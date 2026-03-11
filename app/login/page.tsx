"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { getTenants, getUsers, getDepartments } from "@/lib/data";
import type { Tenant, User, Plan } from "@/lib/types";
import { getPlanDisplayName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useSession();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [plan, setPlan] = useState<Plan>("basic");
  const [role, setRole] = useState<"student" | "faculty" | "hod" | "admin">("student");
  const [user, setUser] = useState<User | null>(null);

  const tenants = getTenants();
  const departments = getDepartments();
  const usersByRole = getUsers(role);

  useEffect(() => {
    setTenant(tenants[0] ?? null);
  }, [tenants.length]);

  useEffect(() => {
    setUser(usersByRole[0] ?? null);
  }, [role, usersByRole.length]);

  const handleLogin = () => {
    if (!tenant || !user) return;
    login(tenant, user, plan);
    router.push(`/${user.role}/dashboard`);
  };

  if (isLoggedIn) {
    router.replace("/");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">AXON LMS</CardTitle>
          <CardDescription>AI-Powered College Learning Platform</CardDescription>
          <p className="text-xs text-muted-foreground">Demo Mode – Select your role and plan</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>College Tenant</Label>
            <Select value={tenant?.id ?? ""} onValueChange={(v) => setTenant(tenants.find((t) => t.id === v) ?? null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">{getPlanDisplayName("basic")}</SelectItem>
                <SelectItem value="premium">{getPlanDisplayName("premium")}</SelectItem>
                <SelectItem value="premium_plus">{getPlanDisplayName("premium_plus")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="hod">HoD</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>User</Label>
            <Select value={user?.id ?? ""} onValueChange={(v) => setUser(usersByRole.find((u) => u.id === v) ?? null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {usersByRole.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.departmentId ? ` — ${departments.find((d) => d.id === u.departmentId)?.name ?? ""}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" size="lg" onClick={handleLogin}>
            Enter Demo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
