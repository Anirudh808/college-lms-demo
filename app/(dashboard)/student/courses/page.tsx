"use client";

import { useSession } from "@/store/session";
import { getCourses, getUsers } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { BookOpen, User, Clock } from "lucide-react";

export default function StudentCoursesPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, undefined, user?.id);
  const allUsers = getUsers();

  const getFacultyName = (facultyId: string) => {
    const f = allUsers.find((u) => u.id === facultyId);
    return f ? f.name : "Faculty";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View and access your enrolled courses</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, idx) => {
          // Mock progress per card
          const progress = Math.min(100, Math.round(Math.random() * 40) + 20);

          const gradients = [
            "from-blue-500 to-cyan-400",
            "from-purple-500 to-pink-400",
            "from-orange-500 to-amber-400",
            "from-emerald-500 to-teal-400",
            "from-indigo-500 to-purple-400",
            "from-rose-500 to-red-400",
          ];
          const gradient = gradients[idx % gradients.length];
          const facultyName = getFacultyName(c.faculty);

          return (
            <Link key={c.id} href={`/student/courses/${c.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-muted/50 overflow-hidden flex flex-col group">
                {/* Course Thumbnail */}
                <div
                  className={`h-32 w-full bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />
                  <BookOpen className="h-10 w-10 text-white/80" />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 text-black hover:bg-white text-xs border-none font-semibold shadow-sm"
                    >
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {facultyName.split(" ").slice(-1)[0]}
                      </span>
                    </Badge>
                  </div>
                  {/* Semester badge */}
                  {c.semester && (
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-black/40 text-white border-none text-xs font-medium">
                        <Clock className="h-3 w-3 mr-1" />
                        Sem {c.semester}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider line-clamp-1">
                      {c.program}
                    </p>
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  {c.university && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{c.university}</p>
                  )}
                </CardHeader>

                <CardContent className="mt-auto pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Course Progress</p>
                    <p className="text-xs font-bold">{progress}%</p>
                  </div>
                  <Progress value={progress} className="h-2" />
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
            <p className="text-lg font-medium">No courses enrolled yet</p>
            <p className="text-sm">Contact your department or check back later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
