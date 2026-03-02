"use client";

import { useParams } from "next/navigation";
import { getCourse, getLessons } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  FileText, MessageSquare, ClipboardList, HelpCircle, 
  PlayCircle, Download, CheckCircle2, Circle, Clock, 
  Flame, Award, Target, BookOpen, AlertCircle, Bot
} from "lucide-react";

export default function StudentCourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const course = getCourse(id);
  
  if (!course) return <div className="p-6 text-center text-muted-foreground">Course not found</div>;

  // Mock data for Smart Learning & Course View enhancements
  const smartLearning = {
    timeSpent: "4h 30m week",
    streak: 5,
    lastPosition: {
      moduleId: course.modules[0]?.id,
      lessonId: course.modules[0]?.lessonIds?.[0],
      title: "Introduction to the Course"
    },
    milestone: "25% Completed"
  };

  const courseOutcomes = [
    "CO1: Understand the fundamental concepts and principles of the subject.",
    "CO2: Apply theoretical knowledge to solve practical problems.",
    "CO3: Analyze and evaluate complex scenarios using appropriate methodologies."
  ];

  // Mock progress states for lessons
  const getLessonState = (index: number, moduleIndex: number) => {
    // Just mock logic: first module mostly done, second module started, rest locked
    if (moduleIndex === 0) {
      if (index === 0) return "completed";
      if (index === 1) return "in-progress";
      return "not-started";
    }
    if (moduleIndex === 1) {
      return "locked"; // simulate prerequisites
    }
    return "not-started";
  };

  return (
    <div className="space-y-6">
      
      {/* Course Header & Smart Learning Banner */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start bg-secondary/20 p-6 rounded-xl border border-secondary">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-background">{course.code}</Badge>
            <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-none font-semibold">Self-Paced</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Master the core concepts and applications in this comprehensive course. Designed for practical skill building.
          </p>
          
          <div className="flex flex-wrap gap-4 mt-4">
             <div className="flex items-center gap-1 text-sm font-medium text-orange-500">
               <Flame className="h-4 w-4" /> {smartLearning.streak} Day Streak
             </div>
             <div className="flex items-center gap-1 text-sm font-medium text-blue-500">
               <Clock className="h-4 w-4" /> {smartLearning.timeSpent}
             </div>
             <div className="flex items-center gap-1 text-sm font-medium text-green-500">
               <Award className="h-4 w-4" /> {smartLearning.milestone}
             </div>
          </div>
        </div>
        
        {/* Resume Learning Card */}
        <Card className="w-full md:w-80 shadow-md border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-primary" /> Up Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold line-clamp-2">{smartLearning.lastPosition.title}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Resume exactly where you left off</p>
            <Button className="w-full" asChild>
               <Link href={`/student/courses/${id}/lessons/${smartLearning.lastPosition.lessonId}`}>
                 Resume Learning
               </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="modules" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="modules">Syllabus & Modules</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="mt-6">
              <div className="space-y-6">
                {course.modules
                  .sort((a, b) => a.order - b.order)
                  .map((m, mIdx) => {
                    const lessons = getLessons(m.id);
                    const isLocked = mIdx === 1; // Mock scenario: module 2 is locked

                    return (
                      <Card key={m.id} className={isLocked ? "opacity-75 bg-muted/30" : ""}>
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {m.title}
                            </CardTitle>
                            {isLocked && (
                                <p className="text-xs text-destructive mt-1 flex items-center gap-1 font-medium">
                                  <AlertCircle className="h-3 w-3" /> Prerequisite: Complete previous module first
                                </p>
                            )}
                          </div>
                          {!isLocked && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Progress</p>
                              <div className="w-24">
                                <Progress value={mIdx === 0 ? 33 : 0} className="h-1.5" />
                              </div>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {lessons
                              .sort((a, b) => a.order - b.order)
                              .map((l, lIdx) => {
                                const state = getLessonState(lIdx, mIdx);
                                const Icon = state === "completed" ? CheckCircle2 : (state === "in-progress" ? PlayCircle : Circle);
                                const iconColor = state === "completed" ? "text-green-500" : (state === "in-progress" ? "text-primary fill-primary/10" : "text-muted-foreground");

                                return (
                                  <Link key={l.id} href={isLocked ? "#" : `/student/courses/${id}/lessons/${l.id}`}
                                        className={isLocked ? "pointer-events-none" : ""}>
                                    <div className={`group flex items-center justify-between p-3 rounded-lg border border-transparent transition-colors ${state === 'in-progress' ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted'}`}>
                                      <div className="flex items-center gap-3">
                                        <Icon className={`h-5 w-5 ${iconColor}`} />
                                        <div>
                                          <span className={`font-medium text-sm ${state === 'in-progress' ? 'text-primary' : ''}`}>{l.title}</span>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> Video (10m)</span>
                                            <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Reading</span>
                                          </div>
                                        </div>
                                      </div>
                                      {state === "in-progress" && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Resume</Badge>}
                                    </div>
                                  </Link>
                                );
                              })}
                              
                            {/* Embedded Quiz Link Mock */}
                            {!isLocked && lessons.length > 0 && (
                               <Link href={`/student/courses/${id}/quizzes`}>
                                 <div className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:bg-muted mt-2 border-t border-dashed">
                                    <div className="flex items-center gap-3">
                                      <ClipboardList className="h-5 w-5 text-orange-500" />
                                      <span className="font-medium text-sm">Module Knowledge Check</span>
                                    </div>
                                    <Badge variant="outline">Quiz</Badge>
                                 </div>
                               </Link>
                            )}

                            {lessons.length === 0 && (
                              <p className="text-sm text-muted-foreground py-2 text-center">Lessons are being updated.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold">Course Assignments</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">View your upcoming and past assignments for this course.</p>
                  <Button asChild>
                    <Link href={`/student/courses/${id}/assignments`}>Go to Assignments</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6">
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                  <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                   <h3 className="text-lg font-semibold">Course Quizzes</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">Test your knowledge with chapter quizzes.</p>
                  <Button asChild>
                    <Link href={`/student/courses/${id}/quizzes`}>Go to Quizzes</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion" className="mt-6">
              <Card>
                <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                   <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                   <h3 className="text-lg font-semibold">Discussion Forum</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-4">Engage with your peers and instructors.</p>
                  <Button variant="outline" asChild>
                    <Link href={`/student/courses/${id}/discussion`}>Open Discussion Room</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Course Outcomes (CO)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {courseOutcomes.map((co, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2 items-start">
                    <span className="font-bold text-foreground bg-muted px-1.5 rounded text-xs mt-0.5">{co.split(':')[0]}</span>
                    <span>{co.split(':')[1]}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Course Resources
              </CardTitle>
              <CardDescription>Materials provided by the instructor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
               <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors cursor-pointer border">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded">
                     <FileText className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-sm font-medium leading-none">Complete Syllabus</p>
                     <p className="text-xs text-muted-foreground mt-1">PDF • 2.4 MB</p>
                   </div>
                 </div>
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Download className="h-4 w-4" /></Button>
               </div>
               
               <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors cursor-pointer border">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 text-blue-600 rounded">
                     <PlayCircle className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="text-sm font-medium leading-none">All Lecture Recordings</p>
                     <p className="text-xs text-muted-foreground mt-1">External Link</p>
                   </div>
                 </div>
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Download className="h-4 w-4" /></Button>
               </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex justify-between items-center">
                <span>AI Tutor Access</span>
                <Bot className="h-5 w-5 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Stuck on a concept? Our AI tutor is trained on this course material.
              </p>
              <Button className="w-full gap-2" variant="outline" asChild>
                <Link href={`/student/ai-tutor?course=${id}`}>
                  <HelpCircle className="h-4 w-4" /> Ask Course Question
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}


