import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const LANGUAGE_MAP: Record<string, number> = {
  python: 71,
  c: 50,
  java: 62,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, code, language, userId, teamId } = body;

    const safeUserId = userId && userId !== "undefined" ? userId : null;
    const safeTeamId = teamId && teamId !== "undefined" ? teamId : null;

    // 1. Fetch REAL Test Cases from DB
    const { data: testCases, error: tcError } = await supabase
      .from("test_cases")
      .select("*")
      .eq("problem_id", problemId);

    if (tcError || !testCases || testCases.length === 0) {
      return NextResponse.json({ error: "No test cases found for this problem" }, { status: 400 });
    }

    let passedCount = 0;
    let totalTime = 0;
    let maxMemory = 0;
    let firstFailure: any = null;
    let lastStdout = "";

    // 2. Execute ALL test cases via Judge0
    const languageId = LANGUAGE_MAP[language] || 71;

    for (const tc of testCases) {
      // BACKEND NORMALIZATION: Ensure input is space-separated even if stored with brackets/commas
      const normalizedInput = (tc.input || "")
        .replace(/[\[\]]/g, "")
        .replace(/,/g, " ");

      const response = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
          stdin: normalizedInput,
        }),
      });

      const result = await response.json();
      
      // Output Normalization: Compress spaces and remove them around brackets/commas
      const normalizeOutput = (s: string) => {
        return (s || "")
          .trim()
          .replace(/\s+/g, " ")
          .replace(/\[\s+/g, "[")
          .replace(/\s+\]/g, "]")
          .replace(/,\s+/g, ",")
          .replace(/\s+,/g, ",");
      };

      const actualOutput = normalizeOutput(result.stdout);
      const expectedOutput = normalizeOutput(tc.expected_output);
      const isMatch = actualOutput === expectedOutput;

      // Track metrics
      totalTime += parseFloat(result.time || "0");
      maxMemory = Math.max(maxMemory, result.memory || 0);
      lastStdout = result.stdout;

      if (isMatch && result.status?.id === 3) {
        passedCount++;
      } else if (!firstFailure) {
        firstFailure = {
          input: tc.input,
          expected: tc.expected_output,
          actual: result.stdout || "(empty)",
          error: result.stderr || result.compile_output || null
        };
      }
    }

    // 3. Apply 8-Point Rubric
    const avgTime = totalTime / testCases.length;
    const allPassed = passedCount === testCases.length;
    const passPercentage = passedCount / testCases.length;

    // a. Output Correctness (2 pts)
    const outputScore = allPassed ? 2 : 0;
    
    // b. Test Case Score (2 pts)
    let tcScore = 0;
    if (passPercentage === 1) tcScore = 2;
    else if (passPercentage >= 0.5) tcScore = 1;

    // c. Time Efficiency (2 pts)
    let timeScore = 0;
    if (allPassed) {
      if (avgTime <= 1.0) timeScore = 2;
      else if (avgTime <= 2.0) timeScore = 1;
    }

    // d. Space Efficiency (2 pts)
    let spaceScore = 0;
    const memoryMB = maxMemory / 1024; // Convert KB to MB
    if (allPassed) {
      if (memoryMB <= 64) spaceScore = 2;
      else if (memoryMB <= 128) spaceScore = 1;
    }

    const totalScore = outputScore + tcScore + timeScore + spaceScore;
    const status = allPassed ? "accepted" : (passedCount > 0 ? "partial" : "wrong");

    // 4. Persistence
    const { data: subData } = await supabase.from("submissions").insert({
      user_id: safeUserId,
      team_id: safeTeamId,
      problem_id: problemId,
      code,
      language,
      output: lastStdout,
      status,
      execution_time: avgTime,
      execution_memory: memoryMB
    }).select("id").single();

    if (subData) {
      // Save Rubric Breakdown
      await supabase.from("rubric_scores").insert({
        submission_id: subData.id,
        output_score: outputScore,
        test_case_score: tcScore,
        time_complexity_score: timeScore,
        space_complexity_score: spaceScore,
        total_score: totalScore,
        execution_time: avgTime,
        execution_memory: memoryMB
      });

      // 5. Update Leaderboard (Total Score)
      if (safeTeamId) {
        try {
          // Fetch all submissions for this team with their rubric scores
          const { data: teamSubs, error: teamSubsError } = await supabase
            .from("submissions")
            .select(`
              problem_id,
              rubric_scores (total_score)
            `)
            .eq("team_id", safeTeamId);

          if (!teamSubsError && teamSubs) {
            // Group by problem_id and keep the max score
            const bestScoresPerProblem: Record<string, number> = {};
            
            teamSubs.forEach((sub: any) => {
              const score = sub.rubric_scores?.[0]?.total_score || 0;
              const pid = sub.problem_id;
              if (!bestScoresPerProblem[pid] || score > bestScoresPerProblem[pid]) {
                bestScoresPerProblem[pid] = score;
              }
            });

            // Calculate overall total
            const newTotalScore = Object.values(bestScoresPerProblem).reduce((sum, s) => sum + s, 0);
            const problemsSolved = Object.keys(bestScoresPerProblem).length;

            // Update teams table
            await supabase
              .from("teams")
              .update({ 
                total_score: newTotalScore,
                problems_solved: problemsSolved,
                updated_at: new Date().toISOString()
              })
              .eq("id", safeTeamId);
            
            console.log(`✅ Leaderboard Updated for Team ${safeTeamId}: Score ${newTotalScore}`);
          }
        } catch (syncError) {
          console.error("Leaderboard Sync Error:", syncError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      rubric: {
        output_score: outputScore,
        test_case_score: tcScore,
        time_score: timeScore,
        space_score: spaceScore,
        total_score: totalScore
      },
      failureDetails: firstFailure,
      message: `${passedCount}/${testCases.length} cases passed. Score: ${totalScore}/8`
    });

  } catch (error: any) {
    console.error("Submission Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
