"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, Users, Shield, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Lobby() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [teamsJoined, setTeamsJoined] = useState(0);
  const [contestStatus, setContestStatus] = useState<"waiting" | "starting" | "active">("waiting");

  useEffect(() => {
    async function fetchStatus() {
      const { data } = await supabase.from("events").select("status").limit(1).single();
      const { count } = await supabase.from("teams").select("*", { count: "exact", head: true });
      
      if (count) setTeamsJoined(count);
      
      if (data) {
        if (data.status === "not_started") setContestStatus("waiting");
        else if (data.status === "instructions") setContestStatus("starting");
        else setContestStatus("active");
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Polling for status change
    return () => clearInterval(interval);
  }, []);

  const handleProceed = () => {
    if (isReady && contestStatus !== "waiting") {
      router.push("/instructions");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-2xl">
        {/* Main Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          {/* Event Name */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground font-mono mb-2">
              CodeArena 2026
            </h1>
            <p className="text-sm text-muted-foreground">
              Controlled Coding Competition
            </p>
          </div>

          {/* Team & Participant Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-secondary/50 border border-border rounded-md p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Team Name
              </p>
              <p className="text-lg font-semibold text-foreground font-mono">
                ByteForce
              </p>
            </div>
            <div className="bg-secondary/50 border border-border rounded-md p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Participant
              </p>
              <p className="text-lg font-semibold text-foreground font-mono">
                John Doe
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${
                contestStatus === "waiting" ? "bg-warning animate-pulse" :
                contestStatus === "starting" ? "bg-primary animate-pulse" :
                "bg-success"
              }`} />
              <div className={`absolute inset-0 w-3 h-3 rounded-full ${
                contestStatus === "waiting" ? "bg-warning/30 animate-ping" :
                contestStatus === "starting" ? "bg-primary/30 animate-ping" :
                ""
              }`} />
            </div>
            <span className="text-lg font-semibold text-foreground">
              {contestStatus === "waiting" ? "Waiting for coordinator to start the contest" :
               contestStatus === "starting" ? "Contest starting..." :
               "Contest in progress"}
            </span>
          </div>

          {/* Ready Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setIsReady(!isReady)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
                isReady
                   ? "bg-success/10 border-success text-success"
                  : "bg-secondary border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {isReady ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-current" />
              )}
              <span className="text-sm font-medium">
                {isReady ? "Ready" : "Mark as Ready"}
              </span>
            </button>
          </div>

          {/* Important Notices */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-md p-4 mb-6">
            <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Important Notices
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>Do not switch tabs during the contest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>All activities are monitored</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-0.5">•</span>
                <span>Violation may lead to disqualification</span>
              </li>
            </ul>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-mono">{teamsJoined} teams joined</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-mono">Monitoring active</span>
            </div>
          </div>

          {/* Start Contest Button */}
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={handleProceed}
              disabled={!isReady || contestStatus === "waiting"}
              className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
            >
              {contestStatus === "waiting" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Waiting for coordinator
                </>
              ) : (
                <>
                  View Instructions
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              {!isReady ? "Mark yourself as ready to proceed" : "Contest is starting - view instructions to begin"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>CodeArena © 2026 — Controlled Coding Event Platform</p>
        </div>
      </div>
    </div>
  );
}
