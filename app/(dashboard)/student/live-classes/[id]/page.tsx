"use client";

import { useParams } from "next/navigation";
import { getLiveClass, getCourse, getChatMessages, getPolls } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/store/session";

export default function LiveClassPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useSession();
  const liveClass = getLiveClass(id);
  const course = liveClass ? getCourse(liveClass.courseId) : null;
  const messages = liveClass ? getChatMessages(liveClass.id) : [];
  const polls = liveClass ? getPolls(liveClass.id) : [];
  const [chatInput, setChatInput] = useState("");

  if (!liveClass) return <p>Live class not found</p>;

  const isFaculty = user?.role === "faculty";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{liveClass.title}</h1>
        <p className="text-muted-foreground">{course?.code} • {liveClass.status}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Classroom</CardTitle>
              <p className="text-sm text-muted-foreground">
                Simulated meeting. In production this would embed Zoom/Meet.
              </p>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Video stream would appear here</p>
              </div>
              <Button className="mt-4" asChild>
                <a href={liveClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                  Open in new tab (demo link)
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                In-class Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {messages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <span className="font-medium">{m.userName}:</span> {m.message}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button disabled>Send (simulated)</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Polls
              </CardTitle>
            </CardHeader>
            <CardContent>
              {polls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No polls yet</p>
              ) : (
                <div className="space-y-4">
                  {polls.map((p) => (
                    <div key={p.id} className="space-y-2">
                      <p className="font-medium text-sm">{p.question}</p>
                      <div className="space-y-1">
                        {p.options.map((opt, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span>{opt}</span>
                            <Badge variant="secondary">
                              {p.responses.filter((r) => r.optionIndex === i).length} votes
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isFaculty && (
                <Button variant="outline" className="mt-4 w-full" disabled>
                  Create Poll (simulated)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
