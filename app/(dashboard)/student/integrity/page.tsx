"use client";

import { useSession } from "@/store/session";
import { getAIUsage } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, History } from "lucide-react";
import { format } from "date-fns";

export default function StudentIntegrityPage() {
  const { user } = useSession();
  const myUsage = user ? getAIUsage(user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrity</h1>
        <p className="text-muted-foreground">Plagiarism previews and AI usage log</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Plagiarism Previews
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              View your plagiarism check history. Limited by plan.
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No plagiarism checks run yet. Use &quot;Plagiarism Preview&quot; when submitting
              assignments (if available on your plan).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              AI Usage Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI actions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {myUsage.slice(-10).reverse().map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <span>{u.action}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{u.credits} credits</Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(u.timestamp), "MMM d HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
