"use client";

import { useSession } from "@/store/session";
import { getPlanLimits } from "@/lib/plans";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Question } from "@/lib/types";
import { 
  Lock, BookOpen, BrainCircuit, FileSignature, 
  Search, Plus, Download, Upload, Loader2, Sparkles, Filter 
} from "lucide-react";
import { getCourses } from "@/lib/data";

export default function FacultyQuestionBankPage() {
  const { user, plan } = useSession();
  const limits = user ? getPlanLimits(user.role, plan) : {};
  const questionSetsAvailable = limits.question_sets?.available ?? false;

  const [questions, setQuestions] = useState<Question[]>([]);
  const courses = getCourses(user?.id);

  // Library State
  const [searchQ, setSearchQ] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterBloom, setFilterBloom] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Builder State
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderType, setBuilderType] = useState("quiz");
  const [builderTime, setBuilderTime] = useState("");
  const [builderRandomize, setBuilderRandomize] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isSelectQuestionsOpen, setSelectQuestionsOpen] = useState(false);

  // AI Generator State
  const [aiNotes, setAiNotes] = useState("");
  const [aiTargetCourse, setAiTargetCourse] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState<Question[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    const q = await LocalStorageService.getQuestions();
    setQuestions(q);
  };

  // Derived filter list
  const filteredQuestions = questions.filter(q => {
    const matchContent = q.content.toLowerCase().includes(searchQ.toLowerCase()) || q.tags.topic.toLowerCase().includes(searchQ.toLowerCase());
    const matchDiff = filterDifficulty === "all" || q.tags.difficulty === filterDifficulty;
    const matchBloom = filterBloom === "all" || q.tags.bloomLevel === filterBloom;
    const matchType = filterType === "all" || q.type === filterType;
    return matchContent && matchDiff && matchBloom && matchType;
  });

  const handleGenerateAI = () => {
    if (!aiNotes || !aiTargetCourse) return;
    setAiIsLoading(true);
    // Simulate AI generation delay
    setTimeout(() => {
      const newGen: Question[] = [];
      const c = parseInt(aiCount) || 5;
      for (let i = 0; i < c; i++) {
        newGen.push({
          id: `ai-gen-${Date.now()}-${i}`,
          courseId: aiTargetCourse,
          type: "mcq",
          content: `Generated Question ${i + 1} based on provided notes regarding "${aiNotes.substring(0, 20)}..."`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          marks: 2,
          negativeMarks: 0,
          tags: {
            co: "CO1",
            bloomLevel: "Applying",
            difficulty: "medium",
            topic: "Auto-generated Topic"
          }
        });
      }
      setAiGenerated(newGen);
      setAiIsLoading(false);
    }, 2500);
  };

  const saveAiQuestionsToBank = async () => {
    await LocalStorageService.saveQuestionsBulk(aiGenerated);
    setAiGenerated([]);
    fetchQuestions();
  };

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(q => q !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const selectedQuestionsObjects = questions.filter(q => selectedQuestionIds.includes(q.id));
  const totalSelectedMarks = selectedQuestionsObjects.reduce((acc, q) => acc + q.marks, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Question Bank & Assessment Builder
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage cross-semester question repositories and construct tailored assessments.
        </p>
      </div>

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="library" className="flex gap-2"><BookOpen className="h-4 w-4" /> Question Library</TabsTrigger>
          <TabsTrigger value="builder" className="flex gap-2"><FileSignature className="h-4 w-4" /> Assessment Builder</TabsTrigger>
          <TabsTrigger value="ai-generator" className="flex gap-2"><BrainCircuit className="h-4 w-4" /> AI Question Generator</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: QUESTION LIBRARY ─── */}
        <TabsContent value="library">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Central Question Repository</CardTitle>
                <CardDescription>View, tag, and filter all available questions across courses.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Bulk Import</Button>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
                <Button><Plus className="h-4 w-4 mr-2"/> Default Question</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search questions or topics..." className="pl-9" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="mcq">MCQ</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="long_answer">Long Answer</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="case_analysis">Case Analysis</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterBloom} onValueChange={setFilterBloom}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Bloom's Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Remembering">Remembering</SelectItem>
                    <SelectItem value="Understanding">Understanding</SelectItem>
                    <SelectItem value="Applying">Applying</SelectItem>
                    <SelectItem value="Analyzing">Analyzing</SelectItem>
                    <SelectItem value="Evaluate">Evaluate</SelectItem>
                    <SelectItem value="Create">Create</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Question Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No questions match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium line-clamp-2" title={q.content}>{q.content}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase text-xs">{q.type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant="secondary" className="text-[10px]">{q.tags.co}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{q.tags.bloomLevel}</Badge>
                              <Badge variant={q.tags.difficulty === "hard" ? "destructive" : q.tags.difficulty === "medium" ? "default" : "secondary"} className="text-[10px] capitalize">
                                {q.tags.difficulty}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{q.marks}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ASSESSMENT BUILDER ─── */}
        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-primary/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /> Configuration</CardTitle>
                <CardDescription>Set the global parameters for your test.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assessment Title</Label>
                  <Input placeholder="e.g. Midterm Physics Exam" value={builderTitle} onChange={(e) => setBuilderTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Assessment Type</Label>
                  <Select value={builderType} onValueChange={setBuilderType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Restrictions (minutes)</Label>
                  <Input type="number" placeholder="60" value={builderTime} onChange={(e) => setBuilderTime(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="randomize" checked={builderRandomize} onCheckedChange={(val: any) => setBuilderRandomize(!!val)} />
                  <Label htmlFor="randomize" className="text-sm font-normal">Randomize question order for students</Label>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Selected Questions</CardTitle>
                  <CardDescription>Construct your exam utilizing the repository.</CardDescription>
                </div>
                {/* Modal to select questions */}
                <Dialog open={isSelectQuestionsOpen} onOpenChange={setSelectQuestionsOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" /> Add from Library</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Select Questions from Bank</DialogTitle>
                    </DialogHeader>
                    <div className="border rounded-md mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Content</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Marks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {questions.map((q) => (
                            <TableRow key={q.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedQuestionIds.includes(q.id)}
                                  onCheckedChange={() => toggleQuestionSelection(q.id)}
                                />
                              </TableCell>
                              <TableCell className="max-w-sm font-medium">{q.content}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-[10px]">{q.tags.bloomLevel}</Badge>
                                  <Badge variant="outline" className="text-[10px]">{q.tags.difficulty}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>{q.marks}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-primary/20 mb-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm">Total Questions: <span className="font-bold text-primary">{selectedQuestionIds.length}</span></p>
                    <p className="text-sm">Total Marks / Weightage: <span className="font-bold text-primary">{totalSelectedMarks}</span></p>
                  </div>
                  <Button variant="outline" size="sm" disabled={selectedQuestionIds.length === 0}>Save Assessment Draft</Button>
                </div>

                <div className="space-y-3">
                  {selectedQuestionsObjects.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                      No questions assigned yet. Click "Add from Library" to begin.
                    </div>
                  ) : (
                    selectedQuestionsObjects.map((q, idx) => (
                      <div key={q.id} className="p-4 border shadow-sm rounded-lg flex items-start gap-3">
                        <div className="mt-1 w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{idx+1}</div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{q.content}</p>
                          <div className="flex gap-2 mt-2">
                             <Badge variant="secondary" className="text-[10px] capitalize">{q.type.replace('_', ' ')}</Badge>
                             <Badge variant="secondary" className="text-[10px]">{q.tags.bloomLevel}</Badge>
                             <span className="text-xs text-muted-foreground font-mono ml-auto">{q.marks} Marks ({q.negativeMarks} neg)</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: AI GENERATOR ─── */}
        <TabsContent value="ai-generator">
           <Card className="border-t-4 border-t-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-500" /> Auto-Create with AI</CardTitle>
              <CardDescription>Input your course notes, slides, or transcripts. We'll extract COs and calibrate difficulty automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              {!questionSetsAvailable ? (
                <div className="p-8 text-center bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                  <Lock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300">Premium Feature</h3>
                  <p className="text-blue-700/80 dark:text-blue-400/80 max-w-sm mx-auto mt-2 mb-4">AI Question Generation requires the Premium plan. Your account limit is 0/month.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700" asChild><a href="/settings/plans">Upgrade Now</a></Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Course</Label>
                      <Select value={aiTargetCourse} onValueChange={setAiTargetCourse}>
                         <SelectTrigger><SelectValue placeholder="Select course..." /></SelectTrigger>
                         <SelectContent>
                           {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Input Notes / Transcripts</Label>
                      <textarea 
                        className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Paste text directly, or describe what you want tested..."
                        value={aiNotes}
                        onChange={(e)=>setAiNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="space-y-2 w-1/3">
                        <Label>Count</Label>
                        <Input type="number" min="1" max="25" value={aiCount} onChange={(e) => setAiCount(e.target.value)} />
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleGenerateAI} disabled={aiIsLoading || !aiNotes || !aiTargetCourse}>
                      {aiIsLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Magic...</> : <><Sparkles className="mr-2 h-4 w-4" /> Synthesize Questions</>}
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/40 border rounded-xl min-h-[300px] flex flex-col">
                    <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground flex items-center justify-between">
                      Generated Preview
                      {aiGenerated.length > 0 && <Button size="sm" variant="secondary" onClick={saveAiQuestionsToBank}>Add to Bank</Button>}
                    </h3>
                    
                    <div className="flex-1 space-y-3">
                      {aiGenerated.length === 0 && !aiIsLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 pt-16">
                          <BrainCircuit className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Awaiting inputs...</p>
                        </div>
                      ) : aiGenerated.map((q) => (
                        <div key={q.id} className="p-3 bg-background border rounded-lg shadow-sm">
                           <p className="text-sm font-medium mb-2">{q.content}</p>
                           <div className="text-xs text-muted-foreground space-y-1">
                             <div className="flex items-center justify-between">
                               <span>Expected: {q.correctAnswer}</span>
                               <span className="font-mono">{q.tags.bloomLevel} • {q.tags.difficulty}</span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
           </Card>
        </TabsContent>
        
      </Tabs>
    </div>
  );
}
