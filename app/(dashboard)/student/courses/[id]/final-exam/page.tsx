"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourse } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldAlert, 
  Camera, 
  Mic, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowLeft,
  AlertTriangle,
  AlertOctagon
} from "lucide-react";
import Link from "next/link";

export default function FinalExamPreExamPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const course = getCourse(id);
  
  const [permissionState, setPermissionState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!course) return <div className="p-6 text-center text-muted-foreground">Course not found</div>;

  const requestPermissions = async () => {
    setPermissionState("requesting");
    setErrorMessage("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // We just need to check if we can get it. We'll close it for now and reopen in the exam page 
      // or pass it along if we were using a more complex state management.
      // For this demo, we just verify permission here.
      stream.getTracks().forEach(track => track.stop());
      setPermissionState("granted");
      
      // Auto-navigate after a short delay to show success state
      setTimeout(() => {
        router.push(`/student/courses/${id}/final-exam/attempt`);
      }, 800);
    } catch (err: any) {
      console.error("Permission error:", err);
      setPermissionState("denied");
      setErrorMessage("Camera or microphone permission was denied. You cannot take the proctored exam without these permissions.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto p-4 md:p-8 pt-12">
        <Card className="border-indigo-100 shadow-lg">
          <div className="h-2 w-full bg-indigo-600 rounded-t-xl" />
          <CardHeader className="text-center pb-8">
            <div className="mx-auto bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {permissionState === 'granted' ? "Permissions Granted" : `${course.title} Final Exam`}
            </CardTitle>
            <CardDescription className="text-lg mt-2 font-medium text-slate-600">
              {course.program}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Rules Section */}
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
                <div className={`flex items-center gap-2 font-medium ${permissionState === 'granted' ? 'text-green-600' : 'text-slate-600'}`}>
                  <Camera className="h-5 w-5" /> Camera
                </div>
                <div className={`flex items-center gap-2 font-medium ${permissionState === 'granted' ? 'text-green-600' : 'text-slate-600'}`}>
                  <Mic className="h-5 w-5" /> Microphone
                </div>
              </div>
              <p className="text-sm text-center text-slate-500 max-w-sm mb-6">
                {permissionState === 'granted' 
                  ? "Hardware access confirmed. You are ready to start the secure session."
                  : "To begin the exam, you must grant the browser permission to access your webcam and microphone."}
              </p>
              
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded mb-4 w-full text-center font-medium">
                    {errorMessage}
                </div>
              )}

              <Button 
                onClick={requestPermissions} 
                className={`w-full sm:w-auto text-lg px-8 py-6 h-auto transition-all ${
                  permissionState === 'granted' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={permissionState === 'requesting' || permissionState === 'granted'}
              >
                {permissionState === 'requesting' ? <ShieldAlert className="mr-2 h-5 w-5 animate-pulse"/> : <ShieldAlert className="mr-2 h-5 w-5"/>}
                {permissionState === 'requesting' 
                  ? "Requesting Permissions..." 
                  : (permissionState === 'granted' ? "Secure Session Ready" : "Grant Permissions & Start")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-slate-400 mt-8 uppercase font-bold tracking-[0.2em]">
          Secure Examination Environment • Powered by LMS Proctor
        </p>
      </div>
    </div>
  );
}
