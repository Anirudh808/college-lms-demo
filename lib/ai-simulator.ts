import { AI_CREDIT_COSTS } from "./plans";
import { useSession } from "@/store/session";
import { getLesson } from "./data";
import type { LimitKey } from "./plans";

const FAKE_CITATIONS = [
  { id: "r1", title: "Course Material - Module 1", excerpt: "As discussed in the foundational concepts..." },
  { id: "r2", title: "Lecture Notes - Week 2", excerpt: "The key principle here is..." },
  { id: "r3", title: "Textbook Reference - Ch. 3", excerpt: "This aligns with the standard definition..." },
];

function extractKeyTerms(content: string, maxTerms = 5): string[] {
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const counts: Record<string, number> = {};
  words.forEach((w) => (counts[w] = (counts[w] || 0) + 1));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([w]) => w);
}

function generateExplainResponse(question: string, context?: string): string {
  const terms = context ? extractKeyTerms(context) : ["concept", "principle", "approach"];
  const termList = terms.join(", ");
  return `Based on your question about "${question.slice(0, 50)}...", here's an explanation:

The core idea revolves around ${termList}. In academic terms, we can break this down into several key components. First, consider the foundational principles that govern this domain. The ${terms[0] || "concept"} plays a central role in understanding the broader picture.

**Key Points:**
1. **Definition**: The standard approach defines this through measurable criteria.
2. **Application**: In practice, this manifests through specific patterns we observe.
3. **Connection**: This relates to other concepts you've learned in the course.

**Example**: A practical illustration would help solidify understanding. Imagine a scenario where these principles are applied—the outcomes typically follow predictable patterns based on the underlying theory.

**References**: See course materials for deeper exploration. The concepts discussed align with the syllabus content on this topic.`;
}

function generateHintResponse(question: string, context?: string): string {
  const terms = context ? extractKeyTerms(context) : ["step", "approach"];
  return `Here's a hint to guide you:

Think about the role of **${terms[0] || "structure"}** in this problem. Consider:
- What is the first step you might take?
- How does the given information constrain your solution?
- What pattern have you seen in similar problems?

I won't give away the full answer—try applying this direction and see how far you get. If you're still stuck, you can ask for a step-by-step solution (if your plan supports it).`;
}

function generateStepByStepResponse(question: string, context?: string): string {
  const terms = context ? extractKeyTerms(context) : ["step", "solution"];
  return `**Step-by-step solution:**

**Step 1: Identify the goal**
We need to find/analyze/determine ${question.slice(0, 40)}...

**Step 2: Gather relevant information**
From the problem context, we have key elements involving ${terms.join(", ")}. List what's given and what we need to find.

**Step 3: Choose an approach**
The most appropriate method here is [approach name]. This works because...

**Step 4: Execute the solution**
Apply the approach systematically. Show each sub-step with clear reasoning.

**Step 5: Verify**
Check that the solution satisfies the original constraints. Consider edge cases.

**Conclusion**: The final answer is [conclusion]. Review each step to ensure you understand the logic—this pattern applies to many similar problems.`;
}

export function getAICreditCost(action: string): number {
  return AI_CREDIT_COSTS[action] ?? 1;
}

export interface AISimulatorResult {
  success: boolean;
  response?: string;
  error?: "limit_reached" | "feature_locked" | "credits_exceeded";
  citations?: { id: string; title: string; excerpt: string }[];
}

export function simulateAI(
  mode: "explain" | "hint" | "step_by_step",
  question: string,
  lessonId?: string,
  featureKey?: LimitKey
): AISimulatorResult {
  const { user, plan, consumeCredits, getFeatureUsage, creditsUsedToday, creditsAllocatedDaily } = useSession.getState();
  if (!user) return { success: false, error: "limit_reached" };

  const action = mode === "step_by_step" ? "step_by_step" : "tutor";
  const credits = getAICreditCost(action);

  if (creditsUsedToday + credits > creditsAllocatedDaily) {
    return { success: false, error: "credits_exceeded" };
  }

  const { getPlanLimits } = require("./plans");
  const limits = getPlanLimits(user.role, plan);
  if (featureKey) {
    const config = limits[featureKey];
    if (config && !config.available) {
      return { success: false, error: "feature_locked" };
    }
    if (config && config.available && config.limit !== "unlimited") {
      const used = getFeatureUsage(featureKey, config.period);
      const limit = config.limit === "unlimited" ? 999 : config.limit;
      if (used >= limit) {
        return { success: false, error: "limit_reached" };
      }
    }
  }

  const consumed = consumeCredits(action, credits);
  if (!consumed) return { success: false, error: "credits_exceeded" };

  if (featureKey) {
    const config = limits[featureKey];
    if (config?.available) {
      useSession.getState().incrementFeatureUsage(featureKey, config.period);
    }
  } else if (mode === "explain" || mode === "hint") {
    useSession.getState().incrementFeatureUsage("tutor", "day");
  } else if (mode === "step_by_step") {
    useSession.getState().incrementFeatureUsage("step_by_step", "day");
  }

  const lesson = lessonId ? getLesson(lessonId) : null;
  const context = lesson?.content ?? "";

  let response: string;
  switch (mode) {
    case "explain":
      response = generateExplainResponse(question, context);
      break;
    case "hint":
      response = generateHintResponse(question, context);
      break;
    case "step_by_step":
      response = generateStepByStepResponse(question, context);
      break;
    default:
      response = generateExplainResponse(question, context);
  }

  const citations = lesson?.references ?? FAKE_CITATIONS;

  return {
    success: true,
    response,
    citations,
  };
}
