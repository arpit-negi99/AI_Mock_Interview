import { io } from 'socket.io-client';
import { APP_CONFIG } from '@/constants/appConfig';

let socket;

export function getSocket(token) {
  if (!socket) {
    socket = io(APP_CONFIG.socketUrl, {
      autoConnect: false,
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  socket.auth = { token };
  return socket;
}
