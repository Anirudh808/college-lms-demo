"use client";

import { useSession } from "@/store/session";
import { getAIUsage } from "@/lib/data";
import analyticsData from "@/data/analytics.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function AdminAIGovernancePage() {
  const { creditsExpiredTotal } = useSession();
  const usage = getAIUsage();
  const spikes = (analyticsData as { usageSpikes?: { date: string; credits: number }[] }).usageSpikes ?? [];

  const totalCreditsUsed = usage.reduce((a, u) => a + u.credits, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Governance Dashboard</h1>
        <p className="text-muted-foreground">Quotas, usage logs, expired credits</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total credits used</p>
            <p className="text-2xl font-bold">{totalCreditsUsed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Expired credits</p>
            <p className="text-2xl font-bold text-amber-600">{creditsExpiredTotal}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage spikes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spikes}>
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
          <CardTitle>Recent AI usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usage.slice(-15).reverse().map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span>User {u.userId} • {u.action}</span>
                <span>{u.credits} credits • {new Date(u.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
