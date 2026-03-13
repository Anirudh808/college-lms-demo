"use client";

import { useParams } from "next/navigation";
import { getCourse, getUser, getDepartment, getAssignments, getSubmissions } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import type { SyllabusModule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileText, ClipboardList, Video, Plus, Users, ChevronRight, Layers, FileSignature, Presentation, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { AssignmentSidePanel } from "@/components/AssignmentSidePanel";
import { AssignmentForm } from "@/components/AssignmentForm";
import { AssignmentAttemptLayout } from "@/components/AssignmentAttemptLayout";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Assessment, AssessmentSubmission } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FacultyCourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const course = getCourse(id);

  if (!course) return <p>Course not found</p>;

  // Load syllabus from map (replaces old course.modules)
  const syllabusData = getCourseSyllabus(id);
  const syllabusModules: SyllabusModule[] = syllabusData?.course?.modules ?? [];

  // Get enrolled students from new `enrollment` field (was enrollmentIds)
  const enrolledStudents = (course.enrollment ?? [])
    .map((userId) => getUser(userId))
    .filter((u): u is NonNullable<typeof u> => !!u);

  const [isAssessmentPanelOpen, setAssessmentPanelOpen] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, AssessmentSubmission[]>>({});
  const [selectedSubmissionView, setSelectedSubmissionView] = useState<{ assessment: Assessment; submission: AssessmentSubmission } | null>(null);

  useEffect(() => {
    LocalStorageService.getAssessments(id).then(async (fetched) => {
      setAssessments(fetched);
      const subMap: Record<string, AssessmentSubmission[]> = {};
      for (const a of fetched) {
        subMap[a.id] = await LocalStorageService.getSubmissions(a.id);
      }
      setSubmissionsMap(subMap);
    });
  }, [id, isAssessmentPanelOpen]);
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge variant="outline">{id.toUpperCase()}</Badge>
          {course.semester && (
            <Badge variant="secondary">Semester {course.semester}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-muted-foreground">{course.program}</p>
        {course.description && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl line-clamp-2">
            {course.description}
          </p>
        )}
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="roster">Student Roster</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="live">Live Sessions</TabsTrigger>
        </TabsList>

        {/* ── Content Tab: syllabus from linked JSON ── */}
        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Modules &amp; Lessons
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {syllabusModules.length > 0
                  ? `${syllabusModules.length} module${syllabusModules.length !== 1 ? "s" : ""} in course syllabus`
                  : "Course syllabus content"}
              </p>
            </CardHeader>
            <CardContent>
              {syllabusModules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No syllabus loaded for this course.
                </p>
              ) : (
                <div className="space-y-5">
                  {syllabusModules.map((mod, mIdx) => (
                    <div key={mod.id} className="rounded-lg border p-4">
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          M{mIdx + 1}
                        </span>
                        {mod.title}
                      </h3>
                      {mod.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {mod.description}
                        </p>
                      )}
                      <div className="space-y-3 mt-3">
                        {(mod.chapters ?? []).map((ch, chIdx) => (
                          <div key={ch.id}>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                              Ch {chIdx + 1}: {ch.title}
                            </p>
                            <div className="space-y-1 pl-2">
                              {(ch.lessons ?? []).map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-2 p-2 rounded hover:bg-muted text-sm"
                                >
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="flex-1 line-clamp-1">{lesson.title}</span>
                                  {(lesson.topics?.length ?? 0) > 0 && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {lesson.topics!.length} topic{lesson.topics!.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-1" /> Add Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Student Roster ── */}
        <TabsContent value="roster" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Roster
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {enrolledStudents.length} enrolled student{enrolledStudents.length !== 1 ? "s" : ""}
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student) => {
                    const dept = student?.departmentId ? getDepartment(student.departmentId) : null;
                    const courseAssignments = getAssignments(id);
                    const subs = courseAssignments.flatMap((a) =>
                      getSubmissions(a.id).filter((s) => s.studentId === student?.id)
                    );
                    const submitted = subs.filter((s) => s.submittedAt).length;
                    const graded = subs.filter((s) => s.score != null).length;
                    return (
                      <TableRow key={student?.id}>
                        <TableCell className="font-medium">{student?.name}</TableCell>
                        <TableCell>{student?.email}</TableCell>
                        <TableCell>{dept?.name ?? "—"}</TableCell>
                        <TableCell>
                          {graded}/{submitted} graded ({courseAssignments.length} total)
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {enrolledStudents.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">No students enrolled.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Course Assignments
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Create and manage assignments mapping to syllabus topics.</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/faculty/grading`}>
                  <Button variant="outline">View Grading Queue</Button>
                </Link>
                <Button onClick={() => setAssessmentPanelOpen(true)} className="bg-primary">
                  <Plus className="h-4 w-4 mr-1" /> Create Assignment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No assignments given.</p>
                </div>
              ) : (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment Info</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Submissions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assignment) => {
                      const submissions = submissionsMap[assignment.id] || [];

                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">{assignment.questions?.[0]?.type || "Assessment"} ({assignment.module})</TableCell>
                          <TableCell>{assignment.questions?.length || 0} Questions</TableCell>
                          <TableCell>{assignment.durationInSeconds / 60} mins</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="link" className="p-0 h-auto font-semibold">
                                  {submissions.length} students <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Submissions for {assignment.questions?.[0]?.type || "Assessment"} Assessment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {submissions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No submissions yet.</p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Student Name</TableHead>
                                          <TableHead>Submitted At</TableHead>
                                          <TableHead>Answers</TableHead>
                                          <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {submissions.map((sub, i) => (
                                          <TableRow key={i}>
                                            <TableCell className="font-medium">{sub.studentName || "Student"}</TableCell>
                                            <TableCell>{new Date(sub.submittedAt).toLocaleString()}</TableCell>
                                            <TableCell>{sub.studentAnswers?.length || 0} answers recorded</TableCell>
                                            <TableCell className="text-right">
                                              <Button variant="outline" size="sm" onClick={() => setSelectedSubmissionView({ assessment: assignment, submission: sub })}>
                                                View Details
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-semibold">Quizzes</h3>
              <p className="text-sm text-muted-foreground">Create quizzes</p>
              <Button variant="outline" className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-1" /> Create Quiz
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ass" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>

                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-primary" />
                  Course Assessments
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Manage assessments from Local Storage.</p>
              </div>
              <Button onClick={() => setAssessmentPanelOpen(true)} className="bg-primary">
                <Plus className="h-4 w-4 mr-1" /> Create Assessment
              </Button>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No assessments created yet.</p>
                </div>
              ) : (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Questions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.questions?.[0]?.type || "Assessment"}</TableCell>
                        <TableCell>{a.module}</TableCell>
                        <TableCell>{a.durationInSeconds / 60} mins</TableCell>
                        <TableCell>{a.questions.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <Video className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-semibold">Live Sessions</h3>
              <p className="text-sm text-muted-foreground">Schedule live classes</p>
              <Button variant="outline" className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-1" /> Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AssignmentSidePanel isOpen={isAssessmentPanelOpen} onClose={() => setAssessmentPanelOpen(false)}>
        <AssignmentForm
          courseId={id}
          syllabusModules={syllabusModules}
          onSuccess={() => setAssessmentPanelOpen(false)}
          onCancel={() => setAssessmentPanelOpen(false)}
        />
      </AssignmentSidePanel>

      <Dialog open={!!selectedSubmissionView} onOpenChange={(open) => !open && setSelectedSubmissionView(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Submission Details</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            {selectedSubmissionView && (
              <AssignmentAttemptLayout
                assessment={selectedSubmissionView.assessment}
                courseId={id}
                facultyViewSubmission={selectedSubmissionView.submission}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
