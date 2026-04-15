export type ContestPhase = "not_started" | "coding" | "break" | "debugging" | "ended";

export interface TimingState {
  phase: ContestPhase;
  timeLeftSeconds: number;
  displayText: string;
}

export function calculateContestState(liveAt: string | null, phaseOverride?: string | null): TimingState {
  if (!liveAt) return { phase: "not_started", timeLeftSeconds: 0, displayText: "00:00:00" };

  const start = new Date(liveAt).getTime();
  const now = new Date().getTime();
  const elapsedSeconds = Math.floor((now - start) / 1000);

  const ROUND1_SEC = 60 * 60;   // 1 hour
  const BREAK_SEC = 5 * 60;     // 5 minutes
  const ROUND2_SEC = 30 * 60;   // 30 minutes

  const BREAK_START = ROUND1_SEC;
  const ROUND2_START = BREAK_START + BREAK_SEC;
  const CONTEST_END = ROUND2_START + ROUND2_SEC;

  let phase: ContestPhase = "ended";
  let remaining = 0;

  if (elapsedSeconds < 0) {
    phase = "not_started";
    remaining = Math.abs(elapsedSeconds);
  } else if (phaseOverride === "debugging" && elapsedSeconds < CONTEST_END) {
    // ⚡ ROLE-OVER LOGIC: Use the remaining time until the absolute end of the contest
    phase = "debugging";
    remaining = CONTEST_END - elapsedSeconds;
  } else if (phaseOverride === "break" && elapsedSeconds < ROUND2_START) {
    phase = "break";
    remaining = ROUND2_START - elapsedSeconds;
  } else if (elapsedSeconds < BREAK_START) {
    phase = "coding";
    remaining = ROUND1_SEC - elapsedSeconds;
  } else if (elapsedSeconds < ROUND2_START) {
    phase = "break";
    remaining = ROUND2_START - elapsedSeconds;
  } else if (elapsedSeconds < CONTEST_END) {
    phase = "debugging";
    remaining = CONTEST_END - elapsedSeconds;
  } else {
    phase = "ended";
    remaining = 0;
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const display = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return { phase, timeLeftSeconds: remaining, displayText: display };
}
