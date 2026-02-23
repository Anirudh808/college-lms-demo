"use client";

import { useSession } from "@/store/session";
import { getUsers, getCourses } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen } from "lucide-react";

export default function AdminDashboardPage() {
  const users = getUsers();
  const courses = getCourses();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Institution overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
