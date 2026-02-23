import type { Plan, Role } from "./types";

export const BASE_PLATFORM_FEE = "XXXX"; // ₹ per user/year

export type LimitKey =
  | "tutor"
  | "summaries"
  | "flashcards"
  | "quiz_gen"
  | "step_by_step"
  | "code_debug"
  | "plagiarism_preview"
  | "interview_sim"
  | "performance_prediction"
  | "grading_assist"
  | "question_sets"
  | "slide_gen"
  | "lecture_summary"
  | "blueprint"
  | "teaching_copilot"
  | "confusion_heatmap"
  | "bias_detection"
  | "grade_inflation_alert"
  | "curriculum_gap_analysis"
  | "predictive_cohort"
  | "faculty_ai_analytics"
  | "accreditation_automation"
  | "industry_skill_mapping"
  | "curriculum_modernization"
  | "faculty_bias_detection"
  | "dropout_prediction"
  | "forecasting"
  | "cost_anomaly_detection"
  | "academic_health_score"
  | "naac_readiness"
  | "cross_dept_risk_modeling";

export interface PlanLimitConfig {
  limit: number | "unlimited";
  period: "day" | "week" | "month";
  available: boolean;
}

export type PlanLimits = Partial<Record<LimitKey, PlanLimitConfig>>;

const STUDENT_LIMITS: Record<Plan, PlanLimits> = {
  basic: {
    tutor: { limit: 10, period: "day", available: true },
    summaries: { limit: 1, period: "day", available: true },
    flashcards: { limit: 1, period: "day", available: true },
    quiz_gen: { limit: 1, period: "week", available: true },
    plagiarism_preview: { limit: 2, period: "month", available: true },
    step_by_step: { limit: 0, period: "day", available: false },
    code_debug: { limit: 0, period: "day", available: false },
    interview_sim: { limit: 0, period: "month", available: false },
    performance_prediction: { limit: 0, period: "week", available: false },
  },
  premium: {
    tutor: { limit: 20, period: "day", available: true },
    summaries: { limit: 2, period: "day", available: true },
    flashcards: { limit: 2, period: "day", available: true },
    quiz_gen: { limit: 1, period: "day", available: true },
    step_by_step: { limit: 2, period: "day", available: true },
    code_debug: { limit: 1, period: "day", available: true },
    plagiarism_preview: { limit: 5, period: "month", available: true },
    interview_sim: { limit: 2, period: "month", available: true },
    performance_prediction: { limit: 1, period: "week", available: true },
  },
  premium_plus: {
    tutor: { limit: 30, period: "day", available: true },
    summaries: { limit: 3, period: "day", available: true },
    flashcards: { limit: 3, period: "day", available: true },
    quiz_gen: { limit: 2, period: "day", available: true },
    step_by_step: { limit: 5, period: "day", available: true },
    code_debug: { limit: 2, period: "day", available: true },
    plagiarism_preview: { limit: 10, period: "month", available: true },
    interview_sim: { limit: 5, period: "month", available: true },
    performance_prediction: { limit: 999, period: "week", available: true },
  },
};

const FACULTY_LIMITS: Record<Plan, PlanLimits> = {
  basic: {
    grading_assist: { limit: 50, period: "month", available: true },
    question_sets: { limit: 5, period: "month", available: true },
    slide_gen: { limit: 5, period: "month", available: true },
    lecture_summary: { limit: 10, period: "month", available: true },
    blueprint: { limit: 1, period: "month", available: true },
    teaching_copilot: { limit: 0, period: "month", available: false },
    confusion_heatmap: { limit: 0, period: "month", available: false },
    bias_detection: { limit: 0, period: "month", available: false },
    grade_inflation_alert: { limit: 0, period: "month", available: false },
  },
  premium: {
    grading_assist: { limit: 150, period: "month", available: true },
    question_sets: { limit: 15, period: "month", available: true },
    slide_gen: { limit: 15, period: "month", available: true },
    lecture_summary: { limit: 20, period: "month", available: true },
    blueprint: { limit: 3, period: "month", available: true },
    teaching_copilot: { limit: 999, period: "month", available: true },
    confusion_heatmap: { limit: 999, period: "month", available: true },
    bias_detection: { limit: 0, period: "month", available: false },
    grade_inflation_alert: { limit: 0, period: "month", available: false },
  },
  premium_plus: {
    grading_assist: { limit: 400, period: "month", available: true },
    question_sets: { limit: 30, period: "month", available: true },
    slide_gen: { limit: 30, period: "month", available: true },
    lecture_summary: { limit: 30, period: "month", available: true },
    blueprint: { limit: 5, period: "month", available: true },
    teaching_copilot: { limit: 999, period: "month", available: true },
    confusion_heatmap: { limit: 999, period: "month", available: true },
    bias_detection: { limit: 999, period: "month", available: true },
    grade_inflation_alert: { limit: 999, period: "month", available: true },
  },
};

