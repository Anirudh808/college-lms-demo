"use client";

import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FacultyQuestionBankPage() {
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const questionSetsAvailable = limits.question_sets?.available ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-muted-foreground">
          Tagged questions, AI-generated questions. Limit: {limits.question_sets?.limit ?? 0}/month
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AI Question Generator</h3>
            {questionSetsAvailable ? (
              <Button disabled>Generate Questions (simulated)</Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled>
                      <Lock className="h-4 w-4 mr-1" /> Upgrade to Premium
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This feature is available in Premium plan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Generate questions from course content. Tag by topic, difficulty, and bloom level.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No questions in bank yet. Add or generate to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
}
