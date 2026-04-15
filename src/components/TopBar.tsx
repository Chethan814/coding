"use client";

import { useEffect, useState } from "react";
import { Timer, Users, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TopBarProps {
  warnings?: number;
  maxWarnings?: number;
  timeLeft?: string;
}

const TopBar = ({
  warnings = 0,
  maxWarnings = 3,
  timeLeft = "00:00:00",
}: TopBarProps) => {
  const router = useRouter();
  const [teamName, setTeamName] = useState("Alpha");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setTeamName(parsed.teamName || parsed.name || "Alpha");
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span className="font-mono text-primary font-bold text-lg tracking-tight italic">
          CodeArena
        </span>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <Users className="h-4 w-4" />
          <span className="font-medium text-foreground">{teamName}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={cn(
          "flex items-center gap-3 px-3 py-1 rounded-md border font-mono",
          timeLeft === "00:00:00" ? "bg-destructive/10 border-destructive text-destructive" : "bg-primary/5 border-primary/20"
        )}>
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-lg font-bold tabular-nums text-foreground tracking-widest">
            {timeLeft}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="font-mono">
            {warnings}/{maxWarnings}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Simple CN implementation if missing in imports
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default TopBar;
