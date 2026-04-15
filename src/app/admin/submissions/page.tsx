"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Code2, Eye, ExternalLink } from "lucide-react";

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch("/api/admin/submissions");
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
      } catch (err) {
        console.error("Failed to fetch submissions");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const statusColors: any = {
    accepted: "bg-success/20 text-success border-success/50",
    wrong: "bg-destructive/20 text-destructive border-destructive/50",
    error: "bg-warning/20 text-warning border-warning/50",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submissions Log</h1>
        <p className="text-muted-foreground">Review every line of code submitted across the competition.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Problem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((sub) => (
              <TableRow key={sub.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(sub.created_at), "HH:mm:ss")}
                </TableCell>
                <TableCell className="font-medium">{sub.users?.name || "Participant"}</TableCell>
                <TableCell>{sub.problems?.title || "Unknown"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[sub.status]}>
                    {sub.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-mono font-bold">
                  {sub.rubric_scores?.[0]?.total_score ?? 0}/8
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Code2 className="h-3.5 w-3.5" /> View Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="flex justify-between items-center pr-8">
                          <span>Submission Analysis - {sub.problems?.title}</span>
                          <Badge variant="outline">{sub.status}</Badge>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase mb-2">Source Code ({sub.language})</p>
                          <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                            {sub.code}
                          </pre>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 border border-border rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase mb-1">Standard Output</p>
                              <pre className="font-mono text-xs">{sub.output || "No output captured"}</pre>
                           </div>
                           <div className="p-3 border border-border rounded-lg">
                              <p className="text-[10px] text-muted-foreground uppercase mb-1">Error/Stderr</p>
                              <pre className="font-mono text-xs text-destructive">{sub.error || "None"}</pre>
                           </div>
                        </div>
                        {sub.rubric_scores?.[0] && (
                          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                            <h4 className="text-xs font-bold uppercase mb-3">Rubric Breakdown</h4>
                            <div className="grid grid-cols-4 gap-4 text-center">
                               <div>
                                  <p className="text-[10px] text-muted-foreground">Output</p>
                                  <p className="text-lg font-bold">{sub.rubric_scores[0].output_score}/2</p>
                               </div>
                               <div>
                                  <p className="text-[10px] text-muted-foreground">Test Cases</p>
                                  <p className="text-lg font-bold">{sub.rubric_scores[0].test_case_score}/2</p>
                               </div>
                               <div>
                                  <p className="text-[10px] text-muted-foreground">Complexity</p>
                                  <p className="text-lg font-bold">{sub.rubric_scores[0].time_complexity_score}/2</p>
                               </div>
                               <div>
                                  <p className="text-[10px] text-muted-foreground">Storage</p>
                                  <p className="text-lg font-bold">{sub.rubric_scores[0].space_complexity_score}/2</p>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                  No submissions recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
