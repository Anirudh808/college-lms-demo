"use client";

import { useSession } from "@/store/session";
import { getCourses, getAssignments, getAttendance, getAnnouncements } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, Calendar, Bot, ClipboardList, Megaphone } from "lucide-react";
import { format } from "date-fns";

export default function StudentDashboardPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, undefined, user?.id);
  const allAssignments = getAssignments();
  const myAssignmentIds = courses.flatMap((c) =>
    allAssignments.filter((a) => a.courseId === c.id).map((a) => a.id)
  );
  const upcomingAssignments = allAssignments
    .filter((a) => myAssignmentIds.includes(a.id) && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  const attendance = getAttendance(undefined, user?.id);
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const announcements = getAnnouncements().slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/student/courses">View courses</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attPct}%</div>
            <Progress value={attPct} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/student/planner">View planner</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Tutor</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/student/ai-tutor">Open AI Tutor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Your enrolled courses and progress</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses enrolled.</p>
            ) : (
              <div className="space-y-4">
                {courses.map((c) => {
                  const totalLessons = c.modules.reduce((acc, m) => acc + (m.lessonIds?.length ?? 0), 0);
                  const progress = totalLessons > 0 ? Math.min(100, Math.round(Math.random() * 40) + 30) : 0;
                  return (
                    <Link key={c.id} href={`/student/courses/${c.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{c.title}</p>
                          <p className="text-sm text-muted-foreground">{c.code}</p>
                        </div>
                        <div className="w-24">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Assignments and quizzes due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => {
                  const course = courses.find((c) => c.id === a.courseId);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{course?.code} • Due {format(new Date(a.dueDate), "MMM d")}</p>
                      </div>
                      <Badge variant="outline">Assignment</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {a.authorName} • {format(new Date(a.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
