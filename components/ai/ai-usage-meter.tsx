"use client";

import { useSession } from "@/store/session";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap } from "lucide-react";

export function AIUsageMeter() {
  const { creditsUsedToday, creditsAllocatedDaily, creditsExpiredTotal } = useSession();
  const pct = creditsAllocatedDaily > 0 ? Math.min(100, (creditsUsedToday / creditsAllocatedDaily) * 100) : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 min-w-[120px] cursor-help">
            <Zap className="w-4 h-4 text-amber-500" />
            <div className="flex-1">
              <Progress value={pct} className="h-2" />
            </div>
            <span className="text-xs font-medium tabular-nums">
              {creditsUsedToday}/{creditsAllocatedDaily}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>AI credits: {creditsUsedToday} used / {creditsAllocatedDaily} daily</p>
          {creditsExpiredTotal > 0 && <p className="text-amber-600">Expired: {creditsExpiredTotal}</p>}
          <p className="text-muted-foreground text-xs">Resets at midnight</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
