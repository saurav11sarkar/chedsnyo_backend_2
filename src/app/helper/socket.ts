import { Server, Socket } from 'socket.io';
import Message from '../modules/message/message.model';

const users: { userId: string; socketId: string }[] = [];

export const socketHandler = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('✅ User connected:', socket.id);

    // Add user to online list
    socket.on('addUser', (userId: string) => {
      if (!users.find(u => u.userId === userId)) {
        users.push({ userId, socketId: socket.id });
      }
      io.emit('getUsers', users);
    });

    // Send message
    socket.on('sendMessage', async ({ senderId, receiverId, conversationId, message }) => {
      const newMsg = await Message.create({ senderId, receiverId, conversationId, message });

      const receiver = users.find(u => u.userId === receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit('receiveMessage', newMsg);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const index = users.findIndex(u => u.socketId === socket.id);
      if (index !== -1) users.splice(index, 1);
      console.log('❌ User disconnected:', socket.id);
      io.emit('getUsers', users);
    });
  });
};
