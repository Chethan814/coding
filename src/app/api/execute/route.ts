import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateWrapper, ProblemMetadata } from "@/lib/code-wrappers";

// Judge0 Language IDs
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_code, language, stdin, problemId } = body;
    
    // Fetch problem metadata if problemId is provided
    let problem: ProblemMetadata | null = null;
    if (problemId) {
      const { data } = await supabase
        .from("problems")
        .select("function_name, parameters, parameter_types, input_type, output_type")
        .eq("id", problemId)
        .single();
      problem = data;
    }

    if (problem) {
      if (!problem.parameters || problem.parameters.length === 0) {
        return NextResponse.json({ 
          error: "Problem is not configured properly (missing parameters)",
          status: { id: 6, description: "System Error" }
        }, { status: 400 });
      }

      if (!problem.parameter_types || problem.parameter_types.length === 0) {
        return NextResponse.json({ 
          error: "Problem is not configured properly (missing parameter types)",
          status: { id: 6, description: "System Error" }
        }, { status: 400 });
      }

      // 1. PRE-VALIDATION: Solve Detection
      if (!source_code.includes(`${problem.function_name}(`)) {
        return NextResponse.json({ 
          error: `Function '${problem.function_name}' not found in your code.`,
          status: { id: 6, description: "Compilation Error" } 
        }, { status: 400 });
      }

      // 2. INPUT GUARD: Basic presence check
      if ((problem.input_type === "array" || problem.input_type === "int_array") && !stdin) {
         return NextResponse.json({ 
          error: "Invalid input format. Array problems require [size] [elements].",
          status: { id: 6, description: "Invalid Input" } 
        }, { status: 400 });
      }
    }

    // Wrap code if problem metadata is available
    const finalCode = problem 
      ? generateWrapper(source_code, problem, language) 
      : source_code;

    const languageId = LANGUAGE_MAP[language] || 71;

    console.log(`[EXEC] Lang: ${language}, Problem: ${problemId || "None"}`);

    const response = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: finalCode,
        language_id: languageId,
        stdin: stdin || "",
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      stdout: result.stdout || "",
      stderr: result.stderr || result.compile_output || "",
      time: result.time || "0.000",
      memory: result.memory || 0,
      status: {
        id: result.status?.id || 3,
        description: result.status?.description || "Accepted"
      }
    });

  } catch (error: any) {
    console.error("Execution Error:", error);
    return NextResponse.json({ 
      error: "Remote execution failed",
      stdout: "",
      stderr: "The code execution engine is currently unreachable."
    }, { status: 500 });
  }
}
