import { customAlphabet } from "nanoid";
import { userModel } from "../../db/models/index.js";
import { Compare, Encrypt, asyncHandler, deleteExpiredOTPs, eventEmitter, generateToken, verifyToken } from "./../../utils/index.js";
import { loginTypes, roleTypes } from "../../db/utils/variables.js";
import { OAuth2Client } from "google-auth-library";

//------------------------------------------ updateUser ------------------------------------------------
export const updateUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, gender, DOB, mobileNumber } = req.body;
  const userId = req.user.id;

  let updatedFields = { firstName, lastName, gender, DOB };

  // Encrypt mobile number if updated
  if (mobileNumber) {
    const encryptedMobile = await Encrypt({ key: mobileNumber, SECRET_KEY: process.env.SIGNATURE_PHONE });
    updatedFields.mobileNumber = encryptedMobile;
  }

  const updatedUser = await userModel.findByIdAndUpdate(userId, updatedFields, { new: true });

  res.json({ message: "User updated", user: updatedUser });
});

//------------------------------------------ getUserData ------------------------------------------------
export const getUserData = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user.id);

  // Await decryptedMobile if it's an async function
  const mobileNumber = await user.decryptedMobile;

  res.json({ firstName: user.firstName, lastName: user.lastName, email: user.email, mobileNumber });
});

//------------------------------------------ loginWithGmail ------------------------------------------------

export const loginWithGmail = asyncHandler(async (req, res, next) => {});

//------------------------------------------ signin ------------------------------------------------

export const signin = asyncHandler(async (req, res, next) => {});

//------------------------------------------ refresh token ------------------------------------------------

export const refreshToken = asyncHandler(async (req, res, next) => {});

//------------------------------------------ forgot password ------------------------------------------------

export const forgotPassword = asyncHandler(async (req, res, next) => {});

//------------------------------------------ reset Password ------------------------------------------------

export const resetPassword = asyncHandler(async (req, res, next) => {});
