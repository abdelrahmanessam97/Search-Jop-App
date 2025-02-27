import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./job.service.js";
import * as UV from "./job.validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";

const jobRouter = Router();

export default jobRouter;
