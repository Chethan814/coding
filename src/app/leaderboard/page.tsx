"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Leaderboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const adminCheck = user?.role === "admin";
    setIsAdmin(adminCheck);

    if (adminCheck) {
      // If admin, fetch real data
      const fetchLeaderboard = async () => {
         const { data, error } = await supabase
           .from("teams")
           .select("*")
           .order("total_score", { ascending: false });
           
         if (data) {
           setTeams(data.map((t, i) => ({
             rank: i + 1,
             name: t.name,
             problems: t.problems_solved || 0,
             score: t.total_score || 0,
             lastSubmit: t.updated_at ? new Date(t.updated_at).toLocaleTimeString() : "N/A"
           })));
         }
      }
      fetchLeaderboard();
    }
  }, []);

  if (isAdmin === null) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-black text-white font-mono uppercase tracking-tighter italic">Access Restricted</h1>
        <p className="text-muted-foreground mt-2 max-w-xs font-mono text-[10px] leading-relaxed">
          THE LIVE LEADERBOARD IS CURRENTLY LOCKED FOR PARTICIPANTS. 
          PLEASE FOCUS ON YOUR CHALLENGES.
        </p>
        <Button 
          variant="outline" 
          className="mt-8 border-primary/20 text-primary hover:bg-primary/10 font-mono text-xs uppercase"
          onClick={() => router.push("/contest")}
        >
          Return to Arena
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-primary font-bold text-lg tracking-tighter">CodeArena</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live · Updated Just Now
        </div>
      </nav>

      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tighter">Global Leaderboard</h1>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground text-left">
                <th className="py-4 px-6 font-bold">Rank</th>
                <th className="py-4 px-6 font-bold">Team</th>
                <th className="py-4 px-6 font-bold text-right">Problems</th>
                <th className="py-4 px-6 font-bold text-right">Score</th>
                <th className="py-4 px-6 font-bold text-right">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {teams.map((team) => (
                <tr key={team.rank} className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-primary italic">#{team.rank}</td>
                  <td className="py-4 px-6 font-bold text-foreground">{team.name}</td>
                  <td className="py-4 px-6 text-right font-mono text-xs text-muted-foreground">{team.problems}</td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-success">{team.score}</td>
                  <td className="py-4 px-6 text-right font-mono text-[10px] text-muted-foreground italic">{team.lastSubmit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {teams.length === 0 && (
            <div className="p-12 text-center text-muted-foreground font-mono italic text-sm">
               No team data synchronized yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
