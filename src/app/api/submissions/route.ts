import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { generateWrapper, ProblemMetadata } from "@/lib/code-wrappers";

const LANGUAGE_MAP: Record<string, number> = {
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
  javascript: 63,
  typescript: 74,
  go: 60,
  rust: 73,
  php: 68,
};

// --- NORMALIZATION HELPERS ---

function normalize(s: string) {
  return (s || "")
    .replace(/\s+/g, "") // remove all whitespace
    .replace(/,/g, "")   // remove all commas
    .replace(/\[|\]/g, "") // remove all brackets
    .toLowerCase();
}

function normalizeOutput(s: string) {
  try {
    // Try JSON normalization first for structure-aware comparison
    const parsed = JSON.parse(s.replace(/'/g, '"'));
    return JSON.stringify(parsed);
  } catch {
    // Fallback to strict character normalization
    return normalize(s);
  }
}

// --- EXECUTION HELPERS ---

async function safeExecute(payload: any) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000); // 8s total timeout

  try {
    const response = await fetch(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(id);
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, code, language, userId, teamId } = body;

    const safeUserId = userId && userId !== "undefined" ? userId : null;
    const safeTeamId = teamId && teamId !== "undefined" ? teamId : null;

    if (!code || !problemId || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 0. SUBMISSION DEDUPLICATION
    if (safeUserId || safeTeamId) {
      const { data: lastSub } = await supabase
        .from("submissions")
        .select("code")
        .eq("problem_id", problemId)
        .match(safeTeamId ? { team_id: safeTeamId } : { user_id: safeUserId })
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastSub && lastSub.code === code) {
        return NextResponse.json({ 
          success: true, 
          message: "Duplicate submission detected.",
          alreadySubmitted: true 
        });
      }
    }

    // 1. Fetch Problem metadata and Test Cases
    const [{ data: problem }, { data: testCases, error: tcError }] = await Promise.all([
      supabase.from("problems").select("function_name, parameters, parameter_types, input_type, output_type").eq("id", problemId).single(),
      supabase.from("test_cases").select("*").eq("problem_id", problemId),
    ]);

    if (!problem || tcError || !testCases || testCases.length === 0) {
      return NextResponse.json({ error: "No problem/test cases found" }, { status: 400 });
    }

    if (!problem.parameters || problem.parameters.length === 0) {
      return NextResponse.json({ error: "Problem is not configured properly (missing parameters)" }, { status: 400 });
    }
    
    if (!problem.parameter_types || problem.parameter_types.length === 0) {
      return NextResponse.json({ error: "Problem is not configured properly (missing parameter types)" }, { status: 400 });
    }

    // 2. PRODUCTION PRE-VALIDATION
    // - Solve Detection
    if (!code.includes(`${problem.function_name}(`)) {
      return NextResponse.json({ error: `Function '${problem.function_name}' not found.` }, { status: 400 });
    }
    // - Input Guard (Check basic presence for array problems)
    if (problem.input_type === "array" && (!testCases[0].input || testCases[0].input.trim() === "")) {
      return NextResponse.json({ error: "System Error: Test cases for array problems cannot be empty." }, { status: 500 });
    }

    // 3. Prepare Code Wrapper
    const finalCode = generateWrapper(code, problem as ProblemMetadata, language);

    // 4. Execute test cases SEQUENTIALLY
    const languageId = LANGUAGE_MAP[language] || 71;
    const results = [];
    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;
    let firstFailure: any = null;

    console.log(`[SUBMIT] Production Engine | Problem: ${problemId} | Cases: ${testCases.length}`);

    for (const [index, tc] of testCases.entries()) {
      try {
        const result = await safeExecute({
          source_code: finalCode,
          language_id: languageId,
          stdin: tc.input || "",
        });

        const stdout = result.stdout || "";
        const stderr = result.stderr || "";
        const compileOutput = result.compile_output || "";
        
        // Error Mapping
        if (compileOutput && !stdout) {
          let cleanError = "Compilation Error";
          if (compileOutput.includes("too few arguments")) cleanError = "Parameter count mismatch in your function.";
          else if (compileOutput.includes("undefined reference")) cleanError = `Could not find function '${problem.function_name}'.`;
          else if (compileOutput.includes("error")) cleanError = "Syntax error or signature mismatch.";
          
          firstFailure = { input: tc.input, expected: tc.expected_output, actual: "Build Failed", error: cleanError, status: "Compilation Error" };
          results.push({ isMatch: false, result });
          break;
        }

        if (stdout.includes("Error: Function") || stdout.includes("Error: Expected") || stdout.includes("Error: Return type")) {
           firstFailure = { input: tc.input, expected: tc.expected_output, actual: "Logic Error", error: stdout.trim(), status: "Wrong Signature" };
           results.push({ isMatch: false, result });
           break;
        }

        const actualRaw = stdout || stderr || "";
        const expectedNorm = normalizeOutput(tc.expected_output);
        const actualNorm = normalizeOutput(actualRaw);
        
        const isMatch = actualNorm === expectedNorm && result.status?.id === 3;

        totalTime += parseFloat(result.time || "0");
        maxMemory = Math.max(maxMemory, result.memory || 0);

        if (isMatch) {
          passedCount++;
        } else if (!firstFailure) {
          firstFailure = {
            input: tc.input,
            expected: tc.expected_output,
            actual: actualRaw || "(empty)",
            error: stderr || null,
            status: result.status?.description
          };
        }

        results.push({ isMatch, result });
        if (index < testCases.length - 1) await sleep(100);

      } catch (err: any) {
        console.error(`[SUBMIT] Case ${index} failed:`, err.message);
        if (!firstFailure) {
          firstFailure = { input: tc.input, expected: tc.expected_output, actual: "Fatal Error", error: err.message };
        }
      }
    }

    // 5. Calculate Metrics
    const avgTime = totalTime / (testCases.length || 1);
    const memoryMB = maxMemory / 1024;
    const allPassed = testCases.length > 0 && passedCount === testCases.length && results.length === testCases.length;
    const firstTestPassed = results.length > 0 && results[0].isMatch;

    const outputScore = firstTestPassed ? 2 : 0;
    const tcScore = allPassed ? 2 : 0;
    let timeScore = 0;
    let spaceScore = 0;

    if (outputScore === 2 && tcScore === 2) {
      timeScore = avgTime < 1.0 ? 2 : avgTime < 2.0 ? 1 : 0;
      spaceScore = memoryMB < 64 ? 2 : memoryMB < 128 ? 1 : 0;
    }

    const currentTotal = outputScore + tcScore + timeScore + spaceScore;
    const status = allPassed ? "accepted" : passedCount > 0 ? "partial" : "wrong";

    // 6. MULTI-TABLE PERSISTENCE (Using Admin client to bypass RLS)
    
    // 6a. Insert Submission (With Resilient Fallback for missing columns)
    let subData: any = null;
    let subError: any = null;

    try {
      const result = await supabaseAdmin
        .from("submissions")
        .insert({
          user_id: safeUserId,
          team_id: safeTeamId,
          problem_id: problemId,
          code,
          language,
          output: results[results.length - 1]?.result?.stdout || "",
          status,
          execution_time: avgTime,
          execution_memory: memoryMB,
        })
        .select("id")
        .single();
      
      subData = result.data;
      subError = result.error;

      // If column is missing (code 42703), retry without metrics
      if (subError?.code === "42703") {
        console.warn("⚠️ Database columns 'execution_time' or 'execution_memory' missing. Retrying without metrics.");
        const retryResult = await supabaseAdmin
          .from("submissions")
          .insert({
            user_id: safeUserId,
            team_id: safeTeamId,
            problem_id: problemId,
            code,
            language,
            output: results[results.length - 1]?.result?.stdout || "",
            status,
          })
          .select("id")
          .single();
        subData = retryResult.data;
        subError = retryResult.error;
      }
    } catch (e) {
      console.error("Submission insertion failed", e);
    }

    if (subError || !subData) throw subError || new Error("Failed to insert submission");

    // 6b. Insert Rubric Score (using exact schema column names)
    await supabaseAdmin.from("rubric_scores").insert({
      submission_id: subData.id,
      output_score: outputScore,
      test_case_score: tcScore,
      time_complexity_score: timeScore,
      space_complexity_score: spaceScore,
      total_score: currentTotal
    });

    if (safeTeamId) {
      // 6c. Update Best Scores
      const { data: currentBest } = await supabaseAdmin
        .from("best_scores")
        .select("best_score")
        .match({ team_id: safeTeamId, problem_id: problemId })
        .single();

      if (!currentBest || currentTotal > (currentBest.best_score || 0)) {
        await supabaseAdmin.from("best_scores").upsert({
          team_id: safeTeamId,
          problem_id: problemId,
          best_score: currentTotal,
          submission_id: subData.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,problem_id' });
      }

      // 6d. Recalculate Leaderboard
      // 1. Get event_id for this problem
      const { data: probData } = await supabaseAdmin.from("problems").select("event_id").eq("id", problemId).single();
      const eventId = probData?.event_id;

      if (eventId) {
        // 2. Sum best scores for this team/event
        const { data: allBest } = await supabaseAdmin.from("best_scores").select("best_score").eq("team_id", safeTeamId);
        const teamTotal = (allBest || []).reduce((sum, b) => sum + (b.best_score || 0), 0);

        // 3. Update leaderboard table
        await supabaseAdmin.from("leaderboard").upsert({
          team_id: safeTeamId,
          event_id: eventId,
          total_score: teamTotal,
          last_submission_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,event_id' });
      }
    }

    return NextResponse.json({
      success: true,
      status,
      rubric: { 
        outputScore, 
        tcScore, 
        timeScore, 
        spaceScore, 
        totalScore: currentTotal 
      },
      message: firstFailure?.status === "Compilation Error" || firstFailure?.status === "Wrong Signature"
        ? firstFailure.error
        : `${passedCount}/${testCases.length} cases passed. Score: ${currentTotal}/8`,
    });

  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
