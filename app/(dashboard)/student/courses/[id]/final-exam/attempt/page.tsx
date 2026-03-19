"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, CheckCircle2, Clock, EyeOff, Loader2, Mic, ShieldAlert, AlertTriangle, AlertOctagon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCourse, getQuiz } from "@/lib/data";

const DEMO_QUESTIONS = [
  {
    id: "demo-1",
    question: "What is the primary purpose of proctoring in an online examination?",
    options: ["To provide technical support", "To ensure academic integrity", "To record the audio of the student", "To increase the exam difficulty"],
    type: "mcq"
  },
  {
    id: "demo-2",
    question: "Which of the following behavior is considered a violation in this proctored environment?",
    options: ["Blinking frequently", "Switching browser tabs", "Drinking water", "Reading questions aloud"],
    type: "mcq"
  },
  {
    id: "demo-3",
    question: "How many violation strikes are allowed before the system automatically submits your exam?",
    options: ["1 strike", "2 strikes", "3 strikes", "No limit"],
    type: "mcq"
  },
  {
    id: "demo-4",
    question: "What happens if you revoke camera permissions during the exam?",
    options: ["Exam continues normally", "A warning is displayed", "Exam is automatically submitted", "You get extra time"],
    type: "mcq"
  },
  {
    id: "demo-5",
    question: "In a '3 Strikes Policy', what does the 3rd strike represent?",
    options: ["The final warning", "The start of the exam", "Temporary suspension", "Immediate automatic submission"],
    type: "mcq"
  }
];

