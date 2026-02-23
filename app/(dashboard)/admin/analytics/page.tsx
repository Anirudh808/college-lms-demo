"use client";

import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminAnalyticsPage() {
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const dropoutPredictionAvailable = limits.dropout_prediction?.available ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Institutional Analytics</h1>
        <p className="text-muted-foreground">Dropout prediction, forecasting (Premium+)</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Dropout Prediction</h3>
            {dropoutPredictionAvailable ? (
              <span className="text-sm text-muted-foreground">Available</span>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upgrade to Premium for dropout prediction</p>
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
