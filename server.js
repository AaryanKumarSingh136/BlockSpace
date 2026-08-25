const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getToken } = require('next-auth/jwt');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    },
  });

  io.use(async (socket, nextMiddleware) => {
    try {
      const token = await getToken({
        req: socket.request,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token?.org_id) {
        return nextMiddleware(new Error('Unauthorized socket connection'));
      }
      socket.data.orgId = String(token.org_id);
      nextMiddleware();
    } catch {
      nextMiddleware(new Error('Unauthorized socket connection'));
    }
  });

  // Attach to global object so API routes can emit events
  global.io = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('join-org', (orgId) => {
      if (orgId && String(orgId) === socket.data.orgId) {
        const room = `org_${socket.data.orgId}`;
        socket.join(room);
        console.log(`[Socket.io] Socket ${socket.id} joined room ${room}`);
      }
    });

    socket.on('leave-org', (orgId) => {
      if (orgId && String(orgId) === socket.data.orgId) {
        const room = `org_${socket.data.orgId}`;
        socket.leave(room);
        console.log(`[Socket.io] Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Blockspace Next.js + Socket.io Server ready on http://${hostname}:${port}`);
  });
});
