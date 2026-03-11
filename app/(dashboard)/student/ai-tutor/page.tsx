"use client";

import { useState } from "react";
import { useSession } from "@/store/session";
import { getCourses } from "@/lib/data";
import { AITutorChat } from "@/components/ai-tutor-chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Bot,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AITutorPage() {
  const { user } = useSession();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Fetch courses enrolled by this student
  const allCourses = user ? getCourses(undefined, undefined, user.id) : [];
  const courses = allCourses.filter(
    (c) =>
      query.trim() === "" ||
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.program?.toLowerCase().includes(query.toLowerCase())
  );

  const selectedCourse = allCourses.find((c) => c.id === selectedCourseId);

  // ─── Chat view ───────────────────────────────────────────────────────────
  if (selectedCourseId) {
    return (
      <div className="flex flex-col h-[calc(100vh-7rem)]">
        {/* Top bar */}
        <div className="flex items-center gap-3 pb-4 border-b mb-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedCourseId(null)}
            title="Back to course selection"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">
                AI Tutor
              </p>
              <p className="text-xs text-muted-foreground leading-tight truncate">
                Knowledgebase: {selectedCourse?.title ?? selectedCourseId}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto shrink-0 bg-primary/10 text-primary border-transparent text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            {selectedCourse?.program ?? "Course"}
          </Badge>
        </div>

        {/* Chat */}
        <div className="flex-1 min-h-0">
          <AITutorChat courseId={selectedCourseId} className="h-full" />
        </div>
      </div>
    );
  }

  // ─── Course-selection landing ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-6 px-2 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI Tutor</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Select a course to focus the AI Tutor's knowledgebase.
          You'll get answers grounded in that course's material.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search your courses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-10"
          autoFocus
        />
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {query ? "No courses match your search." : "You are not enrolled in any courses."}
        </div>
      ) : (
        <div className="space-y-2">
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(course.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border bg-card",
                "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                "transition-all duration-150 text-left group"
              )}
            >
              {/* Icon */}
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold leading-tight truncate">
                  {course.title}
                </p>
                <div className="flex items-center gap-2">
                  {course.program && (
                    <span className="text-xs text-muted-foreground font-medium">
                      {course.program}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
