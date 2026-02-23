"use client";

import { useSession } from "@/store/session";
import { getCourses, getAssignments, getQuizzes, getLiveClasses } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, FileText, HelpCircle, Video } from "lucide-react";

export default function StudentPlannerPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, undefined, user?.id);
  const courseIds = courses.map((c) => c.id);
  const assignments = getAssignments().filter((a) => courseIds.includes(a.courseId));
  const quizzes = getQuizzes().filter((q) => courseIds.includes(q.courseId));
  const liveClasses = getLiveClasses().filter((lc) => courseIds.includes(lc.courseId));

  const items: { id: string; title: string; type: string; date: Date; icon: typeof Calendar }[] = [
    ...assignments.map((a) => ({
      id: a.id,
      title: a.title,
      type: "Assignment",
      date: new Date(a.dueDate),
      icon: FileText,
    })),
    ...quizzes.map((q) => ({
      id: q.id,
      title: q.title,
      type: "Quiz",
      date: new Date(),
      icon: HelpCircle,
    })),
    ...liveClasses.map((lc) => ({
      id: lc.id,
      title: lc.title,
      type: "Live Class",
      date: new Date(lc.scheduledAt),
      icon: Video,
    })),
  ].filter((i) => i.date >= new Date());

  items.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planner</h1>
        <p className="text-muted-foreground">Your upcoming tasks and schedule</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming items</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(item.date, "EEEE, MMM d 'at' HH:mm")}
                      </p>
                    </div>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
