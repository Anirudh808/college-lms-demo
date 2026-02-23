"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourse, getAssignment, getSubmissions } from "@/lib/data";
import { useSession } from "@/store/session";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";

export default function AssignmentSubmitPage() {
  const params = useParams();
  const courseId = params.id as string;
  const aid = params.aid as string;
  const { user } = useSession();
  const course = getCourse(courseId);
  const assignment = getAssignment(aid);
  const sub = user ? getSubmissions(aid, user.id)[0] : null;

  if (!course || !assignment) return <p>Not found</p>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Submitted!", description: "Assignment submitted (simulated)" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/student/courses/${courseId}/assignments`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </Link>

      <Card>
        <CardContent className="pt-6">
          <h1 className="text-xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">{assignment.description}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Due {format(new Date(assignment.dueDate), "MMM d, yyyy")} • {assignment.maxScore} pts
          </p>

          {sub?.submittedAt ? (
            <div className="mt-6 p-4 rounded-lg bg-muted">
              <p className="text-sm font-medium">Your submission</p>
              <pre className="mt-2 text-sm whitespace-pre-wrap">{sub.content || "File uploaded"}</pre>
              {sub.score != null && <p className="mt-2">Score: {sub.score}/{assignment.maxScore}</p>}
              {sub.feedback && <p className="mt-2 text-sm">{sub.feedback}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input placeholder="Paste your answer or upload file (simulated)" />
              <Button type="submit">Submit</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
