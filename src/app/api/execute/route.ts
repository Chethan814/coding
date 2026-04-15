import { NextResponse } from "next/server";

// Judge0 Language IDs mapping
const LANGUAGE_MAP: Record<string, number> = {
  python: 71, // Python 3
  c: 50,      // C (GCC 9.2.0)
  java: 62,   // Java (OpenJDK 13.0.1)
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_code, language, stdin } = body;
    
    // BACKEND NORMALIZATION: Convert [1,2,3] or 1,2,3 to 1 2 3
    // This prevents "ValueError: invalid literal for int()" in Python/C/Java
    const normalizedStdin = (stdin || "")
      .replace(/[\[\]]/g, "") // Remove brackets
      .replace(/,/g, " ");    // Replace commas with spaces

    // DEBUG LOGS
    console.log("--- INCOMING EXEC REQUEST ---");
    console.log("Language:", language);
    console.log("Stdin (Raw):", stdin);
    console.log("Stdin (Normalized):", normalizedStdin);

    const languageId = LANGUAGE_MAP[language] || 71;

    // Call Judge0 API (Public CE instance)
    const response = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code,
        language_id: languageId,
        stdin: normalizedStdin,
      }),
    });

    const result = await response.json();

    // DEBUG LOGS
    console.log("--- JUDGE0 RESPONSE ---");
    console.log("Status:", result.status?.description);
    console.log("Stdout Length:", result.stdout?.length || 0);

    // Standardize Judge0 response for our UI
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
