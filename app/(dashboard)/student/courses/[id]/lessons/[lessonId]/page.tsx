"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getCourse } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import type { SyllabusModule, SyllabusLesson } from "@/lib/types";
import { LessonSections, Content } from "@/components/lesson";
import type { Step, QuizQuestion } from "@/components/lesson";

// ─── Pre-built quiz bank ──────────────────────────────────────────────────────
const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  "M1C1L1": [
    {
      id: "q1",
      question: "What is the primary purpose of a control system?",
      options: ["Generate electrical power", "Maintain a desired output despite disturbances", "Measure physical quantities", "Convert analog to digital signals"],
      correct: 1,
      explanation: "A control system's purpose is to command, direct, or regulate behavior to achieve a desired output — the controlled variable — at a specified value despite disturbances.",
    },
    {
      id: "q2",
      question: "What distinguishes a closed-loop system from an open-loop system?",
      options: ["Closed-loop systems are always more expensive", "Closed-loop systems use only digital controllers", "Closed-loop systems continuously compare actual output to desired reference and correct errors", "Open-loop systems use feedback sensors"],
      correct: 2,
      explanation: "A closed-loop system measures actual output, compares it to the desired reference, and uses the error signal to correct behavior — the key self-regulating property absent in open-loop systems.",
    },
    {
      id: "q3",
      question: "The 'error signal' in a control system is defined as:",
      options: ["The disturbance acting on the plant", "The reference input multiplied by controller gain", "The difference between the reference input and actual output", "The delay between command and response"],
      correct: 2,
      explanation: "Error = Reference Input − Actual Output. This is the fundamental driving signal that the controller acts upon to drive the system toward its desired state.",
    },
    {
      id: "q4",
      question: "Which component converts the controller's output signal into a physical action on the plant?",
      options: ["Sensor", "Transfer function", "Reference input", "Actuator"],
      correct: 3,
      explanation: "An actuator (motor, valve, hydraulic cylinder, etc.) converts the controller's low-power output signal into a physical action that affects the plant.",
    },
    {
      id: "q5",
      question: "A toaster running for a fixed time regardless of toast color is an example of:",
      options: ["Closed-loop feedback system", "An open-loop system", "A negative feedback system", "A PID control system"],
      correct: 1,
      explanation: "A fixed-timer toaster executes a pre-defined action without measuring actual output (toast color). A smart toaster with a color sensor would be closed-loop.",
    },
    {
      id: "q6",
      question: "Why is pure feedforward control insufficient for most real-world applications?",
      options: ["It is too slow", "It cannot handle unmeasured disturbances and model inaccuracies", "It always makes the system unstable", "It requires more sensors"],
      correct: 1,
      explanation: "Feedforward control relies on an accurate plant model and only handles measurable disturbances. It cannot compensate for unmeasured disturbances or model changes over time.",
    },
    {
      id: "q7",
      question: "When output exceeds reference in a negative feedback system, the error signal is:",
      options: ["Positive — controller increases effort", "Negative — controller reduces its effort", "Zero — system is in equilibrium", "Undefined — system enters open-loop mode"],
      correct: 1,
      explanation: "Error = Reference − Output. If output > reference, error is negative. The controller then reduces or reverses effort to push output back down toward the reference.",
    },
  ],
};

