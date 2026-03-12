"use client";

import { useSession } from "@/store/session";
import { 
  getCourses, 
  getAssignments, 
  getSubmissions, 
  getAttendance, 
  getLiveClasses, 
  getUsers 
} from "@/lib/data";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Cell
} from "recharts";
import { 
  BookOpen, 
  FileCheck, 
  Users, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Clock,
  PlayCircle,
  MoreHorizontal
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FacultyDashboardPage() {
  const { user } = useSession();
  const allUsers = getUsers();
  
  // Data Fetching
  const courses = getCourses(user?.id);
  
  // Calculate unique students
  const uniqueStudents = new Set<string>();
  courses.forEach(c => {
    c.enrollment?.forEach(studentId => uniqueStudents.add(studentId));
  });

  const allAssignments = getAssignments().filter((a) =>
    courses.some((c) => c.id === a.courseId)
  );
  
  const submissions = getSubmissions().filter((s) =>
    allAssignments.some((a) => a.id === s.assignmentId)
  );
  
  const pendingGrading = submissions.filter((s) => s.score == null && s.submittedAt);

  const liveClasses = getLiveClasses().filter((lc) => 
    courses.some((c) => c.id === lc.courseId)
  );

  const upcomingClasses = liveClasses
    .filter(lc => !isPast(new Date(lc.scheduledAt)) || lc.status === "live")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  // Generate At-Risk Students Mock Data (in a real app, calculate from actual grades/attendance)
  const atRiskStudents = Array.from(uniqueStudents)
    .slice(0, 5)
    .map(studentId => {
      const student = allUsers.find(u => u.id === studentId);
      return {
        id: studentId,
        name: student?.name || "Unknown Student",
        email: student?.email || "",
        riskFactor: Math.floor(Math.random() * 3) + 1, // 1: Low, 2: Medium, 3: High
        reason: ["Low Attendance", "Failing Grades", "Missing Assignments"][Math.floor(Math.random() * 3)],
        courseId: courses[Math.floor(Math.random() * courses.length)]?.id,
      };
    })
    .sort((a, b) => b.riskFactor - a.riskFactor);


  // Engagement Data for Chart
  const engagementData = courses.map((c, index) => ({
    name: c.title.substring(0, 15) + (c.title.length > 15 ? '...' : ''),
    avgScore: Math.round(65 + Math.random() * 30), // Simulated average score
    attendance: Math.round(70 + Math.random() * 25), // Simulated attendance %
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  const getRiskBadgeColor = (factor: number) => {
    if (factor === 3) return "destructive";
    if (factor === 2) return "warning";
    return "secondary";
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Faculty Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Welcome back, Prof. {user?.name.split(" ")[0]}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/faculty/live-classes">
              <Calendar className="mr-2 h-4 w-4" /> View Schedule
            </Link>
          </Button>
          <Button asChild>
            <Link href="/faculty/assignments/new">
              <FileCheck className="mr-2 h-4 w-4" /> Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently teaching this semester
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueStudents.size}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all enrolled courses
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <AlertCircle className={`h-4 w-4 ${pendingGrading.length > 5 ? "text-destructive" : "text-amber-500"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGrading.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingGrading.length > 0 ? (
                <Link href="/faculty/grading" className="hover:underline text-primary">
                  Needs your attention
                </Link>
              ) : (
                "All caught up!"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(engagementData.reduce((acc, curr) => acc + curr.attendance, 0) / engagementData.length || 0)}%
            </div>
            <Progress 
              value={Math.round(engagementData.reduce((acc, curr) => acc + curr.attendance, 0) / engagementData.length || 0)} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Main Content - Left Col */}
        <div className="col-span-1 lg:col-span-4 space-y-4">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <div>
                  <CardTitle>Classes Overview</CardTitle>
                  <CardDescription>Performance and metrics for your current courses</CardDescription>
               </div>
               <Button variant="ghost" size="sm" asChild>
                 <Link href="/faculty/courses">View All</Link>
               </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Avg Score</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => {
                      const courseData = engagementData.find(d => d.name.includes(course.title.substring(0, 15)));
                      return (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            <Link href={`/faculty/courses/${course.id}`} className="hover:underline">
                              {course.title}
                            </Link>
                            <div className="text-xs text-muted-foreground">{course.program}</div>
                          </TableCell>
                          <TableCell>{course.enrollment?.length || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{courseData?.avgScore}%</span>
                              <Progress value={courseData?.avgScore} className="h-2 w-16" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {courses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No courses assigned currently.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Engagement Analytics</CardTitle>
              <CardDescription>Attendance vs Performance by Course</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}%`}
                    />
                    <RechartsTooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    />
                    <Bar dataKey="attendance" name="Attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar Widgets */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          
          {/* Action Center - At Risk */}
          <Card className="border-destructive/20 shadow-sm">
            <CardHeader className="bg-destructive/5 pb-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Needs Attention</CardTitle>
              </div>
              <CardDescription>Students identified as at-risk</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[240px]">
                <div className="p-4 space-y-4">
                  {atRiskStudents.length > 0 ? (
                    atRiskStudents.map((student) => {
                      const course = courses.find(c => c.id === student.courseId);
                      return (
                        <div key={student.id} className="flex items-start justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-9 w-9 border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {student.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">{student.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {course?.title.substring(0, 20)}...
                              </p>
                              <Badge variant={getRiskBadgeColor(student.riskFactor) as any} className="mt-2 text-[10px] h-4">
                                {student.reason}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs">
                            Message
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No at-risk students identified. Good job!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Pending Grading */}
          <Card>
            <CardHeader className="pb-3">
               <CardTitle className="text-lg flex items-center">
                 <FileCheck className="mr-2 h-5 w-5 text-amber-500" />
                 Pending Grading
               </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {pendingGrading.slice(0, 4).map(sub => {
                   const assignment = allAssignments.find(a => a.id === sub.assignmentId);
                   const student = allUsers.find(u => u.id === sub.studentId);
                   return (
                     <div key={sub.id} className="flex items-center justify-between group">
                       <div className="flex flex-col">
                         <span className="text-sm font-medium group-hover:underline cursor-pointer">
                           {assignment?.title}
                         </span>
                         <span className="text-xs text-muted-foreground">
                           Submitted by {student?.name.split(" ")[0]}
                         </span>
                       </div>
                       <Button variant="ghost" size="sm" asChild>
                         <Link href={`/faculty/grading/${sub.id}`}>Grade</Link>
                       </Button>
                     </div>
                   );
                 })}
                 
                 {pendingGrading.length === 0 && (
                   <div className="text-center text-sm text-muted-foreground py-4">
                     All assignments are graded!
                   </div>
                 )}
                 
                 {pendingGrading.length > 4 && (
                   <Button variant="link" className="w-full text-xs h-auto p-0 mt-2" asChild>
                     <Link href="/faculty/grading">View all {pendingGrading.length} pending items</Link>
                   </Button>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" />
                Upcoming Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {upcomingClasses.length > 0 ? (
                   upcomingClasses.map(lc => {
                     const course = courses.find(c => c.id === lc.courseId);
                     const isLive = lc.status === "live";
                     return (
                       <div key={lc.id} className="flex items-start space-x-4 border border-border p-3 rounded-lg bg-card">
                         <div className={`flex flex-col items-center justify-center min-w-[50px] rounded-md p-2 ${isLive ? 'bg-destructive/10 text-destructive' : 'bg-muted'}`}>
                           <span className="text-xs font-semibold">{format(new Date(lc.scheduledAt), "MMM")}</span>
                           <span className="text-lg font-bold leading-none mt-1">{format(new Date(lc.scheduledAt), "d")}</span>
                         </div>
                         <div className="flex-1 space-y-1">
                           <p className="text-sm font-semibold leading-none flex items-center">
                             {lc.title}
                             {isLive && <Badge variant="destructive" className="ml-2 h-4 text-[10px] px-1 uppercase tracking-wider animate-pulse">Live</Badge>}
                           </p>
                           <p className="text-xs text-muted-foreground">
                             {course?.title.substring(0, 25)}...
                           </p>
                           <div className="flex items-center text-xs text-muted-foreground mt-2">
                             <Clock className="mr-1 h-3 w-3" />
                             {format(new Date(lc.scheduledAt), "h:mm a")} • {lc.duration} mins
                           </div>
                         </div>
                         {isLive && (
                           <Button size="icon" variant="default" className="rounded-full shadow-md animate-in fade-in zoom-in h-8 w-8">
                             <PlayCircle className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                     );
                   })
                 ) : (
                   <div className="text-center text-sm text-muted-foreground py-4">
                     No upcoming classes scheduled.
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

