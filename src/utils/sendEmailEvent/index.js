import { EventEmitter } from "events";
import { customAlphabet } from "nanoid";
import { userModel } from "../../db/models/index.js";
import { sendEmail } from "../../service/sendEmail.js";
import { Hash } from "../index.js";
import { generateToken } from "../token/generateToken.js";
import { html } from "./../../service/emailTemplate.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on("sendEmailOtp", async (data) => {
  const { email, otp } = data;

  // hash otp in database
  await userModel.updateOne({ email }, { otp });

  // send email
  await sendEmail(email, "confirm your email", html({ otp, message: "Confirm your email" }));
});

eventEmitter.on("forgotPassword", async (data) => {
  const { email, otp } = data;

  // hash otp in database
  const hashedOTP = await Hash({ key: otp, SALT_ROUNDS: process.env.SALT_ROUNDS });

  await userModel.updateOne({ email }, { OTP: [{ code: hashedOTP, type: "forgetPassword", expiresIn: Date.now() + 10 * 60 * 1000 }] });

  // send email
  await sendEmail(email, "confirm your Password", html({ otp, message: "change your password" }));
});