const HOD_LIMITS: Record<Plan, PlanLimits> = {
  basic: {
    curriculum_gap_analysis: { limit: 5, period: "month", available: true },
    predictive_cohort: { limit: 0, period: "month", available: false },
    faculty_ai_analytics: { limit: 0, period: "month", available: false },
    accreditation_automation: { limit: 0, period: "month", available: false },
    industry_skill_mapping: { limit: 0, period: "month", available: false },
    curriculum_modernization: { limit: 0, period: "month", available: false },
    faculty_bias_detection: { limit: 0, period: "month", available: false },
  },
  premium: {
    curriculum_gap_analysis: { limit: 15, period: "month", available: true },
    predictive_cohort: { limit: 999, period: "month", available: true },
    faculty_ai_analytics: { limit: 999, period: "month", available: true },
    accreditation_automation: { limit: 999, period: "month", available: true },
    industry_skill_mapping: { limit: 0, period: "month", available: false },
    curriculum_modernization: { limit: 0, period: "month", available: false },
    faculty_bias_detection: { limit: 0, period: "month", available: false },
  },
  premium_plus: {
    curriculum_gap_analysis: { limit: 999, period: "month", available: true },
    predictive_cohort: { limit: 999, period: "month", available: true },
    faculty_ai_analytics: { limit: 999, period: "month", available: true },
    accreditation_automation: { limit: 999, period: "month", available: true },
    industry_skill_mapping: { limit: 999, period: "month", available: true },
    curriculum_modernization: { limit: 999, period: "month", available: true },
    faculty_bias_detection: { limit: 999, period: "month", available: true },
  },
};

const ADMIN_LIMITS: Record<Plan, PlanLimits> = {
  basic: {
    dropout_prediction: { limit: 0, period: "month", available: false },
    forecasting: { limit: 0, period: "month", available: false },
    cost_anomaly_detection: { limit: 0, period: "month", available: false },
    academic_health_score: { limit: 0, period: "month", available: false },
    naac_readiness: { limit: 0, period: "month", available: false },
    cross_dept_risk_modeling: { limit: 0, period: "month", available: false },
  },
  premium: {
    dropout_prediction: { limit: 999, period: "month", available: true },
    forecasting: { limit: 999, period: "month", available: true },
    cost_anomaly_detection: { limit: 999, period: "month", available: true },
    academic_health_score: { limit: 0, period: "month", available: false },
    naac_readiness: { limit: 0, period: "month", available: false },
    cross_dept_risk_modeling: { limit: 0, period: "month", available: false },
  },
  premium_plus: {
    dropout_prediction: { limit: 999, period: "month", available: true },
    forecasting: { limit: 999, period: "month", available: true },
    cost_anomaly_detection: { limit: 999, period: "month", available: true },
    academic_health_score: { limit: 999, period: "month", available: true },
    naac_readiness: { limit: 999, period: "month", available: true },
    cross_dept_risk_modeling: { limit: 999, period: "month", available: true },
  },
};

export function getPlanLimits(role: Role, plan: Plan): PlanLimits {
  switch (role) {
    case "student":
      return STUDENT_LIMITS[plan];
    case "faculty":
      return FACULTY_LIMITS[plan];
    case "hod":
      return HOD_LIMITS[plan];
    case "admin":
      return ADMIN_LIMITS[plan];
    default:
      return {};
  }
}

export const AI_CREDIT_COSTS: Record<string, number> = {
  tutor: 1,
  step_by_step: 2,
  flashcards: 2,
  summary: 1,
  quiz_gen: 4,
  code_debug: 4,
  plagiarism_preview: 5,
  grading_assist: 3,
  question_sets: 4,
  blueprint: 8,
  slide_gen: 3,
  lecture_summary: 2,
  curriculum_gap_analysis: 6,
  teaching_copilot: 2,
  confusion_heatmap: 4,
  interview_sim: 5,
  performance_prediction: 3,
};

export function getCreditsAllocatedDaily(role: Role, plan: Plan): number {
  const baseCredits: Record<Plan, number> = {
    basic: 15,
    premium: 35,
    premium_plus: 60,
  };
  const roleMultiplier: Record<Role, number> = {
    student: 1,
    faculty: 1.2,
    hod: 1,
    admin: 0.8,
  };
  return Math.round(baseCredits[plan] * roleMultiplier[role]);
}

export function getPlanDisplayName(plan: Plan): string {
  switch (plan) {
    case "basic":
      return "Basic";
    case "premium":
      return "Premium";
    case "premium_plus":
      return "Premium Plus";
    default:
      return plan;
  }
}
