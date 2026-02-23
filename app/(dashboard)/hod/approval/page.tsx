"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HodApprovalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course Approval Queue</h1>
        <p className="text-muted-foreground">Content publishing workflow</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No items in approval queue. Content submitted by faculty will appear here.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" disabled>Approve</Button>
            <Button variant="outline" disabled>Reject</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
