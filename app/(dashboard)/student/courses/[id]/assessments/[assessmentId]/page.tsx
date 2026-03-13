"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LocalStorageService } from "@/components/LocalStorageService";
import { AssignmentAttemptLayout } from "@/components/AssignmentAttemptLayout";
import { Assessment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AssessmentAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assessmentId = params.assessmentId as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    LocalStorageService.getAssessmentById(assessmentId).then(data => {
      if (data) setAssessment(data);
    });
  }, [assessmentId]);

  if (!assessment) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Assessment not found or loading...</p>
        <Button variant="outline" onClick={() => router.push(`/student/courses/${courseId}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <AssignmentAttemptLayout assessment={assessment} courseId={courseId} />
    </div>
  );
}
