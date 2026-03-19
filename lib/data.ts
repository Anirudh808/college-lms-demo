import type {
  Tenant,
  User,
  Course,
  Lesson,
  Assignment,
  Submission,
  Quiz,
  QuizAttempt,
  LiveClass,
  ChatMessage,
  Poll,
  DiscussionPost,
  Attendance,
  Announcement,
  AIUsageRecord,
	Assessment,
} from "./types";

import tenantsData from "@/data/tenants.json";
import usersData from "@/data/users.json";
import departmentsData from "@/data/departments.json";
import programsData from "@/data/programs.json";
import lessonsData from "@/data/lessons.json";
import assignmentsData from "@/data/assignments.json";
import submissionsData from "@/data/submissions.json";
import quizzesData from "@/data/quizzes.json";
import quizAttemptsData from "@/data/quizAttempts.json";
import liveClassesData from "@/data/liveClasses.json";
import chatMessagesData from "@/data/chatMessages.json";
import pollsData from "@/data/polls.json";
import discussionsData from "@/data/discussions.json";
import attendanceData from "@/data/attendance.json";
import announcementsData from "@/data/announcements.json";
import aiUsageData from "@/data/aiUsage.json";
import rawCoursesData from "@/data/courses.json";
import rawAssessmentsData from "@/data/assessment_mock.json";
import rawClassroomsData from "@/data/classrooms.json";
import rawQuestionBankData from "@/data/questionBank.json";

const tenants = tenantsData as Tenant[];
const users = usersData as User[];
const departments = departmentsData as import("./types").Department[];
const programs = programsData as import("./types").Program[];
// Cast courses from JSON — field names differ from old schema, cast via unknown
const courses = rawCoursesData as unknown as Course[];
const assessments = rawAssessmentsData as unknown as Assessment;
const classrooms = rawClassroomsData as unknown as import("./types").Classroom[];
const questions = rawQuestionBankData as unknown as import("./types").Question[];
const lessons = lessonsData as Lesson[];
let assignments = [...(assignmentsData as Assignment[])];
let submissions = [...(submissionsData as Submission[])];
const quizzes = quizzesData as Quiz[];
let quizAttempts = [...(quizAttemptsData as QuizAttempt[])];
const liveClasses = liveClassesData as LiveClass[];
let chatMessages = [...(chatMessagesData as ChatMessage[])];
const polls = pollsData as Poll[];
const discussions = discussionsData as DiscussionPost[];
const attendance = attendanceData as Attendance[];
const announcements = announcementsData as Announcement[];
let aiUsage = [...(aiUsageData as AIUsageRecord[])];

export async function loadData() {
  return Promise.resolve();
}

export function getTenants() {
  return tenants;
}

export function getUsers(role?: string) {
  if (role) return users.filter((u) => u.role === role);
  return users;
}

export function getUser(id: string) {
  return users.find((u) => u.id === id);
}

export function getDepartments() {
  return departments;
}

export function getDepartment(id: string) {
  return departments.find((d) => d.id === id);
}

export function getPrograms(departmentId?: string) {
  if (departmentId) return programs.filter((p) => p.departmentId === departmentId);
  return programs;
}

export function getProgram(id: string) {
  return programs.find((p) => p.id === id);
}

export function getCourses(facultyId?: string, departmentId?: string, enrollmentId?: string) {
  let list = courses;
  // New schema: faculty field (was facultyId)
  if (facultyId) list = list.filter((c) => c.faculty === facultyId);
  // New schema: departmentId is now string[] (array), skip simple string filter
  // if (departmentId) list = list.filter((c) => c.departmentId === departmentId);
  // New schema: enrollment field (was enrollmentIds)
  if (enrollmentId) list = list.filter((c) => c.enrollment?.includes(enrollmentId));
  return list;
}

export function getCourse(id: string) {
  return courses.find((c) => c.id === id);
}

export function getClassrooms() {
  return classrooms;
}

export function getClassroomByCourseId(courseId: string) {
  return classrooms.find((c) => c.courseId === courseId);
}

export function getQuestions() {
  return questions;
}

export function getAssessment() {
	return assessments;
}

export function getLessons(moduleId?: string) {
  if (moduleId) return lessons.filter((l) => l.moduleId === moduleId);
  return lessons;
}

export function getLesson(id: string) {
  return lessons.find((l) => l.id === id);
}

export function getAssignments(courseId?: string) {
  if (courseId) return assignments.filter((a) => a.courseId === courseId);
  return assignments;
}

export function getAssignment(id: string) {
  return assignments.find((a) => a.id === id);
}

export function getSubmissions(assignmentId?: string, studentId?: string) {
  let list = submissions;
  if (assignmentId) list = list.filter((s) => s.assignmentId === assignmentId);
  if (studentId) list = list.filter((s) => s.studentId === studentId);
  return list;
}

export function getQuizzes(courseId?: string) {
  if (courseId) return quizzes.filter((q) => q.courseId === courseId);
  return quizzes;
}

export function getQuiz(id: string) {
  return quizzes.find((q) => q.id === id);
}

export function getQuizAttempts(studentId?: string, quizId?: string) {
  let list = quizAttempts;
  if (studentId) list = list.filter((qa) => qa.studentId === studentId);
  if (quizId) list = list.filter((qa) => qa.quizId === quizId);
  return list;
}

export function getLiveClasses(courseId?: string) {
  if (courseId) return liveClasses.filter((lc) => lc.courseId === courseId);
  return liveClasses;
}

export function getLiveClass(id: string) {
  return liveClasses.find((lc) => lc.id === id);
}

export function getChatMessages(liveClassId: string) {
  return chatMessages.filter((ch) => ch.liveClassId === liveClassId);
}

export function getPolls(liveClassId: string) {
  return polls.filter((p) => p.liveClassId === liveClassId);
}

export function getDiscussions(courseId: string) {
  return discussions.filter((d) => d.courseId === courseId);
}

export function getAttendance(courseId?: string, studentId?: string) {
  let list = attendance;
  if (courseId) list = list.filter((a) => a.courseId === courseId);
  if (studentId) list = list.filter((a) => a.studentId === studentId);
  return list;
}

export function getAnnouncements() {
  return announcements;
}

export function getAIUsage(userId?: string) {
  if (userId) return aiUsage.filter((u) => u.userId === userId);
  return aiUsage;
}

export function addAIUsage(record: AIUsageRecord) {
  aiUsage.push(record);
}

export function addSubmission(sub: Submission) {
  submissions.push(sub);
}

export function addChatMessage(msg: ChatMessage) {
  chatMessages.push(msg);
}
