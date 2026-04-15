"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Code2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor, type Monaco } from "@monaco-editor/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const SITE_THEME_ID = "codearena-dark";

function defineEditorTheme(monaco: Monaco) {
  monaco.editor.defineTheme(SITE_THEME_ID, {
    base: "vs-dark",
    inherit: true,
    rules: [{ token: "", foreground: "f8fafc", background: "0f172a" }],
    colors: {
      "editor.background": "#0f172a",
      "editor.foreground": "#f8fafc",
      "editorLineNumber.foreground": "#2a3f5f",
      "editorGutter.background": "#0d1526",
    },
  });
}

const CodeEditor = ({ onRun, onSubmit, problemId, defaultStdin, canSubmit, starterCode }: { onRun: any, onSubmit: any, problemId: string, defaultStdin?: string, canSubmit?: boolean, starterCode?: string }) => {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const themeRegistered = useRef(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [generatedSignature, setGeneratedSignature] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      const { data } = await supabase
        .from("problems")
        .select("function_name, parameters, parameter_types, output_type")
        .eq("id", problemId)
        .single();
      if (data) {
        if (!data.parameters || data.parameters.length === 0) {
          setError("This problem is misconfigured (missing parameters). Contact admin.");
        } else {
          setMetadata(data);
        }
      }
    }
    if (problemId) fetchMetadata();
  }, [problemId]);

  const getSignatureLine = useCallback((lang: string, meta: any) => {
    if (!meta) return "";
    const { function_name, parameters, parameter_types, output_type } = meta;
    
    // Type Mapping
    const typeMap: Record<string, any> = {
      python: { int: "int", long: "int", string: "str", int_array: "list[int]", string_array: "list[str]" },
      c: { int: "int", long: "long long", string: "char*", int_array: "int*", string_array: "char**" },
      java: { int: "int", long: "long", string: "String", int_array: "int[]", string_array: "String[]" }
    };

    const outTypeMap: Record<string, any> = {
      python: "",
      c: { single: "int", array: "int*", string: "char*", long: "long long" },
      java: { single: "int", array: "int[]", string: "String", long: "long" }
    };

    const pTypes = typeMap[lang] || {};
    const args: string[] = [];

    for (let i = 0; i < parameters.length; i++) {
        const typeKey = parameter_types[i];
        const name = parameters[i];
        if (lang === "python") {
            args.push(name);
        } else if (lang === "c") {
            args.push(`${pTypes[typeKey] || "int"} ${name}`);
            if (typeKey === "int_array") args.push(`int ${name}_size`);
        } else if (lang === "java") {
            args.push(`${pTypes[typeKey] || "int"} ${name}`);
        }
    }

    if (lang === "python") {
        return `def ${function_name}(${args.join(", ")}):`;
    } else if (lang === "c") {
        const out = outTypeMap.c[output_type] || "int";
        return `${out} ${function_name}(${args.join(", ")}) {`;
    } else if (lang === "java") {
        const out = outTypeMap.java[output_type] || "int";
        return `public static ${out} ${function_name}(${args.join(", ")}) {`;
    }
    return "";
  }, []);

  useEffect(() => {
    if (!metadata) return;
    const sig = getSignatureLine(language, metadata);
    setGeneratedSignature(sig);

    // If starterCode (error template) is provided, use it. Otherwise, use blank body.
    if (starterCode) {
        setCode(starterCode);
    } else {
        const body = language === "python" ? "    # Write your logic here\n    pass" : "    // Write your logic here\n    return 0;\n}";
        setCode(`${sig}\n${body}`);
    }
  }, [language, metadata, getSignatureLine, starterCode]);

  const validateSignature = () => {
    const lines = code.split("\n");
    const firstLine = lines[0].trim();
    if (firstLine !== generatedSignature.trim()) {
        toast.error("Signature Mismatch", {
            description: "Do not modify the first line (function signature).",
            icon: <AlertCircle className="h-4 w-4" />
        });
        return false;
    }
    return true;
  };

  const handleRun = async () => {
    if (!validateSignature()) return;
    setIsRunning(true);
    try {
      await onRun?.(code, language, defaultStdin || "");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateSignature()) return;
    await onSubmit?.(code, language);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden rounded-xl border border-border bg-[#0f172a]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#0d1526]">
        <div className="flex items-center gap-4">
          <Code2 className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider text-primary anim-pulse">Logic-Only Mode</span>
            <span className="text-[9px] text-muted-foreground">{error ? "Config Error" : "Signature Guard Active"}</span>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded text-[10px] text-destructive font-bold uppercase">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        ) : (
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-36 h-8 text-xs bg-[#1e2d45] border-[#2a3f5f] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#131e33] border-[#2a3f5f]">
              <SelectItem value="python">Python 3</SelectItem>
              <SelectItem value="c">C (GCC)</SelectItem>
              <SelectItem value="java">Java 17</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex-1 relative">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
            <div className="max-w-md p-6 bg-card border border-destructive/50 rounded-xl text-center space-y-4 shadow-2xl">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-bold">System Configuration Mismatch</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
          </div>
        ) : (
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={SITE_THEME_ID}
            onMount={(_, monaco) => {
              if (!themeRegistered.current) { defineEditorTheme(monaco); themeRegistered.current = true; }
              monaco.editor.setTheme(SITE_THEME_ID);
            }}
            onChange={(v) => setCode(v || "")}
            options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 20 }, automaticLayout: true }}
          />
        )}

        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <Button size="sm" onClick={handleRun} disabled={isRunning} className="bg-[#1e2d45] text-white hover:bg-[#2a3f5f] h-9 px-4 uppercase text-[10px] font-bold shadow-lg">
            Run Test
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!canSubmit} className="bg-primary text-background font-bold h-9 px-8 uppercase text-[10px] tracking-wider shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
