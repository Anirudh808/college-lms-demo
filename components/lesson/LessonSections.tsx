"use client";

import React, { useState, useCallback, memo, createContext, useContext } from "react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SyllabusModule, SyllabusLesson, SyllabusChapter } from "@/lib/types";
import type { Step, ProgressStatus } from "./types";
import {
  ArrowLeft,
  ChevronDown,
  Lock,
  PlayCircle,
  ClipboardCheck,
  Hash,
  Circle,
  CheckCircle2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Characters before truncation + tooltip kicks in */
const TRUNCATE_AT = 25;

// ─── Context: completed lesson IDs ────────────────────────────────────────────
// Avoids prop-drilling through ModuleRow and ChapterRow.
const CompletedLessonsCtx = createContext<Set<string>>(new Set<string>());

// ─── TruncatedText ────────────────────────────────────────────────────────────
// Renders text truncated to TRUNCATE_AT chars; shows Radix tooltip on hover.
// Pass locked={true} to suppress the tooltip entirely (e.g. on locked items).

interface TruncatedTextProps {
  text: string;
  className?: string;
  locked?: boolean;
}

const TruncatedText = memo(function TruncatedText({ text, className, locked }: TruncatedTextProps) {
  const isTruncated = !locked && text.length > TRUNCATE_AT;
  const display = isTruncated ? text.slice(0, TRUNCATE_AT - 1) + "\u2026" : text;

  // Locked items or short text — plain span, no tooltip
  if (!isTruncated) {
    return <span className={cn("leading-snug", className)}>{display}</span>;
  }

  // Unlocked + long text — styled Radix tooltip
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <span className={cn("leading-snug cursor-default", className)}>{display}</span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        className={cn(
          "max-w-[220px] text-xs leading-relaxed break-words",
          "bg-gray-900 text-gray-100 border-gray-700",
          "shadow-xl rounded-lg px-3 py-2"
        )}
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
});

// ─── Progress Dot ─────────────────────────────────────────────────────────────

interface ProgressDotProps {
  status: ProgressStatus;
  className?: string;
}

const ProgressDot = memo(function ProgressDot({ status, className }: ProgressDotProps) {
  const styles: Record<ProgressStatus, string> = {
    completed: "bg-green-500 ring-2 ring-green-500/25",
    pending: "bg-yellow-400 ring-2 ring-yellow-400/25",
    not_started: "bg-muted-foreground/30",
  };
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full shrink-0", styles[status], className)}
      aria-label={status.replace(/_/g, " ")}
    />
  );
});

// ─── Step Item ────────────────────────────────────────────────────────────────

interface StepItemProps {
  step: Step;
  stepIndex: number;
  isActive: boolean;
  status: ProgressStatus;
  onNavigate: (index: number) => void;
}

const StepItem = memo(function StepItem({
  step,
  stepIndex,
  isActive,
  status,
  onNavigate,
}: StepItemProps) {
  const Icon =
    step.kind === "quiz" ? ClipboardCheck
      : step.kind === "topic" ? Hash
        : Circle;

  return (
    <button
      onClick={() => onNavigate(stepIndex)}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        // Tighter left padding — pl-6 instead of old pl-10
        "w-full text-left flex items-center gap-2 pl-6 pr-2 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium border-r-[3px] border-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
    >
      {/* Progress dot */}
      <ProgressDot status={status} />

      {/* Kind icon */}
      <Icon
        className={cn(
          "shrink-0 opacity-50",
          step.kind === "subtopic" ? "h-3 w-3" : "h-3.5 w-3.5"
        )}
      />

      {/* Truncated label with tooltip */}
      <TruncatedText text={step.label} className="flex-1 text-left" />

      {/* Done check */}
      {status === "completed" && !isActive && (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 ml-auto" />
      )}
    </button>
  );
});

// ─── Lesson Row ───────────────────────────────────────────────────────────────

