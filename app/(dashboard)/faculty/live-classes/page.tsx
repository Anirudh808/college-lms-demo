"use client";

import { useSession } from "@/store/session";
import { getCourses, getLiveClasses } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Video } from "lucide-react";
import { format } from "date-fns";

export default function FacultyLiveClassesPage() {
  const { user } = useSession();
  const courses = getCourses(user?.id);
  const liveClasses = getLiveClasses().filter((lc) =>
    courses.some((c) => c.id === lc.courseId)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Classes</h1>
        <p className="text-muted-foreground">Schedule and host live sessions</p>
      </div>

      <Button disabled>Schedule new session (simulated)</Button>

      <div className="space-y-4">
        {liveClasses.map((lc) => {
          const course = courses.find((c) => c.id === lc.courseId);
          return (
            <Card key={lc.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{lc.title}</h3>
                    <p className="text-sm text-muted-foreground">{course?.code}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(lc.scheduledAt), "MMM d, yyyy HH:mm")} • {lc.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{lc.status}</Badge>
                    <Button asChild>
                      <Link href={`/faculty/live-classes/${lc.id}`}>Host / Join</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
