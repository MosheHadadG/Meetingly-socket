import { Server } from "socket.io";

const io = new Server({
  /* options */
  cors: {
    origin: "https://meetingly-frontend.onrender.com/",
  },
});

let onlineUsers = [];

const addNewUser = ({ userId, username, socketId }) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, username, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("someone has connected");

  socket.on("newSocketUser", ({ userId, username }) => {
    addNewUser({ userId, username, socketId: socket.id });
    // console.log({ onlineUsers });
  });

  socket.on("sendNotification", ({ notification, type }) => {
    if (
      notification.NotificationsToRemovedParticipants &&
      notification.NotificationsToRemovedParticipants.length > 0
    ) {
      notification.NotificationsToRemovedParticipants.map(
        (notificationToRemovedParticipant) => {
          const { receiver } = notificationToRemovedParticipant;
          console.log(notificationToRemovedParticipant);
          // console.log(receiver);
          const receiverSocket = getUser(receiver);
          if (!receiverSocket) return;
          io.to(receiverSocket.socketId).emit("getNotification", {
            notification: notificationToRemovedParticipant,
            type,
          });
        }
      );
    } else {
      const { receiver } = notification;

      const receiverSocket = getUser(receiver);
      // console.log({ receiverSocket });
      if (!receiverSocket) return;
      io.to(receiverSocket.socketId).emit("getNotification", {
        notification,
        type,
      });
    }
  });

  socket.on("sendRequestNotification", ({ requestNotification }) => {
    const { receiver } = requestNotification;
    const receiverSocket = getUser(receiver);
    if (!receiverSocket) return;
    io.to(receiverSocket.socketId).emit("getRequestNotification", {
      requestNotification,
    });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    console.log("someone has left", { onlineUsers });
  });
});

io.listen(5005);
