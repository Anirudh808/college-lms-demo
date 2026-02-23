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

export default function HodCurriculumPage() {
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const gapAnalysisAvailable = limits.curriculum_gap_analysis?.available ?? false;
  const gapLimit = limits.curriculum_gap_analysis?.limit ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Curriculum Intelligence</h1>
        <p className="text-muted-foreground">Gap analysis, industry mapping (Premium+)</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Curriculum Gap Analysis</h3>
            {gapAnalysisAvailable ? (
              <Button disabled>Run Analysis (simulated) - {gapLimit}/month</Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" disabled>
                      <Lock className="h-4 w-4 mr-1" /> Upgrade to access
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Curriculum gap analysis requires Basic plan (5/month)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
