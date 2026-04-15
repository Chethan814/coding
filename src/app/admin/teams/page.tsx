"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, 
  Trash2, 
  Users, 
  Search, 
  Trophy,
  Copy,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setTeams(data);
    setLoading(false);
  }

  async function createTeam() {
    if (!newTeamName.trim()) return;
    
    const { data, error } = await supabase
      .from("teams")
      .insert([{ name: newTeamName }])
      .select()
      .single();
      
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Team "${newTeamName}" created!`);
      setTeams([data, ...teams]);
      setNewTeamName("");
    }
  }

  async function deleteTeam(id: string) {
    const confirmed = window.confirm("Are you sure? This will delete all submissions and scores for this team permanently.");
    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/team-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_id: id, action: "delete" })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setTeams(teams.filter(t => t.id !== id));
      toast.success(result.message || "Team scrubbed and removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Access code copied!");
  };

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">Manage participating teams and their access codes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search teams..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Team Name / Access Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{team.name}</p>
                          <button 
                            onClick={() => copyToClipboard(team.name)}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            {copiedId === team.name ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                            Copy Access Code
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(team.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteTeam(team.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTeams.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                      No teams found. Start by creating one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Quick Create
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Unique Team Name</p>
                <Input 
                  placeholder="e.g. ByteForce-1" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createTeam()}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  This will also act as the login access code for the participants.
                </p>
              </div>
              <Button className="w-full" onClick={createTeam}>Add Team</Button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Team Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Registered</span>
                <span className="font-mono font-bold">{teams.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Live Participants</span>
                <Badge variant="outline" className="font-mono text-[10px]">0 ACTIVE</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
