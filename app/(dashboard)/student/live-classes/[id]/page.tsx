"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useParams, useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { getLiveClass, getCourse, getLessons } from "@/lib/data";
import { getCourseSyllabus } from "@/lib/syllabusMap";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  PenLine,
  BarChart2,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  Hand,
  Send,
  Plus,
  Trash2,
  Clock,
  Eraser,
  Wifi,
  X,
  Sparkles,
  ImageIcon,
  Lightbulb,
  FileText,
  CheckCircle2,
  Circle,
  Maximize2,
  Minimize2,
  Radio,
  Tablet,
  QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";

// ─── Static mock data ────────────────────────────────────────────────────────

const MOCK_STUDENTS = [
  { id: "s1", name: "Rahul Verma", avatar: "RV", handRaised: false, online: true },
  { id: "s2", name: "Priya Patel", avatar: "PP", handRaised: true, online: true },
  { id: "s3", name: "Arjun Kumar", avatar: "AK", handRaised: false, online: true },
  { id: "s4", name: "Sneha Rao", avatar: "SR", handRaised: false, online: true },
  { id: "s5", name: "Dev Shah", avatar: "DS", handRaised: false, online: false },
];

const EMOJI_REACTIONS = ["👏", "❤️", "😮", "😂", "🔥", "👍"];

type Tab = "lessons" | "board" | "people" | "chat" | "polls";
type DrawTool = "pen" | "eraser";

// ─── Whiteboard Component ─────────────────────────────────────────────────────

