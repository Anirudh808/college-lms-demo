import { getPlanLimits, type LimitKey } from "./plans";
import type { Role, Plan } from "./types";
import { useSession } from "@/store/session";

export function useCanAccessFeature(feature: LimitKey): {
  canAccess: boolean;
  limit: number | "unlimited";
  used: number;
  period: "day" | "week" | "month";
  upgradeTo?: Plan;
} {
  const { user, plan } = useSession();
  if (!user) return { canAccess: false, limit: 0, used: 0, period: "day" };

  const limits = getPlanLimits(user.role, plan);
  const config = limits[feature];

  if (!config) return { canAccess: true, limit: "unlimited", used: 0, period: "day" };

  if (!config.available) {
    const upgradeTo: Plan = plan === "basic" ? "premium" : "premium_plus";
    return { canAccess: false, limit: 0, used: 0, period: "day", upgradeTo };
  }

  const used = useSession.getState().getFeatureUsage(feature, config.period);
  const limit = config.limit === "unlimited" ? 999 : config.limit;
  const canAccess = used < limit;

  return {
    canAccess,
    limit: config.limit,
    used,
    period: config.period,
  };
}
