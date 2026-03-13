import { NextResponse } from 'next/server';

// Global state for live class rooms to survive HMR
const _global = global as any;
if (!_global.liveRooms) {
  _global.liveRooms = new Map();
}
const rooms = _global.liveRooms;

interface RoomState {
  users: Map<string, any>;
  view: string;
  lessonIndex: number;
  strokes: any[];
  chats: any[];
  polls: any[];
  lastActivityTime: number;
}

export async function POST(req: Request, { params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    body = { events: [] };
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Map(),
      view: 'content',
      lessonIndex: 0,
      strokes: [],
      chats: [],
      polls: [],
      lastActivityTime: Date.now()
    } as RoomState);
  }

  const room = rooms.get(roomId) as RoomState;
  room.lastActivityTime = Date.now();

  const events = body.events || [];

  for (const event of events) {
    switch (event.type) {
      case 'join-room':
        room.users.set(event.payload.id, { ...event.payload, online: true, lastSeen: Date.now() });
        break;
      case 'change-view':
        room.view = event.payload;
        break;
      case 'change-lesson':
        room.lessonIndex = event.payload;
        break;
      case 'draw-stroke':
        room.strokes.push(event.payload);
        break;
      case 'clear-board':
        room.strokes = [];
        break;
      case 'send-chat':
        room.chats.push(event.payload);
        break;
      case 'create-poll':
        room.polls.push(event.payload);
        break;
      case 'cast-vote':
        const pollIndex = room.polls.findIndex((p: any) => p.id === event.payload.pollId);
        if (pollIndex !== -1) {
          const poll = room.polls[pollIndex];
          poll.votes[event.payload.optionIdx]++;
        }
        break;
      case 'heartbeat':
        if (event.payload?.id && room.users.has(event.payload.id)) {
           room.users.get(event.payload.id).lastSeen = Date.now();
        }
        break;
    }
  }

  // Cleanup inactive users (not seen in 10 seconds)
  const now = Date.now();
  for (const [userId, user] of room.users.entries()) {
    if (now - user.lastSeen > 10000) {
      room.users.delete(userId);
    }
  }

  return NextResponse.json({
    users: Array.from(room.users.values()),
    view: room.view,
    lessonIndex: room.lessonIndex,
    strokes: room.strokes,
    chats: room.chats,
    polls: room.polls,
    timestamp: Date.now()
  });
}