function Whiteboard({ isTeacher, socket, roomId }: { isTeacher: boolean; socket: Socket | null; roomId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [color, setColor] = useState("#1d4ed8");
  const [size, setSize] = useState(3);

  const COLORS = ["#1d4ed8", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#000000", "#ffffff"];

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTeacher) return;
    drawing.current = true;
    const canvas = canvasRef.current!;
    lastPos.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current || !isTeacher) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? size * 6 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (socket && isTeacher) {
      socket.emit("draw-stroke", roomId, {
        x0: lastPos.current!.x,
        y0: lastPos.current!.y,
        x1: pos.x,
        y1: pos.y,
        color,
        size,
        tool,
      });
    }

    lastPos.current = pos;
  };

  const endDraw = () => { drawing.current = false; lastPos.current = null; };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (socket && isTeacher) {
      socket.emit("clear-board", roomId);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStroke = (s: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.strokeStyle = s.tool === "eraser" ? "#ffffff" : s.color;
      ctx.lineWidth = s.tool === "eraser" ? s.size * 6 : s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    socket.on("new-stroke", handleStroke);
    socket.on("board-cleared", handleClear);

    return () => {
      socket.off("new-stroke", handleStroke);
      socket.off("board-cleared", handleClear);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {isTeacher && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-gradient-to-r from-muted/40 to-muted/10 shrink-0 flex-wrap">
          {/* Tool toggle */}
          <div className="flex rounded-lg overflow-hidden border">
            <button
              onClick={() => setTool("pen")}
              className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors", tool === "pen" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              <PenLine className="h-3.5 w-3.5" /> Pen
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors", tool === "eraser" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              <Eraser className="h-3.5 w-3.5" /> Eraser
            </button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); setTool("pen"); }}
                className={cn("h-5 w-5 rounded-full border-2 transition-transform", color === c && tool === "pen" ? "border-primary scale-125" : "border-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Size</span>
            <input type="range" min={1} max={10} value={size} onChange={(e) => setSize(+e.target.value)} className="w-20 h-1.5 accent-primary" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* iPad connection badge */}
            <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-200 bg-green-50">
              <Wifi className="h-3 w-3" /> iPad Connected
            </Badge>
            <Button variant="outline" size="sm" onClick={clearCanvas} className="h-7 text-xs gap-1">
              <Trash2 className="h-3 w-3" /> Clear
            </Button>
          </div>
        </div>
      )}

      {!isTeacher && (
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 shrink-0">
          <span className="text-xs text-muted-foreground">Teacher's whiteboard (live)</span>
          <Badge variant="outline" className="gap-1 text-[10px] ml-auto text-green-600 border-green-200 bg-green-50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
          </Badge>
        </div>
      )}

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1600}
          height={900}
          className={cn("w-full h-full", isTeacher ? "cursor-crosshair" : "cursor-default")}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{ touchAction: "none" }}
        />
        {!isTeacher && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/40 text-sm select-none">Viewing teacher's board</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Poll Modal ─────────────────────────────────────────────────────────

function CreatePollModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (q: string, opts: string[], dur: number, correctIdx: number | null) => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(30);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Create Live Poll</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Question</label>
          <Input placeholder="Ask the class…" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground flex justify-between">
            <span>Options</span>
            <span className="text-[10px] opacity-70 italic">Click circle to mark as correct</span>
          </label>
          {options.map((o, i) => (
            <div key={i} className="flex gap-2 items-center">
              <button
                onClick={() => setCorrectAnswer(correctAnswer === i ? null : i)}
                className={cn(
                  "h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                  correctAnswer === i ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"
                )}
              >
                {correctAnswer === i && <Check className="h-3 w-3" />}
              </button>
              <Input
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={(e) => setOptions(opts => opts.map((x, j) => j === i ? e.target.value : x))}
                className="h-8 text-sm"
              />
              {options.length > 2 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setOptions(o => o.filter((_, j) => j !== i))}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
          {options.length < 5 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setOptions(o => [...o, ""])}>
              <Plus className="h-3 w-3" /> Add option
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-muted-foreground shrink-0">Duration</label>
          <input type="range" min={10} max={120} step={10} value={duration} onChange={(e) => setDuration(+e.target.value)} className="flex-1 accent-primary" />
          <span className="text-sm font-medium w-12 text-right">{duration}s</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={() => {
            if (question.trim() && options.filter(Boolean).length >= 2) {
              onCreate(question, options.filter(Boolean), duration, correctAnswer);
            }
          }}>
            Launch Poll
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Poll Popup ───────────────────────────────────────────────────────

function StudentPollPopup({ poll, onVote, totalJoined, onClose }: {
  poll: { id: string; question: string; options: string[]; votes: number[]; ended: boolean; duration: number; timeLeft: number; myVote: number | null; correctAnswer: number | null };
  onVote: (pollId: string, optionIdx: number) => void;
  totalJoined: number;
  onClose: () => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const totalVotes = poll.votes.reduce((a, b) => a + b, 0);

  const handleSubmit = () => {
    if (selectedIdx !== null) {
      onVote(poll.id, selectedIdx);
      onClose(); // Close immediately after manual submission
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card border rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 relative overflow-hidden">
        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 h-1.5 bg-primary/20 w-full">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${(poll.timeLeft / poll.duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs gap-1.5 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Poll
          </Badge>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-bold">{poll.timeLeft}s left</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold leading-tight tracking-tight">
          {poll.question}
        </h2>

        <div className="space-y-3">
          {poll.options.map((opt, i) => {
            const isSelected = selectedIdx === i;
            const hasVoted = poll.myVote !== null;

            return (
              <button
                key={i}
                disabled={hasVoted || poll.ended}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "w-full group relative rounded-2xl border-2 p-5 text-left transition-all duration-200",
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
                  hasVoted && "cursor-default opacity-80"
                )}
              >
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-lg font-medium">{opt}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="h-4 w-4" />
            {totalVotes} response{totalVotes !== 1 ? "s" : ""}
          </div>

          <Button
            disabled={selectedIdx === null || poll.myVote !== null || poll.ended}
            onClick={handleSubmit}
            className="rounded-xl px-6"
          >
            Submit Answer
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground italic">
          Poll will auto-submit or close when the timer expires.
        </p>
      </div>
    </div>
  );
}

export default function LiveClassPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useSession();
  const liveClass = getLiveClass(id);
  const course = liveClass ? getCourse(liveClass.courseId) : null as any;
  const isTeacher = user?.role === "faculty";
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);

  // Detect iPad/tablet mode via URL param ?tabview=true
  const searchParams = useSearchParams();
  const isTabletView = searchParams.get("tabview") === "true";

  // QR modal state (desktop faculty only)
  const [showQR, setShowQR] = useState(false);
  const tabletUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?tabview=true`
    : ``;

  // Sidebar tab
  const [tab, setTab] = useState<Tab>("lessons");
  // Current main view: "content" or "board"
  const [mainView, setMainView] = useState<"content" | "board">("content");
  // Lesson selection (from course syllabus)
  const syllabusData = course ? getCourseSyllabus(course.id) : null;
  const allModules = syllabusData?.course?.modules ?? [];
  const allLessons = allModules.flatMap((m) => {
    const chapters = m.chapters ?? [];
    const lessons = chapters.flatMap((ch) => ch.lessons ?? []);
    return lessons.map((l) => ({
      ...l,
      moduleName: m.title,
      // Aggregating all subtopic contents into a single list for the explanation panel
      paragraphs: l.topics?.flatMap(t => t.subtopics?.map(s => s.content).filter(Boolean) ?? []) ?? [],
      // Aggregating all examples
      allExamples: l.topics?.flatMap(t => t.subtopics?.flatMap(s => s.examples?.map(ex => ({ title: s.title, text: ex })) ?? []) ?? []) ?? [],
      // Aggregating all images
      allImages: l.topics?.flatMap(t => t.subtopics?.flatMap(s => s.images?.map(img => ({ caption: s.title, url: img })) ?? []) ?? []) ?? []
    }));
  });

  const [lessonIndex, setLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const currentLesson = allLessons[lessonIndex];

  // Students state (joined students)
  const [students, setStudents] = useState<{ id: string; name: string; avatar: string; role: string; handRaised?: boolean; online?: boolean }[]>([]);
  const [host, setHost] = useState<{ name: string; avatar: string } | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { id: "c1", user: "Priya Patel", text: "Ready to learn!", time: "10:01" },
    { id: "c2", user: "Rahul Verma", text: "Good morning!", time: "10:02" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Emoji reactions
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; x: number }[]>([]);

  // Polls
  const [polls, setPolls] = useState<{
    id: string; question: string; options: string[];
    votes: number[]; ended: boolean; duration: number; timeLeft: number; myVote: number | null;
    correctAnswer: number | null;
  }[]>([
    {
      id: "p0", question: "Are you familiar with negative integers?",
      options: ["Yes, fully", "Somewhat", "Not really"],
      votes: [2, 1, 1], ended: true, duration: 30, timeLeft: 0, myVote: 0, correctAnswer: 0,
    },
  ]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [timerRefs] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Example panel pagination
  const [examplePage, setExamplePage] = useState(0);
  const [imagePage, setImagePage] = useState(0);

  // ── Timer for polls
  useEffect(() => {
    polls.forEach((poll) => {
      if (!poll.ended && !timerRefs.has(poll.id)) {
        const interval = setInterval(() => {
          setPolls((prev) =>
            prev.map((p) => {
              if (p.id !== poll.id) return p;
              if (p.timeLeft <= 1) {
                clearInterval(interval);
                timerRefs.delete(p.id);
                // Dismiss popup after timer ends (e.g., after 2 seconds to see results).
                if (p.id === activePollId) {
                  setTimeout(() => setActivePollId(null), 3000);
                }
                return { ...p, timeLeft: 0, ended: true };
              }
              return { ...p, timeLeft: p.timeLeft - 1 };
            })
          );
        }, 1000);
        timerRefs.set(poll.id, interval);
      }
    });
  }, [polls.length, isTeacher, activePollId]);

  // Elapsed session timer
  useEffect(() => {
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!pageRef.current) return;
    if (!document.fullscreenElement) {
      pageRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // Socket init
  useEffect(() => {
    const s = io();
    console.log("[Socket] Attempting to connect...");
    setSocket(s);
    if (user) {
      const avatar = user.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : (user.email ? user.email.slice(0, 2).toUpperCase() : "??");

      console.log("[Socket] Joining room:", id, "as", user.name || user.email);
      s.emit("join-room", id, {
        id: user.id,
        name: user.name || user.email || "Anonymous",
        avatar,
        role: user.role,
        online: true
      });
    }

    s.on("connect", () => {
      console.log("[Socket] Connected with ID:", s.id);
    });

    s.on("view-changed", (v: "content" | "board") => {
      console.log("[Socket] View changed to:", v);
      if (!isTeacher) {
        setMainView(v);
        setTab(v === "board" ? "board" : "lessons");
      }
    });

    s.on("lesson-changed", (idx: number) => {
      console.log("[Socket] Lesson changed to index:", idx);
      if (!isTeacher) setLessonIndex(idx);
    });

    s.on("new-chat-message", (msg) => {
      setChatMessages((m) => [...m, msg]);
    });

    s.on("users-updated", (userList: any[]) => {
      console.log("[Socket] Users updated:", userList);
      // Filter for students
      setStudents(userList.filter((u: any) => u.role === "student"));
      // Find the faculty/host
      const faculty = userList.find((u: any) => u.role === "faculty");
      if (faculty) {
        setHost({ name: faculty.name, avatar: faculty.avatar });
      }
    });

    s.on("poll-created", (pollData) => {
      console.log("[Socket] Poll created received:", pollData);
      if (!isTeacher) {
        setPolls(p => [...p, pollData]);
        setActivePollId(pollData.id);
        console.log("[Socket] Set activePollId to:", pollData.id);
        setTab("polls");
      }
    });

    s.on("vote-cast", ({ pollId, optionIdx }) => {
      console.log("[Socket] Vote cast received for poll:", pollId);
      setPolls(prev => prev.map(p =>
        p.id === pollId
          ? { ...p, votes: p.votes.map((v, i) => i === optionIdx ? v + 1 : v) }
          : p
      ));
    });

    return () => {
      console.log("[Socket] Disconnecting...");
      s.disconnect();
    };
  }, [id, isTeacher, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Handlers
  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = {
      id: Date.now().toString(),
      user: user?.name ?? "Me",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((m) => [...m, msg]);
    setChatInput("");
    if (socket) {
      socket.emit("send-chat", id, msg);
    }
  };

  const sendEmoji = (emoji: string) => {
    const id = Date.now().toString();
    setFloatingEmojis((e) => [...e, { id, emoji, x: Math.random() * 80 + 10 }]);
    setTimeout(() => setFloatingEmojis((e) => e.filter((x) => x.id !== id)), 2000);
    // Also add to chat as a reaction
    setChatMessages((m) => [...m, {
      id,
      user: user?.name ?? "Me",
      text: emoji,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  };

  const raiseHand = () => {
    const student = students.find(s => s.id === user?.id);
    if (!student) return;
    const newState = !student.handRaised;
    setStudents((s) => s.map((st) => st.id === user?.id ? { ...st, handRaised: newState } : st));
    // In a full implementation, we'd emit a socket event here too
  };

  const createPoll = (question: string, options: string[], duration: number, correctAnswer: number | null) => {
    const newPoll = {
      id: Date.now().toString(),
      question,
      options,
      votes: options.map(() => 0),
      ended: false,
      duration,
      timeLeft: duration,
      myVote: null,
      correctAnswer,
    };
    setPolls((p) => [...p, newPoll]);
    setShowCreatePoll(false);
    setTab("polls");
    if (socket) {
      socket.emit("create-poll", id, newPoll);
    }
  };

  const votePoll = (pollId: string, optionIdx: number) => {
    setPolls((p) => p.map((poll) =>
      poll.id === pollId && poll.myVote === null
        ? { ...poll, myVote: optionIdx, votes: poll.votes.map((v, i) => i === optionIdx ? v + 1 : v) }
        : poll
    ));
    if (socket) {
      socket.emit("cast-vote", id, { pollId, optionIdx });
    }
  };

  const markComplete = () => {
    if (!currentLesson) return;
    setCompletedLessons((s) => { const n = new Set(s); n.add(currentLesson.id); return n; });
  };

  const nextLesson = () => {
    if (lessonIndex < allLessons.length - 1) {
      const newIdx = lessonIndex + 1;
      setLessonIndex(newIdx);
      if (socket && isTeacher) socket.emit("change-lesson", id, newIdx);
    }
  };

  const prevLesson = () => {
    if (lessonIndex > 0) {
      const newIdx = lessonIndex - 1;
      setLessonIndex(newIdx);
      if (socket && isTeacher) socket.emit("change-lesson", id, newIdx);
    }
  };

  if (!liveClass) return <p className="p-8 text-muted-foreground">Live class not found</p>;

  // ── Tablet / iPad Mode: faculty opened URL with ?tabview=true → whiteboard only
  if (isTeacher && isTabletView) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
        {/* Minimal header */}
        <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b bg-card shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-400/30 text-red-500 text-[11px] font-bold tracking-wide">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
            <span className="text-xs font-semibold text-muted-foreground">iPad Whiteboard Mode</span>
          </div>
          <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
            <Wifi className="h-3 w-3" /> Syncing
          </Badge>
        </div>
        {/* Full-screen whiteboard — draws sync to all students via socket */}
        <div className="flex-1 overflow-hidden">
          <Whiteboard isTeacher={true} socket={socket} roomId={id} />
        </div>
      </div>
    );
  }

  // ── Nav tabs for sidebar
  const TABS: { id: Tab; icon: typeof BookOpen; label: string; badge?: number }[] = [
    { id: "lessons", icon: BookOpen, label: "Lessons" },
    { id: "board", icon: PenLine, label: "Board" },
    { id: "people", icon: Users, label: "People", badge: students.length || undefined },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "polls", icon: BarChart2, label: "Polls", badge: polls.filter(p => !p.ended).length || undefined },
  ];

  const activePoll = polls.find(p => !p.ended);

  return (
    <div ref={pageRef} className="flex h-[calc(100vh-7rem)] overflow-hidden -m-6 bg-background">
      {/* ══════ Left Sidebar (icon strip) ══════ */}
      <div className="w-14 shrink-0 border-r bg-card flex flex-col items-center py-3 gap-1 shadow-sm">
        {TABS.map(({ id: tabId, icon: Icon, label, badge }) => {
          // Students cannot switch to Board or Lessons tabs manually — those are teacher-controlled
          const studentRestricted = !isTeacher && (tabId === "board" || tabId === "lessons");
          return (
            <button
              key={tabId}
              onClick={() => {
                if (studentRestricted) return;
                setTab(tabId);
                if (tabId === "board") setMainView("board");
                else if (tabId === "lessons") setMainView("content");
              }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 w-10 h-12 rounded-xl transition-colors text-[10px] font-medium",
                tab === tabId ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                studentRestricted && "opacity-40 cursor-not-allowed hover:bg-transparent"
              )}
              title={studentRestricted ? `${label} (controlled by teacher)` : label}
            >
              <Icon className="h-4 w-4 mt-2" />
              <span className="leading-none">{label}</span>
              {badge ? (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ══════ Left Detail Panel ══════ */}
      <div className="w-56 shrink-0 border-r bg-card flex flex-col overflow-hidden">
        {/* Lessons tab */}
        {tab === "lessons" && (
          <>
            <div className="px-3 py-3 border-b shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course Outline</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-3">
                {allModules.map((mod) => {
                  const modLessons = mod.chapters?.flatMap((ch) => ch.lessons ?? []) ?? [];
                  return (
                    <div key={mod.id}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-1">{mod.title}</p>
                      {modLessons.map((l: any, li: any) => {
                        const globalIdx = allLessons.findIndex((al: any) => al.id === l.id);
                        const isActive = l.id === currentLesson?.id;
                        const isDone = completedLessons.has(l.id);
                        return (
                          <button
                            key={l.id}
                            onClick={() => {
                              if (!isTeacher) return;
                              setLessonIndex(globalIdx);
                              setMainView("content");
                              setTab("lessons");
                              if (socket) {
                                socket.emit("change-lesson", id, globalIdx);
                                socket.emit("change-view", id, "content");
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs text-left transition-colors",
                              isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground",
                              isTeacher ? "hover:bg-muted hover:text-foreground cursor-pointer" : "cursor-default"
                            )}
                          >
                            {isDone
                              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                              : isActive
                                ? <Circle className="h-3.5 w-3.5 shrink-0 text-primary fill-primary" />
                                : <Circle className="h-3.5 w-3.5 shrink-0" />
                            }
                            <span className="truncate">{l.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Board tab */}
        {tab === "board" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <PenLine className="h-8 w-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Whiteboard is open in the main panel.</p>
            {isTeacher && (
              <Badge variant="outline" className="text-[10px] gap-1 text-green-600 border-green-200 bg-green-50">
                <Wifi className="h-2.5 w-2.5" /> iPad mode available
              </Badge>
            )}
          </div>
        )}

        {/* People tab */}
        {tab === "people" && (
          <>
            <div className="px-3 py-3 border-b shrink-0 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Participants</p>
              <Badge variant="secondary" className="text-[10px]">{students.filter(s => s.online).length} online</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Host entry */}
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/5">
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 uppercase">
                    {host ? host.avatar : (isTeacher ? (user?.name ?? "T").slice(0, 2) : "H")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{host ? host.name : (isTeacher ? (user?.name ?? "Teacher") : "Host")}</p>
                    <p className="text-[10px] text-primary">Host</p>
                  </div>
                </div>
                {students.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted">
                    <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                      s.online ? "bg-slate-500" : "bg-slate-300 opacity-50")}>
                      {s.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs font-medium truncate", !s.online && "opacity-50")}>{s.name}</p>
                      {!s.online && <p className="text-[10px] text-muted-foreground">offline</p>}
                    </div>
                    {s.handRaised && (
                      <span title="Hand raised" className="text-sm animate-bounce">✋</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Chat tab */}
        {tab === "chat" && (
          <>
            <div className="px-3 py-3 border-b shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Class Chat</p>
            </div>
            <ScrollArea className="flex-1 px-3 py-2">
              <div className="space-y-2">
                {chatMessages.map((m) => (
                  <div key={m.id} className="space-y-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-semibold">{m.user}</span>
                      <span className="text-[9px] text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="text-xs bg-muted rounded-lg px-2.5 py-1.5 leading-snug">{m.text}</p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="p-2 border-t shrink-0 flex gap-1.5">
              <Input
                placeholder="Message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="h-8 text-xs"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={sendChat}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}

        {/* Polls tab */}
        {tab === "polls" && (
          <>
            <div className="px-3 py-3 border-b shrink-0 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Polls</p>
              {isTeacher && (
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => setShowCreatePoll(true)}>
                  <Plus className="h-2.5 w-2.5" /> New
                </Button>
              )}
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {polls.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No polls yet</p>
                )}
                {[...polls].reverse().map((poll) => {
                  const total = poll.votes.reduce((a, b) => a + b, 0);
                  return (
                    <div key={poll.id} className="space-y-2 rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug">{poll.question}</p>
                        {!poll.ended
                          ? <Badge className="text-[9px] gap-1 bg-green-500 shrink-0"><Clock className="h-2.5 w-2.5" />{poll.timeLeft}s</Badge>
                          : <Badge variant="secondary" className="text-[9px] shrink-0">Ended</Badge>
                        }
                      </div>
                      <div className="space-y-1.5">
                        {poll.options.map((opt, i) => {
                          const pct = total > 0 ? Math.round((poll.votes[i] / total) * 100) : 0;
                          const voted = poll.myVote === i;
                          const isCorrect = poll.correctAnswer === i;
                          return (
                            <button
                              key={i}
                              disabled={poll.ended || poll.myVote !== null || isTeacher}
                              onClick={() => votePoll(poll.id, i)}
                              className={cn(
                                "w-full relative rounded-lg overflow-hidden text-left transition-all",
                                (isTeacher || poll.ended || poll.myVote !== null)
                                  ? "cursor-default"
                                  : "hover:border-primary cursor-pointer",
                                "border",
                                isCorrect && (isTeacher || poll.ended) && "border-green-500/50"
                              )}
                            >
                              <div
                                className={cn("absolute inset-y-0 left-0 transition-all duration-500",
                                  isCorrect && (isTeacher || poll.ended) ? "bg-green-500/10" : voted ? "bg-primary/20" : "bg-muted"
                                )}
                                style={{ width: (isTeacher || poll.ended || poll.myVote !== null) ? `${pct}%` : "0%" }}
                              />
                              <div className="relative flex items-center justify-between px-2.5 py-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">{opt}</span>
                                  {isCorrect && (isTeacher || poll.ended) && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                                </div>
                                {(isTeacher || poll.ended || poll.myVote !== null) && (
                                  <span className="text-[10px] font-semibold text-muted-foreground">{pct}%</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {(isTeacher || poll.ended) && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-muted-foreground">{total} response{total !== 1 ? "s" : ""}</p>
                          {isTeacher && poll.correctAnswer !== null && (
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-[9px] text-green-600 border-green-200 bg-green-50 px-1.5 py-0">
                                Success: {poll.votes[poll.correctAnswer]}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] text-red-600 border-red-200 bg-red-50 px-1.5 py-0">
                                Wrong/Skipped: {students.length - poll.votes[poll.correctAnswer]}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* ══════ Main Content Area ══════ */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="h-13 border-b px-4 flex items-center gap-3 shrink-0 bg-card shadow-sm">
          {/* LIVE badge + timer */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-400/30 text-red-500 text-[11px] font-bold tracking-wide">
              <Radio className="h-3 w-3 animate-pulse" /> LIVE
            </span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-border shrink-0" />

          {/* Lesson nav */}
          <div className="flex items-center gap-1 min-w-0">
            {isTeacher && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={prevLesson} disabled={lessonIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="text-sm min-w-0">
              {!isTeacher && (
                <span className="text-[10px] font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5 mr-1.5">Following Teacher</span>
              )}
              <span className="text-muted-foreground">{currentLesson?.moduleName} · </span>
              <span className="font-semibold truncate">{currentLesson?.title ?? "No lesson"}</span>
            </div>
            {isTeacher && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={nextLesson} disabled={lessonIndex >= allLessons.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle — faculty only */}
            {isTeacher ? (
              <div className="flex rounded-lg border overflow-hidden shadow-sm">
                <button
                  onClick={() => { setMainView("content"); setTab("lessons"); if (socket) socket.emit("change-view", id, "content"); }}
                  className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all", mainView === "content" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  <Sparkles className="h-3 w-3" /> Content
                </button>
                <button
                  onClick={() => { setMainView("board"); setTab("board"); if (socket) socket.emit("change-view", id, "board"); }}
                  className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all", mainView === "board" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
                >
                  <PenLine className="h-3 w-3" /> Board
                </button>
              </div>
            ) : (
              <div className="flex rounded-lg border overflow-hidden opacity-60 pointer-events-none select-none" title="View is controlled by teacher">
                <span className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5", mainView === "content" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Sparkles className="h-3 w-3" /> Content
                </span>
                <span className={cn("px-3 py-1.5 text-xs flex items-center gap-1.5", mainView === "board" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <PenLine className="h-3 w-3" /> Board
                </span>
              </div>
            )}

            {/* Mark complete / next */}
            {isTeacher && mainView === "content" && (
              <>
                {currentLesson && !completedLessons.has(currentLesson.id) ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50" onClick={markComplete}>
                    <Check className="h-3 w-3" /> Mark Complete
                  </Button>
                ) : (
                  <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50 border border-green-200 text-xs">
                    <CheckCircle2 className="h-3 w-3" /> Completed
                  </Badge>
                )}
                <Button size="sm" className="h-7 text-xs gap-1" onClick={nextLesson} disabled={lessonIndex >= allLessons.length - 1}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            )}

            {/* Student: raise hand + emojis */}
            {!isTeacher && (
              <>
                <button
                  onClick={raiseHand}
                  className={cn(
                    "h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors border",
                    students.find(s => s.id === "s1")?.handRaised
                      ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                      : "hover:bg-muted"
                  )}
                >
                  <Hand className="h-3.5 w-3.5" />
                  {students.find(s => s.id === "s1")?.handRaised ? "Lower Hand" : "Raise Hand"}
                </button>
                <div className="flex items-center gap-0.5">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => sendEmoji(emoji)}
                      className="h-8 w-8 rounded-lg text-base flex items-center justify-center hover:bg-muted transition-colors">
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Faculty: iPad / QR mode button */}
            {isTeacher && (
              <button
                onClick={() => setShowQR(true)}
                title="Open on iPad / Phone / Tablet"
                className="h-8 px-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
              >
                <Tablet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">iPad Mode</span>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors border text-muted-foreground hover:text-foreground"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Live poll banner for students */}
        {!isTeacher && activePoll && (
          <div className="shrink-0 border-b bg-amber-50 dark:bg-amber-950/30 px-4 py-2 flex items-center gap-3">
            <Badge className="bg-amber-500 text-white gap-1 text-xs shrink-0">
              <Clock className="h-3 w-3" /> Poll · {activePoll.timeLeft}s
            </Badge>
            <p className="text-sm font-medium truncate">{activePoll.question}</p>
            <Button size="sm" className="h-6 text-xs shrink-0 ml-auto" onClick={() => setTab("polls")}>Answer</Button>
          </div>
        )}

        {/* Content OR Whiteboard */}
        {mainView === "content" ? (
          <div className="flex-1 overflow-hidden grid grid-cols-2 grid-rows-2 gap-3 p-4">

            {/* Panel 1: Explanation (spans full left column) */}
            <div className="row-span-2 border rounded-xl flex flex-col overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Explanation</span>
                <Sparkles className="h-3 w-3 text-primary/50 ml-1" />
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {currentLesson?.paragraphs && currentLesson.paragraphs.length > 0 ? (
                    currentLesson.paragraphs.map((para: string | undefined, i: number) => para && (
                      <div key={i} className="space-y-2">
                        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                          {para}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <p className="text-sm">No detailed explanation available for this lesson.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Panel 2: Examples (top right) */}
            <div className="border rounded-xl flex flex-col overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-gradient-to-r from-amber-500/5 to-transparent">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Solved Examples</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => setExamplePage(p => Math.max(0, p - 1))} disabled={examplePage === 0} className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] text-muted-foreground">{examplePage + 1} / {Math.max(1, currentLesson?.allExamples?.length ?? 0)}</span>
                  <button onClick={() => setExamplePage(p => Math.min((currentLesson?.allExamples?.length ?? 1) - 1, p + 1))} disabled={examplePage >= (currentLesson?.allExamples?.length ?? 1) - 1} className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  {currentLesson?.allExamples && currentLesson.allExamples.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">{currentLesson.allExamples[examplePage]?.title}</h4>
                      <pre className="text-[11px] bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap text-muted-foreground">
                        {currentLesson.allExamples[examplePage]?.text}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-40">
                      <Lightbulb className="h-8 w-8 mb-2" />
                      <p className="text-xs">No examples available.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Panel 3: Visual Aids (bottom right) */}
            <div className="border rounded-xl flex flex-col overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-gradient-to-r from-violet-500/5 to-transparent">
                <ImageIcon className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold">Visual Aids</span>
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => setImagePage(p => Math.max(0, p - 1))} disabled={imagePage === 0} className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[10px] text-muted-foreground">{imagePage + 1} / {Math.max(1, currentLesson?.allImages?.length ?? 0)}</span>
                  <button onClick={() => setImagePage(p => Math.min((currentLesson?.allImages?.length ?? 1) - 1, p + 1))} disabled={imagePage >= (currentLesson?.allImages?.length ?? 1) - 1} className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col items-center justify-center">
                {currentLesson?.allImages && currentLesson.allImages.length > 0 ? (
                  <div className="w-full flex flex-col items-center justify-center gap-3 h-full">
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-inner bg-muted/30">
                      <img
                        src={currentLesson.allImages[imagePage]?.url}
                        alt={currentLesson.allImages[imagePage]?.caption}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/800x450?text=${encodeURIComponent(currentLesson.allImages[imagePage]?.caption || "Visual Aid")}`;
                        }}
                      />
                    </div>
                    <p className="text-[10px] font-medium text-center text-muted-foreground px-2">
                      {currentLesson.allImages[imagePage]?.caption}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center opacity-30 gap-2">
                    <ImageIcon className="h-10 w-10" />
                    <p className="text-xs">No visual aids available.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Whiteboard isTeacher={isTeacher} socket={socket} roomId={id} />
          </div>
        )}

        {/* Floating emoji reactions */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
          {floatingEmojis.map(({ id, emoji, x }) => (
            <div
              key={id}
              className="absolute bottom-16 text-3xl"
              style={{
                left: `${x}%`,
                animation: "floatUp 2s ease-out forwards",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Poll creation modal */}
      {showCreatePoll && (
        <CreatePollModal onClose={() => setShowCreatePoll(false)} onCreate={createPoll} />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
      `}} />
      {/* Student Poll Popup Overlay */}
      {!isTeacher && activePollId && (
        (() => {
          const p = polls.find(p => p.id === activePollId);
          if (!p) return null;
          return (
            <StudentPollPopup
              poll={p}
              onVote={votePoll}
              totalJoined={students.length}
              onClose={() => setActivePollId(null)}
            />
          );
        })()
      )}

      {/* ── QR Code Modal (faculty desktop) ───────────────────────────────── */}
      {showQR && isTeacher && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-5">
            {/* Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Tablet className="h-5 w-5 text-violet-600" />
                <h3 className="font-semibold text-base">Open on iPad / Phone</h3>
              </div>
              <button
                onClick={() => setShowQR(false)}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-xl border">
              <QRCode value={tabletUrl} size={200} />
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Scan with your iPad, phone, or tablet camera.
              <br />Opens the whiteboard in drawing-only mode.
            </p>

            {/* Copyable URL */}
            <div className="w-full flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <QrCode className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">{tabletUrl}</span>
              <button
                className="text-[10px] text-primary font-medium shrink-0 hover:underline"
                onClick={() => navigator.clipboard.writeText(tabletUrl)}
              >
                Copy
              </button>
            </div>

            <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50 w-full justify-center py-1.5">
              <Wifi className="h-3 w-3" /> Drawings will sync in real-time to all students
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
