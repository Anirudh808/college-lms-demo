"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCourse } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import type { SyllabusModule, SyllabusLesson, SyllabusSubtopic } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  PlayCircle,
  Lock,
  Bot,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  Image as ImageIcon,
  FileText,
  ClipboardCheck,
  Hash,
  Circle,
  Trophy,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// A flat ordered list of "steps" for the current lesson
type StepKind = "topic" | "subtopic" | "quiz";
interface Step {
  id: string;        // unique step id used as ?step= value
  kind: StepKind;
  label: string;
  topicId?: string;
  subtopicData?: SyllabusSubtopic;
  imageMeta?: { caption: string; license: string; source: string }[];
}

// ─── Carousel ────────────────────────────────────────────────────────────────
function Carousel({
  items,
  renderItem,
  emptyText,
}: {
  items: string[];
  renderItem: (item: string, idx: number) => React.ReactNode;
  emptyText: string;
}) {
  const [idx, setIdx] = useState(0);
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-4 text-center opacity-50">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">{renderItem(items[idx], idx)}</div>
      {items.length > 1 && (
        <div className="flex items-center justify-between mt-2 px-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-medium">{idx + 1} / {items.length}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7"
            onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} disabled={idx === items.length - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Markdown prose renderer ─────────────────────────────────────────────────
function Prose({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className) || ""}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
          p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed text-foreground/80">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
          code: ({ children, className: cls }) => {
            const isBlock = cls?.includes("language-");
            return isBlock
              ? <code className="block bg-muted rounded-lg px-3 py-2 text-xs font-mono text-foreground whitespace-pre-wrap my-2">{children}</code>
              : <code className="bg-muted rounded px-1 py-0.5 text-xs font-mono text-primary">{children}</code>;
          },
          pre: ({ children }) => <pre className="bg-muted rounded-xl p-3 my-3 overflow-x-auto text-xs">{children}</pre>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-sm text-foreground/80">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm text-foreground/80">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-3 my-2 text-muted-foreground italic text-sm">{children}</blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80">{children}</a>
          ),
          hr: () => <hr className="border-border my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Subtopic 3-Panel View ────────────────────────────────────────────────────
function SubtopicView({ sub, imageMeta }: {
  sub: SyllabusSubtopic;
  imageMeta?: { caption: string; license: string; source: string }[];
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div
        className="grid gap-4 flex-1 min-h-0"
        style={{ gridTemplateColumns: "55% 45%", gridTemplateRows: "1fr 1fr" }}
      >
        {/* Panel 1: Content — col 1, rows 1+2 */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col min-h-0"
          style={{ gridColumn: "1", gridRow: "1 / 3" }}>
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {sub.content ? (
              <Prose content={sub.content} />
            ) : (
              <p className="text-sm text-muted-foreground italic opacity-50">No content yet.</p>
            )}
          </div>
        </div>

        {/* Panel 2: Examples — col 2, row 1 */}
        <div className="rounded-2xl border bg-amber-500/5 border-amber-500/20 p-5 flex flex-col min-h-0"
          style={{ gridColumn: "2", gridRow: "1" }}>
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Examples</span>
          </div>
          <div className="flex-1 min-h-0">
            <Carousel
              items={sub.examples ?? []}
              emptyText="No examples for this subtopic."
              renderItem={(ex) => (
                <div className="border-l-2 border-amber-400 pl-3 py-1 overflow-y-auto h-full">
                  <Prose content={ex} className="text-muted-foreground" />
                </div>
              )}
            />
          </div>
        </div>

        {/* Panel 3: Images — col 2, row 2 */}
        <div className="rounded-2xl border bg-blue-500/5 border-blue-500/20 p-5 flex flex-col min-h-0"
          style={{ gridColumn: "2", gridRow: "2" }}>
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Illustrations</span>
          </div>
          <div className="flex-1 min-h-0">
            <Carousel
              items={sub.images ?? []}
              emptyText="No illustrations for this subtopic."
              renderItem={(imgUrl, i) => {
                const meta = imageMeta?.[i];
                return (
                  <figure className="flex flex-col items-center gap-2 h-full min-h-0">
                    <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                      <img src={imgUrl} alt={meta?.caption ?? `Image ${i + 1}`}
                        className="rounded-xl object-contain h-full max-w-full bg-muted border"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    {meta?.caption && (
                      <figcaption className="text-[10px] text-muted-foreground italic text-center line-clamp-2 shrink-0">
                        {meta.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Topic Overview View ──────────────────────────────────────────────────────
function TopicOverview({ topicTitle, subtopics }: { topicTitle: string; subtopics: SyllabusSubtopic[] }) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">This topic covers {subtopics.length} subtopic{subtopics.length !== 1 ? "s" : ""}:</p>
      <div className="grid gap-3">
        {subtopics.map((sub, i) => (
          <div key={sub.id} className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-sm">{sub.title}</p>
              {sub.content && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{sub.content.slice(0, 160)}…</p>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Click <strong>Next</strong> below to begin with the first subtopic.
      </p>
    </div>
  );
}

// ─── Quiz View ────────────────────────────────────────────────────────────────
function QuizView({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted ? questions.filter((q) => answers[q.id] === q.correct).length : 0;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const reset = () => { setAnswers({}); setSubmitted(false); };

  if (submitted) {
    return (
      <div className="space-y-6">
        {/* Score Banner */}
        <div className={cn(
          "rounded-2xl p-6 text-center border",
          score === questions.length ? "bg-green-500/10 border-green-500/30" :
          score >= questions.length * 0.6 ? "bg-yellow-500/10 border-yellow-500/30" :
          "bg-red-500/10 border-red-500/30"
        )}>
          <Trophy className={cn("h-12 w-12 mx-auto mb-3",
            score === questions.length ? "text-green-500" :
            score >= questions.length * 0.6 ? "text-yellow-500" : "text-red-500"
          )} />
          <p className="text-3xl font-bold">{score} / {questions.length}</p>
          <p className="text-muted-foreground mt-1">
            {score === questions.length ? "Perfect score! 🎉" :
             score >= questions.length * 0.6 ? "Good job! Keep it up." :
             "Review the lesson and try again."}
          </p>
          <Progress
            value={(score / questions.length) * 100}
            className="mt-4 h-2"
          />
        </div>

        {/* Review */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const chosen = answers[q.id];
            const isCorrect = chosen === q.correct;
            return (
              <div key={q.id} className={cn(
                "p-4 rounded-xl border",
                isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
              )}>
                <p className="font-semibold text-sm mb-3">
                  <span className="text-muted-foreground mr-2">Q{qIdx + 1}.</span>{q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={cn(
                      "px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                      q.correct === oIdx ? "bg-green-500/15 text-green-700 dark:text-green-400 font-medium" :
                      chosen === oIdx ? "bg-red-500/15 text-red-700 dark:text-red-400" :
                      "text-muted-foreground"
                    )}>
                      {q.correct === oIdx ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" /> :
                       chosen === oIdx ? <XCircle className="h-4 w-4 shrink-0 text-red-500" /> :
                       <div className="h-4 w-4 shrink-0" />}
                      {opt}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground p-2 bg-background/60 rounded-lg border">
                  <span className="font-bold text-foreground">Explanation: </span>{q.explanation}
                </p>
              </div>
            );
          })}
        </div>
        <Button variant="outline" onClick={reset} className="gap-2">
          <ClipboardCheck className="h-4 w-4" /> Retake Quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {questions.map((q, qIdx) => (
        <div key={q.id} className="p-4 rounded-xl border bg-muted/20">
          <p className="font-semibold text-sm mb-3">
            <span className="text-muted-foreground mr-2">Q{qIdx + 1}.</span>{q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oIdx) => {
              const chosen = answers[q.id] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: oIdx }))}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-3",
                    chosen ? "border-primary bg-primary/10 font-medium" : "border-muted hover:border-primary/40 hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 shrink-0 transition-colors",
                    chosen ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )} />
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <Button onClick={() => setSubmitted(true)} disabled={!allAnswered} className="gap-2">
        <ClipboardCheck className="h-4 w-4" />
        Submit Quiz
        {!allAnswered && <span className="text-xs opacity-70 ml-1">({Object.keys(answers).length}/{questions.length} answered)</span>}
      </Button>
    </div>
  );
}

// ─── Floating AI Chat ─────────────────────────────────────────────────────────
function FloatingChat({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI Tutor. Ask me anything about this lesson." }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, open]);

  const send = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setTimeout(() => {
      setMsgs((m) => [...m, {
        role: "ai",
        text: `Great question! "${text.slice(0, 50)}${text.length > 50 ? "…" : ""}" — this is a simulated AI response for course ${courseId}.`
      }]);
    }, 700);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 h-[22rem] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">AI Tutor</span>
              <Badge variant="secondary" className="text-[10px] py-0 h-4">Online</Badge>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-3 py-2 flex gap-2 items-center">
            <input
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Ask about this lesson…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={send} disabled={!input.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="Open AI Tutor"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  );
}

// ─── Pre-built quiz bank ──────────────────────────────────────────────────────
const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  "M1C1L1": [
    {
      id: "q1", question: "What is the primary purpose of a control system?",
      options: ["Generate electrical power", "Maintain a desired output despite disturbances", "Measure physical quantities", "Convert analog to digital signals"],
      correct: 1,
      explanation: "A control system's purpose is to command, direct, or regulate behavior to achieve a desired output — the controlled variable — at a specified value despite disturbances."
    },
    {
      id: "q2", question: "What distinguishes a closed-loop system from an open-loop system?",
      options: ["Closed-loop systems are always more expensive", "Closed-loop systems use only digital controllers", "Closed-loop systems continuously compare actual output to desired reference and correct errors", "Open-loop systems use feedback sensors"],
      correct: 2,
      explanation: "A closed-loop system measures actual output, compares it to the desired reference, and uses the error signal to correct behavior — the key self-regulating property absent in open-loop systems."
    },
    {
      id: "q3", question: "The 'error signal' in a control system is defined as:",
      options: ["The disturbance acting on the plant", "The reference input multiplied by controller gain", "The difference between the reference input and actual output", "The delay between command and response"],
      correct: 2,
      explanation: "Error = Reference Input − Actual Output. This is the fundamental driving signal that the controller acts upon to drive the system toward its desired state."
    },
    {
      id: "q4", question: "Which component converts the controller's output signal into a physical action on the plant?",
      options: ["Sensor", "Transfer function", "Reference input", "Actuator"],
      correct: 3,
      explanation: "An actuator (motor, valve, hydraulic cylinder, etc.) converts the controller's low-power output signal into a physical action that affects the plant."
    },
    {
      id: "q5", question: "A toaster running for a fixed time regardless of toast color is an example of:",
      options: ["Closed-loop feedback system", "An open-loop system", "A negative feedback system", "A PID control system"],
      correct: 1,
      explanation: "A fixed-timer toaster executes a pre-defined action without measuring actual output (toast color). A smart toaster with a color sensor would be closed-loop."
    },
    {
      id: "q6", question: "Why is pure feedforward control insufficient for most real-world applications?",
      options: ["It is too slow", "It cannot handle unmeasured disturbances and model inaccuracies", "It always makes the system unstable", "It requires more sensors"],
      correct: 1,
      explanation: "Feedforward control relies on an accurate plant model and only handles measurable disturbances. It cannot compensate for unmeasured disturbances or model changes over time."
    },
    {
      id: "q7", question: "When output exceeds reference in a negative feedback system, the error signal is:",
      options: ["Positive — controller increases effort", "Negative — controller reduces its effort", "Zero — system is in equilibrium", "Undefined — system enters open-loop mode"],
      correct: 1,
      explanation: "Error = Reference − Output. If output > reference, error is negative. The controller then reduces or reverses effort to push output back down toward the reference."
    }
  ]
};

// ─── Build the ordered flat step list for a lesson ────────────────────────────
function buildSteps(lesson: SyllabusLesson, lessonId: string): Step[] {
  const steps: Step[] = [];
  for (const topic of lesson.topics ?? []) {
    // Topic overview step
    steps.push({
      id: topic.id,
      kind: "topic",
      label: topic.title,
      topicId: topic.id,
    });
    // Subtopic steps
    for (const sub of topic.subtopics ?? []) {
      steps.push({
        id: sub.id,
        kind: "subtopic",
        label: sub.title,
        topicId: topic.id,
        subtopicData: sub,
        imageMeta: sub.image_meta,
      });
    }
  }
  // Quiz step (only if we have questions for this lesson)
  if (QUIZ_BANK[lessonId]?.length) {
    steps.push({ id: "quiz", kind: "quiz", label: "Lesson Quiz" });
  }
  return steps;
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────────────
function LessonViewerInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const course = getCourse(courseId);

  const syllabusData = getCourseSyllabus(courseId);
  const syllabusModules: SyllabusModule[] = syllabusData?.course?.modules ?? [];

  const firstModuleId = syllabusModules[0]?.id;
  const firstChapterId = syllabusModules[0]?.chapters?.[0]?.id;

  // Find current lesson
  let currentLesson: SyllabusLesson | null = null;
  let currentModuleId = "";
  let currentChapterId = "";
  for (const mod of syllabusModules) {
    for (const ch of mod.chapters ?? []) {
      for (const l of ch.lessons ?? []) {
        if (l.id === lessonId) { currentLesson = l; currentModuleId = mod.id; currentChapterId = ch.id; }
      }
    }
  }

  const isLessonLocked = currentModuleId !== firstModuleId || currentChapterId !== firstChapterId;

  // Build steps
  const steps: Step[] = currentLesson ? buildSteps(currentLesson, lessonId) : [];

  // Current step from URL ?step=
  const stepParam = searchParams.get("step");
  const currentStepIdx = stepParam
    ? Math.max(0, steps.findIndex((s) => s.id === stepParam))
    : 0;
  const currentStep = steps[currentStepIdx] ?? null;

  const navigate = (idx: number) => {
    if (idx < 0 || idx >= steps.length) return;
    const s = steps[idx];
    router.push(`/student/courses/${courseId}/lessons/${lessonId}?step=${s.id}`);
  };

  // Resize outline width
  const [outlineW, setOutlineW] = useState(280);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    setOutlineW(Math.min(420, Math.max(200, dragRef.current.startW + e.clientX - dragRef.current.startX)));
  }, []);
  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, [onMouseMove, onMouseUp]);

  if (!course) return <p className="p-8 text-muted-foreground">Course not found</p>;

  const progressPct = steps.length > 0 ? Math.round(((currentStepIdx + 1) / steps.length) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden border rounded-xl bg-card">

      {/* ══════════════════════════════════════════════════════════════════
          LEFT — Course + Lesson Outline
      ══════════════════════════════════════════════════════════════════ */}
      <aside className="shrink-0 flex flex-col overflow-hidden" style={{ width: outlineW }}>
        {/* Header */}
        <div className="h-12 px-3 border-b flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 shrink-0">
            <Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-3.5 w-3.5" /></Link>
          </Button>
          <span className="font-semibold text-sm truncate">Course Outline</span>
        </div>

        {/* Progress bar */}
        {!isLessonLocked && steps.length > 0 && (
          <div className="px-3 py-2 border-b shrink-0">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Lesson progress</span>
              <span>{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {syllabusModules.map((mod, mIdx) => {
              const isModUnlocked = mod.id === firstModuleId;
              return (
                <div key={mod.id} className="space-y-1">
                  {/* Module header */}
                  <div className="flex items-center gap-1.5 px-2 py-1 sticky top-0 bg-card z-10">
                    {!isModUnlocked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                    <h3 className={cn(
                      "text-[10px] font-bold uppercase tracking-widest truncate",
                      isModUnlocked ? "text-muted-foreground" : "text-muted-foreground/30"
                    )}>M{mIdx + 1}: {mod.title}</h3>
                  </div>

                  {(mod.chapters ?? []).map((ch, chIdx) => {
                    const isChUnlocked = isModUnlocked && ch.id === firstChapterId;
                    return (
                      <div key={ch.id} className="space-y-0.5">
                        {/* Chapter header */}
                        <div className="flex items-center gap-1.5 px-2 pt-1">
                          {!isChUnlocked && <Lock className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />}
                          <p className={cn(
                            "text-[9px] font-bold uppercase tracking-widest truncate",
                            isChUnlocked ? "text-muted-foreground/60" : "text-muted-foreground/25"
                          )}>Ch {chIdx + 1}: {ch.title}</p>
                        </div>

                        {(ch.lessons ?? []).map((l) => {
                          const isThisLesson = l.id === lessonId;
                          const isLocked = !isChUnlocked;

                          if (isLocked) {
                            return (
                              <div key={l.id} className="text-sm text-muted-foreground/25 flex items-center gap-2 px-3 py-1.5 cursor-not-allowed select-none">
                                <Lock className="h-3 w-3 shrink-0" />
                                <span className="truncate">{l.title}</span>
                              </div>
                            );
                          }

                          // Build steps for this lesson to render in sidebar
                          const lSteps = buildSteps(l, l.id);

                          return (
                            <div key={l.id}>
                              {/* Lesson row */}
                              <div className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium",
                                isThisLesson ? "text-foreground" : "text-muted-foreground"
                              )}>
                                <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="truncate text-xs">{l.title}</span>
                              </div>

                              {/* Steps inline (only for current lesson) */}
                              {isThisLesson && lSteps.map((step, sIdx) => {
                                const isActive = step.id === (stepParam ?? lSteps[0]?.id);
                                const isPast = sIdx < currentStepIdx;

                                const Icon = step.kind === "topic" ? Hash
                                  : step.kind === "quiz" ? ClipboardCheck
                                  : Circle;

                                return (
                                  <button
                                    key={step.id}
                                    onClick={() => navigate(sIdx)}
                                    className={cn(
                                      "w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ml-1",
                                      isActive
                                        ? "bg-primary text-primary-foreground font-semibold"
                                        : isPast
                                        ? "text-muted-foreground hover:bg-muted"
                                        : "text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground",
                                      step.kind === "topic" && "mt-1"
                                    )}
                                  >
                                    <Icon className={cn(
                                      "shrink-0 mt-0.5",
                                      step.kind === "topic" ? "h-3.5 w-3.5" : "h-2.5 w-2.5 mt-1",
                                      step.kind === "quiz" && "h-3.5 w-3.5"
                                    )} />
                                    <span className="leading-snug">{step.label}</span>
                                    {isPast && !isActive && (
                                      <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto shrink-0 mt-0.5" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Drag handle */}
      <div className="relative w-0 shrink-0 cursor-col-resize select-none"
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = { startX: e.clientX, startW: outlineW };
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}>
        <div className="absolute inset-y-0 -left-2 -right-2" />
        <div className="absolute inset-y-0 left-0 w-px bg-border hover:bg-primary/50 transition-colors" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN — Step Content
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col p-5 md:p-7 overflow-hidden">

            {isLessonLocked ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-5 bg-muted rounded-full mb-6">
                  <Lock className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Lesson Locked</h2>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Complete Module 1, Chapter 1 first to unlock this content.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/student/courses/${courseId}`}><ArrowLeft className="h-4 w-4 mr-2" /> Back to Course</Link>
                </Button>
              </div>
            ) : !currentLesson ? (
              <p className="text-muted-foreground text-center py-20">Lesson not found.</p>
            ) : !currentStep ? (
              <p className="text-muted-foreground text-center py-20">No content available.</p>
            ) : (
              <>
                {/* Step header */}
                <div className="mb-6 shrink-0">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent gap-1">
                      <BookOpen className="h-3 w-3" /> M1 · C1 · {currentLesson.title}
                    </Badge>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    <span className="font-medium text-foreground/70">{currentStep.label}</span>
                  </div>

                  {/* Step kind badge + title */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {currentStep.kind === "topic" && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Hash className="h-3 w-3" /> Topic Overview
                      </Badge>
                    )}
                    {currentStep.kind === "subtopic" && (
                      <Badge variant="outline" className="text-xs gap-1 bg-muted">
                        <Circle className="h-2.5 w-2.5 fill-current" /> Subtopic
                      </Badge>
                    )}
                    {currentStep.kind === "quiz" && (
                      <Badge className="text-xs gap-1 bg-primary/10 text-primary border-transparent">
                        <ClipboardCheck className="h-3 w-3" /> Lesson Quiz
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold">{currentStep.label}</h1>
                </div>

                {/* Step content */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  {currentStep.kind === "topic" && (() => {
                    const topic = currentLesson.topics?.find((t) => t.id === currentStep.topicId);
                    return topic ? <div className="flex-1 overflow-y-auto pr-4"><TopicOverview topicTitle={topic.title} subtopics={topic.subtopics ?? []} /></div> : null;
                  })()}

                  {currentStep.kind === "subtopic" && currentStep.subtopicData && (
                    <SubtopicView sub={currentStep.subtopicData} imageMeta={currentStep.imageMeta} />
                  )}

                  {currentStep.kind === "quiz" && (
                    <div className="flex-1 overflow-y-auto pr-4">
                      <QuizView questions={QUIZ_BANK[lessonId] ?? []} />
                    </div>
                  )}
                </div>

                {/* Prev / Next nav */}
                <div className="flex items-center justify-between border-t pt-4 mt-4 shrink-0">
                  <Button
                    variant="outline" className="gap-2"
                    disabled={currentStepIdx === 0}
                    onClick={() => navigate(currentStepIdx - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentStepIdx + 1} / {steps.length}
                  </span>
                  {currentStepIdx < steps.length - 1 ? (
                    <Button className="gap-2" onClick={() => navigate(currentStepIdx + 1)}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" asChild className="gap-2">
                      <Link href={`/student/courses/${courseId}`}>
                        <Trophy className="h-4 w-4" /> Finish Lesson
                      </Link>
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
      </div>

      <FloatingChat courseId={courseId} />
    </div>
  );
}

// ─── Page (wrap with Suspense for useSearchParams) ────────────────────────────
export default function LessonViewerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading lesson…</div>}>
      <LessonViewerInner />
    </Suspense>
  );
}
