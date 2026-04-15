export type EventStateType = "not_started" | "instructions" | "live" | "ended";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface Rubric {
  output: number;
  testCases: number;
  timeComplexity: number;
  spaceComplexity: number;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  phase: 1 | 2; // 1 = Coding, 2 = Debugging
  testCases: TestCase[];
  rubric: Rubric;
  baseCode: string;
}

export interface Submission {
  id: string;
  problemId: string;
  userId: string;
  code: string;
  score: number;
  isOverridden: boolean;
  status: "pending" | "evaluated";
  timestamp: string;
}

// In-memory global store to survive hot-reloads during dev
declare global {
  var _eventState: EventStateType | undefined;
  var _problems: Problem[] | undefined;
  var _submissions: Submission[] | undefined;
}

const defaultProblems: Problem[] = [
  {
    id: "p1",
    title: "Array Sum",
    description: "Write a function that returns the sum of an array of integers.",
    difficulty: "Easy",
    phase: 1,
    testCases: [
      { id: "tc1", input: "[1, 2, 3]", expectedOutput: "6", isHidden: false },
      { id: "tc2", input: "[-1, 1]", expectedOutput: "0", isHidden: true },
    ],
    rubric: { output: 2, testCases: 2, timeComplexity: 2, spaceComplexity: 2 },
    baseCode: `function arraySum(arr) {\n  // your code here\n}`,
  },
];

export const db = {
  get eventState(): EventStateType {
    if (!global._eventState) global._eventState = "not_started";
    return global._eventState;
  },
  set eventState(state: EventStateType) {
    global._eventState = state;
  },
  
  get problems(): Problem[] {
    if (!global._problems) global._problems = [...defaultProblems];
    return global._problems;
  },
  set problems(problems: Problem[]) {
    global._problems = problems;
  },
  
  get submissions(): Submission[] {
    if (!global._submissions) global._submissions = [];
    return global._submissions;
  },
  set submissions(submissions: Submission[]) {
    global._submissions = submissions;
  }
};
