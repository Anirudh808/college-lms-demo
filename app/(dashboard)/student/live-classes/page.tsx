"use client";

import { useSession } from "@/store/session";
import { getCourses, getLiveClasses } from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Video, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function StudentLiveClassesPage() {
  const { user } = useSession();
  const myCourses = getCourses(undefined, undefined, user?.id);
  const courseIds = myCourses.map((c) => c.id);
  const liveClasses = getLiveClasses().filter((lc) => courseIds.includes(lc.courseId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground">Upcoming and past live sessions</p>
      </div>

      <div className="space-y-4">
        {liveClasses.map((lc: any) => {
          const course = myCourses.find((c: any) => c.id === lc.courseId) as any;
          return (
            <Card key={lc.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold">{lc.title}</h3>
                  <p className="text-sm text-muted-foreground">{course?.program}</p>
                </div>
                <Badge variant={lc.status === "live" ? "default" : "secondary"}>{lc.status}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(lc.scheduledAt), "MMM d, yyyy 'at' HH:mm")}
                  </span>
                  <span>{lc.duration} min</span>
                </div>
                <Link href={`/student/live-classes/${lc.id}`}>
                  <Button className="mt-4">
                    <Video className="w-4 h-4 mr-2" />
                    {lc.status === "live" ? "Join Now" : "View / Join"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {liveClasses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No live classes scheduled for your courses.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
