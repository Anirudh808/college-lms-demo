"use client";

import { getUsers, getDepartment, getProgram } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const users = getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">RBAC overview, bulk import (simulated)</p>
      </div>

      <Button disabled>Bulk Import (simulated)</Button>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {users.map((u) => {
              const dept = getDepartment(u.departmentId || "");
              const prog = u.programs?.length ? getProgram(u.programs[0]) : null;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.email} • {dept?.name ?? ""} {prog ? `• ${prog.code}` : ""}
                    </p>
                  </div>
                  <Badge className="capitalize">{u.role}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
