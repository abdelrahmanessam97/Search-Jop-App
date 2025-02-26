import { customAlphabet } from "nanoid";
import { userModel } from "../../db/models/index.js";
import { Compare, asyncHandler, deleteExpiredOTPs, eventEmitter, generateToken, verifyToken } from "./../../utils/index.js";
import { loginTypes, roleTypes } from "../../db/utils/variables.js";
import { OAuth2Client } from "google-auth-library";
import cron from "node-cron";

//------------------------------------------ signup ------------------------------------------------
export const signup = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, mobileNumber, gender, DOB, role } = req.body;

  const existingUser = await userModel.findOne({ email });
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  // send email otp
  const otp = customAlphabet("1234567890", 6)();

  eventEmitter.emit("sendEmailOtp", { email, otp });

  const newUser = await userModel.create({
    firstName,
    lastName,
    email,
    password,
    mobileNumber,
    gender,
    DOB,
    role,
    OTP: [{ code: otp, type: "confirmEmail", expiresIn: Date.now() + 10 * 60 * 1000 }],
  });

  res.status(201).json({ message: "User registered. Verify your email within 10 minutes.", user: newUser });
});

//------------------------------------------ confirm Email ------------------------------------------------
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { code, email } = req.body;

  // get user
  const user = await userModel.findOne({ email, isConfirmed: false });

  if (await userModel.findOne({ email, isConfirmed: true })) {
    return next(new Error("user already confirmed", { cause: 409 }));
  }

  // check if user exist
  if (!user) return next(new Error("user not found", { cause: 404 }));

  // check if code is valid
  const otpRecord = user.OTP.find((o) => o.type === "confirmEmail" && o.expiresIn > Date.now());
  if (!otpRecord || !(await Compare({ key: code, hashedKey: otpRecord.code }))) return res.status(400).json({ message: "Invalid or expired OTP" });

  // Schedule the job to run every 6 hours
  cron.schedule("0 */6 * * *", () => deleteExpiredOTPs(userModel));

  // update user
  await userModel.updateOne({ email }, { isConfirmed: true, OTP: [] });

  return res.status(200).json({ message: "email confirmed successfully" });
});

//------------------------------------------ signin ------------------------------------------------

export const signin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
    isConfirmed: true,
    provider: loginTypes[1],
  });

  // check if user exist
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }

  // check if password is valid
  if (!(await Compare({ key: password, hashedKey: user.password }))) {
    return next(new Error("password is invalid", { cause: 400 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.User ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "5d" },
  });

  const refresh_token = await generateToken({
    payload: { email, id: user._id },
    SIGNATURE: user.role == roleTypes.User ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "7d" },
  });

  // get user
  return res.status(200).json({
    message: "signin successfully",
    token: { access_token, refresh_token },
  });
});

//------------------------------------------signupWithGoogle && loginWithGoogle ------------------------------------------------

export const loginWithGmail = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }

  const { email, given_name, family_name, sub, picture } = await verify();

  let user = await userModel.findOne({ email });

  // check if user exist
  if (!user) {
    user = await userModel.create({
      firstName: given_name,
      lastName: family_name,
      email,
      password: sub,
      provider: loginTypes[0],
      profilePic: { secure_url: picture },
      isConfirmed: true,
    });
  }

  //check if user is google
  if (user.provider != loginTypes[0]) {
    return next(new Error("should login by form page", { cause: 404 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE: user.role == roleTypes.User ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "5d" },
  });

  // get user
  return res.status(200).json({ message: "signin with google successfully", access_token });
});

//------------------------------------------ refresh token ------------------------------------------------

export const refreshToken = asyncHandler(async (req, res, next) => {
  const { authorization } = req.body;

  const [prefix, token] = authorization?.split(" ") || ["", ""];

  if (!prefix || !token) {
    return next(new Error("token not found", { cause: 400 }));
  }

  // Check if prefix is valid
  let SIGNATURE_TOKEN = undefined;

  if (prefix === process.env.PREFIX_TOKEN_USER) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_USER;
  } else if (prefix === process.env.PREFIX_TOKEN_ADMIN) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_ADMIN;
  } else {
    return next(new Error("prefix is invalid", { cause: 400 }));
  }

  // verify a token symmetric - synchronous
  const decoded = await verifyToken({ token, SIGNATURE: SIGNATURE_TOKEN });

  if (!decoded?.id) {
    return next(new Error("token is invalid", { cause: 400 }));
  }

  // get user
  const user = await userModel.findById(decoded?.id);
  if (user.changeCredentialTime > decoded?.iat * 1000) return res.status(403).json({ message: "Token expired" });

  if (!user) {
    return next(new Error("user not found", { cause: 400 }));
  }

  // generate token
  const access_token = await generateToken({
    payload: { email: user.email, id: user._id },
    SIGNATURE: user.role == roleTypes.User ? process.env.SIGNATURE_TOKEN_USER : process.env.SIGNATURE_TOKEN_ADMIN,
    option: { expiresIn: "5d" },
  });

  return res.status(200).json({ message: "refresh token successfully", token: { access_token } });
});

//------------------------------------------ reset Password ------------------------------------------------

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { email, code, newPassword } = req.body;

  // get user
  const user = await userModel.findOne({ email, isDeleted: null });

  if (!user) return next(new Error("user not found", { cause: 404 }));

  // check if code is valid
  const otpRecord = user.OTP.find((o) => o.type === "forgetPassword" && o.expiresIn > Date.now());
  if (!otpRecord || !(await Compare({ key: code, hashedKey: otpRecord.code }))) return next(new Error("code is invalid", { cause: 400 }));

  // Schedule the job to run every 6 hours
  cron.schedule("0 */6 * * *", () => deleteExpiredOTPs(userModel));

  // update user
  await userModel.updateOne({ email }, { password: newPassword, isConfirmed: true, OTP: [] });

  return res.status(200).json({ message: "password reset successfully" });
});

//------------------------------------------ forgot password ------------------------------------------------

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // get user

  if (!(await userModel.findOne({ email, deletedAt: null }))) {
    return next(new Error("user not found", { cause: 404 }));
  }

  // send email otp
  const otp = customAlphabet("1234567890", 6)();

  eventEmitter.emit("forgotPassword", { email, otp });

  return res.status(200).json({ message: "code sent to email successfully" });
});
