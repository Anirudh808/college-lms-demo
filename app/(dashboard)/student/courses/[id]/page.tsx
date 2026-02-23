"use client";

import { useParams } from "next/navigation";
import { getCourse, getLessons } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, MessageSquare, ClipboardList, HelpCircle } from "lucide-react";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const course = getCourse(id);
  if (!course) return <p>Course not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.code}</p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-4">
          <div className="space-y-2">
            {course.modules
              .sort((a, b) => a.order - b.order)
              .map((m) => {
                const lessons = getLessons(m.id);
                return (
                  <Card key={m.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{m.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lessons
                          .sort((a, b) => a.order - b.order)
                          .map((l) => (
                            <Link key={l.id} href={`/student/courses/${id}/lessons/${l.id}`}>
                              <div className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                                <FileText className="h-4 w-4" />
                                <span>{l.title}</span>
                              </div>
                            </Link>
                          ))}
                        {lessons.length === 0 && (
                          <p className="text-sm text-muted-foreground">No lessons yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardContent className="py-6">
              <Link href={`/student/courses/${id}/assignments`}>
                <Button>View Assignments</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-4">
          <Card>
            <CardContent className="py-6">
              <Link href={`/student/courses/${id}/quizzes`}>
                <Button>View Quizzes</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussion" className="mt-4">
          <Card>
            <CardContent className="py-6">
              <Link href={`/student/courses/${id}/discussion`}>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discussion Room
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Link href={`/student/ai-tutor?course=${id}`}>
          <Button variant="secondary">
            <HelpCircle className="w-4 h-4 mr-2" />
            Ask AI Tutor
          </Button>
        </Link>
      </div>
    </div>
  );
}
