"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STEPS = [
  { title: "Welcome", text: "This is the AI-Powered College LMS demo. Use it to showcase features to investors and clients." },
  { title: "Login", text: "On the login screen, select Tenant, Plan, Role, and User. Try different combinations to see plan gating." },
  { title: "Dashboard", text: "Each role has a custom dashboard. Students see courses and deadlines; Faculty see grading; HoD and Admin have their own views." },
  { title: "AI Tutor", text: "Students can use Explain, Hint, or Step-by-step modes. Step-by-step is gated on Premium+. Limits reset with Simulate Next Day." },
  { title: "AI Credits", text: "The top bar shows AI credit usage. Each action consumes credits. Unused credits expire and show in Admin's AI Governance dashboard." },
  { title: "Feature Gating", text: "Locked features show upgrade prompts. Try Basic plan for students to see step-by-step locked." },
  { title: "Switch Role/Plan", text: "Click your avatar → Switch Role/Plan to change context without logging out. Great for demos!" },
  { title: "Pricing", text: "Admin → Pricing & Plans shows base fee ₹1200/user/year and plan differences." },
];

export function DemoTour({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo Tour — Step {step + 1} of {STEPS.length}</DialogTitle>
          <DialogDescription>{current.text}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-between mt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Previous
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
