"use client";

import { useSession } from "@/store/session";
import { getCourses } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default function FacultyCoursesPage() {
  const { user } = useSession();
  const courses = getCourses(user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">Manage your courses and content</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <Link key={c.id} href={`/faculty/courses/${c.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <p className="text-sm text-muted-foreground">{c.code}</p>
                <h3 className="font-semibold">{c.title}</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {c.modules.length} modules • Upload content, assignments, quizzes
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
