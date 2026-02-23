"use client";

import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { getCourses } from "@/lib/data";
import analyticsData from "@/data/analytics.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FacultyAnalyticsPage() {
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const atRiskAvailable = limits.faculty_ai_analytics?.available ?? false;
  const courses = getCourses(user?.id);

  const atRiskStudents = (analyticsData as { atRiskStudents?: string[] }).atRiskStudents ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Course and student insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(analyticsData as { usageSpikes?: { date: string; credits: number }[] }).usageSpikes ?? []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Line type="monotone" dataKey="credits" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>At-Risk Students (Premium+)</CardTitle>
            {!atRiskAvailable && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Premium+ for at-risk student insights</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {atRiskAvailable ? (
            <div className="space-y-2">
              {atRiskStudents.length === 0 ? (
                <p className="text-muted-foreground">No at-risk students identified.</p>
              ) : (
                atRiskStudents.map((id) => <div key={id}>Student {id} — Low engagement, consider intervention</div>)
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Upgrade to Premium Plus to see at-risk student list.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
