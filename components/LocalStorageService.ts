import { Assessment, AssessmentSubmission } from "@/lib/types";

const ASSESSMENTS_KEY = "assessments";
const SUBMISSIONS_KEY = "assessment_submissions";
export const LocalStorageService = {
  getAssessments: async (courseId?: string): Promise<Assessment[]> => {
    const res = await fetch(`/api/assessment/list${courseId ? `?courseId=${courseId}` : ''}`);
    if (!res.ok) return [];
    return res.json();
  },

  getAssessmentById: async (id: string): Promise<Assessment | null> => {
    const res = await fetch(`/api/assessment/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  saveAssessment: async (assessment: Assessment): Promise<void> => {
    await fetch('/api/assessment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assessment)
    });
  },

  saveSubmission: async (submission: AssessmentSubmission): Promise<void> => {
    await fetch('/api/assessment/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  },

  getSubmissions: async (assessmentId: string): Promise<AssessmentSubmission[]> => {
    const res = await fetch(`/api/assessment/submissions?assessmentId=${assessmentId}`);
    if (!res.ok) return [];
    return res.json();
  }
};
