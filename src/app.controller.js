import connectionDb from "./db/connectionDb.js";
import userRouter from "./modules/users/user.controller.js";
import { globalErrorHandler } from "./utils/error/index.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import authRouter from "./modules/auth/auth.controller.js";

const bootstrap = async (app, express) => {
  app.use(helmet());
  app.use(cors());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  // connect to database
  await connectionDb();

  // parse application/json
  app.use(express.json());

  //main route
  app.get("/", (req, res) => res.send("Hello My App ( Social App )"));

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);

  // error handling middleware
  app.use("*", (req, res, next) => {
    return next(new Error(`Route not found ${req.originalUrl}`, { cause: 404 }));
  });

  // error handling middleware
  app.use(globalErrorHandler);
};

export default bootstrap;
