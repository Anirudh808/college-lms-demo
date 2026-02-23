"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { getLesson } from "@/lib/data";
import { simulateAI } from "@/lib/ai-simulator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Send, Lightbulb, ListOrdered, BookOpen } from "lucide-react";

export default function AITutorPage() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson") ?? undefined;
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"explain" | "hint" | "step_by_step">("explain");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; citations?: { id: string; title: string; excerpt: string }[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitModal, setLimitModal] = useState<{ type: "limit" | "locked"; upgradeTo?: string } | null>(null);
  const [showCitations, setShowCitations] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tutorLimit = limits.tutor;
  const stepLimit = limits.step_by_step;
  const canStepByStep = stepLimit?.available ?? false;
  const usageByFeature = useSession((s) => s.usageByFeature);
  const currentDate = useSession((s) => s.currentDate);
  const tutorUsed = usageByFeature.tutor?.day?.[currentDate] ?? 0;
  const stepUsed = usageByFeature.step_by_step?.day?.[currentDate] ?? 0;
  const tutorRemaining = tutorLimit?.limit && tutorLimit.limit !== "unlimited" ? Math.max(0, tutorLimit.limit - tutorUsed) : 999;
  const stepRemaining = stepLimit?.limit && stepLimit.limit !== "unlimited" ? Math.max(0, stepLimit.limit - stepUsed) : 0;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!question.trim() || loading) return;

    if (mode === "step_by_step" && !canStepByStep) {
      setLimitModal({ type: "locked", upgradeTo: "Premium" });
      return;
    }

    if (mode === "step_by_step" && stepRemaining <= 0) {
      setLimitModal({ type: "limit" });
      return;
    }

    if (tutorRemaining <= 0 && mode !== "step_by_step") {
      setLimitModal({ type: "limit" });
      return;
    }

    setMessages((m) => [...m, { role: "user", content: question }]);
    setQuestion("");
    setLoading(true);

    const featureKey = mode === "step_by_step" ? "step_by_step" : "tutor";
    const result = simulateAI(mode, question, lessonId, featureKey);

    setLoading(false);

    if (!result.success) {
      if (result.error === "feature_locked") setLimitModal({ type: "locked", upgradeTo: "Premium" });
      else if (result.error === "limit_reached" || result.error === "credits_exceeded") setLimitModal({ type: "limit" });
      setMessages((m) => m.slice(0, -1));
      return;
    }

    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: result.response ?? "",
        citations: result.citations,
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Tutor</h1>
        <p className="text-muted-foreground">
          Get help with your course material. Tutor: {tutorRemaining} left today.
          {canStepByStep && ` Step-by-step: ${stepRemaining} left.`}
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <Label className="text-sm">Mode:</Label>
        <Button
          variant={mode === "explain" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("explain")}
        >
          <BookOpen className="w-4 h-4 mr-1" /> Explain
        </Button>
        <Button variant={mode === "hint" ? "default" : "outline"} size="sm" onClick={() => setMode("hint")}>
          <Lightbulb className="w-4 h-4 mr-1" /> Hint only
        </Button>
        {canStepByStep ? (
          <Button
            variant={mode === "step_by_step" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("step_by_step")}
          >
            <ListOrdered className="w-4 h-4 mr-1" /> Step-by-step
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimitModal({ type: "locked", upgradeTo: "Premium" })}
          >
            <Lock className="w-4 h-4 mr-1" /> Step-by-step
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="citations"
          checked={showCitations}
          onChange={(e) => setShowCitations(e.target.checked)}
        />
        <Label htmlFor="citations">Show citations from course material</Label>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
          <CardDescription>
            Ask a question. Responses are simulated for demo—no real AI calls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask a question to get started.</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.role === "assistant" && showCitations && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs font-medium mb-1">References</p>
                      <ul className="text-xs space-y-1">
                        {msg.citations.map((c) => (
                          <li key={c.id}>
                            {c.title}: {c.excerpt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend} disabled={loading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!limitModal} onOpenChange={() => setLimitModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {limitModal?.type === "locked" ? "Feature locked" : "Limit reached"}
            </DialogTitle>
            <DialogDescription>
              {limitModal?.type === "locked"
                ? `This feature is available in ${limitModal.upgradeTo ?? "Premium"}.`
                : "You've reached your daily limit. Try again tomorrow or upgrade your plan."}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setLimitModal(null)}>OK</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