interface LessonRowProps {
  lesson: SyllabusLesson;
  lessonId: string;
  courseId: string;
  steps: Step[];
  stepParam: string | null;
  isUnlocked: boolean;
  onNavigate: (idx: number) => void;
  getStepStatus: (stepIdx: number) => ProgressStatus;
}

const LessonRow = memo(function LessonRow({
  lesson,
  lessonId,
  courseId,
  steps,
  stepParam,
  isUnlocked,
  onNavigate,
  getStepStatus,
}: LessonRowProps) {
  const isCurrentLesson = lesson.id === lessonId;

  // ── All hooks must be at the top — NO early returns before this ────────
  const [isOpen, setIsOpen] = useState(isCurrentLesson);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  // Context: never conditional, always called at top level
  const completedLessons = useContext(CompletedLessonsCtx);

  // ── Locked lesson ──────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="flex items-center border border-t-2 border-t-border/50 gap-2 pl-7 pr-2 py-2.5 text-sm text-muted-foreground/35 cursor-not-allowed select-none">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <TruncatedText text={lesson.title} locked />
      </div>
    );
  }

  const lessonStatus: ProgressStatus =
    completedLessons.has(lesson.id)
      ? "completed"
      : steps.length === 0
        ? "not_started"
        : steps.every((_, i) => getStepStatus(i) === "completed")
          ? "completed"
          : steps.some((_, i) => getStepStatus(i) !== "not_started")
            ? "pending"
            : "not_started";

  const hasTopics = (lesson.topics?.length ?? 0) > 0;

  // ── Non-current lesson: Link navigates to it ───────────────────────────
  if (!isCurrentLesson) {
    return (
      <Link
        href={`/student/courses/${courseId}/lessons/${lesson.id}`}
        className={cn(
          "w-full flex items-center gap-2 pl-7 pr-2 py-2.5 text-sm transition-colors text-left",
          lessonStatus === "completed"
            ? "text-green-600 dark:text-green-400 hover:bg-green-500/5"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <ProgressDot status={lessonStatus} />
        <PlayCircle className={cn(
          "h-3.5 w-3.5 shrink-0",
          lessonStatus === "completed" ? "text-green-500" : "text-primary/50"
        )} />
        <TruncatedText text={lesson.title} className="flex-1" />
        {hasTopics && (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-muted-foreground/40 ml-auto" />
        )}
      </Link>
    );
  }

  // ── Current lesson: toggle steps accordion ─────────────────────────────
  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 pl-7 pr-2 py-2.5 text-sm transition-colors text-left text-foreground font-semibold"
      >
        <ProgressDot status={lessonStatus} />
        <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
        <TruncatedText text={lesson.title} className="flex-1" />
        {hasTopics && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 ml-auto",
              !isOpen && "-rotate-90"
            )}
          />
        )}
      </button>

      {isOpen && hasTopics && (
        <div className="border-l border-border/50 ml-6 animate-in slide-in-from-top-1 duration-150">
          {steps.map((step, sIdx) => (
            <StepItem
              key={step.id}
              step={step}
              stepIndex={sIdx}
              isActive={step.id === (stepParam ?? steps[0]?.id)}
              status={getStepStatus(sIdx)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Chapter Row ──────────────────────────────────────────────────────────────

interface ChapterRowProps {
  chapter: SyllabusChapter;
  chapterIndex: number;
  lessonId: string;
  courseId: string;
  isUnlocked: boolean;
  isFirstChapter: boolean;
  firstChapterId: string;
  steps: Step[];
  currentStepIdx: number;
  stepParam: string | null;
  onNavigate: (idx: number) => void;
  getStepStatus: (stepIdx: number) => ProgressStatus;
}

const ChapterRow = memo(function ChapterRow({
  chapter,
  chapterIndex,
  lessonId,
  courseId,
  isUnlocked,
  isFirstChapter,
  firstChapterId,
  steps,
  currentStepIdx,
  stepParam,
  onNavigate,
  getStepStatus,
}: ChapterRowProps) {
  const containsCurrentLesson = chapter.lessons?.some((l) => l.id === lessonId);
  // Auto-open: first unlocked chapter, or any chapter containing the current lesson
  const [isOpen, setIsOpen] = useState(
    isUnlocked && (isFirstChapter || !!containsCurrentLesson)
  );
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // ── Locked chapter: static, non-clickable ──────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="flex items-center border border-t-2 border-t-border/50 gap-2 pl-6 pr-2 py-2.5 text-muted-foreground/30 select-none cursor-not-allowed">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-medium leading-none mb-0.5">Chapter {chapterIndex + 1}</span>
          <TruncatedText text={chapter.title} className="text-sm font-semibold" locked />
        </div>
      </div>
    );
  }

  // ── Unlocked chapter: expandable ───────────────────────────────────────
  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 pl-6 pr-2 py-2.5 text-left transition-colors hover:bg-muted/40 text-foreground"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200",
            !isOpen && "-rotate-90"
          )}
        />
        <div className="flex flex-col flex-1 min-w-0 text-left">
          <span className="text-[10px] font-medium text-muted-foreground/60 leading-none mb-0.5">
            Chapter {chapterIndex + 1}
          </span>
          <TruncatedText text={chapter.title} className="text-sm font-semibold" />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/30 animate-in slide-in-from-top-1 duration-150">
          {(chapter.lessons ?? []).map((lesson, lIdx) => {
            const lessonUnlocked =
              chapter.id === firstChapterId && lIdx < 2;
            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                lessonId={lessonId}
                courseId={courseId}
                steps={lesson.id === lessonId ? steps : []}
                stepParam={stepParam}
                isUnlocked={lessonUnlocked}
                onNavigate={onNavigate}
                getStepStatus={getStepStatus}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

// ─── Module Row ───────────────────────────────────────────────────────────────

interface ModuleRowProps {
  mod: SyllabusModule;
  moduleIndex: number;
  isUnlocked: boolean;
  lessonId: string;
  courseId: string;
  firstChapterId: string;
  steps: Step[];
  currentStepIdx: number;
  stepParam: string | null;
  onNavigate: (idx: number) => void;
  getStepStatus: (stepIdx: number) => ProgressStatus;
}

const ModuleRow = memo(function ModuleRow({
  mod,
  moduleIndex,
  isUnlocked,
  lessonId,
  courseId,
  firstChapterId,
  steps,
  currentStepIdx,
  stepParam,
  onNavigate,
  getStepStatus,
}: ModuleRowProps) {
  const containsCurrentLesson = mod.chapters?.some((ch) =>
    ch.lessons?.some((l) => l.id === lessonId)
  );
  // Auto-open first (and only) unlocked module
  const [isOpen, setIsOpen] = useState(isUnlocked);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // ── Locked module: static, non-clickable ───────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="border-b border-border last:border-b-0">
        <div className="flex items-start gap-2 px-3 py-3 text-muted-foreground/30 cursor-not-allowed select-none">
          <Lock className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <span className="text-[10px] font-medium leading-none">Module {moduleIndex + 1} · Locked</span>
            <TruncatedText text={mod.title} className="text-sm font-bold" locked />
          </div>
        </div>
      </div>
    );
  }

  // ── Unlocked module: expandable ────────────────────────────────────────
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        className="w-full flex items-start gap-2 px-3 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-200 mt-0.5",
            !isOpen && "-rotate-90"
          )}
        />
        <div className="flex flex-col flex-1 min-w-0 gap-0.5">
          <span className="text-[10px] text-muted-foreground/70 font-medium leading-none">
            Module {moduleIndex + 1}
          </span>
          <TruncatedText text={mod.title} className="text-sm font-bold text-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="bg-muted/20 border-t border-border/50 animate-in slide-in-from-top-1 duration-150">
          {(mod.chapters ?? []).map((ch, chIdx) => (
            <ChapterRow
              key={ch.id}
              chapter={ch}
              chapterIndex={chIdx}
              lessonId={lessonId}
              courseId={courseId}
              isUnlocked={ch.id === firstChapterId}
              isFirstChapter={chIdx === 0}
              firstChapterId={firstChapterId}
              steps={steps}
              currentStepIdx={currentStepIdx}
              stepParam={stepParam}
              onNavigate={onNavigate}
              getStepStatus={getStepStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── LessonSections ───────────────────────────────────────────────────────────

export interface LessonSectionsProps {
  courseId: string;
  lessonId: string;
  syllabusModules: SyllabusModule[];
  firstModuleId: string;
  firstChapterId: string;
  steps: Step[];
  currentStepIdx: number;
  stepParam: string | null;
  progressPct: number;
  isLessonLocked: boolean;
  completedLessonIds: Set<string>;
  width: number;
  onNavigate: (idx: number) => void;
  onDragStart: (startX: number, startW: number) => void;
}

export const LessonSections = memo(function LessonSections({
  courseId,
  lessonId,
  syllabusModules,
  firstModuleId,
  firstChapterId,
  steps,
  currentStepIdx,
  stepParam,
  progressPct,
  isLessonLocked,
  completedLessonIds,
  width,
  onNavigate,
  onDragStart,
}: LessonSectionsProps) {
  const getStepStatus = useCallback(
    (stepIdx: number): ProgressStatus => {
      if (stepIdx < currentStepIdx) return "completed";
      if (stepIdx === currentStepIdx) return "pending";
      return "not_started";
    },
    [currentStepIdx]
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <CompletedLessonsCtx.Provider value={completedLessonIds}>
        <TooltipProvider>
          <aside
            className="shrink-0 flex flex-col overflow-hidden border-r border-border bg-card"
            style={{ width }}
            aria-label="Lesson Sections"
          >
            {/* Header */}
            <div className="h-12 px-3 border-b flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0 rounded-full">
                <Link href={`/student/courses/${courseId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="font-semibold text-sm">Course Content</span>
            </div>

            {/* Progress bar */}
            {!isLessonLocked && steps.length > 0 && (
              <div className="px-3 py-2.5 border-b shrink-0 bg-muted/20">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-muted-foreground">Your progress</span>
                  <span className="text-xs font-semibold text-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5 rounded-full" />
              </div>
            )}

            {/* Legend */}
            <div className="px-3 py-1.5 border-b shrink-0 flex items-center gap-3 bg-muted/10">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <ProgressDot status="completed" /> Done
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <ProgressDot status="pending" /> In Progress
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                <ProgressDot status="not_started" /> Not Started
              </span>
            </div>

            {/* Module list */}
            <ScrollArea className="flex-1">
              <div>
                {syllabusModules.map((mod, mIdx) => (
                  <ModuleRow
                    key={mod.id}
                    mod={mod}
                    moduleIndex={mIdx}
                    isUnlocked={mod.id === firstModuleId}
                    lessonId={lessonId}
                    courseId={courseId}
                    firstChapterId={firstChapterId}
                    steps={steps}
                    currentStepIdx={currentStepIdx}
                    stepParam={stepParam}
                    onNavigate={onNavigate}
                    getStepStatus={getStepStatus}
                  />
                ))}
              </div>
            </ScrollArea>
          </aside>
        </TooltipProvider>
      </CompletedLessonsCtx.Provider>

      {/* ── Drag handle ─────────────────────────────────────────── */}
      <div
        className="relative w-0 shrink-0 cursor-col-resize select-none z-10"
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart(e.clientX, width);
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-y-0 -left-2 -right-2" />
        <div className="absolute inset-y-0 left-0 w-px bg-border hover:bg-primary/50 transition-colors" />
      </div>
    </div>
  );
});
