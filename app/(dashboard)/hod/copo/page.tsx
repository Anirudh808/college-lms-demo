"use client";

import { useSession } from "@/store/session";
import { getCourses } from "@/lib/data";
import analyticsData from "@/data/analytics.json";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function HodCoPoPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, user?.departmentId);
  const coPoAttainment = (analyticsData as { coPoAttainment?: Record<string, Record<string, number>> }).coPoAttainment ?? {};

  const data = courses.flatMap((c) => {
    const co = coPoAttainment[c.id];
    if (!co) return [];
    return Object.entries(co).map(([coName, val]) => ({
      name: `${c.code} ${coName}`,
      value: val,
    }));
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CO/PO Attainment</h1>
        <p className="text-muted-foreground">Course outcome attainment by course</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.length ? data : [{ name: "N/A", value: 0 }]}>
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
