/**
 * Dynamic Code Wrapper Engine for CodeArena
 * Generates executable boilerplate around user-submitted logic.
 */

export interface ProblemMetadata {
  function_name: string;
  parameters: string[];
  parameter_types: string[];
  input_type: string;
  output_type: string;
}

export function generateWrapper(userCode: string, problem: ProblemMetadata, language: string): string {
  if (!problem.parameters || problem.parameters.length === 0) {
    throw new Error("Invalid problem config: parameters missing");
  }
  if (!problem.parameter_types || problem.parameter_types.length === 0) {
    throw new Error("Invalid problem config: parameter_types missing");
  }

  switch (language.toLowerCase()) {
    case "python":
      return generatePythonWrapper(userCode, problem);
    case "c":
      return generateCWrapper(userCode, problem);
    case "java":
      return generateJavaWrapper(userCode, problem);
    default:
      return userCode;
  }
}

function generatePythonWrapper(userCode: string, problem: ProblemMetadata): string {
  const { function_name, parameters, output_type, parameter_types } = problem;

  // Map metadata output_type to Python types for validation
  const typeMap: Record<string, string> = {
    single: "int",
    long: "int",
    string: "str",
    array: "list",
    int_array: "list",
    string_array: "list",
    int_2d_array: "list",
    float: "float"
  };
  const expectedPyType = typeMap[output_type] || "object";

  return `
import sys
import ast
import inspect

${userCode}

if __name__ == "__main__":
    # 1. STRICT SIGNATURE VALIDATION
    if "${function_name}" not in globals():
        print("Error: Function '${function_name}' not defined. Please check your signature.")
        sys.exit(1)
    
    sig = inspect.signature(${function_name})
    params = list(sig.parameters.keys())
    expected = ${JSON.stringify(parameters)}
    
    if params != expected:
        print(f"Error: Expected function signature ${function_name}({', '.join(expected)})")
        sys.exit(1)

    # 2. INPUT PARSING
    lines = sys.stdin.readlines()
    if not lines: sys.exit(0)
    
    raw_input = "".join(lines)
    input_parts = raw_input.split()
    
    args = []
    ptr = 0
    try:
        for p_type in ${JSON.stringify(parameter_types)}:
            if p_type == "int" or p_type == "long":
                args.append(int(input_parts[ptr]))
                ptr += 1
            elif p_type == "string":
                args.append(input_parts[ptr])
                ptr += 1
            elif p_type == "int_array":
                size = int(input_parts[ptr])
                ptr += 1
                arr = [int(x) for x in input_parts[ptr : ptr + size]]
                args.append(arr)
                ptr += size
            elif p_type == "string_array":
                size = int(input_parts[ptr])
                ptr += 1
                arr = input_parts[ptr : ptr + size]
                args.append(arr)
                ptr += size
            elif p_type == "int_2d_array":
                rows = int(input_parts[ptr])
                ptr += 1
                cols = int(input_parts[ptr])
                ptr += 1
                matrix = []
                for _ in range(rows):
                    matrix.append([int(x) for x in input_parts[ptr : ptr + cols]])
                    ptr += cols
                args.append(matrix)

        # 3. RUNTIME SAFETY & EXECUTION
        result = ${function_name}(*args)
        
        # 4. RETURN TYPE VALIDATION
        if "${expectedPyType}" != "object":
            if not isinstance(result, ${expectedPyType}):
                 print("Error: Return type must be ${expectedPyType}")
                 sys.exit(1)

        # 5. OUTPUT HANDLING
        if isinstance(result, list):
            import json
            print(json.dumps(result))
        elif isinstance(result, float):
            print(f"{result:.6f}".rstrip('0').rstrip('.'))
        else:
            print(result)

    except TypeError as e:
        print(f"Error: Parameter mismatch or type error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Runtime Error: {e}")
        sys.exit(1)
`;
}

