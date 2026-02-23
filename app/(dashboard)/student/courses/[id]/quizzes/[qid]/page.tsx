"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCourse, getQuiz } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const qid = params.qid as string;
  const course = getCourse(courseId);
  const quiz = getQuiz(qid);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  if (!course || !quiz) return <p>Not found</p>;

  const q = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;

  const handleSubmit = () => {
    let correct = 0;
    quiz.questions.forEach((qu) => {
      if (answers[qu.id] === qu.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    toast({ title: "Quiz submitted!", description: `Score: ${correct}/${quiz.questions.length}` });
  };

  if (submitted && score !== null) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold">Quiz Complete</h1>
            <p className="text-2xl font-bold mt-4 text-primary">
              {score} / {quiz.questions.length} correct
            </p>
            <Link href={`/student/courses/${courseId}/quizzes`}>
              <Button className="mt-4">Back to Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/student/courses/${courseId}/quizzes`}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {quiz.questions.length}
          </p>
          <h2 className="text-lg font-semibold mt-2">{q.question}</h2>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                  answers[q.id] === i ? "border-primary bg-primary/5" : ""
                }`}
              >
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === i}
                  onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                />
                {opt}
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Previous
            </Button>
            {isLast ? (
              <Button onClick={handleSubmit}>Submit</Button>
            ) : (
              <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
