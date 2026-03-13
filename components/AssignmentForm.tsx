"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Wand2, Plus, Trash2 } from "lucide-react";
import { Assessment, AssessmentQuestion } from "@/lib/types";
import { getAssessment } from "@/lib/data";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormErrors {
  module?: string;
  chapter?: string;
  lesson?: string;
  durationInSeconds?: string;
  questionLimit?: string;
  questions?: string;
  questionErrors?: QuestionError[];
}

interface QuestionError {
  question?: string;
  type?: string;
  correctAnswer?: string;
  options?: string;
  emptyOptionIndices?: number[]; // indices of option inputs that are empty
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [errors, setErrors] = useState<FormErrors>({});

  const formRef = useRef<HTMLFormElement>(null);

  // ── Derived selects ──────────────────────────────────────────────────────────
  const selectedModuleObj = syllabusModules.find(m => m.id === module);
  const chapters = selectedModuleObj?.chapters || [];
  const selectedChapterObj = chapters.find((c: any) => c.id === chapter);
  const lessons = selectedChapterObj?.lessons || [];
  const selectedLessonObj = lessons.find((l: any) => l.id === lesson);
  const topics = selectedLessonObj?.topics || [];
  const selectedTopicObj = topics.find((t: any) => t.id === topic);
  const subTopics = selectedTopicObj?.subtopics || [];

