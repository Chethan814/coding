"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Plus, Trash2, Save, FlaskConical } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface TestCase {
  id?: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export default function ProblemTestCases() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<any>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: prob } = await supabase.from("problems").select("title").eq("id", id).single();
      const { data: tcs } = await supabase.from("test_cases").select("*").eq("problem_id", id);
      
      if (prob) setProblem(prob);
      if (tcs) setTestCases(tcs);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected_output: "", is_hidden: true }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: any) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simplest way: Delete old ones and insert all new ones
      await supabase.from("test_cases").delete().eq("problem_id", id);
      
      const { error } = await supabase.from("test_cases").insert(
        testCases.map(tc => ({
          ...tc,
          problem_id: id
        }))
      );
      
      if (error) throw error;
      toast.success("Test cases updated!");
      router.push("/admin/problems");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-mono">Loading test engine...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/problems">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Test Case Management</h1>
            <p className="text-muted-foreground">Configuring runner for: <span className="text-primary font-mono">{problem?.title}</span></p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="space-y-4">
        {testCases.map((tc, index) => (
          <Card key={index} className="border-border bg-card">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Test Case #{index + 1}</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id={`hidden-${index}`} 
                    checked={tc.is_hidden} 
                    onCheckedChange={(val) => updateTestCase(index, "is_hidden", !!val)}
                  />
                  <Label htmlFor={`hidden-${index}`} className="text-xs">Hidden</Label>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTestCase(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Input</Label>
                  <Textarea 
                    className="font-mono text-xs min-h-[80px] bg-muted/20" 
                    placeholder="Standard input..."
                    value={tc.input}
                    onChange={(e) => updateTestCase(index, "input", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Expected Output</Label>
                  <Textarea 
                    className="font-mono text-xs min-h-[80px] bg-muted/20" 
                    placeholder="Exact expected output..."
                    value={tc.expected_output}
                    onChange={(e) => updateTestCase(index, "expected_output", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button 
          variant="outline" 
          className="w-full border-dashed py-8 border-2 group hover:border-primary/50 hover:bg-primary/5 transition-all"
          onClick={addTestCase}
        >
          <Plus className="h-5 w-5 mr-2 text-muted-foreground group-hover:text-primary" />
          Add New Test Case
        </Button>
      </div>
    </div>
  );
}
