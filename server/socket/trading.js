const { connectDB, User, Card, Trade, mongoose } = require("../db");

const rooms = new Map();

function getRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return {
    roomId,
    users: room.users.map((u) => ({
      socketId: u.socketId,
      userId: u.userId,
      username: u.username,
      offer: u.offer,
      locked: u.locked,
      accepted: u.accepted,
    })),
    status: room.status,
  };
}

async function executeTrade(room) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const participant of room.users) {
      const user = await User.findOne({ username: participant.username }).session(
        session
      );
      if (!user) throw new Error(`User ${participant.username} not found`);

      const offerIds = participant.offer.map((c) => c._id.toString());
      const inventoryIds = user.inventory
        .filter((inv) => inv.card)
        .map((inv) => inv.card.toString());

      for (const offerId of offerIds) {
        if (!inventoryIds.includes(offerId)) {
          throw new Error(`${participant.username} doesn't own card ${offerId}`);
        }
      }
    }

    for (let i = 0; i < room.users.length; i++) {
      const giver = room.users[i];
      const receiver = room.users[1 - i];

      const giverUser = await User.findOne({ username: giver.username }).session(
        session
      );
      const receiverUser = await User.findOne({
        username: receiver.username,
      }).session(session);

      const offerIds = giver.offer.map((c) => c._id.toString());

      giverUser.inventory = giverUser.inventory.filter(
        (inv) => !offerIds.includes(inv.card.toString())
      );

      for (const card of giver.offer) {
        receiverUser.inventory.push({ card: card._id });
      }

      await giverUser.save({ session });
      await receiverUser.save({ session });
    }

    await Trade.findOneAndUpdate(
      { roomId: room.roomId },
      { status: "completed", completedAt: new Date() },
      { session }
    );

    await session.commitTransaction();
    return true;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

function setupTradingSocket(io) {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-room", async ({ roomId, username }) => {
      try {
        await connectDB();

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.username = username;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, {
            roomId,
            users: [],
            status: "pending",
          });
        }

        const room = rooms.get(roomId);

        if (room.users.length >= 2 && !room.users.find((u) => u.username === username)) {
          socket.emit("error", { message: "Room is full" });
          return;
        }

        const existing = room.users.find((u) => u.username === username);
        if (existing) {
          existing.socketId = socket.id;
        } else {
          room.users.push({
            socketId: socket.id,
            userId: socket.id,
            username,
            offer: [],
            locked: false,
            accepted: false,
          });
        }

        await Trade.findOneAndUpdate(
          { roomId },
          {
            roomId,
            status: "pending",
            participants: room.users.map((u) => ({
              userId: u.userId,
              username: u.username,
              offer: [],
              locked: false,
              accepted: false,
            })),
          },
          { upsert: true }
        );

        io.to(roomId).emit("room-update", getRoomState(roomId));
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    socket.on("add-to-offer", async ({ card }) => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room || room.status !== "pending") return;

      const user = room.users.find((u) => u.username === username);
      if (!user || user.locked) return;

      if (user.offer.find((c) => c._id === card._id)) return;

      user.offer.push(card);
      user.locked = false;
      user.accepted = false;

      // Reset other user's lock/accept when offer changes
      room.users.forEach((u) => {
        if (u.username !== username) {
          u.locked = false;
          u.accepted = false;
        }
      });

      io.to(roomId).emit("room-update", getRoomState(roomId));
    });

    socket.on("remove-from-offer", async ({ cardId }) => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room || room.status !== "pending") return;

      const user = room.users.find((u) => u.username === username);
      if (!user || user.locked) return;

      user.offer = user.offer.filter((c) => c._id !== cardId);
      room.users.forEach((u) => {
        u.locked = false;
        u.accepted = false;
      });

      io.to(roomId).emit("room-update", getRoomState(roomId));
    });

    socket.on("lock-trade", () => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.username === username);
      if (!user) return;

      user.locked = true;
      user.accepted = false;

      io.to(roomId).emit("room-update", getRoomState(roomId));
    });

    socket.on("unlock-trade", () => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.username === username);
      if (!user) return;

      user.locked = false;
      user.accepted = false;
      room.status = "pending";

      io.to(roomId).emit("room-update", getRoomState(roomId));
    });

    socket.on("accept-trade", async () => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.username === username);
      if (!user || !user.locked) return;

      user.accepted = true;

      const allLocked = room.users.length === 2 && room.users.every((u) => u.locked);
      const allAccepted = room.users.every((u) => u.accepted);

      if (allLocked && allAccepted) {
        try {
          room.status = "executing";
          io.to(roomId).emit("room-update", getRoomState(roomId));

          await executeTrade(room);
          room.status = "completed";

          io.to(roomId).emit("trade-complete", {
            message: "Trade executed successfully!",
          });
          io.to(roomId).emit("room-update", getRoomState(roomId));
        } catch (err) {
          room.status = "pending";
          room.users.forEach((u) => {
            u.locked = false;
            u.accepted = false;
          });
          io.to(roomId).emit("error", { message: err.message });
          io.to(roomId).emit("room-update", getRoomState(roomId));
        }
      } else {
        io.to(roomId).emit("room-update", getRoomState(roomId));
      }
    });

    socket.on("leave-room", () => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      const room = rooms.get(roomId);
      if (!room) return;

      room.users = room.users.filter((u) => u.username !== username);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      } else {
        room.users.forEach((u) => {
          u.locked = false;
          u.accepted = false;
        });
        io.to(roomId).emit("room-update", getRoomState(roomId));
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      const username = socket.data.username;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      room.users = room.users.filter((u) => u.socketId !== socket.id);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      } else {
        io.to(roomId).emit("room-update", getRoomState(roomId));
      }
    });
  });
}

module.exports = { setupTradingSocket };
