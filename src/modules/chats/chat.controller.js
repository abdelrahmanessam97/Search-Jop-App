import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./chat.service.js";
import * as UV from "./chat.validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";

const chatRouter = Router();

chatRouter.get("/chatHistory/:userId", authentication, US.getChatHistory);

export default chatRouter;
