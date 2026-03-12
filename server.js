const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      if (req.url === '/api/socket') {
        res.end();
      } else {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      }
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

  io.on("connection", (socket) => {
    // console.log("Client connected", socket.id);

    // Join a class room
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      // console.log(`Socket ${socket.id} joined room ${roomId}`);
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
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
