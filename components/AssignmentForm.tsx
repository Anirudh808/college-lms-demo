"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Wand2, Plus, Trash2 } from "lucide-react";
import { Assessment, AssessmentQuestion } from "@/lib/types";

export function AssignmentForm({
  courseId, syllabusModules, onSuccess, onCancel
}: {
  courseId: string;
  syllabusModules: any[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [module, setModule] = useState("");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [durationInSeconds, setDuration] = useState("1800");
  const [type, setType] = useState("MCQ");
  const [questionLimit, setQuestionLimit] = useState("5");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Derived arrays
  const selectedModuleObj = syllabusModules.find(m => m.id === module);
  const chapters = selectedModuleObj?.chapters || [];

  const selectedChapterObj = chapters.find((c: any) => c.id === chapter);
  const lessons = selectedChapterObj?.lessons || [];

  const selectedLessonObj = lessons.find((l: any) => l.id === lesson);
  const topics = selectedLessonObj?.topics || [];

  const selectedTopicObj = topics.find((t: any) => t.id === topic);
  const subTopics = selectedTopicObj?.subtopics || [];

  const handleGenerateAI = async () => {
    setIsLoadingAI(true);
    try {
      const resp = await fetch("/data/assessment_mock.json");
      if (resp.ok) {
        const data = await resp.json();
        setDuration(data.durationInSeconds.toString());
        setQuestionLimit(data.questionLimit.toString());
        // Map the existing mock data to inject type into questions if missing
        const typedQuestions = data.questions.map((q: any) => ({
          ...q,
          type: q.type || data.type || "MCQ"
        }));
        setQuestions(typedQuestions);
      } else {
        // Fallback for demo if mock fetch fails
        alert("Could not load AI mock data.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingAI(false);
  };

  const handleManualAddQuestion = () => {
    setQuestions([...questions, {
      question: "",
      type: type,
      options: type === "MCQ" || type === "Multi Select" ? [
        { key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }
      ] : [],
      correctAnswer: type === "MCQ" ? { option: "A", answer: true } : (type === "Multi Select" ? { multiOptions: [] } : undefined),
    }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!module || !chapter || !lesson) {
      alert("Module, Chapter, and Lesson are required.");
      return;
    }

    const obj: Assessment = {
      id: crypto.randomUUID(),
      courseId,
      module,
      chapter,
      lesson,
      topic,
      subTopic,
      durationInSeconds: parseInt(durationInSeconds) || 0,
      questionLimit: parseInt(questionLimit) || 0,
      questions
    };

    LocalStorageService.saveAssessment(obj).then(() => {
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label>Module *</Label>
          <select
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={module} onChange={e => { setModule(e.target.value); setChapter(""); setLesson(""); setTopic(""); setSubTopic(""); }}
            required
          >
            <option value="">Select Module</option>
            {syllabusModules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>

        <div>
          <Label>Chapter *</Label>
          <select
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={chapter} onChange={e => { setChapter(e.target.value); setLesson(""); setTopic(""); setSubTopic(""); }}
            required disabled={!chapters.length}
          >
            <option value="">Select Chapter</option>
            {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        <div>
          <Label>Lesson *</Label>
          <select
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={lesson} onChange={e => { setLesson(e.target.value); setTopic(""); setSubTopic(""); }}
            required disabled={!lessons.length}
          >
            <option value="">Select Lesson</option>
            {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Topic (Optional)</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={topic} onChange={e => { setTopic(e.target.value); setSubTopic(""); }}
              disabled={!topics.length}
            >
              <option value="">Select Topic</option>
              {topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <Label>SubTopic (Optional)</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={subTopic} onChange={e => setSubTopic(e.target.value)}
              disabled={!subTopics.length}
            >
              <option value="">Select SubTopic</option>
              {subTopics.map((st: any) => <option key={st.id} value={st.id}>{st.title}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type} onChange={e => setType(e.target.value)}
            >
              <option value="MCQ">MCQ</option>
              <option value="Fill in the blanks">Fill in the blanks</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Multi Select">Multi Select</option>
              <option value="Upload Document">Upload Document</option>
              <option value="True or False">True or False</option>
            </select>
          </div>
          <div>
            <Label>Duration (Seconds)</Label>
            <Input type="number" value={durationInSeconds} onChange={e => setDuration(e.target.value)} required />
          </div>
        </div>

        {type !== "Upload Document" && (
          <div>
            <Label>Question Limit</Label>
            <Input type="number" value={questionLimit} onChange={e => setQuestionLimit(e.target.value)} min={1} required />
          </div>
        )}

        <div className="pt-4 border-t border-muted">
          <div className="flex justify-between items-center mb-4">
            <Label className="text-base font-semibold">Questions ({questions.length})</Label>
            <div className="space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={handleManualAddQuestion}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
              <Button type="button" variant="default" size="sm" onClick={handleGenerateAI} disabled={!module || isLoadingAI}>
                <Wand2 className="w-4 h-4 mr-1" /> AI Generate
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {questions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded relative bg-muted/20">
                <button type="button" className="absolute top-2 right-2 text-destructive"
                  onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-muted-foreground mr-2 font-bold">Q{idx + 1} ({q.type})</Label>
                    <select
                      className="h-7 text-xs rounded border border-input bg-background px-2"
                      value={q.type}
                      onChange={e => {
                        const newType = e.target.value as any;
                        const newQ = [...questions];
                        newQ[idx].type = newType;
                        
                        if (newType === "MCQ" || newType === "Multi Select") {
                          newQ[idx].options = [
                            { key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }
                          ];
                          newQ[idx].correctAnswer = newType === "MCQ" ? { option: "A", answer: true } : { multiOptions: [] };
                        } else {
                          newQ[idx].options = [];
                          newQ[idx].correctAnswer = { option: "", answer: true };
                        }
                        
                        setQuestions(newQ);
                      }}
                    >
                      <option value="MCQ">MCQ</option>
                      <option value="Fill in the blanks">Fill in the blanks</option>
                      <option value="Short Answer">Short Answer</option>
                      <option value="Multi Select">Multi Select</option>
                      <option value="Upload Document">Upload Document</option>
                      <option value="True or False">True or False</option>
                    </select>
                  </div>
                  <Input value={q.question}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[idx].question = e.target.value;
                      setQuestions(newQ);
                    }}
                    placeholder="Enter question" className="mt-1" required
                  />
                </div>
                {(q.type === "MCQ" || q.type === "Multi Select") && q.options && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pl-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <Label className="w-4 text-xs font-mono">{opt.key}:</Label>
                        <Input value={opt.text} className="h-8 text-xs"
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[idx].options![oIdx].text = e.target.value;
                            setQuestions(newQ);
                          }}
                        />
                      </div>
                    ))}
                    <div className="col-span-2 mt-2 flex items-center gap-2 border-t pt-2">
                      <Label className="text-xs font-semibold">Correct Option(s):</Label>
                      {q.type === "MCQ" ? (
                        <select className="h-8 rounded text-xs px-2 border bg-green-50/50"
                          value={q.correctAnswer?.option || "A"}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[idx].correctAnswer = { option: e.target.value, answer: true };
                            setQuestions(newQ);
                          }}
                        >
                          {q.options.map(opt => <option key={opt.key} value={opt.key}>{opt.key}</option>)}
                        </select>
                      ) : (
                        <div className="flex flex-wrap gap-2 items-center">
                           {q.options.map(opt => (
                              <label key={opt.key} className="flex items-center gap-1 text-xs cursor-pointer bg-muted/30 px-2 py-1 rounded hover:bg-muted/50 transition-colors">
                                <input type="checkbox" className="w-3 h-3"
                                  checked={q.correctAnswer?.multiOptions?.includes(opt.key) || false}
                                  onChange={e => {
                                    const checked = e.target.checked;
                                    const current = q.correctAnswer?.multiOptions || [];
                                    const newQ = [...questions];
                                    if (checked) {
                                      newQ[idx].correctAnswer = { ...newQ[idx].correctAnswer, multiOptions: [...current, opt.key] };
                                    } else {
                                      newQ[idx].correctAnswer = { ...newQ[idx].correctAnswer, multiOptions: current.filter((k: string) => k !== opt.key) };
                                    }
                                    setQuestions(newQ);
                                  }}
                                />
                                <span>{opt.key}</span>
                              </label>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Fallback for other answer inputs like Short Answer or True/False correct answer config */}
                {(q.type === "Short Answer" || q.type === "Fill in the blanks" || q.type === "True or False") && (
                   <div className="mt-2 flex items-center gap-2 border-t pt-2">
                     <Label className="text-xs font-semibold">Ideal Answer:</Label>
                     {q.type === "True or False" ? (
                        <select className="h-8 rounded text-xs px-2 border bg-green-50/50"
                          value={q.correctAnswer?.option || "True"}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[idx].correctAnswer = { option: e.target.value, answer: true };
                            setQuestions(newQ);
                          }}
                        >
                          <option value="True">True</option>
                          <option value="False">False</option>
                        </select>
                     ) : (
                        <Input className="h-8 text-xs bg-green-50/50 flex-1"
                          placeholder="Type correct answer"
                          value={q.correctAnswer?.option || ""}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[idx].correctAnswer = { option: e.target.value, answer: true };
                            setQuestions(newQ);
                          }}
                        />
                     )}
                   </div>
                )}
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">No questions added yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-6 border-t font-medium">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Assessment</Button>
      </div>
    </form>
  );
}
