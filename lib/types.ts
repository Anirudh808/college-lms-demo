export type Role = "student" | "faculty" | "hod" | "admin";
export type Plan = "basic" | "premium" | "premium_plus";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  programs?: string[]; // array of course IDs the user is enrolled in (student) or teaches (faculty)
  planOverride?: Plan;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  tenantId: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  departmentId: string;
}

export interface Course {
  id: string;
  title: string;
  program: string;
  year?: string | number;
  semester?: number;
  university?: string;
  language?: string;
  departmentId?: string[];
  description?: string;
  syllabus?: string; // relative path to the course JSON file, e.g. "./heat_and_mass_transfer_course.json"
  enrollment: string[]; // array of student user IDs
  faculty: string; // faculty user ID
}

// ─── Syllabus JSON types (used when loading course detail files) ──────────────

export interface SyllabusSubtopic {
  id: string;
  title: string;
  content?: string;
  examples?: string[];
  images?: string[];
  image_meta?: { caption: string; license: string; source: string }[];
}

export interface SyllabusLesson {
  id: string;
  title: string;
  description?: string;
  topics?: {
    id: string;
    title: string;
    subtopics?: SyllabusSubtopic[];
  }[];
}

export interface SyllabusChapter {
  id: string;
  title: string;
  description?: string;
  lessons: SyllabusLesson[];
}

export interface SyllabusModule {
  id: string;
  title: string;
  description?: string;
  chapters: SyllabusChapter[];
}

export interface CourseSyllabus {
  course: {
    id: string;
    title: string;
    program?: string;
    year?: string;
    semester?: string;
    university?: string;
    credits?: number;
    description?: string;
    modules: SyllabusModule[];
  };
}

// Legacy stub — kept so lesson pages compile (getLessons still used)
export interface Module {
  id: string;
  title: string;
  order: number;
  lessonIds: string[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  moduleId: string;
  order: number;
  references?: { id: string; title: string; excerpt: string }[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  type: "essay" | "code" | "file" | "quiz";
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt: string;
  content?: string;
  fileUrl?: string;
  score?: number;
  gradedAt?: string;
  feedback?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  type: "mcq" | "truefalse";
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  answers: { questionId: string; selectedIndex: number }[];
}

export interface LiveClass {
  id: string;
  courseId: string;
  title: string;
  scheduledAt: string;
  duration: number;
  meetingUrl: string;
  status: "scheduled" | "live" | "ended";
}

export interface ChatMessage {
  id: string;
  liveClassId: string;
  userId: string;
  userName: string;
  message: string;
  sentAt: string;
}

export interface Poll {
  id: string;
  liveClassId: string;
  question: string;
  options: string[];
  createdBy: string;
  createdAt: string;
  responses: { userId: string; optionIndex: number }[];
}

export interface DiscussionPost {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
  replies: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  courseId: string;
  date: string;
  studentId: string;
  status: "present" | "absent" | "late";
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  targetRole?: Role;
  targetDepartmentId?: string;
}

export interface AIUsageRecord {
  id: string;
  userId: string;
  action: string;
  credits: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PlanLimit {
  key: string;
  limit: number | "unlimited";
  period: "day" | "week" | "month";
}

export interface AssessmentQuestionOption {
  key: string;
  text: string;
  reason?: string;
}

export interface AssessmentQuestion {
  question: string;
  type: string;
  options?: AssessmentQuestionOption[];
  correctAnswer?: {
    option?: string;
    answer?: boolean;
    multiOptions?: string[];
  };
}

export interface Assessment {
  id: string;
  courseId: string;
  module: string;
  chapter: string;
  lesson: string;
  topic?: string;
  subTopic?: string;
  durationInSeconds: number;
  questionLimit: number;
	type: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentSubmission {
  assessmentId: string;
  courseId: string;
  studentId?: string;
  studentAnswers: any[];
  submittedAt: number;
}

