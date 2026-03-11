"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getDiscussions } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function CourseDiscussionPage() {
  const params = useParams();
  const courseId = params.id as string;
  const course = getCourse(courseId) as any;
  const discussions = getDiscussions(courseId);

  if (!course) return <p>Course not found</p>;

  return (
    <div className="space-y-6">
      <Link href={`/student/courses/${courseId}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to course
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Discussion - {course.code}</h1>
        <p className="text-muted-foreground">{course.title}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Button disabled>New post (simulated)</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {discussions.map((d) => (
          <Card key={d.id}>
            <CardContent className="pt-6">
              <h3 className="font-semibold">{d.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{d.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {d.authorName} • {format(new Date(d.createdAt), "MMM d, yyyy")}
              </p>
              <div className="mt-4 pl-4 border-l space-y-2">
                {d.replies.map((r) => (
                  <div key={r.id}>
                    <p className="text-sm">{r.content}</p>
                    <p className="text-xs text-muted-foreground">
                      — {r.authorName} • {format(new Date(r.createdAt), "MMM d")}
                    </p>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4" disabled>
                Reply
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
