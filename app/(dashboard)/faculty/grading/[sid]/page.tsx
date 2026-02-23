"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getAssignment, getSubmissions, getUser } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function GradingSubmissionPage() {
  const params = useParams();
  const sid = params.sid as string;
  const submissions = getSubmissions();
  const sub = submissions.find((s) => s.id === sid);
  const assignment = sub ? getAssignment(sub.assignmentId) : null;
  const student = sub ? getUser(sub.studentId) : null;

  if (!sub || !assignment) return <p>Not found</p>;

  const handleGrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ title: "Graded!", description: "Submission graded (simulated)" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/faculty/grading">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <h1 className="text-xl font-bold">{assignment.title}</h1>
          <p className="text-sm text-muted-foreground">
            {student?.name} • Submitted {sub.submittedAt && format(new Date(sub.submittedAt), "MMM d, yyyy")}
          </p>

          <div className="mt-6 p-4 rounded-lg bg-muted">
            <p className="font-medium text-sm">Submission</p>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{sub.content || "File uploaded"}</pre>
          </div>

          <form onSubmit={handleGrade} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Score (0-{assignment.maxScore})</label>
              <Input type="number" min={0} max={assignment.maxScore} defaultValue={sub.score ?? ""} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Input placeholder="Optional feedback" defaultValue={sub.feedback ?? ""} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Submit Grade</Button>
              <Button type="button" variant="outline">
                AI Grading Assist (simulated)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