// ─── Build ordered flat step list for a lesson ───────────────────────────────
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

  // Quiz step (only if questions exist for this lesson)
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

  const firstModuleId = syllabusModules[0]?.id ?? "";
  const firstChapterId = syllabusModules[0]?.chapters?.[0]?.id ?? "";

  // Find current lesson
  let currentLesson: SyllabusLesson | null = null;
  let currentModuleId = "";
  let currentChapterId = "";

  for (const mod of syllabusModules) {
    for (const ch of mod.chapters ?? []) {
      for (const l of ch.lessons ?? []) {
        if (l.id === lessonId) {
          currentLesson = l;
          currentModuleId = mod.id;
          currentChapterId = ch.id;
        }
      }
    }
  }

  // ─── Lesson unlock: first 2 lessons in the unlocked chapter are accessible ──
  const allUnlockedLessons = syllabusModules
    .find((m) => m.id === firstModuleId)
    ?.chapters?.find((ch) => ch.id === firstChapterId)
    ?.lessons ?? [];
  const currentLessonIdx = allUnlockedLessons.findIndex((l) => l.id === lessonId);

  // Locked if: wrong module/chapter, OR lesson index >= 2
  const isLessonLocked =
    currentModuleId !== firstModuleId ||
    currentChapterId !== firstChapterId ||
    currentLessonIdx >= 2;

  // ─── Next lesson: search the FULL flat lesson list so every lesson has a "next" ──
  const allLessonsFlat: SyllabusLesson[] = [];
  for (const mod of syllabusModules) {
    for (const ch of mod.chapters ?? []) {
      for (const l of ch.lessons ?? []) {
        allLessonsFlat.push(l);
      }
    }
  }
  const currentFlatIdx = allLessonsFlat.findIndex((l) => l.id === lessonId);
  const nextLesson: SyllabusLesson | null =
    currentFlatIdx !== -1 && currentFlatIdx < allLessonsFlat.length - 1
      ? allLessonsFlat[currentFlatIdx + 1]
      : null;

  // Build steps
  const steps: Step[] = currentLesson ? buildSteps(currentLesson, lessonId) : [];

  // Current step from URL ?step=
  const stepParam = searchParams.get("step");
  const currentStepIdx = stepParam
    ? Math.max(0, steps.findIndex((s) => s.id === stepParam))
    : 0;
  const currentStep = steps[currentStepIdx] ?? null;

  // ─── Track completed lessons (for sidebar progress dots) ───────────────────
  const DONE_KEY = `lms_${courseId}_done`;
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(DONE_KEY) : null;
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const markLessonComplete = useCallback((id: string) => {
    setCompletedLessonIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(DONE_KEY, JSON.stringify(Array.from(next))); } catch { }
      return next;
    });
  }, [DONE_KEY]);

  const navigate = useCallback(
    (idx: number) => {
      // Within current lesson steps — normal navigation
      if (idx >= 0 && idx < steps.length) {
        router.push(`/student/courses/${courseId}/lessons/${lessonId}?step=${steps[idx].id}`);
        return;
      }
      // Past the last step — mark lesson complete then go to next
      if (idx >= steps.length && nextLesson) {
        markLessonComplete(lessonId);
        router.push(`/student/courses/${courseId}/lessons/${nextLesson.id}`);
        return;
      }
      // Before first step — do nothing
    },
    [courseId, lessonId, router, steps, nextLesson, markLessonComplete]
  );

  // Resizable sidebar width
  const [outlineW, setOutlineW] = useState(300);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    setOutlineW(Math.min(460, Math.max(220, dragRef.current.startW + e.clientX - dragRef.current.startX)));
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleDragStart = useCallback((startX: number, startW: number) => {
    dragRef.current = { startX, startW };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  if (!course) {
    return <p className="p-8 text-muted-foreground">Course not found</p>;
  }

  const progressPct =
    steps.length > 0 ? Math.round(((currentStepIdx + 1) / steps.length) * 100) : 0;

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden border rounded-xl bg-card">
      {/* LEFT — LessonSections */}
      <LessonSections
        courseId={courseId}
        lessonId={lessonId}
        syllabusModules={syllabusModules}
        firstModuleId={firstModuleId}
        firstChapterId={firstChapterId}
        steps={steps}
        currentStepIdx={currentStepIdx}
        stepParam={stepParam}
        progressPct={progressPct}
        isLessonLocked={isLessonLocked}
        completedLessonIds={completedLessonIds}
        width={outlineW}
        onNavigate={navigate}
        onDragStart={handleDragStart}
      />

      {/* RIGHT — Content */}
      <Content
        courseId={courseId}
        lessonId={lessonId}
        currentLesson={currentLesson}
        currentStep={currentStep}
        currentStepIdx={currentStepIdx}
        steps={steps}
        isLessonLocked={isLessonLocked}
        quizQuestions={QUIZ_BANK[lessonId] ?? []}
        nextLessonTitle={nextLesson?.title}
        onNavigate={navigate}
      />
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
