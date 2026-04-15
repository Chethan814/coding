"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Settings2,
  AlertCircle,
  ShieldAlert,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminEvents() {
  const [status, setStatus] = useState<string>("not_started");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchStatus() {
      const { data, error } = await supabase
        .from("events")
        .select("status")
        .limit(1)
        .single();
        
      if (data) {
        setStatus(data.status);
      }
      setLoading(false);
    }
    fetchStatus();
  }, []);

  const updateStatus = async (newStatus: string) => {
    try {
      // In this setup, we update the first event row
      const { data: event } = await supabase.from("events").select("id").limit(1).single();
      
      if (event) {
        const { error } = await supabase
          .from("events")
          .update({ status: newStatus })
          .eq("id", event.id);
          
        if (error) throw error;
        setStatus(newStatus);
        toast.success(`Event status updated to ${newStatus}`);
      } else {
        // Create an event if none exists
        const { error } = await supabase.from("events").insert({ 
          name: "Coding Contest 2026", 
          status: newStatus 
        });
        if (error) throw error;
        setStatus(newStatus);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleHardReset = async () => {
    const confirmed = window.confirm(
      "CRITICAL ACTION: This will permanently delete ALL teams, submissions, and rubric scores. The competition will be reset to the lobby. Proceed?"
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // 1. Delete all Rubric Scores (Foreign Key dependent)
      await supabase.from("rubric_scores").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all in some drivers, or just match all

      // 2. Delete all Submissions
      await supabase.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // 3. Delete all Teams
      await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // 4. Reset Event Status
      await updateStatus("not_started");

      toast.success("ARENA PURGED: All data cleared for new session.");
    } catch (err: any) {
      toast.error("Wipe Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    not_started: { label: "Not Started", color: "bg-muted text-muted-foreground", icon: Clock },
    instructions: { label: "Instructions", color: "bg-info/20 text-info border-info/50", icon: AlertCircle },
    live: { label: "Live", color: "bg-success/20 text-success border-success/50", icon: Play },
    ended: { label: "Ended", color: "bg-destructive/20 text-destructive border-destructive/50", icon: Square },
  };

  const currentStatus = statusConfig[status] || statusConfig.not_started;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">Control the lifecycle and state of your coding events.</p>
        </div>
        <Badge variant="outline" className={`px-3 py-1 text-sm font-mono ${currentStatus.color}`}>
          <currentStatus.icon className="h-3 w-3 mr-2 inline" />
          {currentStatus.label.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Global Event Controls</CardTitle>
            <CardDescription>
              Changing the state will immediately redirect all participants based on the middleware rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={status === "not_started" ? "default" : "outline"}
                className="flex items-center gap-2"
                onClick={() => updateStatus("not_started")}
              >
                <Clock className="h-4 w-4" /> Reset / Lobby
              </Button>
              <Button 
                variant={status === "instructions" ? "default" : "outline"}
                className="flex items-center gap-2"
                onClick={() => updateStatus("instructions")}
              >
                <AlertCircle className="h-4 w-4" /> Start Instructions
              </Button>
              <Button 
                variant={status === "live" ? "default" : "outline"}
                className="flex items-center gap-2 bg-success/10 text-success hover:bg-success/20 border-success/20"
                onClick={() => updateStatus("live")}
              >
                <Play className="h-4 w-4" /> Go Live
              </Button>
              <Button 
                variant={status === "ended" ? "default" : "outline"}
                className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                onClick={() => updateStatus("ended")}
              >
                <Square className="h-4 w-4" /> End Event
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Event Phase Control</CardTitle>
            <CardDescription>
              Switch between Phase 1 (Coding) and Phase 2 (Debugging).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div className="space-y-1">
                <p className="text-sm font-medium">Phase 1: Coding</p>
                <p className="text-xs text-muted-foreground">60 Minutes - Core logic problems.</p>
              </div>
              <Badge>Active</Badge>
            </div>
            
            <div className="border-t border-border/50 pt-6 space-y-4">
               <div>
                  <h4 className="text-xs font-bold text-destructive uppercase tracking-widest mb-1 flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" /> Destructive Zone
                  </h4>
                  <p className="text-[10px] text-muted-foreground italic">These actions cannot be undone. All participant data will be purged.</p>
               </div>
               <Button 
                 variant="destructive" 
                 className="w-full gap-2 font-mono text-xs uppercase"
                 disabled={loading}
                 onClick={handleHardReset}
               >
                 <Trash2 className="h-4 w-4" /> Hard Reset Arena
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Event Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 font-mono text-xs">
            {mounted && (
              <>
                <div className="flex gap-4 border-l-2 border-primary pl-4 py-1">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span>System initialized. Database connected.</span>
                </div>
                <div className="flex gap-4 border-l-2 border-info pl-4 py-1">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-info">Current state detected: {status}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
