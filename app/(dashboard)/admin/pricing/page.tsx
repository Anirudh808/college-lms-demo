"use client";

import { BASE_PLATFORM_FEE, getPlanDisplayName } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminPricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing & Plans</h1>
        <p className="text-muted-foreground">Base platform fee and plan differences</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold">Base Platform Fee</h3>
          <p className="text-2xl font-bold mt-2">₹{BASE_PLATFORM_FEE} <span className="text-sm font-normal text-muted-foreground">per user/year</span></p>
          <p className="text-sm text-muted-foreground mt-2">
            All tiers include this base fee. AI allowances and feature gating vary by plan.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {(["basic", "premium", "premium_plus"] as const).map((plan) => (
          <Card key={plan}>
            <CardContent className="pt-6">
              <Badge className="mb-2">{getPlanDisplayName(plan)}</Badge>
              <h3 className="font-semibold">{getPlanDisplayName(plan)}</h3>
              <ul className="text-sm text-muted-foreground mt-4 space-y-1">
                {plan === "basic" && (
                  <>
                    <li>• Student: 20 tutor/day, 1 summary, 1 flashcard, limited</li>
                    <li>• Faculty: 50 grading assist/month, 5 question sets</li>
                    <li>• HoD: 5 gap analyses/month</li>
                  </>
                )}
                {plan === "premium" && (
                  <>
                    <li>• Student: 50 tutor/day, step-by-step, code debug</li>
                    <li>• Faculty: 200 grading assist/month, teaching copilot</li>
                    <li>• HoD: Predictive cohort, accreditation</li>
                  </>
                )}
                {plan === "premium_plus" && (	
                  <>
                    <li>• Student: 60 tutor/day, full features</li>
                    <li>• Faculty: 400 grading, bias detection</li>
                    <li>• HoD: Industry skill mapping</li>
                    <li>• Admin: NAAC readiness, health score</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
