import { chatModel, userModel } from "../../db/models";

export default (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join private chat room
    socket.on("joinChat", async ({ senderId, receiverId }) => {
      const room = [senderId, receiverId].sort().join("_");
      socket.join(room);
    });

    // Send message event
    socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
      const room = [senderId, receiverId].sort().join("_");

      // Check sender's role (only HR or company owner can start chat)
      const sender = await userModel.findById(senderId);
      if (!sender || !["HR", "CompanyOwner"].includes(sender.role)) {
        return socket.emit("errorMessage", { message: "Only HR or company owner can start chat" });
      }

      let chat = await chatModel.findOne({
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      });

      if (!chat) {
        chat = await chatModel.create({ senderId, receiverId, messages: [] });
      }

      const newMessage = { message, senderId, timestamp: new Date() };
      chat.messages.push(newMessage);
      await chat.save();

      io.to(room).emit("receiveMessage", { senderId, message, timestamp: newMessage.timestamp });
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
