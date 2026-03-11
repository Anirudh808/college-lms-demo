"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { simulateAI } from "@/lib/ai-simulator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Send, Lightbulb, ListOrdered, BookOpen } from "lucide-react";

interface AITutorChatProps {
  lessonId?: string;
  courseId?: string;
  className?: string;
}

export function AITutorChat({ lessonId, courseId, className = "" }: AITutorChatProps) {
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
    <div className={`space-y-4 flex flex-col h-full ${className}`}>
      <div>
        <h2 className="text-xl font-bold">AI Tutor</h2>
        <p className="text-xs text-muted-foreground">
          {tutorRemaining} queries left. {canStepByStep && `${stepRemaining} step-by-step.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={mode === "explain" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() => setMode("explain")}
        >
          <BookOpen className="w-3 h-3 mr-1" /> Explain
        </Button>
        <Button 
          variant={mode === "hint" ? "default" : "outline"} 
          size="sm" 
          className="h-7 text-xs px-2"
          onClick={() => setMode("hint")}
        >
          <Lightbulb className="w-3 h-3 mr-1" /> Hint
        </Button>
        {canStepByStep ? (
          <Button
            variant={mode === "step_by_step" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setMode("step_by_step")}
          >
            <ListOrdered className="w-3 h-3 mr-1" /> Step
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => setLimitModal({ type: "locked", upgradeTo: "Premium" })}
          >
            <Lock className="w-3 h-3 mr-1" /> Step
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="citations"
          checked={showCitations}
          onChange={(e) => setShowCitations(e.target.checked)}
          className="h-3 w-3"
        />
        <Label htmlFor="citations" className="text-xs">Show citations</Label>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm">Chat</CardTitle>
          <CardDescription className="text-xs">Simulated responses</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground">Ask a question to get started.</p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                  {msg.role === "assistant" && showCitations && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-[10px] font-medium mb-1">References</p>
                      <ul className="text-[10px] space-y-1">
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

          <div className="flex gap-2 mt-auto">
            <Input
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="text-sm h-9"
            />
            <Button onClick={handleSend} disabled={loading} size="icon" className="h-9 w-9 shrink-0">
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
