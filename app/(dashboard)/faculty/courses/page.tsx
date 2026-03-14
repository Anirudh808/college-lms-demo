"use client";

import { useSession } from "@/store/session";
import { getCourses, getUsers } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Users, Layers, Plus } from "lucide-react";

export default function FacultyCoursesPage() {
  const { user } = useSession();
  const courses = getCourses(user?.id);
  const allUsers = getUsers();

  const getEnrolledCount = (enrollmentArr: string[]) => enrollmentArr?.length ?? 0;

  const getModuleCount = (courseId: string) => {
    const syllabus = getCourseSyllabus(courseId);
    return syllabus?.course?.modules?.length ?? 0;
  };

  const gradients = [
    "from-blue-500 to-cyan-400",
    "from-purple-500 to-pink-400",
    "from-orange-500 to-amber-400",
    "from-emerald-500 to-teal-400",
    "from-indigo-500 to-purple-400",
    "from-rose-500 to-red-400",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and content</p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/faculty/courses/create">
            <Plus className="h-4 w-4" />
            Create New Course
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, idx) => {
          const moduleCount = getModuleCount(c.id);
          const enrolledCount = getEnrolledCount(c.enrollment);
          const gradient = gradients[idx % gradients.length];

          return (
            <Link key={c.id} href={`/faculty/courses/${c.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-muted/50 overflow-hidden flex flex-col group">
                {/* Thumbnail */}
                <div
                  className={`h-28 w-full bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />
                  <BookOpen className="h-8 w-8 text-white/80" />
                  {c.semester && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-black border-none text-xs font-semibold">
                        Sem {c.semester}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
                    {c.program}
                  </p>
                  <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                </CardHeader>

                <CardContent className="mt-auto pt-0 pb-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      {moduleCount > 0 ? `${moduleCount} modules` : "Modules loading"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {enrolledCount} student{enrolledCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {courses.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No courses assigned yet</p>
            <p className="text-sm">Contact your HOD or admin for course assignment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
