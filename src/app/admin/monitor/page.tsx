"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  Search,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminMonitor() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLiveStatus() {
    try {
      const res = await fetch("/api/admin/monitor");
      const participants = await res.json();
      if (Array.isArray(participants)) {
        setData(participants);
      }
    } catch (err) {
      console.error("Failed to fetch monitor data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Monitor</h1>
          <p className="text-muted-foreground">Real-time status of all active participants and teams.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-success/10 px-3 py-1 rounded-full border border-success/20 text-success text-[10px] font-mono">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            POLLING ACTIVE
          </div>
          <Button variant="outline" size="sm" onClick={() => {setLoading(true); fetchLiveStatus();}}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Connected</p>
                <h3 className="text-3xl font-bold font-mono">{data.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">In-Contest Active</p>
                <h3 className="text-3xl font-bold font-mono">
                  {data.filter(p => p.status === 'in_contest').length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Suspicion Alerts</p>
                <h3 className="text-3xl font-bold font-mono">0</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Participant / Team</TableHead>
              <TableHead>Current Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Ping</TableHead>
              <TableHead className="text-right">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{p.users?.name || "Anonymous User"}</span>
                    <span className="text-[10px] text-muted-foreground">{p.teams?.name || "No Team Assigned"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">Coding (Phase 1)</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      p.status === 'in_contest' ? "bg-success" : "bg-warning"
                    )} />
                    <span className="capitalize text-xs">{p.status.replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-[10px] text-muted-foreground">
                  Just now
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                  Waiting for participants to connect...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