  // ── AI Generate ──────────────────────────────────────────────────────────────
  const handleGenerateAI = async () => {
    setIsLoadingAI(true);
    try {
      const assessments = getAssessment();
      if (assessments) {
        setDuration(assessments.durationInSeconds.toString());
        setQuestionLimit(assessments.questionLimit.toString());
        const typedQuestions = assessments.questions.map((q: any) => ({
          ...q,
          type: q.type || assessments.type || "MCQ"
        }));
        setQuestions(typedQuestions);
        setErrors({});
      } else {
        alert("Could not load AI mock data.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingAI(false);
  };

  // ── Add Question ─────────────────────────────────────────────────────────────
  const handleManualAddQuestion = () => {
    setQuestions([...questions, {
      question: "",
      type: type,
      options: type === "MCQ" || type === "Multi Select" ? [
        { key: "A", text: "" }, { key: "B", text: "" },
        { key: "C", text: "" }, { key: "D", text: "" }
      ] : [],
      correctAnswer: type === "MCQ"
        ? { option: "A", answer: true }
        : type === "Multi Select"
          ? { multiOptions: [] }
          : undefined,
    }]);
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!module) newErrors.module = "Module is required.";
    if (!chapter) newErrors.chapter = "Chapter is required.";
    if (!lesson) newErrors.lesson = "Lesson is required.";

    const dur = parseInt(durationInSeconds);
    if (!durationInSeconds || isNaN(dur) || dur <= 0)
      newErrors.durationInSeconds = "Duration must be greater than 0.";

    const ql = parseInt(questionLimit);
    if (!questionLimit || isNaN(ql) || ql <= 0)
      newErrors.questionLimit = "Question limit must be greater than 0.";

    if (questions.length === 0) {
      newErrors.questions = "Minimum one question is required.";
    } else {
      const questionErrors: QuestionError[] = questions.map((q) => {
        const qErr: QuestionError = {};

        if (!q.question?.trim()) qErr.question = "Question text is required.";
        if (!q.type) qErr.type = "Question type is required.";

        if (q.type === "MCQ") {
          const filledOpts = (q.options || []).filter(o => o.text.trim() !== "");
          const emptyIndices = (q.options || []).map((o, i) => o.text.trim() === "" ? i : -1).filter(i => i !== -1);
          if (filledOpts.length === 0) {
            qErr.options = "Options are required for MCQ question.";
            qErr.emptyOptionIndices = emptyIndices;
          } else if (filledOpts.length < 2) {
            qErr.options = "Minimum two options are required.";
            qErr.emptyOptionIndices = emptyIndices;
          } else if (emptyIndices.length > 0) {
            // Some options are empty — flag them visually
            qErr.emptyOptionIndices = emptyIndices;
            // Also check correct answer is among filled options
            const filledKeys = filledOpts.map(o => o.key);
            if (!q.correctAnswer?.option || !filledKeys.includes(q.correctAnswer.option)) {
              qErr.correctAnswer = "Correct answer must be one of the filled options.";
            }
          } else {
            const keys = (q.options || []).map(o => o.key);
            if (!q.correctAnswer?.option || !keys.includes(q.correctAnswer.option)) {
              qErr.correctAnswer = "Correct answer must be one of the options.";
            }
          }
        } else if (q.type === "Multi Select") {
          const filledMultiOpts = (q.options || []).filter(o => o.text.trim() !== "");
          const emptyMultiIndices = (q.options || []).map((o, i) => o.text.trim() === "" ? i : -1).filter(i => i !== -1);
          if (filledMultiOpts.length === 0) {
            qErr.options = "Options are required for multi select question.";
            qErr.emptyOptionIndices = emptyMultiIndices;
          } else if (filledMultiOpts.length < 2) {
            qErr.options = "Minimum two options are required.";
            qErr.emptyOptionIndices = emptyMultiIndices;
          } else if (emptyMultiIndices.length > 0) {
            qErr.emptyOptionIndices = emptyMultiIndices;
          }
          if (!q.correctAnswer?.multiOptions || q.correctAnswer.multiOptions.length === 0) {
            qErr.correctAnswer = "Select at least one correct answer.";
          }
        } else if (q.type === "Short Answer" || q.type === "Fill in the blanks") {
          if (!q.correctAnswer?.option?.trim()) {
            qErr.correctAnswer = "Correct answer is required for short answer question.";
          }
        }

        return qErr;
      });

      const hasQErrors = questionErrors.some(e => Object.keys(e).length > 0);
      if (hasQErrors) newErrors.questionErrors = questionErrors;
    }

    setErrors(newErrors);

    // Scroll to first error
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        const firstError = formRef.current?.querySelector("[data-error='true']");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return false;
    }
    return true;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const obj: Assessment = {
      id: crypto.randomUUID(),
      courseId,
      module,
      chapter,
      lesson,
      topic,
      type,
      subTopic,
      durationInSeconds: parseInt(durationInSeconds) || 0,
      questionLimit: parseInt(questionLimit) || 0,
      questions
    };

    LocalStorageService.saveAssessment(obj).then(() => {
      onSuccess();
    });
  };

  // ── Helper ───────────────────────────────────────────────────────────────────
  const fieldClass = (hasError: boolean) =>
    `flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm bg-background ${hasError ? "border-destructive ring-1 ring-destructive" : "border-input"}`;

  const ErrorMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-4">

        {/* Module */}
        <div data-error={!!errors.module || undefined}>
          <Label>Module *</Label>
          <select
            className={fieldClass(!!errors.module)}
            value={module}
            onChange={e => { setModule(e.target.value); setChapter(""); setLesson(""); setTopic(""); setSubTopic(""); setErrors(prev => ({ ...prev, module: undefined })); }}
          >
            <option value="">Select Module</option>
            {syllabusModules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          <ErrorMsg msg={errors.module} />
        </div>

        {/* Chapter */}
        <div data-error={!!errors.chapter || undefined}>
          <Label>Chapter *</Label>
          <select
            className={fieldClass(!!errors.chapter)}
            value={chapter}
            onChange={e => { setChapter(e.target.value); setLesson(""); setTopic(""); setSubTopic(""); setErrors(prev => ({ ...prev, chapter: undefined })); }}
            disabled={!chapters.length}
          >
            <option value="">Select Chapter</option>
            {chapters.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <ErrorMsg msg={errors.chapter} />
        </div>

        {/* Lesson */}
        <div data-error={!!errors.lesson || undefined}>
          <Label>Lesson *</Label>
          <select
            className={fieldClass(!!errors.lesson)}
            value={lesson}
            onChange={e => { setLesson(e.target.value); setTopic(""); setSubTopic(""); setErrors(prev => ({ ...prev, lesson: undefined })); }}
            disabled={!lessons.length}
          >
            <option value="">Select Lesson</option>
            {lessons.map((l: any) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <ErrorMsg msg={errors.lesson} />
        </div>

        {/* Topic + SubTopic */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Topic (Optional)</Label>
            <select
              className={fieldClass(false)}
              value={topic}
              onChange={e => { setTopic(e.target.value); setSubTopic(""); }}
              disabled={!topics.length}
            >
              <option value="">Select Topic</option>
              {topics.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <Label>SubTopic (Optional)</Label>
            <select
              className={fieldClass(false)}
              value={subTopic}
              onChange={e => setSubTopic(e.target.value)}
              disabled={!subTopics.length}
            >
              <option value="">Select SubTopic</option>
              {subTopics.map((st: any) => <option key={st.id} value={st.id}>{st.title}</option>)}
            </select>
          </div>
        </div>

        {/* Duration + Question Limit */}
        <div className="grid grid-cols-2 gap-4">
          <div data-error={!!errors.durationInSeconds || undefined}>
            <Label>Duration (Seconds) *</Label>
            <Input
              type="number"
              value={durationInSeconds}
              onChange={e => { setDuration(e.target.value); setErrors(prev => ({ ...prev, durationInSeconds: undefined })); }}
              className={errors.durationInSeconds ? "border-destructive ring-1 ring-destructive" : ""}
              min={1}
            />
            <ErrorMsg msg={errors.durationInSeconds} />
          </div>
          <div data-error={!!errors.questionLimit || undefined}>
            <Label>Question Limit *</Label>
            <Input
              type="number"
              value={questionLimit}
              onChange={e => { setQuestionLimit(e.target.value); setErrors(prev => ({ ...prev, questionLimit: undefined })); }}
              className={errors.questionLimit ? "border-destructive ring-1 ring-destructive" : ""}
              min={1}
            />
            <ErrorMsg msg={errors.questionLimit} />
          </div>
        </div>

        {/* Default Type for new questions */}
        <div>
          <Label>Default Question Type</Label>
          <select
            className={fieldClass(false)}
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="MCQ">MCQ</option>
            <option value="Fill in the blanks">Fill in the blanks</option>
            <option value="Short Answer">Short Answer</option>
            <option value="Multi Select">Multi Select</option>
            <option value="Upload Document">Upload Document</option>
            <option value="True or False">True or False</option>
          </select>
        </div>

        {/* Questions Section */}
        <div className="pt-4 border-t border-muted">
          <div className="flex justify-between items-center mb-3">
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

          {/* Questions array empty error */}
          {errors.questions && (
            <div data-error="true" className="mb-3 p-2 rounded border border-destructive bg-destructive/10">
              <p className="text-xs text-destructive font-medium">{errors.questions}</p>
            </div>
          )}

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {questions.map((q, idx) => {
              const qErr = errors.questionErrors?.[idx] || {};
              const hasErr = Object.keys(qErr).length > 0;
              return (
                <div
                  key={idx}
                  data-error={hasErr || undefined}
                  className={`p-3 border rounded relative bg-muted/20 ${hasErr ? "border-destructive" : ""}`}
                >
                  <button type="button" className="absolute top-2 right-2 text-destructive"
                    onClick={() => {
                      const newQs = questions.filter((_, i) => i !== idx);
                      setQuestions(newQs);
                      setErrors(prev => {
                        const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                        qErrs.splice(idx, 1);
                        return { ...prev, questionErrors: qErrs, questions: newQs.length === 0 ? prev.questions : undefined };
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground mr-2 font-bold">Q{idx + 1}</Label>
                      <select
                        className="h-7 text-xs rounded border border-input bg-background px-2"
                        value={q.type}
                        onChange={e => {
                          const newType = e.target.value as any;
                          const newQ = [...questions];
                          newQ[idx].type = newType;
                          if (newType === "MCQ" || newType === "Multi Select") {
                            newQ[idx].options = [
                              { key: "A", text: "" }, { key: "B", text: "" },
                              { key: "C", text: "" }, { key: "D", text: "" }
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

                    {/* Question text */}
                    <Input
                      value={q.question}
                      onChange={e => {
                        const newQ = [...questions];
                        newQ[idx].question = e.target.value;
                        setQuestions(newQ);
                        // clear question error as user types
                        if (e.target.value.trim()) {
                          setErrors(prev => {
                            const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                            if (qErrs[idx]) qErrs[idx] = { ...qErrs[idx], question: undefined };
                            return { ...prev, questionErrors: qErrs };
                          });
                        }
                      }}
                      placeholder="Enter question"
                      className={`mt-1 ${qErr.question ? "border-destructive ring-1 ring-destructive" : ""}`}
                    />
                    <ErrorMsg msg={qErr.question} />
                  </div>

                  {/* MCQ / Multi Select options */}
                  {(q.type === "MCQ" || q.type === "Multi Select") && q.options && (
                    <div className="mt-2 pl-2">
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isEmptyOpt = qErr.emptyOptionIndices?.includes(oIdx);
                          return (
                            <div key={oIdx} className="flex items-center gap-2">
                              <Label className="w-4 text-xs font-mono">{opt.key}:</Label>
                              <Input
                                value={opt.text}
                                className={`h-8 text-xs ${isEmptyOpt ? "border-destructive ring-1 ring-destructive" : ""}`}
                                onChange={e => {
                                  // Update question data
                                  const newQ = [...questions];
                                  newQ[idx].options![oIdx].text = e.target.value;
                                  setQuestions(newQ);

                                  // Clear this option's error as soon as user types something
                                  if (e.target.value.trim()) {
                                    setErrors(prev => {
                                      const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                                      if (qErrs[idx]) {
                                        const remaining = (qErrs[idx].emptyOptionIndices || []).filter(i => i !== oIdx);
                                        const updatedOptions = newQ[idx].options || [];
                                        const filledCount = updatedOptions.filter(o => o.text.trim() !== "").length;
                                        qErrs[idx] = {
                                          ...qErrs[idx],
                                          emptyOptionIndices: remaining,
                                          // clear message once enough filled
                                          options: filledCount >= 2 ? undefined : qErrs[idx].options,
                                        };
                                      }
                                      return { ...prev, questionErrors: qErrs };
                                    });
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <ErrorMsg msg={qErr.options} />

                      <div className="mt-2 flex items-center gap-2 border-t pt-2">
                        <Label className="text-xs font-semibold">Correct Option(s):</Label>
                        {q.type === "MCQ" ? (
                          <select
                            className={`h-8 rounded text-xs px-2 border bg-green-50/50 ${qErr.correctAnswer ? "border-destructive ring-1 ring-destructive" : ""}`}
                            value={q.correctAnswer?.option || "A"}
                            onChange={e => {
                              const newQ = [...questions];
                              newQ[idx].correctAnswer = { option: e.target.value, answer: true };
                              setQuestions(newQ);
                              // clear correctAnswer error immediately
                              setErrors(prev => {
                                const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                                if (qErrs[idx]) qErrs[idx] = { ...qErrs[idx], correctAnswer: undefined };
                                return { ...prev, questionErrors: qErrs };
                              });
                            }}
                          >
                            {q.options.map(opt => <option key={opt.key} value={opt.key}>{opt.key}</option>)}
                          </select>
                        ) : (
                          <div className="flex flex-wrap gap-2 items-center">
                            {q.options.map(opt => (
                              <label key={opt.key} className="flex items-center gap-1 text-xs cursor-pointer bg-muted/30 px-2 py-1 rounded hover:bg-muted/50">
                                <input type="checkbox" className="w-3 h-3"
                                  checked={q.correctAnswer?.multiOptions?.includes(opt.key) || false}
                                  onChange={e => {
                                    const curr = q.correctAnswer?.multiOptions || [];
                                    const newQ = [...questions];
                                    const updated = e.target.checked
                                      ? [...curr, opt.key]
                                      : curr.filter((k: string) => k !== opt.key);
                                    newQ[idx].correctAnswer = { ...newQ[idx].correctAnswer, multiOptions: updated };
                                    setQuestions(newQ);
                                    // clear correctAnswer error when at least one is selected
                                    if (updated.length > 0) {
                                      setErrors(prev => {
                                        const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                                        if (qErrs[idx]) qErrs[idx] = { ...qErrs[idx], correctAnswer: undefined };
                                        return { ...prev, questionErrors: qErrs };
                                      });
                                    }
                                  }}
                                />
                                <span>{opt.key}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <ErrorMsg msg={qErr.correctAnswer} />
                    </div>
                  )}

                  {/* Short Answer / Fill in the blanks / True or False */}
                  {(q.type === "Short Answer" || q.type === "Fill in the blanks" || q.type === "True or False") && (
                    <div className="mt-2 flex flex-col gap-1 border-t pt-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-semibold">Ideal Answer:</Label>
                        {q.type === "True or False" ? (
                          <select
                            className="h-8 rounded text-xs px-2 border bg-green-50/50"
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
                          <Input
                            className={`h-8 text-xs bg-green-50/50 flex-1 ${qErr.correctAnswer ? "border-destructive ring-1 ring-destructive" : ""}`}
                            placeholder="Type correct answer"
                            value={q.correctAnswer?.option || ""}
                            onChange={e => {
                              const newQ = [...questions];
                              newQ[idx].correctAnswer = { option: e.target.value, answer: true };
                              setQuestions(newQ);
                              // clear correctAnswer error as user types
                              if (e.target.value.trim()) {
                                setErrors(prev => {
                                  const qErrs = prev.questionErrors ? [...prev.questionErrors] : [];
                                  if (qErrs[idx]) qErrs[idx] = { ...qErrs[idx], correctAnswer: undefined };
                                  return { ...prev, questionErrors: qErrs };
                                });
                              }
                            }}
                          />
                        )}
                      </div>
                      <ErrorMsg msg={qErr.correctAnswer} />
                    </div>
                  )}
                </div>
              );
            })}

            {questions.length === 0 && !errors.questions && (
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
