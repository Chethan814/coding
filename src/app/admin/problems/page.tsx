"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, BookOpen, Trash2, Edit2, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { toast } from "sonner";

interface Problem {
  id: string;
  title: string;
  difficulty: string;
  type: string;
  points: number;
}

export default function AdminProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProblems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setProblems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const deleteProblem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this problem?")) return;
    
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete problem");
    } else {
      toast.success("Problem deleted");
      fetchProblems();
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const diffColor: Record<string, string> = {
    Easy: "text-success border-success/30",
    Medium: "text-warning border-warning/30",
    Hard: "text-destructive border-destructive/30",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problem Bank</h1>
          <p className="text-muted-foreground">Manage the coding and debugging challenges for participants.</p>
        </div>
        <Link href="/admin/problems/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Problem
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search problems..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 font-mono text-sm text-muted-foreground">
            Indexing problems...
          </div>
        ) : filteredProblems.length > 0 ? (
          filteredProblems.map((prob) => (
            <div key={prob.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{prob.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className={`text-[10px] ${diffColor[prob.difficulty] || ""}`}>
                      {prob.difficulty.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">• {prob.type}</span>
                    <span className="text-xs text-muted-foreground">• {prob.points} Points</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link href={`/admin/problems/${prob.id}/testcases`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
                    <ListChecks className="h-3.5 w-3.5" /> Test Cases
                  </Button>
                </Link>
                <Link href={`/admin/problems/${prob.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteProblem(prob.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
             <p className="text-muted-foreground">No problems found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
