"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getQuizzes, getQuizAttempts } from "@/lib/data";
import { useSession } from "@/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function CourseQuizzesPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user } = useSession();
  const course = getCourse(courseId) as any;
  const quizzes = getQuizzes(courseId);

  if (!course) return <p>Course not found</p>;

  return (
    <div className="space-y-6">
      <Link href={`/student/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to course
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Quizzes - {course.program}</h1>
        <p className="text-muted-foreground">{course.title}</p>
      </div>

      <div className="space-y-4">
        {quizzes.map((q) => {
          const attempts = user ? getQuizAttempts(user.id, q.id) : [];
          const lastAttempt = attempts[attempts.length - 1];
          const maxScore = q.questions.length;
          return (
            <Card key={q.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{q.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{q.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {q.questions.length} questions • {q.timeLimit} min
                    </p>
                  </div>
                  {lastAttempt && (
                    <Badge>
                      Last: {lastAttempt.score}/{maxScore}
                    </Badge>
                  )}
                </div>
                <Button className="mt-4" asChild>
                  <Link href={`/student/courses/${courseId}/quizzes/${q.id}`}>
                    {attempts.length > 0 ? "Retake" : "Start"} Quiz
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
