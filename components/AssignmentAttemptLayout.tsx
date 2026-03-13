"use client";

import { useState, useEffect } from "react";
import { Assessment, AssessmentSubmission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LocalStorageService } from "@/components/LocalStorageService";
import { Clock, UploadCloud, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";

export function AssignmentAttemptLayout({ assessment, courseId, facultyViewSubmission }: { assessment: Assessment; courseId: string; facultyViewSubmission?: AssessmentSubmission; }) {
  const router = useRouter();
  const { user } = useSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>(new Array(assessment.questions.length).fill(null));
  const [timeLeft, setTimeLeft] = useState(assessment.durationInSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<AssessmentSubmission | null>(null);

  useEffect(() => {
    if (facultyViewSubmission) {
      setAnswers(facultyViewSubmission.studentAnswers);
      setIsSubmitted(true);
      setSubmissionData(facultyViewSubmission);
      return;
    }
    // Check if the user already submitted
    LocalStorageService.getSubmissions(assessment.id).then((subs: AssessmentSubmission[]) => {
      const existing = subs.find(s => s.studentId === user?.id || s.studentName === user?.name);
      if (existing) {
        setAnswers(existing.studentAnswers);
        setIsSubmitted(true);
        setSubmissionData(existing);
      }
    });
  }, [assessment.id, facultyViewSubmission]);

  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSubmit = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    const submission: AssessmentSubmission = {
      assessmentId: assessment.id,
      courseId,
      studentName: user?.name,
      studentId: user?.id, // Would come from auth context normally
      studentAnswers: answers,
      submittedAt: Date.now()
    };
    LocalStorageService.saveSubmission(submission).then(() => {
      setSubmissionData(submission);
    });
  };

  if (isSubmitted) {
    let correctCount = 0;
    const evaluatedQuestions = assessment.questions.map((q, idx) => {
      const studentAns = answers[idx];
      let isCorrect = false;
      let correctAnsText = "";

      if (q.type === "MCQ" || q.type === "True or False") {
        isCorrect = studentAns === q.correctAnswer?.option;
        correctAnsText = q.correctAnswer?.option || "Not set";
      } else if (q.type === "Multi Select") {
        const studentSet = new Set(studentAns || []);
        const correctSet = new Set(q.correctAnswer?.multiOptions || []);
        isCorrect = studentSet.size === correctSet.size && [...studentSet].every((val: any) => correctSet.has(val as string));
        correctAnsText = q.correctAnswer?.multiOptions?.join(", ") || "Not set";
      } else if (q.type === "Short Answer" || q.type === "Fill in the blanks") {
        // Simple string match for short answer
        isCorrect = studentAns?.toString().trim().toLowerCase() === q.correctAnswer?.option?.trim().toLowerCase();
        correctAnsText = q.correctAnswer?.option || "Not set";
      } else {
        isCorrect = false;
        correctAnsText = "Manual Grading Required";
      }

      if (isCorrect) correctCount++;
      return { q, studentAns, isCorrect, correctAnsText };
    });

    const isAutoGraded = (ty: string) => ["MCQ", "True or False", "Multi Select", "Short Answer", "Fill in the blanks"].includes(ty);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border rounded-lg text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold">Assessment Submitted</h2>
          <p className="text-muted-foreground">Your answers have been securely saved.</p>
          <div className="bg-background p-4 rounded border mt-4 inline-block">
            <p className="text-lg font-bold text-primary">Score: {correctCount} / {assessment.questions.length}</p>
            <p className="text-sm text-muted-foreground mt-1">{Math.round((correctCount / assessment.questions.length) * 100)}% Accuracy</p>
          </div>
          {!facultyViewSubmission && (
            <Button onClick={() => router.push(`/student/courses/${courseId}`)} className="mt-4">Return to Course</Button>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold border-b pb-2">Submission Review</h3>
          {evaluatedQuestions.map((res, idx) => (
            <Card key={idx} className={isAutoGraded(res.q.type) ? (res.isCorrect ? "border-green-300 bg-green-50/10" : "border-red-300 bg-red-50/10") : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-medium">
                    {idx + 1}. {res.q.question}
                  </CardTitle>
                  {isAutoGraded(res.q.type) && (
                    res.isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-muted-foreground">Your Answer:</span>{" "}
                    <span className={isAutoGraded(res.q.type) ? (res.isCorrect ? "text-green-600 font-medium" : "text-red-500 font-medium") : ""}>
                      {Array.isArray(res.studentAns) ? res.studentAns.join(", ") : res.studentAns || "No answer provided"}
                    </span>
                  </p>
                  {isAutoGraded(res.q.type) && !res.isCorrect && (
                    <p>
                      <span className="font-semibold text-muted-foreground">Correct Answer:</span>{" "}
                      <span className="text-primary font-medium">{res.correctAnsText}</span>
                    </p>
                  )}
                  {!isAutoGraded(res.q.type) && (
                    <div className="p-3 mt-2 bg-muted rounded text-muted-foreground italic">
                      This question requires manual review and grading by your instructor.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const renderQuestionContent = () => {
    const question = assessment.questions[currentQuestionIndex];
    if (!question) return <p>No questions configured.</p>;

    if (question.type === "Upload Document") {
      return (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
          <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-medium mb-1">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, or ZIP (max 10MB)</p>
          <input type="file" className="hidden" id="file-upload"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const newAns = [...answers];
                newAns[currentQuestionIndex] = file.name;
                setAnswers(newAns);
              }
            }}
          />
          <Button asChild variant="outline"><label htmlFor="file-upload">Select File</label></Button>
          {answers[currentQuestionIndex] && <p className="mt-4 text-sm text-green-600">Selected: {answers[currentQuestionIndex]}</p>}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">{currentQuestionIndex + 1}. {question.question}</h3>

        {question.type === "MCQ" && (
          <div className="space-y-3">
            {question.options?.map(opt => (
              <label key={opt.key} className="flex items-center space-x-3 p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors">
                <input type="radio" name={`q-${currentQuestionIndex}`}
                  checked={answers[currentQuestionIndex] === opt.key}
                  onChange={() => {
                    const newAns = [...answers];
                    newAns[currentQuestionIndex] = opt.key;
                    setAnswers(newAns);
                  }}
                  className="h-4 w-4"
                />
                <span>{opt.key}. {opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "True or False" && (
          <div className="space-y-3">
            {["True", "False"].map(opt => (
              <label key={opt} className="flex items-center space-x-3 p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors">
                <input type="radio" name={`q-${currentQuestionIndex}`}
                  checked={answers[currentQuestionIndex] === opt}
                  onChange={() => {
                    const newAns = [...answers];
                    newAns[currentQuestionIndex] = opt;
                    setAnswers(newAns);
                  }}
                  className="h-4 w-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === "Multi Select" && (
          <div className="space-y-3">
            {question.options?.map(opt => (
              <label key={opt.key} className="flex items-center space-x-3 p-3 border rounded hover:bg-muted/50 cursor-pointer transition-colors">
                <input type="checkbox"
                  checked={(answers[currentQuestionIndex] || []).includes(opt.key)}
                  onChange={e => {
                    const curr = answers[currentQuestionIndex] || [];
                    let updated;
                    if (e.target.checked) updated = [...curr, opt.key];
                    else updated = curr.filter((v: string) => v !== opt.key);
                    const newAns = [...answers];
                    newAns[currentQuestionIndex] = updated;
                    setAnswers(newAns);
                  }}
                  className="h-4 w-4"
                />
                <span>{opt.key}. {opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {(question.type === "Short Answer" || question.type === "Fill in the blanks") && (
          <textarea
            className="w-full h-32 p-3 border rounded resize-y"
            placeholder="Type your answer here..."
            value={answers[currentQuestionIndex] || ""}
            onChange={e => {
              const newAns = [...answers];
              newAns[currentQuestionIndex] = e.target.value;
              setAnswers(newAns);
            }}
          />
        )}
      </div>
    );
  };

  const progress = ((currentQuestionIndex + 1) / (assessment.questions.length || 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assessment</h2>
          <p className="text-muted-foreground">Module: {assessment.module}</p>
        </div>
        <div className="flex items-center gap-2 text-lg font-mono bg-muted p-2 rounded-lg">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className={timeLeft < 60 ? "text-red-500 font-bold" : ""}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="pt-6 min-h-[400px]">
          {renderQuestionContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline"
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>

        <div className="flex-1" />

        {currentQuestionIndex < assessment.questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestionIndex(Math.min(assessment.questions.length - 1, currentQuestionIndex + 1))}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Submit Assessment
          </Button>
        )}
      </div>
    </div>
  );
}
