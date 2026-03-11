"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SyllabusLesson, SyllabusSubtopic } from "@/lib/types";
import type { Step, QuizQuestion } from "./types";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Circle,
  FileText,
  Hash,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Send,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

// ─── Carousel ────────────────────────────────────────────────────────────────

interface CarouselProps {
  items: string[];
  renderItem: (item: string, idx: number) => React.ReactNode;
  emptyText: string;
}

const Carousel = memo(function Carousel({ items, renderItem, emptyText }: CarouselProps) {
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
});

// ─── Prose renderer ───────────────────────────────────────────────────────────

interface ProseProps {
  content: string;
  className?: string;
}

const Prose = memo(function Prose({ content, className }: ProseProps) {
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
});

// ─── Subtopic 3-Panel View ────────────────────────────────────────────────────

interface SubtopicViewProps {
  sub: SyllabusSubtopic;
  imageMeta?: { caption: string; license: string; source: string }[];
}

const SubtopicView = memo(function SubtopicView({ sub, imageMeta }: SubtopicViewProps) {
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
            {sub.content
              ? <Prose content={sub.content} />
              : <p className="text-sm text-muted-foreground italic opacity-50">No content yet.</p>}
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
                      <img
                        src={imgUrl}
                        alt={meta?.caption ?? `Image ${i + 1}`}
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
});

// ─── Topic Overview ───────────────────────────────────────────────────────────

interface TopicOverviewProps {
  topicTitle: string;
  subtopics: SyllabusSubtopic[];
}

const TopicOverview = memo(function TopicOverview({ topicTitle, subtopics }: TopicOverviewProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        This topic covers {subtopics.length} subtopic{subtopics.length !== 1 ? "s" : ""}:
      </p>
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
});

// ─── Quiz View ────────────────────────────────────────────────────────────────

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView = memo(function QuizView({ questions }: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted ? questions.filter((q) => answers[q.id] === q.correct).length : 0;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const reset = () => { setAnswers({}); setSubmitted(false); };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className={cn(
          "rounded-2xl p-6 text-center border",
          score === questions.length ? "bg-green-500/10 border-green-500/30"
            : score >= questions.length * 0.6 ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-red-500/10 border-red-500/30"
        )}>
          <Trophy className={cn("h-12 w-12 mx-auto mb-3",
            score === questions.length ? "text-green-500"
              : score >= questions.length * 0.6 ? "text-yellow-500" : "text-red-500"
          )} />
          <p className="text-3xl font-bold">{score} / {questions.length}</p>
          <p className="text-muted-foreground mt-1">
            {score === questions.length ? "Perfect score! 🎉"
              : score >= questions.length * 0.6 ? "Good job! Keep it up."
                : "Review the lesson and try again."}
          </p>
          <Progress value={(score / questions.length) * 100} className="mt-4 h-2" />
        </div>

        <div className="space-y-4">
          {questions.map((q, qIdx) => {
            const chosen = answers[q.id];
            const isCorrect = chosen === q.correct;
            return (
              <div key={q.id} className={cn("p-4 rounded-xl border",
                isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5")}>
                <p className="font-semibold text-sm mb-3">
                  <span className="text-muted-foreground mr-2">Q{qIdx + 1}.</span>{q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={cn(
                      "px-3 py-2 rounded-lg text-sm flex items-center gap-2",
                      q.correct === oIdx ? "bg-green-500/15 text-green-700 dark:text-green-400 font-medium"
                        : chosen === oIdx ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "text-muted-foreground"
                    )}>
                      {q.correct === oIdx
                        ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        : chosen === oIdx
                          ? <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                          : <div className="h-4 w-4 shrink-0" />}
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
                  <div className={cn("h-4 w-4 rounded-full border-2 shrink-0 transition-colors",
                    chosen ? "border-primary bg-primary" : "border-muted-foreground/40")} />
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
        {!allAnswered && (
          <span className="text-xs opacity-70 ml-1">({Object.keys(answers).length}/{questions.length} answered)</span>
        )}
      </Button>
    </div>
  );
});

// ─── Floating AI Chat ─────────────────────────────────────────────────────────

interface FloatingChatProps {
  courseId: string;
}

const FloatingChat = memo(function FloatingChat({ courseId }: FloatingChatProps) {
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
});

// ─── Content (main export) ────────────────────────────────────────────────────

export interface ContentProps {
  courseId: string;
  lessonId: string;
  currentLesson: SyllabusLesson | null;
  currentStep: Step | null;
  currentStepIdx: number;
  steps: Step[];
  isLessonLocked: boolean;
  quizQuestions: QuizQuestion[];
  nextLessonTitle?: string;   // title of next lesson if unlocked, used for CTA
  onNavigate: (idx: number) => void;
}

export const Content = memo(function Content({
  courseId,
  lessonId,
  currentLesson,
  currentStep,
  currentStepIdx,
  steps,
  isLessonLocked,
  quizQuestions,
  nextLessonTitle,
  onNavigate,
}: ContentProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
      <div className="flex-1 flex flex-col p-5 md:p-7 overflow-hidden">

        {/* Locked state */}
        {isLessonLocked ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            {/* Animated lock icon */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
              <div className="relative p-6 bg-gradient-to-br from-muted to-muted/60 rounded-full border border-border shadow-inner">
                <Lock className="h-14 w-14 text-muted-foreground/60" />
              </div>
            </div>

            <div className="max-w-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-4">
                <Lock className="h-3 w-3" /> Locked Content
              </span>
              <h2 className="text-2xl font-bold mb-3">
                {currentLesson?.title ?? "This lesson is locked"}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                Complete the earlier lessons in order to unlock this content.
                Progress through each lesson step-by-step to earn access.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline" className="gap-2">
                  <Link href={`/student/courses/${courseId}`}>
                    <ArrowLeft className="h-4 w-4" /> Back to Course
                  </Link>
                </Button>
              </div>
            </div>
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

              {/* Kind badge */}
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
                return topic
                  ? <div className="flex-1 overflow-y-auto pr-4"><TopicOverview topicTitle={topic.title} subtopics={topic.subtopics ?? []} /></div>
                  : null;
              })()}

              {currentStep.kind === "subtopic" && currentStep.subtopicData && (
                <SubtopicView sub={currentStep.subtopicData} imageMeta={currentStep.imageMeta} />
              )}

              {currentStep.kind === "quiz" && (
                <div className="flex-1 overflow-y-auto pr-4">
                  <QuizView questions={quizQuestions} />
                </div>
              )}
            </div>

            {/* Prev / Next nav */}
            <div className="flex items-center justify-between border-t pt-4 mt-4 shrink-0">
              <Button
                variant="outline" className="gap-2"
                disabled={currentStepIdx === 0}
                onClick={() => onNavigate(currentStepIdx - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentStepIdx + 1} / {steps.length}
              </span>
              {currentStepIdx < steps.length - 1 ? (
                <Button className="gap-2" onClick={() => onNavigate(currentStepIdx + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : nextLessonTitle ? (
                // Last step + next lesson is unlocked — show Start Next Lesson CTA
                <Button
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
                  onClick={() => onNavigate(steps.length)}
                >
                  <ChevronRight className="h-4 w-4" />
                  Start Next Lesson
                </Button>
              ) : (
                // Last step, no next lesson — finish
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

      {/* AI Chat bubble */}
      <FloatingChat courseId={courseId} />
    </div>
  );
});
