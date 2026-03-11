"use client";

import { useSession } from "@/store/session";
import { getCourses, getDepartment } from "@/lib/data";
import analyticsData from "@/data/analytics.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function HodDashboardPage() {
  const { user } = useSession();
  const dept = user?.departmentId ? getDepartment(user.departmentId) : null;
  const courses = getCourses(undefined, user?.departmentId);
  const passRates = (analyticsData as { passRates?: Record<string, number> }).passRates ?? {};

  const passRateData = courses.map((c) => ({
    name: c.title.substring(0, 10) + (c.title.length > 10 ? "..." : ""),
    value: passRates[c.id] ?? Math.round(70 + Math.random() * 20),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HoD Dashboard</h1>
        <p className="text-muted-foreground">{dept?.name ?? "Department"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(courses.map((c) => c.faculty)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passRateData.length > 0
                ? Math.round(passRateData.reduce((a, b) => a + b.value, 0) / passRateData.length)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pass Rate by Course</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passRateData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
