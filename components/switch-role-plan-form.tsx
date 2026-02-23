"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { getUsers, getDepartments, getPrograms } from "@/lib/data";
import type { User, Plan } from "@/lib/types";
import { getPlanDisplayName } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SwitchRolePlanForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { switchRolePlan } = useSession();
  const [role, setRole] = useState<"student" | "faculty" | "hod" | "admin">("student");
  const [plan, setPlan] = useState<Plan>("basic");
  const [user, setUser] = useState<User | null>(null);

  const users = getUsers(role);
  const departments = getDepartments();
  const programs = getPrograms();

  useEffect(() => {
    setUser(users[0] ?? null);
  }, [role, users.length]);

  const handleSubmit = () => {
    if (!user) return;
    switchRolePlan(user, plan);
    onSuccess?.();
    router.push(`/${user.role}/dashboard`);
  };

  return (
    <div className="space-y-4 py-4">
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
        <Label>Plan</Label>
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
        <Label>User</Label>
        <Select value={user?.id ?? ""} onValueChange={(v) => setUser(users.find((u) => u.id === v) ?? null)}>
          <SelectTrigger>
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}{" "}
                {u.programId ? `(${programs.find((p) => p.id === u.programId)?.code ?? ""})` : ""}
                {u.departmentId ? ` - ${departments.find((d) => d.id === u.departmentId)?.name ?? ""}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={handleSubmit}>
        Switch
      </Button>
    </div>
  );
}
