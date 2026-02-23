"use client";

import { useSession } from "@/store/session";
import { getCourses } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default function StudentCoursesPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, undefined, user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View and access your enrolled courses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const totalLessons = c.modules.reduce((acc, m) => acc + (m.lessonIds?.length ?? 0), 0);
          const progress = totalLessons > 0 ? Math.min(100, Math.round(Math.random() * 40) + 30) : 0;
          return (
            <Link key={c.id} href={`/student/courses/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <p className="text-sm text-muted-foreground">{c.code}</p>
                  <h3 className="font-semibold">{c.title}</h3>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">{progress}% complete</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No courses enrolled. Contact your department to enroll.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
