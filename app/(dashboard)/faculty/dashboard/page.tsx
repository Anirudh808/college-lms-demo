"use client";

import { useSession } from "@/store/session";
import { getCourses, getAssignments, getSubmissions } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { BookOpen, FileCheck } from "lucide-react";

export default function FacultyDashboardPage() {
  const { user } = useSession();
  const courses = getCourses(user?.id);
  const allAssignments = getAssignments().filter((a) =>
    courses.some((c) => c.id === a.courseId)
  );
  const submissions = getSubmissions().filter((s) =>
    allAssignments.some((a) => a.id === s.assignmentId)
  );
  const pendingGrading = submissions.filter((s) => s.score == null && s.submittedAt);

  const engagementData = courses.map((c: any) => ({
    name: c.code,
    value: Math.round(70 + Math.random() * 25),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <p className="text-muted-foreground">Overview of your courses and activities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/faculty/courses">View courses</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGrading.length}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/faculty/grading">Grade now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Engagement (simulated)</CardTitle>
          <p className="text-sm text-muted-foreground">Estimated engagement by course</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {courses.map((c: any) => (
              <Link key={c.id} href={`/faculty/courses/${c.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">{c.code}</p>
                  </div>
                  <Button variant="ghost" size="sm">Open</Button>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
