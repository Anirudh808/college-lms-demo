"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getAssignments, getSubmissions } from "@/lib/data";
import { useSession } from "@/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function CourseAssignmentsPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useSession();
  const course = getCourse(courseId) as any;
  const assignments = getAssignments(courseId);

  if (!course) return <p>Course not found</p>;

  return (
    <div className="space-y-6">
      <Link href={`/student/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to course
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Assignments - {course.code}</h1>
        <p className="text-muted-foreground">{course.title}</p>
      </div>

      <div className="space-y-4">
        {assignments.map((a) => {
          const sub = user ? getSubmissions(a.id, user.id)[0] : null;
          const submitted = !!sub?.submittedAt;
          const graded = sub?.score != null;
          const overdue = new Date(a.dueDate) < new Date() && !submitted;

          return (
            <Card key={a.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{a.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Due {format(new Date(a.dueDate), "MMM d, yyyy")} • Max {a.maxScore} pts
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {submitted && (
                      <Badge variant={graded ? "default" : "secondary"}>
                        {graded ? `${sub!.score}/${a.maxScore}` : "Submitted"}
                      </Badge>
                    )}
                    {overdue && !submitted && <Badge variant="destructive">Overdue</Badge>}
                  </div>
                </div>
                <Button className="mt-4" variant={submitted ? "outline" : "default"} asChild>
                  <Link href={`/student/courses/${courseId}/assignments/${a.id}`}>
                    {submitted ? "View submission" : "Submit"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
