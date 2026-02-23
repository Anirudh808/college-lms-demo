"use client";

import { useParams } from "next/navigation";
import { getCourse, getLessons, getUser, getProgram, getDepartment, getAssignments, getSubmissions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, ClipboardList, Video, Plus, Users } from "lucide-react";
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

  const enrolledStudents = (course.enrollmentIds ?? [])
    .map((userId) => getUser(userId))
    .filter((u): u is NonNullable<typeof u> => !!u);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.code}</p>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="roster">Student Roster</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="live">Live Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Modules & Lessons</CardTitle>
              <p className="text-sm text-muted-foreground">Course content — view or edit lessons</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((m) => {
                    const lessons = getLessons(m.id);
                    return (
                      <div key={m.id} className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-3">{m.title}</h3>
                        <div className="space-y-2">
                          {lessons
                            .sort((a, b) => a.order - b.order)
                            .map((l) => (
                              <Link
                                key={l.id}
                                href={`/faculty/courses/${id}/lessons/${l.id}`}
                              >
                                <div className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                                  <FileText className="h-4 w-4" />
                                  <span>{l.title}</span>
                                </div>
                              </Link>
                            ))}
                          {lessons.length === 0 && (
                            <p className="text-sm text-muted-foreground pl-6">No lessons yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <Button variant="outline" className="mt-4" disabled>
                <Plus className="h-4 w-4 mr-1" /> Add Content
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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
                    <TableHead>Program</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((student) => {
                    const prog = student?.programId ? getProgram(student.programId) : null;
                    const dept = student ? getDepartment(student.departmentId) : null;
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
                        <TableCell>{prog?.code ?? "—"}</TableCell>
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
            <CardContent className="pt-6">
              <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-semibold">Assignments</h3>
              <p className="text-sm text-muted-foreground">Create and manage assignments</p>
              <Link href={`/faculty/grading`}>
                <Button variant="outline" className="mt-4">View Grading Queue</Button>
              </Link>
              <Button variant="outline" className="mt-4 ml-2" disabled>
                <Plus className="h-4 w-4 mr-1" /> Create Assignment
              </Button>
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
    </div>
  );
}
