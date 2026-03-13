const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const roomUsers = new Map(); // roomId -> Set of users {id, name, role}

  io.on("connection", (socket) => {
    let currentUser = null;
    let currentRoom = null;

    // Join a class room
    socket.on("join-room", (roomId, userData) => {
      console.log(`[Socket] User ${userData?.name} joining room ${roomId}`);
      socket.join(roomId);
      currentRoom = roomId;
      currentUser = userData;

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      
      const usersInRoom = roomUsers.get(roomId);
      // Mark as online when joining
      usersInRoom.set(socket.id, { ...userData, online: true });

      const currentList = Array.from(usersInRoom.values());
      console.log(`[Socket] Updated user list for room ${roomId}:`, currentList.length, "users");
      io.to(roomId).emit("users-updated", currentList);
    });

    // Handle view changes
    socket.on("change-view", (roomId, view) => {
      socket.to(roomId).emit("view-changed", view);
    });

    // Handle lesson change
    socket.on("change-lesson", (roomId, lessonIndex) => {
      socket.to(roomId).emit("lesson-changed", lessonIndex);
    });

    // Handle drawing strokes
    socket.on("draw-stroke", (roomId, strokeData) => {
      socket.to(roomId).emit("new-stroke", strokeData);
    });
    
    // Handle clearing board
    socket.on("clear-board", (roomId) => {
      socket.to(roomId).emit("board-cleared");
    });

    // Handle chat message
    socket.on("send-chat", (roomId, messageData) => {
      socket.to(roomId).emit("new-chat-message", messageData);
    });

    // Handle poll creation
    socket.on("create-poll", (roomId, pollData) => {
      console.log(`[Socket] Poll created in room ${roomId}:`, pollData.question);
      socket.to(roomId).emit("poll-created", pollData);
    });

    // Handle poll vote
    socket.on("cast-vote", (roomId, pollId, optionIdx) => {
    console.log(`[Socket] Vote cast in ${roomId}: poll ${pollId}, option ${optionIdx}`);
    socket.to(roomId).emit("vote-cast", { pollId, optionIdx });
  });

  socket.on("content-highlight", (roomId, highlightData) => {
    // highlightData: { type, id, ranges, active, clearAll, isRemove }
    console.log(`[Socket] Room ${roomId} highlight:`, highlightData.id, "ranges:", highlightData.ranges?.length);
    socket.to(roomId).emit("content-highlight", highlightData);
  });

  socket.on("disconnect", () => {
      if (currentRoom && roomUsers.has(currentRoom)) {
        const usersInRoom = roomUsers.get(currentRoom);
        console.log(`[Socket] User ${currentUser?.name} disconnected from ${currentRoom}`);
        usersInRoom.delete(socket.id);
        io.to(currentRoom).emit("users-updated", Array.from(usersInRoom.values()));
      }
    });
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
