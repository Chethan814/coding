"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, Shield, Zap, TestTube, Clock, Package, Trophy, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Instructions() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      const { data } = await supabase.from("events").select("status").limit(1).single();
      if (data) {
        setIsLive(data.status === "live");
      }
      setLoading(false);
    }
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (agreed && isLive) {
      router.push("/contest");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground font-mono">Contest Instructions</h1>
        <p className="text-sm text-muted-foreground mt-1">Please read and accept the rules before starting</p>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Section 1: General Rules */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">General Rules</h2>
            </div>
            <div className="bg-card border border-border rounded-md p-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-bold">1</span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">No tab switching</span> during the contest. All browser tabs will be monitored.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-bold">2</span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">No external help</span> or communication with others during the contest.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-bold">3</span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">No copy-paste</span> from external sources or other participants.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs font-bold">4</span>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">System is monitored</span> for all activities including keystrokes, tab switches, and time spent.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Scoring System */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Scoring System</h2>
            </div>
            
            <div className="space-y-4">
              {/* Problem Breakdown */}
              <div className="bg-card border border-border rounded-md p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Each Problem = 8 Points</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-secondary/50 border border-border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Output</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary font-mono">2</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Test Cases</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary font-mono">2</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Time Complexity</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary font-mono">2</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="bg-secondary/50 border border-border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Space Complexity</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary font-mono">2</span>
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Score */}
              <div className="bg-primary/5 border border-primary/20 rounded-md p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Problems</p>
                    <p className="text-3xl font-bold text-primary font-mono">20</p>
                    <p className="text-xs text-muted-foreground mt-1">10 coding + 10 debugging</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Points per Problem</p>
                    <p className="text-3xl font-bold text-primary font-mono">8</p>
                    <p className="text-xs text-muted-foreground mt-1">4 rubric categories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Maximum Score</p>
                    <p className="text-3xl font-bold text-primary font-mono">160</p>
                    <p className="text-xs text-muted-foreground mt-1">Perfect score</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Violations */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Violations</h2>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 rounded-md p-6 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Multiple warnings</span> (3 or more) will lead to immediate disqualification from the contest.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Suspicious behavior</span> including rapid tab switches, unusual patterns, or external communication attempts will be reviewed by administrators.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  <span className="font-semibold">All violations</span> are logged and may be used for disqualification decisions, even if warnings were not issued.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Section - Agreement */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  agreed
                    ? "bg-primary border-primary"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}>
                  {agreed && <CheckCircle2 className="h-3.5 w-3.5 text-background" />}
                </div>
              </div>
              <span className="text-sm text-foreground">
                I have read and agree to the rules
              </span>
            </label>
            <Button
              onClick={handleStart}
              disabled={!agreed || !isLive || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono min-w-[200px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : !isLive ? (
                "Waiting for Go Live..."
              ) : (
                "Start Contest"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
