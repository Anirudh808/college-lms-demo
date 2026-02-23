"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getLesson } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LessonViewerPage() {
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const course = getCourse(courseId);
  const lesson = getLesson(lessonId);

  if (!course || !lesson) return <p>Not found</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Link href={`/student/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to course
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <h1 className="text-xl font-bold">{lesson.title}</h1>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{lesson.content}</p>
          {lesson.references && lesson.references.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-2">References</h3>
              <ul className="list-disc pl-6 space-y-1">
                {lesson.references.map((r) => (
                  <li key={r.id}>
                    <span className="font-medium">{r.title}</span>: {r.excerpt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Link href={`/student/ai-tutor?lesson=${lessonId}&course=${courseId}`}>
          <Button>Ask AI Tutor about this lesson</Button>
        </Link>
      </div>
    </div>
  );
}
