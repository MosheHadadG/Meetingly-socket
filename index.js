import { Server } from "socket.io";

const io = new Server({
  /* options */
  cors: {
    origin: "*",
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

const getUserById = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

const getUserByUsername = (username) => {
  return onlineUsers.find((user) => user.username === username);
};

io.on("connection", (socket) => {
  console.log("someone has connected");

  socket.on("newSocketUser", ({ userId, username }) => {
    addNewUser({ userId, username, socketId: socket.id });

    io.emit("getOnlineUsers", onlineUsers);
    // console.log({ onlineUsers });
  });

  socket.on("sendMessage", ({ messageData }) => {
    const { receiverUsername } = messageData;
    console.log(messageData);

    const receiverSocket = getUserByUsername(receiverUsername);
    if (!receiverSocket) return;

    delete messageData.receiverUsername;
    io.to(receiverSocket.socketId).emit("getMessage", {
      messageSent: messageData.messageSent,
    });
  });

  // Notifications and Event Requests

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
          const receiverSocket = getUserById(receiver);
          if (!receiverSocket) return;
          io.to(receiverSocket.socketId).emit("getNotification", {
            notification: notificationToRemovedParticipant,
            type,
          });
        }
      );
    } else {
      const { receiver } = notification;

      const receiverSocket = getUserById(receiver);
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
    const receiverSocket = getUserById(receiver);
    if (!receiverSocket) return;
    io.to(receiverSocket.socketId).emit("getRequestNotification", {
      requestNotification,
    });
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getOnlineUsers", onlineUsers);
    console.log("someone has left", { onlineUsers });
  });
});

const port = process.env.PORT || 5005;

io.listen(port);
