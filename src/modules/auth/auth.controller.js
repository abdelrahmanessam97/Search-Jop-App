import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import * as US from "./auth.service.js";
import * as UV from "./auth.validation.js";

const authRouter = Router();

authRouter.post("/signup", validation(UV.signupSchema), US.signup);
authRouter.patch("/confirm-email", validation(UV.confirmEmailSchema), US.confirmEmail);
authRouter.post("/signupWithGmail", US.loginWithGmail);

authRouter.post("/signin", validation(UV.signinSchema), US.signin);
authRouter.post("/loginWithGmail", US.loginWithGmail);
authRouter.get("/refresh_token", validation(UV.refreshTokenSchema), US.refreshToken);

authRouter.patch("/forgot_password", validation(UV.forgotPasswordSchema), US.forgotPassword);
authRouter.patch("/reset_password", validation(UV.resetPasswordSchema), US.resetPassword);

export default authRouter;