export default function ExamTakePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const examId = params.examId as string;
  
  const course = getCourse(id);
  const exam = getQuiz(examId);

  // Proctoring States
  const [isFinished, setIsFinished] = useState<null | 'submitted' | 'terminated'>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [violations, setViolations] = useState<{ type: string; time: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState((exam?.timeLimit || 30) * 60);
  const [submitting, setSubmitting] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  // Dialog States
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  
  // Mock Answers
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup Proctoring Permissions (Mock Camera/Mic)
  const requestPermissions = async () => {
    if (isRequestingPermissions) return;
    setIsRequestingPermissions(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const handleTrackEnded = () => {
        setMediaStream(null);
        setPermissionsGranted(false);
        setViolations((prev) => [
          ...prev, 
          { type: "Camera or Microphone disconnected", time: new Date().toLocaleTimeString() }
        ]);
      };

      stream.getTracks().forEach(track => {
        track.onended = handleTrackEnded;
      });

      // Update all states together to ensure immediate re-rendering
      setMediaStream(stream);
      setPermissionsGranted(true);
      setHasStarted(true);
      setIsRequestingPermissions(false); // Set to false here instead of finally to avoid late state update
    } catch (err) {
      console.error("Permission denied", err);
      setWarningMessage("You must grant camera and microphone permissions to take this exam.");
      setShowWarningDialog(true);
      setIsRequestingPermissions(false);
    }
  };

  useEffect(() => {
    if (hasStarted && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [hasStarted, mediaStream]);

  // Monitor tab visibility
  useEffect(() => {
    if (!hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations((prev) => [
          ...prev, 
          { type: "Tab Switched / Hidden", time: new Date().toLocaleTimeString() }
        ]);
				if (violations.length < 3) {
					setWarningMessage("Warning: Tab switching is recorded as a violation during this exam.");
					setShowWarningDialog(true);
				}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted]);

  // Monitor Copy/Paste
  useEffect(() => {
    if (!hasStarted) return;

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setViolations((prev) => [
        ...prev, 
        { type: "Copy/Paste Attempted", time: new Date().toLocaleTimeString() }
      ]);
    };

    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);

    return () => {
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
    };
  }, [hasStarted]);

  // Timer
  useEffect(() => {
    if (!hasStarted || !permissionsGranted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, permissionsGranted, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = (status: 'submitted' | 'terminated' = 'submitted') => {
    setSubmitting(true);
    stopMediaTracks(); // Ensure tracks are stopped
    // Mock submission delay
    setTimeout(() => {
      setSubmitting(false);
      setIsFinished(status);
    }, 1500);
  };

  const stopMediaTracks = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }
  };

  // Auto-submit on 3 violations
  useEffect(() => {
    if (violations.length >= 3 && hasStarted && !submitting) {
      setShowViolationDialog(true);
      // Wait for 5 seconds then submit
      const timeout = setTimeout(() => {
        setShowViolationDialog(false);
      }, 2000);
			handleSubmit('terminated');
      return () => clearTimeout(timeout);
    }
  }, [violations, hasStarted, submitting]);

  // Anti-Cheat: Disable DevTools and Right Clicks in Production
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    // 1. Disable Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    const handleKeyDownInfo = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
      }
    };

    // 3. DevTools Debugger Trap (Pauses execution and messes with DevTools if opened)
    const debuggerTrap = setInterval(() => {
      // The function below will trigger the debugger statement if devtools is open
      (function() { return false; }['constructor']('debugger')['call']());
    }, 1000);

    // Attach listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDownInfo);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDownInfo);
      clearInterval(debuggerTrap);
    };
  }, []);

  // IF FINISHED ======================================================================
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] bg-slate-50 p-6 text-center animate-in fade-in duration-500">
        <Card className={`max-w-md w-full p-8 shadow-xl border-t-8 ${isFinished === 'submitted' ? 'border-t-green-600' : 'border-t-red-600'}`}>
          <div className="flex flex-col items-center">
            {isFinished === 'submitted' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6 text-green-600 shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Exam Submitted</h2>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                  Your exam has been successfully recorded and sent for secondary review. You will be notified once your results are available.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6 text-red-600 shadow-inner">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Exam Terminated</h2>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                  This session was terminated due to security violations. Your progress up to this point has been saved and flagged for manual audit.
                </p>
              </>
            )}
            <Button 
              onClick={() => router.push(`/student/courses/${id}`)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 shadow-lg shadow-indigo-100"
            >
              Return to Course Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // IF NOT STARTED OR PERMISSIONS NOT GRANTED YET ====================================
  if (!hasStarted || !permissionsGranted) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8 pt-12">
        <Card className="border-indigo-100 shadow-lg">
          <div className="h-2 w-full bg-indigo-600 rounded-t-xl" />
          <CardHeader className="text-center pb-8">
            <div className="mx-auto bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {hasStarted ? "Exam Paused" : (exam?.title || "Exam")}
            </CardTitle>
            <CardDescription className="text-lg mt-2 font-medium text-slate-600">
              {course?.title || "General"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
               <h3 className="font-semibold text-amber-900 flex items-center mb-2">
                 <AlertTriangle className="h-5 w-5 mr-2" />
                 Proctored Exam Rules
               </h3>
               <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside ml-1">
                 <li>Your camera and microphone will be recorded.</li>
                 <li>Switching tabs or minimizing the browser will be flagged.</li>
                 <li>Copying, pasting, and right-clicking are strictly disabled.</li>
                 <li>Ensure you are in a quiet, well-lit room.</li>
                 <li className="font-bold text-amber-900 border-t border-amber-200/50 pt-2 mt-2">
                   3 Strikes Policy: <span className="font-normal text-amber-800">Your exam will be automatically submitted if you receive 3 violation flags.</span>
                 </li>
               </ul>
             </div>

             <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg border-dashed">
               <div className="flex gap-4 mb-4">
                 <div className="flex items-center gap-2 text-slate-600 font-medium">
                   <Camera className="h-5 w-5" /> Camera
                 </div>
                 <div className="flex items-center gap-2 text-slate-600 font-medium">
                   <Mic className="h-5 w-5" /> Microphone
                 </div>
               </div>
               <p className="text-sm text-center text-slate-500 max-w-sm mb-6">
                 {hasStarted 
                   ? "Exam paused. You must re-grant permission to access your webcam and microphone to continue."
                   : "To begin the exam, you must grant the browser permission to access your webcam and microphone."}
               </p>
               <Button 
                onClick={requestPermissions} 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto"
                disabled={isRequestingPermissions}
               >
                 {isRequestingPermissions ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <ShieldAlert className="mr-2 h-5 w-5"/>}
                 {isRequestingPermissions 
                   ? "Requesting Permissions..." 
                   : (hasStarted ? "Resume Exam" : "Grant Permissions & Start")}
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // EXAM TAKING VIEW =================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 overflow-hidden">
      {/* Exam Header Topbar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{exam?.title || "Exam in Progress"}</h1>
          <p className="text-sm font-medium text-slate-500">{course?.title}</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Remaining</span>
             <span className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
               {formatTime(timeLeft)}
             </span>
           </div>
           <Button 
             onClick={() => handleSubmit()} 
             disabled={submitting}
             className="bg-green-600 hover:bg-green-700 text-white"
           >
             {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
             Submit Exam
           </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 select-none">
           <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Mock Questions */}
              {(exam?.questions && exam.questions.length > 0 ? exam.questions : DEMO_QUESTIONS).map((q, qIndex) => (
                <Card key={q.id} className="shadow-sm border-slate-200">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-base leading-relaxed flex items-start gap-4">
                      <span className="flex-shrink-0 bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {qIndex + 1}
                      </span>
                      {q.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {(q.type === 'mcq' || q.type === 'truefalse') && q.options?.map((opt, i) => (
                        <label 
                          key={i} 
                          className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}
                        >
                          <input 
                            type="radio" 
                            name={`question-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-600"
                          />
                          <span className={`font-medium ${answers[q.id] === opt ? 'text-indigo-900' : 'text-slate-700'}`}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

           </div>
        </div>

        {/* Right Sidebar - Proctoring Panel */}
        <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col hidden lg:flex">
          <div className="p-4 border-b border-slate-200 relative bg-black">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-48 object-cover rounded shadow-inner"
            />
            <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-slate-900 flex items-center justify-between">
              Monitoring Logs
              <Badge variant={violations.length > 0 ? "destructive" : "secondary"}>
                {violations.length} Flags
              </Badge>
            </h3>

            {violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-100 flex-1">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-sm font-medium">Session Secure</p>
                <p className="text-xs">No violations detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v, i) => (
                  <Alert key={i} variant="destructive" className="py-2.5 px-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm ml-2 font-semibold">Violation Flagged</AlertTitle>
                    <AlertDescription className="text-xs ml-2 mt-1 font-medium">
                      {v.type} at {v.time}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showViolationDialog} onOpenChange={setShowViolationDialog}>
        <DialogContent 
          className="sm:max-w-md" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
             <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200 shadow-sm animate-pulse">
               <AlertOctagon className="w-8 h-8 text-red-600" />
             </div>
             <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Exam Terminated</DialogTitle>
             <DialogDescription className="text-base text-slate-600">
               You have reached the maximum number of allowed violations (3). Your exam session has been terminated and your current progress is being automatically submitted.
             </DialogDescription>
          </div>
          <DialogFooter className="sm:justify-center border-t border-slate-100 pt-4 mt-2">
             <p className="text-sm font-medium text-slate-500 animate-pulse flex items-center">
               <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting exam...
             </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* General Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
               <AlertTriangle className="h-5 w-5" />
               Exam Warning
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 font-medium">{warningMessage}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowWarningDialog(false)} className="bg-amber-600 hover:bg-amber-700 text-white">
              I Understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
