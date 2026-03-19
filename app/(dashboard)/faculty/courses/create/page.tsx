"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  UploadCloud, FileText, Sparkles, Wand2, Hammer, CheckCircle2,
  ChevronRight, ChevronLeft, Bot, Plus, BookOpen, ChevronDown,
  Layers, PenLine, Trash2, X, GripVertical, FolderOpen, RefreshCw
} from "lucide-react";
import testCourseData from "@/data/test_course.json";

// ─── Types ───────────────────────────────────────────────────────────────────
type BuildMode = "ai" | "manual" | null;
type ContentSource = "existing" | "upload" | null;
type GeneratorStep = "choose" | "upload" | "questions" | "result";

interface Subtopic { id: string; title: string; content: string; }
interface Topic { id: string; title: string; subtopics: Subtopic[]; }
interface Lesson { id: string; title: string; topics: Topic[]; generatedContent?: string; }
interface Chapter { id: string; title: string; lessons: Lesson[]; }
interface Module { id: string; title: string; chapters: Chapter[]; }

interface ContentGeneratorState {
  open: boolean;
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  chapterId: string;
  step: GeneratorStep;
  source: ContentSource;
  uploadedFile: File | null;
  lessonDesc: string;
  lessonScope: string;
  levelOfDetail: string;
  includeExamples: string;
  isGenerating: boolean;
  generatedContent: string;
}

