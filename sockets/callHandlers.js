import CallHistory from '../models/CallHistory.js';

// Track active calls to prevent duplicates/busy states
const activeCalls = new Map(); // userId -> { partnerId, role, socketId, callType }

export const callHandlers = (io, socket, onlineUsers) => {
  const userId = socket.user._id.toString();

  // 1. Initial Call Request
  socket.on('call-user', async ({ receiverId, conversationId, callType }) => {
    if (!receiverId) return;
    
    const mode = callType || 'audio';
    const rId = receiverId.toString();
    console.log(`[CALL] ${userId} calling ${rId} (${mode})`);

    // Check if receiver is online using global onlineUsers mapping
    const receiverSocketId = onlineUsers.get(rId);
    if (!receiverSocketId) {
      socket.emit('call-error', { message: 'User is offline' });
      return;
    }

    // Check if receiver is busy
    if (activeCalls.has(rId)) {
      socket.emit('call-error', { message: 'User is busy in another call' });
      return;
    }

    // Mark both as busy
    activeCalls.set(userId, { partnerId: rId, role: 'caller', socketId: socket.id, callType: mode });
    activeCalls.set(rId, { partnerId: userId, role: 'receiver', callType: mode });

    // Notify receiver socket directly
    io.to(receiverSocketId).emit('incoming-call', {
      callerId: userId,
      callerName: socket.user.name,
      callerAvatar: socket.user.avatar,
      conversationId,
      callType: mode
    });

    // Notify caller that it's ringing
    socket.emit('call-ringing', { receiverId: rId });
  });

  // 2. Accept Call
  socket.on('accept-call', ({ callerId }) => {
    // Update receiver's entry in activeCalls with their specific socket ID
    const receiverCall = activeCalls.get(userId);
    if (receiverCall) {
      receiverCall.socketId = socket.id;
    }

    const callerCall = activeCalls.get(callerId);
    const callerSocketId = callerCall?.socketId || onlineUsers.get(callerId?.toString());
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { receiverId: userId });
    }
  });

  // 3. Reject Call
  socket.on('reject-call', async ({ callerId }) => {
    const callerCall = activeCalls.get(callerId);
    const callerSocketId = callerCall?.socketId || onlineUsers.get(callerId?.toString());
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-rejected', { receiverId: userId });
    }

    const callData = activeCalls.get(userId);

    // Log to history
    await CallHistory.create({
      caller: callerId,
      receiver: userId,
      status: 'rejected',
      callType: callData?.callType || 'audio'
    });

    // Clear busy states after logging
    activeCalls.delete(userId);
    activeCalls.delete(callerId);
  });

  // 4. WebRTC Signaling (Offer/Answer/ICE Candidates)
  socket.on('webrtc-offer', ({ to, offer }) => {
    const partnerCall = activeCalls.get(to);
    const targetSocketId = partnerCall?.socketId || onlineUsers.get(to?.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { from: userId, offer });
    }
  });

  socket.on('webrtc-answer', ({ to, answer }) => {
    const partnerCall = activeCalls.get(to);
    const targetSocketId = partnerCall?.socketId || onlineUsers.get(to?.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { from: userId, answer });
    }
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    const partnerCall = activeCalls.get(to);
    const targetSocketId = partnerCall?.socketId || onlineUsers.get(to?.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', { from: userId, candidate });
    }
  });

  // 5. End Call
  socket.on('end-call', async ({ partnerId, duration }) => {
    console.log(`[CALL] Call ended between ${userId} and ${partnerId}`);
    
    const partnerCall = activeCalls.get(partnerId);
    const partnerSocketId = partnerCall?.socketId || onlineUsers.get(partnerId?.toString());
    if (partnerSocketId) {
      io.to(partnerSocketId).emit('call-ended', { from: userId });
    }

    // Log to history if this was the person ending it or reporting it
    if (duration !== undefined) {
      const callData = activeCalls.get(userId);
      await CallHistory.create({
        caller: callData?.role === 'caller' ? userId : partnerId,
        receiver: callData?.role === 'receiver' ? userId : partnerId,
        status: 'completed',
        duration,
        callType: callData?.callType || 'audio',
        endedAt: new Date()
      });
    }

    // Clear states after logging
    activeCalls.delete(userId);
    activeCalls.delete(partnerId);
  });

  // 6. Cleanup on disconnect
  socket.on('disconnect', () => {
    const callState = activeCalls.get(userId);
    if (callState) {
      const partnerCall = activeCalls.get(callState.partnerId);
      const partnerSocketId = partnerCall?.socketId || onlineUsers.get(callState.partnerId?.toString());
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('call-ended', { from: userId, reason: 'disconnect' });
      }
      activeCalls.delete(callState.partnerId);
      activeCalls.delete(userId);
    }
  });
};
