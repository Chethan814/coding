"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Code, Shield, Trophy, Users, Timer, Eye } from "lucide-react";

export default function Landing() {
  const router = useRouter();

  const features = [
    { icon: Users, title: "Team-Based", desc: "Collaborative coding environment" },
    { icon: Shield, title: "Monitored", desc: "Real-time behavior tracking" },
    { icon: Timer, title: "Timed", desc: "Strict countdown enforcement" },
    { icon: Eye, title: "Controlled", desc: "Tab-switch & activity detection" },
    { icon: Trophy, title: "Competitive", desc: "Live leaderboard rankings" },
    { icon: Code, title: "Multi-Language", desc: "C, Python, Java support" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="h-14 border-b border-border bg-card flex items-center justify-between px-6">
        <span className="font-mono text-primary font-bold text-lg">CodeArena</span>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
            Login
          </Button>
          <Button size="sm" onClick={() => router.push("/login")} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Join Event
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs font-mono text-primary">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live Event Active
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Controlled Coding
            <br />
            <span className="text-gradient">Competition Platform</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            A monitored, lab-based competitive programming environment designed for
            serious coding events. Fair. Secure. Competitive.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono"
            >
              Enter Competition
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/leaderboard")}
              className="font-mono"
            >
              View Leaderboard
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {features.map((f) => (
            <div key={f.title} className="panel p-4 space-y-2 group hover:border-primary/50 transition-colors">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Technical Notice */}
        <div className="mt-12 max-w-xl w-full text-center space-y-3 p-6 rounded-2xl bg-muted/30 border border-border">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
            Professional Standard
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our platform uses <span className="text-primary font-bold">Judge0 Sandbox Architecture</span>. 
            All solutions are executed in real-time against hidden test cases. 
            Ensure your code reads from <span className="text-foreground">stdin</span> and prints to <span className="text-foreground">stdout</span>.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        CodeArena © 2026 — Controlled Coding Event Platform
      </div>
    </div>
  );
}
