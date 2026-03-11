"use client";

import { useSession } from "@/store/session";
import { getCourses, getAssignments, getAttendance, getAnnouncements } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  BookOpen, Calendar, Bot, ClipboardList, Megaphone, 
  TrendingUp, AlertTriangle, GraduationCap, Clock, 
  Activity, BookCheck, ShieldAlert, Sparkles, Target, Award, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock Data
const semesterOverview = {
  name: "Spring 2026",
  creditsCompleted: 45,
  creditsRequired: 120,
  currentSemesterCredits: 15,
  overallGpa: 3.8,
};

const performanceTrendData = [
  { week: "W1", score: 75 },
  { week: "W2", score: 78 },
  { week: "W3", score: 82 },
  { week: "W4", score: 80 },
  { week: "W5", score: 85 },
  { week: "W6", score: 88 },
  { week: "W7", score: 91 },
];

const academicHealth = {
  conceptMastery: 87, // %
  predictedGrade: "A-",
  dropoutRisk: "Low", // Low, Medium, High
  atRiskAlerts: [
    { id: 1, course: "Data Structures", issue: "Missed 2 consecutive assignments", severity: "warning" }
  ],
  improvementPlan: [
    "Review Graph Algorithms in Data Structures before next week's quiz.",
    "Attend TA office hours for Machine Learning on Thursday.",
    "Complete pending reading task for Software Engineering."
  ]
};

const examSchedule = [
  { id: 1, course: "Database Systems", type: "Midterm", date: "2026-03-15T10:00:00Z", location: "Room 302" },
  { id: 2, course: "Machine Learning", type: "Quiz 3", date: "2026-03-22T14:00:00Z", location: "Online (Proctored)" },
];

const recentGrades = [
  { id: 1, course: "Software Engineering", task: "Project Phase 1", grade: "92 / 100", date: "2026-02-28T00:00:00Z" },
  { id: 2, course: "Data Structures", task: "Assignment 4", grade: "78 / 100", date: "2026-02-25T00:00:00Z" },
];

export default function StudentDashboardPage() {
  const { user } = useSession();
  const courses = getCourses(undefined, undefined, user?.id);
  const allAssignments = getAssignments();
  const myAssignmentIds = courses.flatMap((c) =>
    allAssignments.filter((a) => a.courseId === c.id).map((a) => a.id)
  );
  const upcomingAssignments = allAssignments
    .filter((a) => myAssignmentIds.includes(a.id) && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);
  const attendance = getAttendance(undefined, user?.id);
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const announcements = getAnnouncements().slice(0, 3);

  const creditsProgress = Math.round((semesterOverview.creditsCompleted / semesterOverview.creditsRequired) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Academic Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Welcome back, {user?.name || "Student"}! Here&apos;s your {semesterOverview.name} overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
            GPA: {semesterOverview.overallGpa}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
            {semesterOverview.currentSemesterCredits} Credits This Term
          </Badge>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active this semester</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Degree Progress</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{semesterOverview.creditsCompleted} / {semesterOverview.creditsRequired}</div>
            <Progress value={creditsProgress} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{creditsProgress}% completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attPct}%</div>
            <Progress value={attPct} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {attPct >= 80 ? "On track" : "Needs attention"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
            <Button variant="link" className="p-0 h-auto mt-1" asChild>
              <Link href="/student/planner">View planner</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Academic Health Panel */}
      <h2 className="text-xl font-bold mt-8 mb-2">AI Academic Health</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Performance Chart */}
        <Card className="md:col-span-2 flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Performance Trend
                </CardTitle>
                <CardDescription>Your AI-calculated performance over the past weeks</CardDescription>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                Predicted Final: {academicHealth.predictedGrade}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Health Insights */}
        <Card className="flex flex-col border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 fill-primary text-primary" />
              Health Insights
            </CardTitle>
            <CardDescription>Driven by predictive analytics</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-5">
            {/* Mastery & Risk */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" /> Mastery
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{academicHealth.conceptMastery}%</span>
                </div>
                <Progress value={academicHealth.conceptMastery} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1 text-muted-foreground">
                  <ShieldAlert className="h-3 w-3" /> Risk Signal
                </p>
                <div>
                  <Badge variant={academicHealth.dropoutRisk === "Low" ? "default" : "destructive"} className={academicHealth.dropoutRisk === "Low" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20" : ""}>
                    {academicHealth.dropoutRisk} Risk
                  </Badge>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {academicHealth.atRiskAlerts.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-800 dark:text-red-400">
                <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Action Required
                </p>
                {academicHealth.atRiskAlerts.map(alert => (
                  <div key={alert.id} className="text-sm">
                    <strong>{alert.course}:</strong> {alert.issue}
                  </div>
                ))}
              </div>
            )}

            {/* AI Plan */}
            <div className="space-y-2">
              <p className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Improvement Plan
              </p>
              <ul className="space-y-2">
                {academicHealth.improvementPlan.map((plan, i) => (
                  <li key={i} className="text-xs flex gap-2 items-start bg-background/50 p-2 rounded-md border border-primary/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground leading-relaxed">{plan}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
             <Button className="w-full gap-2" variant="outline" asChild>
                <Link href="/student/ai-tutor">
                  <Bot className="h-4 w-4" /> Discuss with AI Tutor
                </Link>
             </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Detail Lists */}
      <h2 className="text-xl font-bold mt-8 mb-2">Overview</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        
        {/* Exams */}
        <Card className="xl:col-span-1 border-blue-500/20">
           <CardHeader className="pb-3 bg-blue-500/5 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <BookCheck className="h-4 w-4 text-blue-500" />
              Exam Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {examSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams.</p>
            ) : (
              <div className="space-y-4">
                {examSchedule.map((exam) => (
                  <div key={exam.id} className="border-l-2 border-blue-500 pl-3">
                    <p className="font-semibold text-sm">{exam.type}</p>
                    <p className="text-xs font-medium">{exam.course}</p>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(exam.date), "MMM d, h:mm a")}</span>
                      <span>{exam.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card className="xl:col-span-1 border-orange-500/20">
          <CardHeader className="pb-3 bg-orange-500/5 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-500" />
              Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-4">
                {upcomingAssignments.map((a) => {
                  const course = courses.find((c) => c.id === a.courseId);
                  return (
                    <div key={a.id} className="border-l-2 border-orange-500 pl-3">
                      <p className="font-semibold text-sm line-clamp-1" title={a.title}>{a.title}</p>
                      <p className="text-xs font-medium line-clamp-1">{course?.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Due {format(new Date(a.dueDate), "MMM d")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades */}
        <Card className="xl:col-span-1 border-green-500/20">
          <CardHeader className="pb-3 bg-green-500/5 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Recent Grades
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
             {recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent grades.</p>
            ) : (
              <div className="space-y-4">
                {recentGrades.map((grade) => (
                  <div key={grade.id} className="border-l-2 border-green-500 pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{grade.task}</p>
                        <p className="text-xs font-medium">{grade.course}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-none font-bold">
                        {grade.grade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Posted {format(new Date(grade.date), "MMM d")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card className="xl:col-span-1 border-purple-500/20">
          <CardHeader className="pb-3 bg-purple-500/5 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-purple-500" />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.id} className="border-l-2 border-purple-500 pl-3">
                     <p className="font-semibold text-sm line-clamp-1" title={a.title}>{a.title}</p>
                     <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.content}</p>
                     <p className="text-xs text-muted-foreground mt-1">
                       {format(new Date(a.createdAt), "MMM d")}
                     </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
