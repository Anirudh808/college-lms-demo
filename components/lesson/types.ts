// ─── Shared types for Lesson UI ──────────────────────────────────────────────

export type ProgressStatus = "completed" | "pending" | "not_started";

export type StepKind = "topic" | "subtopic" | "quiz";

export interface Step {
  /** Unique step id used as ?step= URL value */
  id: string;
  kind: StepKind;
  label: string;
  topicId?: string;
  subtopicData?: import("@/lib/types").SyllabusSubtopic;
  imageMeta?: { caption: string; license: string; source: string }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}