function generateCWrapper(userCode: string, problem: ProblemMetadata): string {
  const { function_name, parameters, parameter_types, output_type } = problem;

  let declarations = "";
  let scans = "";
  let callArgs = [];

  for (let i = 0; i < parameter_types.length; i++) {
    const type = parameter_types[i];
    const name = parameters[i];

    if (type === "int") {
      declarations += `    int ${name};\n`;
      scans += `    scanf("%d", &${name});\n`;
      callArgs.push(name);
    } else if (type === "long") {
      declarations += `    long long ${name};\n`;
      scans += `    scanf("%lld", &${name});\n`;
      callArgs.push(name);
    } else if (type === "string") {
      declarations += `    char ${name}[10000];\n`;
      scans += `    scanf("%s", ${name});\n`;
      callArgs.push(name);
    } else if (type === "int_array") {
      const sizeName = `${name}_size`;
      declarations += `    int ${sizeName}; int* ${name};\n`;
      scans += `    if (scanf("%d", &${sizeName}) == 1) {\n`;
      scans += `        ${name} = (int*)malloc(${sizeName} * sizeof(int));\n`;
      scans += `        for(int i=0; i<${sizeName}; i++) scanf("%d", &${name}[i]);\n`;
      scans += `    }\n`;
      callArgs.push(name);
      callArgs.push(sizeName);
    } else if (type === "string_array") {
      const sizeName = `${name}_size`;
      declarations += `    int ${sizeName}; char** ${name};\n`;
      scans += `    if (scanf("%d", &${sizeName}) == 1) {\n`;
      scans += `        ${name} = (char**)malloc(${sizeName} * sizeof(char*));\n`;
      scans += `        for(int i=0; i<${sizeName}; i++) { ${name}[i] = (char*)malloc(1000); scanf("%s", ${name}[i]); }\n`;
      scans += `    }\n`;
      callArgs.push(name);
      callArgs.push(sizeName);
    } else if (type === "int_2d_array") {
      const rowName = `${name}_rows`;
      const colName = `${name}_cols`;
      declarations += `    int ${rowName}, ${colName}; int** ${name};\n`;
      scans += `    if (scanf("%d %d", &${rowName}, &${colName}) == 2) {\n`;
      scans += `        ${name} = (int**)malloc(${rowName} * sizeof(int*));\n`;
      scans += `        for(int r=0; r<${rowName}; r++) {\n`;
      scans += `            ${name}[r] = (int*)malloc(${colName} * sizeof(int));\n`;
      scans += `            for(int c=0; c<${colName}; c++) scanf("%d", &${name}[r][c]);\n`;
      scans += `        }\n`;
      scans += `    }\n`;
      callArgs.push(name);
      callArgs.push(rowName);
      callArgs.push(colName);
    }
  }

  let outputLogic = "";
  if (output_type === "array") {
      outputLogic = `
    printf("[");
    for(int i=0; result && i<100; i++) {
       printf("%d%s", result[i], (i<99 ? "," : ""));
    }
    printf("]");`;
  } else if (output_type === "string") {
      outputLogic = `    printf("%s", result);`;
  } else if (output_type === "long") {
      outputLogic = `    printf("%lld", result);`;
  } else if (output_type === "float") {
      outputLogic = `    printf("%.6f", result);`;
  } else {
      outputLogic = `    printf("%d", result);`;
  }

  const outTypeC: Record<string, string> = { single: "int", array: "int*", string: "char*", long: "long long", float: "double" };
  const returnType = outTypeC[output_type] || "int";

  return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
${declarations}
${scans}
    ${returnType} result = ${function_name}(${callArgs.join(", ")});
${outputLogic}
    return 0;
}
`;
}

function generateJavaWrapper(userCode: string, problem: ProblemMetadata): string {
  const { function_name, parameters, parameter_types, output_type } = problem;

  let scans = "";
  let callArgs = [];

  for (let i = 0; i < parameter_types.length; i++) {
    const type = parameter_types[i];
    const name = parameters[i];

    if (type === "int") {
      scans += `        int ${name} = sc.nextInt();\n`;
      callArgs.push(name);
    } else if (type === "long") {
      scans += `        long ${name} = sc.nextLong();\n`;
      callArgs.push(name);
    } else if (type === "string") {
      scans += `        String ${name} = sc.next();\n`;
      callArgs.push(name);
    } else if (type === "int_array") {
      const sizeName = `${name}Size`;
      scans += `        int ${sizeName} = sc.nextInt();\n`;
      scans += `        int[] ${name} = new int[${sizeName}];\n`;
      scans += `        for(int i=0; i<${sizeName}; i++) ${name}[i] = sc.nextInt();\n`;
      callArgs.push(name);
    } else if (type === "string_array") {
      const sizeName = `${name}Size`;
      scans += `        int ${sizeName} = sc.nextInt();\n`;
      scans += `        String[] ${name} = new String[${sizeName}];\n`;
      scans += `        for(int i=0; i<${sizeName}; i++) ${name}[i] = sc.next();\n`;
      callArgs.push(name);
    } else if (type === "int_2d_array") {
      const rowsName = `${name}Rows`;
      const colsName = `${name}Cols`;
      scans += `        int ${rowsName} = sc.nextInt();\n`;
      scans += `        int ${colsName} = sc.nextInt();\n`;
      scans += `        int[][] ${name} = new int[${rowsName}][${colsName}];\n`;
      scans += `        for(int r=0; r<${rowsName}; r++) for(int c=0; c<${colsName}; c++) ${name}[r][c] = sc.nextInt();\n`;
      callArgs.push(name);
    }
  }

  const outTypeJava: Record<string, string> = { single: "int", array: "int[]", string: "String", long: "long", float: "double" };
  const returnType = outTypeJava[output_type] || "int";

  let outputLogic = "";
  if (output_type === "array") {
    outputLogic = `        System.out.println(Arrays.toString(result));`;
  } else {
    outputLogic = `        System.out.println(result);`;
  }

  return `
import java.util.*;

public class Main {
    
    ${userCode}

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
${scans}
        ${returnType} result = ${function_name}(${callArgs.join(", ")});
${outputLogic}
    }
}
`;
}
