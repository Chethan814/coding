"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function EditProblem() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    constraints: "",
    examples: [] as { input: string; output: string; explanation?: string }[],
    difficulty: "Medium",
    type: "coding",
    points: 8,
    order_index: 0
  });

  useEffect(() => {
    async function fetchProblem() {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", id)
        .single();
        
      if (data) {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          constraints: data.constraints || "",
          examples: data.examples || [],
          difficulty: data.difficulty || "Medium",
          type: data.type || "coding",
          points: 8, // Force 8 even if DB has something else
          order_index: data.order_index || 0
        });
      }
      setLoading(false);
    }
    fetchProblem();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("problems")
        .update(formData)
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Problem updated successfully!");
      router.push("/admin/problems");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-mono">Loading problem details...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/problems">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Problem</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Problem Title</Label>
                  <Input 
                    id="title" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Markdown Supported)</Label>
                  <Textarea 
                    id="description" 
                    className="min-h-[200px] font-mono text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constraints">Constraints (Optional)</Label>
                  <Textarea 
                    id="constraints" 
                    placeholder="e.g. 2 <= nums.length <= 10^4"
                    className="min-h-[100px] font-mono text-xs bg-muted/20"
                    value={formData.constraints}
                    onChange={(e) => setFormData({...formData, constraints: e.target.value})}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <Label className="uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Examples / Samples</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 px-2 border-primary/20 text-primary"
                      onClick={() => setFormData({
                        ...formData, 
                        examples: [...formData.examples, { input: "", output: "", explanation: "" }]
                      })}
                    >
                      <Plus className="h-3 w-3" /> Add Example
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.examples.map((ex, idx) => (
                      <div key={idx} className="bg-muted/30 border border-border rounded-lg p-4 space-y-3 relative group">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setFormData({
                            ...formData,
                            examples: formData.examples.filter((_, i) => i !== idx)
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">INPUT</span>
                            <Textarea 
                              className="min-h-[60px] font-mono text-xs bg-card" 
                              value={ex.input}
                              onChange={(e) => {
                                const newEx = [...formData.examples];
                                newEx[idx].input = e.target.value;
                                setFormData({...formData, examples: newEx});
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">OUTPUT</span>
                            <Textarea 
                              className="min-h-[60px] font-mono text-xs bg-card" 
                              value={ex.output}
                              onChange={(e) => {
                                const newEx = [...formData.examples];
                                newEx[idx].output = e.target.value;
                                setFormData({...formData, examples: newEx});
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                           <span className="text-[10px] font-mono font-bold text-muted-foreground">EXPLANATION (OPTIONAL)</span>
                           <Input 
                             className="h-8 text-xs bg-card" 
                             value={ex.explanation}
                             placeholder="Brief logic explanation..."
                             onChange={(e) => {
                               const newEx = [...formData.examples];
                               newEx[idx].explanation = e.target.value;
                               setFormData({...formData, examples: newEx});
                             }}
                           />
                        </div>
                      </div>
                    ))}
                    {formData.examples.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-border rounded-lg text-xs text-muted-foreground italic">
                        No examples added. Use examples to guide participants.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => setFormData({...formData, difficulty: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Problem Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData({...formData, type: v as any})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="debugging">Debugging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 group">
                  <Label htmlFor="points" className="text-muted-foreground">Scoring Matrix</Label>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-primary">FIXED: 8 POINTS</span>
                        < Badge variant="outline" className="text-[10px] bg-primary text-white">4 Rubrics</Badge>
                     </div>
                     <p className="text-[9px] text-muted-foreground mt-1 tracking-tighter italic">Points are automatically calculated (2pts x 4 rubrics)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">List Order (Index)</Label>
                  <Input 
                    id="order" 
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setFormData({...formData, order_index: isNaN(val) ? 0 : val});
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full gap-2" disabled={saving}>
              <Save className="h-4 w-4" /> 
              {saving ? "Saving..." : "Apply Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
