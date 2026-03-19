import { Assessment, AssessmentSubmission, StudyMaterial, Question } from "@/lib/types";

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
  },

  getStudyMaterials: async (courseId: string): Promise<StudyMaterial[]> => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`materials_${courseId}`);
      if (stored) return JSON.parse(stored);
    }
    
    // Seed from backend if not in local storage
    const res = await fetch(`/api/materials/${courseId}`);
    if (!res.ok) return [];
    const data = await res.json();
    
    if (typeof window !== "undefined") {
      localStorage.setItem(`materials_${courseId}`, JSON.stringify(data));
    }
    return data;
  },

  addStudyMaterial: async (courseId: string, material: StudyMaterial): Promise<void> => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`materials_${courseId}`);
      const materials = stored ? JSON.parse(stored) : [];
      materials.push(material);
      localStorage.setItem(`materials_${courseId}`, JSON.stringify(materials));
    }
  },

  getQuestions: async (): Promise<Question[]> => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`questions_bank`);
      if (stored) return JSON.parse(stored);
    }
    
    // Seed from backend if not in local storage
    const res = await fetch(`/api/questions`);
    if (!res.ok) return [];
    const data = await res.json();
    
    if (typeof window !== "undefined") {
      localStorage.setItem(`questions_bank`, JSON.stringify(data));
    }
    return data;
  },

  addQuestion: async (question: Question): Promise<void> => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`questions_bank`);
      const questions = stored ? JSON.parse(stored) : [];
      questions.push(question);
      localStorage.setItem(`questions_bank`, JSON.stringify(questions));
    }
  },

  saveQuestionsBulk: async (newQuestions: Question[]): Promise<void> => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`questions_bank`);
      const questions = stored ? JSON.parse(stored) : [];
      const updated = [...questions, ...newQuestions];
      localStorage.setItem(`questions_bank`, JSON.stringify(updated));
    }
  }
};
