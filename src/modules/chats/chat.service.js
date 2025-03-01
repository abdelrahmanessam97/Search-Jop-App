import { asyncHandler } from "../../utils/index.js";
import { chatModel, companyModel, userModel } from "../../db/models/index.js";
import fs from "fs";
import cloudinary from "../../utils/cloudnary/index.js";

//------------------------------------------ getChatHistory ------------------------------------------------
export const getChatHistory = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const user = req.user._id;

  // Check if the user exists
  const targetUser = await userModel.findById(userId);
  if (!targetUser) return res.status(404).json({ message: "User not found" });

  // Find the chat history between the two users
  const chat = await chatModel
    .findOne({
      $or: [
        { senderId: user, receiverId: userId },
        { senderId: userId, receiverId: user },
      ],
    })
    .populate("messages.senderId", "firstName lastName");

  if (!chat) return res.status(404).json({ message: "No chat history found" });

  res.status(200).json({ chat });
});
