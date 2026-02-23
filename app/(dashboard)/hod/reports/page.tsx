"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function HodReportsPage() {
  const handleExport = () => {
    toast({ title: "Export started", description: "PDF export simulated" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports Export Center</h1>
        <p className="text-muted-foreground">Export department reports as PDF</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Department Summary Report</h3>
              <p className="text-sm text-muted-foreground">Courses, faculty, pass rates</p>
            </div>
            <Button onClick={handleExport}>Export PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
