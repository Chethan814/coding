"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ArrowRight, ShieldCheck, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Participant State
  const [teamCode, setTeamCode] = useState("");
  const [name, setName] = useState("");

  // Admin State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent, isAdmin: boolean) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = isAdmin 
        ? { email, password, isAdmin: true }
        : { teamCode, name, isAdmin: false };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Login successful!");
        // Store session (simplified)
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(data.redirect);
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <span className="font-mono text-primary font-bold text-3xl italic tracking-tighter">CodeArena</span>
          <p className="text-sm text-muted-foreground">Unified access portal for participants and admins</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-card border border-border">
            <TabsTrigger value="student" className="text-xs font-mono">Participant</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs font-mono">Coordinator</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <form onSubmit={(e) => handleLogin(e, false)} className="panel p-6 space-y-5 border-border/50 shadow-xl">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Name</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="pl-10 h-11 bg-muted/30 border-border font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Team Access Code</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value)}
                    placeholder="e.g. ALPHA-2026"
                    className="pl-10 h-11 bg-muted/30 border-border font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm transition-all"
              >
                {loading ? "Verifying..." : "Enter Competition"}
                {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form onSubmit={(e) => handleLogin(e, true)} className="panel p-6 space-y-5 border-primary/20 bg-primary/5 shadow-2xl">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@arena.com"
                    className="pl-10 h-11 bg-muted/30 border-primary/20 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-primary">Secure Token</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-muted/30 border-primary/20 font-mono text-xs focus-visible:ring-1 focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 font-mono text-sm"
              >
                {loading ? "Authenticating..." : "Admin Authorization"}
                {!loading && <ShieldCheck className="h-4 w-4 ml-2" />}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest underline decoration-primary/30 underline-offset-4">
            Authorized Personnel Only
          </p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </div>
    </div>
  );
}
