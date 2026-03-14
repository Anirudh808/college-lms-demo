import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, Tenant, Role, Plan } from "@/lib/types";
import { getCreditsAllocatedDaily } from "@/lib/plans";
import { addAIUsage } from "@/lib/data";

export interface SessionState {
  tenant: Tenant | null;
  user: User | null;
  plan: Plan;
  isLoggedIn: boolean;
  currentDate: string; // YYYY-MM-DD for demo "Simulate Next Day"
  creditsAllocatedDaily: number;
  creditsUsedToday: number;
  creditsExpiredTotal: number;
  usageByFeature: Record<string, { day: Record<string, number>; week: Record<string, number>; month: Record<string, number> }>;
  login: (tenant: Tenant, user: User, plan: Plan) => void;
  logout: () => void;
  switchRolePlan: (user: User, plan: Plan) => void;
  simulateNextDay: () => void;
  consumeCredits: (action: string, credits: number) => boolean;
  incrementFeatureUsage: (feature: string, period: "day" | "week" | "month") => boolean;
  getFeatureUsage: (feature: string, period: "day" | "week" | "month") => number;
  canUseFeature: (feature: string, limit: number, period: "day" | "week" | "month") => boolean;
}

const getDateKey = (date: string, period: "day" | "week" | "month") => {
  const d = new Date(date);
  if (period === "day") return date;
  if (period === "week") {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return start.toISOString().slice(0, 10);
  }
  return date.slice(0, 7); // YYYY-MM
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      tenant: null,
      user: null,
      plan: "basic",
      isLoggedIn: false,
      currentDate: new Date().toISOString().slice(0, 10),
      creditsAllocatedDaily: 0,
      creditsUsedToday: 0,
      creditsExpiredTotal: 0,
      usageByFeature: {},

  login: (tenant, user, plan) => {
    const credits = getCreditsAllocatedDaily(user.role, plan);
    set({
      tenant,
      user,
      plan: user.planOverride || plan,
      isLoggedIn: true,
      creditsAllocatedDaily: credits,
      creditsUsedToday: 0,
      creditsExpiredTotal: 0,
      usageByFeature: {},
    });
  },

  logout: () => {
    set({
      tenant: null,
      user: null,
      plan: "basic",
      isLoggedIn: false,
      creditsUsedToday: 0,
    });
  },

  switchRolePlan: (user, plan) => {
    const credits = getCreditsAllocatedDaily(user.role, plan);
    set({
      user,
      plan: user.planOverride || plan,
      creditsAllocatedDaily: credits,
      creditsUsedToday: 0,
      usageByFeature: {},
    });
  },

  simulateNextDay: () => {
    const { creditsAllocatedDaily, creditsUsedToday, creditsExpiredTotal, user } = get();
    const newExpired = creditsAllocatedDaily - creditsUsedToday;
    const newExpiredTotal = newExpired > 0 ? creditsExpiredTotal + newExpired : creditsExpiredTotal;
    const nextDate = new Date(get().currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    set({
      currentDate: nextDate.toISOString().slice(0, 10),
      creditsUsedToday: 0,
      creditsExpiredTotal: newExpiredTotal,
      usageByFeature: {},
    });
  },

  consumeCredits: (action, credits) => {
    const { creditsUsedToday, creditsAllocatedDaily, user } = get();
    if (creditsUsedToday + credits > creditsAllocatedDaily) return false;
    if (user) {
      addAIUsage({
        id: `ai-${Date.now()}`,
        userId: user.id,
        action,
        credits,
        timestamp: new Date().toISOString(),
      });
    }
    set({ creditsUsedToday: creditsUsedToday + credits });
    return true;
  },

  incrementFeatureUsage: (feature, period) => {
    const { usageByFeature, user } = get();
    const key = getDateKey(get().currentDate, period);
    const feat = usageByFeature[feature] || { day: {}, week: {}, month: {} };
    const p = feat[period] || {};
    const count = (p[key] || 0) + 1;
    set({
      usageByFeature: {
        ...usageByFeature,
        [feature]: {
          ...feat,
          [period]: { ...p, [key]: count },
        },
      },
    });
    return true;
  },

  getFeatureUsage: (feature, period) => {
    const { usageByFeature } = get();
    const key = getDateKey(get().currentDate, period);
    const feat = usageByFeature[feature];
    if (!feat) return 0;
    return feat[period]?.[key] || 0;
  },

  canUseFeature: (feature, limit, period) => {
    if (limit === 0 || limit === 999) return limit > 0;
    const used = get().getFeatureUsage(feature, period);
    return used < limit;
  },
}),
    {
      name: "axon-lms-session",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

