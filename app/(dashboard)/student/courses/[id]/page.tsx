"use client";

import { useParams } from "next/navigation";
import { getCourse, getUsers } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import type { SyllabusModule, SyllabusLesson } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileText, MessageSquare, ClipboardList, HelpCircle,
  PlayCircle, Download, CheckCircle2, Circle, Clock,
  Flame, Award, Target, BookOpen, AlertCircle, Bot,
  GraduationCap, User, Layers, FileSignature
} from "lucide-react";
import { useState, useEffect } from "react";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Assessment, AssessmentSubmission } from "@/lib/types";
import { useSession } from "@/store/session";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const course = getCourse(id);
  const allUsers = getUsers();

  if (!course) return <div className="p-6 text-center text-muted-foreground">Course not found</div>;

  // Load syllabus from the static syllabus map
  const syllabusData = getCourseSyllabus(id);
  const syllabusModules: SyllabusModule[] = syllabusData?.course?.modules ?? [];

  const { user } = useSession();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssessmentSubmission>>({});

  useEffect(() => {
    LocalStorageService.getAssessments(id).then(async (data) => {
      setAssessments(data);
      if (user?.name) {
        const subs: Record<string, AssessmentSubmission> = {};
        for (const a of data) {
          const s = await LocalStorageService.getSubmissions(a.id);
          const userSub = s.find(sub => sub.studentId === user.id || sub.studentName === user.name);
          if (userSub) {
            subs[a.id] = userSub;
          }
        }
        setSubmissions(subs);
      }
    });
  }, [id, user?.name]);
  // Resolve faculty name
  const facultyUser = allUsers.find((u) => u.id === course.faculty);
  const facultyName = facultyUser?.name ?? "Faculty";

  // Build flat lesson list for "Resume" link (first lesson of first chapter of first module)
  const firstLesson: SyllabusLesson | null =
    syllabusModules[0]?.chapters?.[0]?.lessons?.[0] ?? null;

  // Smart learning mock
  const smartLearning = {
    timeSpent: "4h 30m week",
    streak: 5,
    milestone: "25% Completed",
  };

  // Mock progress state per lesson
  const getLessonState = (lessonIdx: number, moduleIdx: number) => {
    if (moduleIdx === 0 && lessonIdx === 0) return "completed";
    if (moduleIdx === 0 && lessonIdx === 1) return "in-progress";
    if (moduleIdx === 1) return "locked";
    return "not-started";
  };

  const courseOutcomes = [
    "CO1: Understand the fundamental concepts and principles of the subject.",
    "CO2: Apply theoretical knowledge to solve practical problems.",
    "CO3: Analyse and evaluate complex scenarios using appropriate methodologies.",
  ];

  return (
    <div className="space-y-6">

      {/* ── Course Header & Smart Learning Banner ── */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start bg-secondary/20 p-6 rounded-xl border border-secondary">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-background">{course.id.toUpperCase()}</Badge>
            {course.university && (
              <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-none font-semibold">
                {course.university}
              </Badge>
            )}
            {course.semester && (
              <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-none font-semibold">
                Semester {course.semester}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
          <p className="text-sm text-muted-foreground font-medium mb-1">{course.program}</p>
          {course.year && (
            <p className="text-xs text-muted-foreground mb-2">Year: {course.year}</p>
          )}
          {course.description && (
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed mt-2 line-clamp-3">
              {course.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              {facultyName}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
              <Flame className="h-4 w-4" /> {smartLearning.streak} Day Streak
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-blue-500">
              <Clock className="h-4 w-4" /> {smartLearning.timeSpent}
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-green-500">
              <Award className="h-4 w-4" /> {smartLearning.milestone}
            </div>
          </div>
        </div>

        {/* Resume Learning Card */}
        <Card className="w-full md:w-80 shadow-md border-primary/20 bg-primary/5 shrink-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" /> Up Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold line-clamp-2">
              {firstLesson?.title ?? "Introduction to the Course"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Resume exactly where you left off
            </p>
            <Button className="w-full" asChild>
              <Link href={firstLesson ? `/student/courses/${id}/lessons/${firstLesson.id}` : "#"}>
                Resume Learning
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (Main Content) ── */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="modules" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="modules">Syllabus &amp; Modules</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            {/* ── Syllabus Tab ── */}
            <TabsContent value="modules" className="mt-6">
              {syllabusModules.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Layers className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p>Syllabus is being prepared.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {syllabusModules.map((mod, mIdx) => {
                    const isLocked = mIdx === 1; // Module 2 locked for demo
                    // Collect all lessons across chapters in this module
                    const allLessons = mod.chapters?.flatMap((ch) => ch.lessons ?? []) ?? [];

                    return (
                      <Card key={mod.id} className={isLocked ? "opacity-70 bg-muted/30" : ""}>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                              Module {mIdx + 1}
                            </p>
                            <CardTitle className="text-lg">{mod.title}</CardTitle>
                            {mod.description && (
                              <CardDescription className="mt-1 line-clamp-2 text-xs">
                                {mod.description}
                              </CardDescription>
                            )}
                            {isLocked && (
                              <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                                <AlertCircle className="h-3 w-3" /> Complete previous module first
                              </p>
                            )}
                          </div>
                          {!isLocked && (
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Progress</p>
                              <div className="w-24">
                                <Progress value={mIdx === 0 ? 20 : 0} className="h-1.5" />
                              </div>
                            </div>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {mod.chapters?.map((ch, chIdx) => (
                            <div key={ch.id}>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-1">
                                Chapter {chIdx + 1}: {ch.title}
                              </p>
                              <div className="space-y-1">
                                {(ch.lessons ?? []).map((lesson, lIdx) => {
                                  // find absolute lesson index across all chapters for state
                                  const absIdx = mod.chapters
                                    .slice(0, chIdx)
                                    .reduce((s, c2) => s + (c2.lessons?.length ?? 0), 0) + lIdx;
                                  const state = getLessonState(absIdx, mIdx);
                                  const Icon =
                                    state === "completed"
                                      ? CheckCircle2
                                      : state === "in-progress"
                                        ? PlayCircle
                                        : Circle;
                                  const iconColor =
                                    state === "completed"
                                      ? "text-green-500"
                                      : state === "in-progress"
                                        ? "text-primary"
                                        : "text-muted-foreground";

                                  return (
                                    <Link
                                      key={lesson.id}
                                      href={isLocked ? "#" : `/student/courses/${id}/lessons/${lesson.id}`}
                                      className={isLocked ? "pointer-events-none" : ""}
                                    >
                                      <div
                                        className={`group flex items-center justify-between p-3 rounded-lg border border-transparent transition-colors ${state === "in-progress"
                                          ? "bg-primary/5 border-primary/20"
                                          : "hover:bg-muted"
                                          }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                                          <div>
                                            <span className={`font-medium text-sm ${state === "in-progress" ? "text-primary" : ""}`}>
                                              {lesson.title}
                                            </span>
                                            {lesson.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {lesson.description}
                                              </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                              {(lesson.topics?.length ?? 0) > 0 && (
                                                <span>{lesson.topics!.length} topic{lesson.topics!.length !== 1 ? "s" : ""}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        {state === "in-progress" && (
                                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                                            Resume
                                          </Badge>
                                        )}
                                        {state === "completed" && (
                                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none shrink-0">
                                            Done
                                          </Badge>
                                        )}
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {/* Quiz link per module */}
                          {!isLocked && allLessons.length > 0 && (
                            <Link href={`/student/courses/${id}/quizzes`}>
                              <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border hover:bg-muted mt-2">
                                <div className="flex items-center gap-3">
                                  <ClipboardList className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium text-sm">Module Knowledge Check</span>
                                </div>
                                <Badge variant="outline">Quiz</Badge>
                              </div>
                            </Link>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <CardContent>
                {assessments.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No assessments available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assessments.map(a => {
                      const hasSubmitted = !!submissions[a.id];
                      return (
                        <div key={a.id} className="flex flex-wrap items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <h4 className="font-semibold text-base">{a.questions?.[0]?.type || "Assessment"} Assessment</h4>
                            <p className="text-sm text-muted-foreground mt-1">Module: {a.module} • {a.durationInSeconds / 60} mins</p>
                          </div>
                          <Button asChild variant={hasSubmitted ? "outline" : "default"}>
                            <Link href={`/student/courses/${id}/assignments/${a.id}`}>
                              {hasSubmitted ? "View Result" : "Attempt Now"}
                            </Link>
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6">
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold">Course Quizzes</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">Test your knowledge with chapter quizzes.</p>
                  <Button asChild>
                    <Link href={`/student/courses/${id}/quizzes`}>Go to Quizzes</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-primary" />
                    Course Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assessments.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">No assessments available yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assessments.map(a => {
                        const hasSubmitted = !!submissions[a.id];
                        return (
                          <div key={a.id} className="flex flex-wrap items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div>
                              <h4 className="font-semibold text-base">{a.questions?.[0]?.type || "Assessment"} Assessment</h4>
                              <p className="text-sm text-muted-foreground mt-1">Module: {a.module} • {a.durationInSeconds / 60} mins</p>
                            </div>
                            <Button asChild variant={hasSubmitted ? "outline" : "default"}>
                              <Link href={`/student/courses/${id}/assignments/${a.id}`}>
                                {hasSubmitted ? "View Result" : "Attempt Now"}
                              </Link>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold">Discussion Forum</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">Engage with your peers and instructors.</p>
                  <Button variant="outline" asChild>
                    <Link href={`/student/courses/${id}/discussion`}>Open Discussion Room</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div className="space-y-6">

          {/* Course Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Course Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faculty</span>
                <span className="font-medium text-right">{facultyName}</span>
              </div>
              {course.program && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Program</span>
                  <span className="font-medium text-right line-clamp-2">{course.program}</span>
                </div>
              )}
              {course.year && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{course.year}</span>
                </div>
              )}
              {course.semester && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{course.semester}</span>
                </div>
              )}
              {course.university && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">University</span>
                  <span className="font-medium text-right">{course.university}</span>
                </div>
              )}
              {course.language && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language</span>
                  <Badge variant="outline">{course.language}</Badge>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enrolled Students</span>
                <span className="font-medium">{course.enrollment?.length ?? 0}</span>
              </div>
              {syllabusModules.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules</span>
                  <span className="font-medium">{syllabusModules.length}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Outcomes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Course Outcomes (CO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {courseOutcomes.map((co, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                    <span className="font-bold text-foreground bg-muted px-1.5 rounded text-xs mt-0.5">
                      {co.split(":")[0]}
                    </span>
                    <span>{co.split(":")[1]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Course Resources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Course Resources
              </CardTitle>
              <CardDescription>Materials provided by the instructor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors cursor-pointer border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">Complete Syllabus</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF • 2.4 MB</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors cursor-pointer border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded">
                    <PlayCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">All Lecture Recordings</p>
                    <p className="text-xs text-muted-foreground mt-1">External Link</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Tutor */}
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex justify-between items-center">
                <span>AI Tutor Access</span>
                <Bot className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stuck on a concept? Our AI tutor is trained on this course material.
              </p>
              <Button className="w-full gap-2" variant="outline" asChild>
                <Link href={`/student/ai-tutor?course=${id}`}>
                  <HelpCircle className="h-4 w-4" /> Ask Course Question
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