const DUMMY_LESSON_CONTENT = (title: string) => `## ${title}

### Overview
This lesson provides a comprehensive introduction to the core principles involved. Students will build foundational understanding through theoretical frameworks and applied practical examples drawn from real-world engineering and industry contexts.

### Key Concepts
- **Principle 1**: Fundamental definition and scope, with emphasis on practical implications for modern design and analysis.
- **Principle 2**: Mathematical formulation and governing equations — students are expected to apply these to structured numerical problems.
- **Principle 3**: Classification of types/methods with comparative advantages and limitations discussed in depth.

### Learning Pathway
This lesson is structured progressively:
1. Begin with conceptual understanding and historical context
2. Build mathematical and analytical tools step-by-step
3. Apply to worked examples across different domains
4. Consolidate with a summary table and review questions

### Practical Applications
Real-world use cases where these principles are applied include manufacturing systems, thermal management, structural analysis, and system design. Case studies will be drawn from automotive, aerospace, and civil engineering domains.

### Summary
By the end of this lesson, students should be able to define, derive, classify, and apply the core concepts to unseen analytical problems within the given scope.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const DRAFT_KEY = "course-create-draft";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useSession();
  const { toast } = useToast();

  // Course form data — declared first so draft-restore useEffect can call setFormData
  const [formData, setFormData] = useState({
    title: "", program: "", year: "", semester: "",
    university: "", departmentId: "d1", description: ""
  });

  const [step, setStep] = useState(1);  // 1-3 wizard steps
  const [buildMode, setBuildMode] = useState<BuildMode>(null); // after step 3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [draftRestored, setDraftRestored] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiChat, setAiChat] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: `I've analysed your uploaded materials and generated a comprehensive course draft. The structure on the right reflects the full syllabus. Feel free to ask me to modify any module, add assessments, or rewrite topics!` }
  ]);

  // Manual builder state
  const [manualModules, setManualModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Ref for lesson file upload input
  const genFileInputRef = useRef<HTMLInputElement>(null);

  // Lesson content generator dialog
  const defaultGenState: ContentGeneratorState = {
    open: false, lessonId: "", lessonTitle: "", moduleId: "", chapterId: "",
    step: "choose", source: null, uploadedFile: null,
    lessonDesc: "", lessonScope: "", levelOfDetail: "intermediate", includeExamples: "yes",
    isGenerating: false, generatedContent: "",
  };
  const [genState, setGenState] = useState<ContentGeneratorState>(defaultGenState);
  const setGen = (partial: Partial<ContentGeneratorState>) => setGenState(prev => ({ ...prev, ...partial }));

  // ─── Draft persistence ────────────────────────────────────────────────────
  // Restore draft on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.formData) setFormData(draft.formData);
      if (typeof draft.step === "number") setStep(draft.step);
      if (draft.buildMode) setBuildMode(draft.buildMode);
      if (Array.isArray(draft.manualModules)) setManualModules(draft.manualModules);
      if (Array.isArray(draft.expandedModules)) setExpandedModules(new Set(draft.expandedModules));
      if (Array.isArray(draft.expandedChapters)) setExpandedChapters(new Set(draft.expandedChapters));
      setDraftRestored(true);
    } catch { /* ignore corrupt drafts */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft whenever relevant state changes
  const saveDraft = useCallback(() => {
    try {
      const draft = {
        formData,
        step,
        buildMode,
        manualModules,
        expandedModules: Array.from(expandedModules),
        expandedChapters: Array.from(expandedChapters),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* quota exceeded — ignore */ }
  }, [formData, step, buildMode, manualModules, expandedModules, expandedChapters]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftRestored(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setStep(1);
    setBuildMode(null);
    setFormData({ title: "", program: "", year: "", semester: "", university: "", departmentId: "d1", description: "" });
    setManualModules([]);
    setExpandedModules(new Set());
    setExpandedChapters(new Set());
    setUploadedFiles([]);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const openContentGenerator = (moduleId: string, chapterId: string, lesson: Lesson) => {
    setGenState({ ...defaultGenState, open: true, lessonId: lesson.id, lessonTitle: lesson.title, moduleId, chapterId, step: "choose" });
  };

  const handleGenGenerate = () => {
    setGen({ isGenerating: true });
    setTimeout(() => {
      setGen({ isGenerating: false, generatedContent: DUMMY_LESSON_CONTENT(genState.lessonTitle), step: "result" });
    }, 1800);
  };

  const handleSaveGeneratedContent = () => {
    const { moduleId, chapterId, lessonId, generatedContent } = genState;
    setManualModules(prev => prev.map(m => m.id !== moduleId ? m : {
      ...m, chapters: m.chapters.map(ch => ch.id !== chapterId ? ch : {
        ...ch, lessons: ch.lessons.map(l => l.id !== lessonId ? l : { ...l, generatedContent })
      })
    }));
    setGenState(defaultGenState);
    toast({ title: "Content saved!", description: `Lesson content saved for “${genState.lessonTitle}”` });
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setUploadedFiles(Array.from(e.target.files));
  };

  const handleChooseAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setBuildMode("ai");
    }, 2000);
  };

  const handleChooseManual = () => {
    setBuildMode("manual");
    // Seed with one empty module
    setManualModules([{ id: uid(), title: "Module 1", chapters: [] }]);
    setExpandedModules(new Set(["m0"]));
  };

  const handlePublish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        program: formData.program,
        year: parseInt(formData.year) || 1,
        semester: parseInt(formData.semester) || 1,
        university: formData.university,
        departmentId: [formData.departmentId],
        description: formData.description,
        faculty: user.id,
        syllabus: "./test_course.json",
      };
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        clearDraft(); // remove draft on successful publish
        toast({ title: "Course Published!", description: "Your course is now live." });
        router.push("/faculty/courses");
      } else throw new Error(result.error);
    } catch {
      toast({ title: "Error", description: "Failed to publish.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── AI Chat ──────────────────────────────────────────────────────────────
  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    const userMsg = aiMessage.trim();
    setAiChat(prev => [...prev, { role: "user", text: userMsg }]);
    setAiMessage("");
    setTimeout(() => {
      setAiChat(prev => [...prev, {
        role: "ai",
        text: `Got it! I've processed your request: "${userMsg}". The course structure has been updated accordingly. Is there anything else you'd like to refine?`
      }]);
    }, 900);
  };

  // ─── Manual Builder Handlers ──────────────────────────────────────────────
  const addModule = () => {
    const id = uid();
    setManualModules(prev => [...prev, { id, title: `Module ${prev.length + 1}`, chapters: [] }]);
    setExpandedModules(prev => new Set([...prev, id]));
  };

  const addChapter = (moduleId: string) => {
    setManualModules(prev => prev.map(m => m.id !== moduleId ? m : {
      ...m, chapters: [...m.chapters, { id: uid(), title: `Chapter ${m.chapters.length + 1}`, lessons: [] }]
    }));
  };

  const addLesson = (moduleId: string, chapterId: string) => {
    setManualModules(prev => prev.map(m => m.id !== moduleId ? m : {
      ...m, chapters: m.chapters.map(ch => ch.id !== chapterId ? ch : {
        ...ch, lessons: [...ch.lessons, { id: uid(), title: `Lesson ${ch.lessons.length + 1}`, topics: [] }]
      })
    }));
  };

  const updateModuleTitle = (id: string, title: string) =>
    setManualModules(prev => prev.map(m => m.id !== id ? m : { ...m, title }));
  const updateChapterTitle = (mId: string, chId: string, title: string) =>
    setManualModules(prev => prev.map(m => m.id !== mId ? m : {
      ...m, chapters: m.chapters.map(ch => ch.id !== chId ? ch : { ...ch, title })
    }));
  const updateLessonTitle = (mId: string, chId: string, lId: string, title: string) =>
    setManualModules(prev => prev.map(m => m.id !== mId ? m : {
      ...m, chapters: m.chapters.map(ch => ch.id !== chId ? ch : {
        ...ch, lessons: ch.lessons.map(l => l.id !== lId ? l : { ...l, title })
      })
    }));

  const toggleModule = (id: string) => setExpandedModules(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const toggleChapter = (id: string) => setExpandedChapters(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  // ─── Step Indicator ───────────────────────────────────────────────────────
  const stepLabels = ["Details", "Materials", "Method"];
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
        style={{ width: `${((step - 1) / 2) * 100}%` }}
      />
      {stepLabels.map((label, i) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
            step > i + 1 ? "bg-primary text-primary-foreground shadow-lg" :
            step === i + 1 ? "bg-primary text-primary-foreground shadow-lg" :
            "bg-muted text-muted-foreground"
          }`}>{step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}</div>
          <span className={`text-xs font-semibold ${step >= i + 1 ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
        </div>
      ))}
    </div>
  );

  // ─── AI Course Data from test_course.json ────────────────────────────────
  const testModules = (testCourseData as any).modules ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // FULL-PAGE: AI Builder
  // ─────────────────────────────────────────────────────────────────────────
  if (buildMode === "ai") {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -my-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setBuildMode(null)} className="gap-1 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" /> Back to Method
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="font-bold text-base line-clamp-1">{formData.title || "Untitled Course"}</h1>
              <p className="text-xs text-muted-foreground">{formData.program} · AI Generated Draft</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 font-medium">Draft</span>
            <Button onClick={handlePublish} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 gap-2">
              {isSubmitting ? "Publishing..." : "Publish Course"} <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Body: Chat | Course Structure */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: AI Chat */}
          <div className="w-[340px] shrink-0 border-r flex flex-col bg-muted/20">
            <div className="px-4 py-3 border-b bg-background flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Course Assistant</p>
                <p className="text-xs text-muted-foreground">Refine your course</p>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {aiChat.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-background border rounded-bl-none shadow-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={aiMessage}
                  onChange={e => setAiMessage(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAiSend()}
                  placeholder="Ask AI to refine..."
                  className="text-sm"
                />
                <Button size="icon" onClick={handleAiSend} className="shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Course Overview */}
          <div className="flex-1 overflow-y-auto">
            {/* Course Header Banner */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]" />
              <div className="relative z-10">
                <p className="text-indigo-200 text-sm font-medium mb-1">{testCourseData.target_audience}</p>
                <h2 className="text-3xl font-bold mb-2">{testCourseData.course_title}</h2>
                <p className="text-white/80 text-sm leading-relaxed max-w-2xl">{testCourseData.course_description}</p>
                <div className="flex gap-4 mt-4">
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{testCourseData.difficulty_level}</span>
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{testCourseData.estimated_duration}</span>
                  <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">{testModules.length} Modules</span>
                </div>
              </div>
            </div>

            {/* Modules List */}
            <div className="p-6 space-y-4">
              {testModules.map((mod: any, mIdx: number) => {
                const chapterCount = mod.chapters?.length ?? 0;
                const lessonCount = (mod.chapters ?? []).reduce((s: number, ch: any) => s + (ch.lessons?.length ?? 0), 0);
                return (
                  <div key={mIdx} className="border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-muted/30 p-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                          {mIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{mod.module_title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.module_objective}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 text-xs text-muted-foreground">
                        <span className="bg-muted rounded px-1.5 py-0.5">{chapterCount} ch</span>
                        <span className="bg-muted rounded px-1.5 py-0.5">{lessonCount} lessons</span>
                      </div>
                    </div>
                    <div className="divide-y">
                      {(mod.chapters ?? []).map((ch: any, chIdx: number) => (
                        <div key={chIdx} className="p-4 pl-6">
                          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                            Chapter {chIdx + 1}: {ch.chapter_title}
                          </p>
                          <div className="space-y-1.5 pl-2">
                            {(ch.lessons ?? []).map((lesson: any, lIdx: number) => (
                              <div key={lIdx} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 group cursor-pointer">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm flex-1 line-clamp-1">{lesson.lesson_title}</span>
                                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                  {lesson.topics?.length ?? 0} topics
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FULL-PAGE: Manual Builder
  // ─────────────────────────────────────────────────────────────────────────
  if (buildMode === "manual") {
    return (<>

      {/* ─── Lesson Content Generator Dialog ─────────────────────────────── */}
      <Dialog open={genState.open} onOpenChange={open => !open && setGenState(defaultGenState)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Generate Lesson Content
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lesson: <span className="font-semibold text-foreground">{genState.lessonTitle}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Step: Choose source */}
          {genState.step === "choose" && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">How would you like to generate content for this lesson?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setGen({ source: "existing", step: "questions" })}
                  className="flex flex-col items-center gap-3 p-5 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-full flex items-center justify-center">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-primary">Use Existing Files</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Generate from already uploaded course materials</p>
                  </div>
                </button>
                <button
                  onClick={() => setGen({ source: "upload", step: "upload" })}
                  className="flex flex-col items-center gap-3 p-5 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-950 text-green-600 rounded-full flex items-center justify-center">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-primary">Upload New File</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload a specific reference file for this lesson</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Upload new file */}
          {genState.step === "upload" && (
            <div className="space-y-4 py-2">
              {/* Hidden native file input — triggered via ref */}
              <input
                ref={genFileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={e => e.target.files?.[0] && setGen({ uploadedFile: e.target.files[0] })}
              />
              <div
                className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => genFileInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 text-primary mb-3 opacity-70" />
                {genState.uploadedFile ? (
                  <>
                    <p className="font-semibold text-sm text-green-600">{genState.uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(genState.uploadedFile.size / 1024).toFixed(1)} KB — ready to process
                    </p>
                    <p className="text-xs text-primary mt-2 underline">Click to change file</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sm">Click to browse or drag &amp; drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — specific material for this lesson</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={e => { e.stopPropagation(); genFileInputRef.current?.click(); }}
                    >
                      Browse Files
                    </Button>
                  </>
                )}
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setGen({ step: "choose", uploadedFile: null })}>Back</Button>
                <Button
                  disabled={!genState.uploadedFile || genState.isGenerating}
                  onClick={handleGenGenerate}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white gap-2"
                >
                  {genState.isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Content</>}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Questions for existing files */}
          {genState.step === "questions" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">Fill in these details to help AI generate precise, relevant content for this lesson.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Lesson Description <span className="text-muted-foreground">(what this lesson covers)</span></Label>
                  <textarea
                    value={genState.lessonDesc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGen({ lessonDesc: e.target.value })}
                    placeholder="e.g. Covers the fundamental concepts of stress and strain in solid mechanics including Hooke's Law..."
                    className="text-sm min-h-[70px] resize-none w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Scope of the Lesson</Label>
                  <textarea
                    value={genState.lessonScope}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGen({ lessonScope: e.target.value })}
                    placeholder="e.g. Limit to undergraduate level; exclude derivations beyond basic calculus"
                    className="text-sm min-h-[60px] resize-none w-full rounded-md border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Level of Detail</Label>
                  <Select value={genState.levelOfDetail} onValueChange={v => setGen({ levelOfDetail: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="introductory">Introductory — high level overview</SelectItem>
                      <SelectItem value="intermediate">Intermediate — moderate depth</SelectItem>
                      <SelectItem value="advanced">Advanced — full derivations & proofs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Include Worked Examples?</Label>
                  <Select value={genState.includeExamples} onValueChange={v => setGen({ includeExamples: v })}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes — include 2-3 solved examples</SelectItem>
                      <SelectItem value="no">No — theory only</SelectItem>
                      <SelectItem value="extensive">Extensive — prioritise examples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setGen({ step: "choose" })}>Back</Button>
                <Button
                  disabled={genState.isGenerating}
                  onClick={handleGenGenerate}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white gap-2"
                >
                  {genState.isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Content</>}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {genState.step === "result" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm font-semibold">Content generated successfully!</p>
              </div>
              <div className="border rounded-xl bg-muted/30 p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{genState.generatedContent}</pre>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setGen({ step: "choose", generatedContent: "", source: null })}>Start Over</Button>
                <Button onClick={handleSaveGeneratedContent} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Save to Lesson
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -my-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setBuildMode(null)} className="gap-1 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="font-bold text-base line-clamp-1">{formData.title || "Untitled Course"}</h1>
              <p className="text-xs text-muted-foreground">Manual Builder</p>
            </div>
          </div>
          <Button onClick={handlePublish} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 gap-2">
            {isSubmitting ? "Publishing..." : "Publish Course"} <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Body: Tree | Preview */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Structure Editor */}
          <div className="w-[340px] shrink-0 border-r flex flex-col overflow-hidden bg-muted/10">
            <div className="px-4 py-3 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hammer className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Course Structure</p>
              </div>
              <Button size="sm" variant="outline" onClick={addModule} className="gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> Module
              </Button>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-2">
              {manualModules.map((mod, mIdx) => (
                <div key={mod.id} className="border rounded-lg overflow-hidden bg-background shadow-sm">
                  {/* Module Row */}
                  <div
                    className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/30"
                    onClick={() => toggleModule(mod.id)}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedModules.has(mod.id) ? "" : "-rotate-90"}`} />
                    <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Input
                      value={mod.title}
                      onChange={e => { e.stopPropagation(); updateModuleTitle(mod.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="h-6 text-xs border-0 p-0 bg-transparent font-semibold focus-visible:ring-0 flex-1 min-w-0"
                    />
                    <Button size="icon" variant="ghost" className="w-6 h-6 shrink-0 opacity-40 hover:opacity-100"
                      onClick={e => { e.stopPropagation(); addChapter(mod.id); }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Chapters */}
                  {expandedModules.has(mod.id) && (
                    <div className="pl-4 pb-2 space-y-1">
                      {mod.chapters.map((ch, chIdx) => (
                        <div key={ch.id} className="border rounded-md overflow-hidden">
                          <div
                            className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/20"
                            onClick={() => toggleChapter(ch.id)}
                          >
                            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expandedChapters.has(ch.id) ? "" : "-rotate-90"}`} />
                            <BookOpen className="w-3 h-3 text-amber-500 shrink-0" />
                            <Input
                              value={ch.title}
                              onChange={e => { e.stopPropagation(); updateChapterTitle(mod.id, ch.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              className="h-5 text-xs border-0 p-0 bg-transparent focus-visible:ring-0 flex-1 min-w-0"
                            />
                            <Button size="icon" variant="ghost" className="w-5 h-5 shrink-0 opacity-40 hover:opacity-100"
                              onClick={e => { e.stopPropagation(); addLesson(mod.id, ch.id); }}>
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          {expandedChapters.has(ch.id) && (
                            <div className="pl-5 pb-1.5 space-y-0.5">
                              {ch.lessons.map((lesson, lIdx) => (
                                <div key={lesson.id} className="group flex flex-col gap-0.5 py-1 px-2 rounded hover:bg-muted/20">
                                  <div className="flex items-center gap-2">
                                    <FileText className={`w-3 h-3 shrink-0 ${lesson.generatedContent ? "text-green-500" : "text-muted-foreground"}`} />
                                    <Input
                                      value={lesson.title}
                                      onChange={e => updateLessonTitle(mod.id, ch.id, lesson.id, e.target.value)}
                                      className="h-5 text-xs border-0 p-0 bg-transparent focus-visible:ring-0 flex-1 min-w-0"
                                    />
                                    <button
                                      onClick={() => openContentGenerator(mod.id, ch.id, lesson)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[10px] text-purple-600 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium"
                                    >
                                      <Sparkles className="w-2.5 h-2.5" />
                                      {lesson.generatedContent ? "Regen" : "Generate"}
                                    </button>
                                  </div>
                                  {lesson.generatedContent && (
                                    <p className="text-[10px] text-green-600 pl-5">✓ Content ready</p>
                                  )}
                                </div>
                              ))}
                              <button
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 px-2 py-1"
                                onClick={() => addLesson(mod.id, ch.id)}
                              >
                                <Plus className="w-3 h-3" /> Add Lesson
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 px-2 py-1"
                        onClick={() => addChapter(mod.id)}
                      >
                        <Plus className="w-3 h-3" /> Add Chapter
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {manualModules.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No modules yet</p>
                  <Button size="sm" className="mt-3" onClick={addModule}>Add First Module</Button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold">{formData.title || "Untitled Course"}</h2>
                <p className="text-muted-foreground mt-1">{formData.program}</p>
                {formData.description && (
                  <p className="text-sm mt-3 leading-relaxed text-muted-foreground max-w-2xl">{formData.description}</p>
                )}
              </div>

              {manualModules.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Layers className="w-12 h-12 opacity-20 mb-4" />
                  <p className="text-lg font-medium">Start building your course</p>
                  <p className="text-sm mt-1">Add modules using the left panel to see a live preview here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {manualModules.map((mod, mIdx) => (
                    <div key={mod.id} className="border rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-primary/5 border-b p-4 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold text-sm">
                          {mIdx + 1}
                        </div>
                        <h3 className="font-semibold">{mod.title || "Untitled Module"}</h3>
                        <span className="ml-auto text-xs text-muted-foreground">{mod.chapters.length} chapters</span>
                      </div>
                      {mod.chapters.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center italic">No chapters yet</p>
                      ) : (
                        <div className="divide-y">
                          {mod.chapters.map((ch, chIdx) => (
                            <div key={ch.id} className="p-4">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Ch {chIdx + 1}: {ch.title || "Untitled Chapter"}
                              </p>
                              <div className="space-y-1.5 pl-3">
                                {ch.lessons.map((lesson, lIdx) => (
                                  <div key={lesson.id} className="rounded-lg border overflow-hidden mb-2">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                                      <FileText className={`w-3.5 h-3.5 shrink-0 ${lesson.generatedContent ? "text-green-500" : "text-muted-foreground"}`} />
                                      <span className="text-sm font-medium flex-1">{lesson.title || "Untitled Lesson"}</span>
                                      {lesson.generatedContent && (
                                        <span className="text-[10px] bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">✓ Content</span>
                                      )}
                                    </div>
                                    {lesson.generatedContent && (
                                      <div className="px-4 py-3 bg-background border-t">
                                        <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{lesson.generatedContent}</pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {ch.lessons.length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">No lessons</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WIZARD STEPS 1–3
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
          <p className="text-muted-foreground mt-1">Design, structure, and publish a new course for your students.</p>
        </div>
        {draftRestored && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-2.5 text-sm shrink-0">
            <span>✦ Draft restored</span>
            <button
              onClick={handleDiscardDraft}
              className="underline text-amber-600 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-100 font-medium"
            >
              Discard
            </button>
          </div>
        )}
      </div>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardContent className="pt-6">
          {renderStepIndicator()}

          <div className="mt-8 relative min-h-[400px]">
            {/* Step 1: Metadata */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Heat and Mass Transfer" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Input id="program" name="program" value={formData.program} onChange={handleInputChange} placeholder="e.g. B.E. Mechanical Engineering" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" name="year" type="number" value={formData.year} onChange={handleInputChange} placeholder="e.g. 3" min="1" max="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Input id="semester" name="semester" type="number" value={formData.semester} onChange={handleInputChange} placeholder="e.g. 5" min="1" max="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input id="university" name="university" value={formData.university} onChange={handleInputChange} placeholder="e.g. Anna University" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select value={formData.departmentId} onValueChange={v => handleSelectChange("departmentId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="d1">Computer Science</SelectItem>
                        <SelectItem value="d2">Mechanical Engineering</SelectItem>
                        <SelectItem value="d3">Electrical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="description">Course Description</Label>
                  <textarea
                    id="description" name="description" value={formData.description} onChange={handleInputChange}
                    placeholder="A rigorous, industry-oriented course..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setStep(2)} disabled={!formData.title || !formData.program} className="gap-2">
                    Next Step <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Materials */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-6">
                  <h3 className="text-lg font-medium">Upload Course Reference Materials</h3>
                  <p className="text-sm text-muted-foreground">Upload syllabus PDFs, past lecture notes, or textbooks to help structure the course.</p>
                </div>
                <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-primary/10 transition-colors cursor-pointer relative">
                  <UploadCloud className="w-12 h-12 text-primary mb-4 opacity-80" />
                  <p className="font-semibold text-primary">Drag & drop files here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT up to 50MB</p>
                  <Input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Uploaded Files</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div className="truncate">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="gap-2"><ChevronLeft className="w-4 h-4" /> Back</Button>
                  <Button onClick={() => setStep(3)} className="gap-2">Proceed <ChevronRight className="w-4 h-4" /></Button>
                </div>
              </div>
            )}

            {/* Step 3: Build Method */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-8">
                  <h3 className="text-xl font-bold">How would you like to build this course?</h3>
                  <p className="text-sm text-muted-foreground">Let AI generate a structured draft, or start building manually from scratch.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card
                    className={`relative overflow-hidden cursor-pointer border-2 transition-all hover:border-primary hover:shadow-xl ${isGenerating ? "opacity-60 pointer-events-none" : ""}`}
                    onClick={handleChooseAI}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
                    <CardHeader className="text-center pb-2 relative z-10">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle>Generate with AI</CardTitle>
                      <CardDescription className="pt-2">Automatically structure modules, quizzes, and lessons from your uploaded materials.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center relative z-10 pb-6">
                      <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2" disabled={isGenerating}>
                        {isGenerating ? "Analysing Files..." : "Generate Draft"} {!isGenerating && <Wand2 className="w-4 h-4" />}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card
                    className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-xl flex flex-col"
                    onClick={handleChooseManual}
                  >
                    <CardHeader className="text-center pb-2 flex-grow">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Hammer className="w-8 h-8 text-foreground" />
                      </div>
                      <CardTitle>Manual Build</CardTitle>
                      <CardDescription className="pt-2">Start from scratch and manually define modules, chapters, lessons, topics, and subtopics.</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center pb-6">
                      <Button variant="outline" className="w-full gap-2">Start Building <ChevronRight className="w-4 h-4" /></Button>
                    </CardFooter>
                  </Card>
                </div>
                <div className="flex justify-start pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="gap-2" disabled={isGenerating}>
                    <ChevronLeft className="w-4 h-4" /> Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
