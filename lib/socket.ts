import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Uses current window location host by default, or NEXT_PUBLIC_SOCKET_URL if defined
    const socketUrl =
      typeof window !== 'undefined'
        ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
        : '';

    socket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};
