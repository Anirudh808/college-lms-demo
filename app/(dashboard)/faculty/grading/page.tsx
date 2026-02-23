"use client";

import { useSession } from "@/store/session";
import { getCourses, getAssignments, getSubmissions } from "@/lib/data";
import { getPlanLimits } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function FacultyGradingPage() {
  const { user, plan } = useSession();
  const courses = getCourses(user?.id);
  const allAssignments = getAssignments().filter((a) =>
    courses.some((c) => c.id === a.courseId)
  );
  const submissions = getSubmissions().filter((s) =>
    allAssignments.some((a) => a.id === s.assignmentId)
  );
  const pendingGrading = submissions.filter((s) => s.score == null && s.submittedAt);

  const limits = user ? getPlanLimits(user.role, plan) : {};
  const gradingAssistAvailable = limits.grading_assist?.available ?? false;
  const usageByFeature = useSession((s) => s.usageByFeature);
  const currentDate = useSession((s) => s.currentDate);
  const monthKey = currentDate.slice(0, 7);
  const gradingUsed = usageByFeature.grading_assist?.month?.[monthKey] ?? 0;
  const gradingLimit = limits.grading_assist?.limit === "unlimited" ? 999 : (limits.grading_assist?.limit ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grading</h1>
        <p className="text-muted-foreground">
          Pending submissions to grade. AI grading assist: {gradingUsed}/{gradingLimit} used this month.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {pendingGrading.length === 0 ? (
            <p className="text-muted-foreground">No pending submissions to grade.</p>
          ) : (
            <div className="space-y-3">
              {pendingGrading.map((s) => {
                const assignment = allAssignments.find((a) => a.id === s.assignmentId);
                const course = courses.find((c) => c.id === assignment?.courseId);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{assignment?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {course?.code} • Submitted {s.submittedAt && format(new Date(s.submittedAt), "MMM d")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {gradingAssistAvailable && gradingUsed < gradingLimit ? (
                        <Button size="sm" asChild>
                          <Link href={`/faculty/grading/${s.id}`}>Grade (AI Assist)</Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Lock className="h-4 w-4 mr-1" /> Grade
                        </Button>
                      )}
                    </div>
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
