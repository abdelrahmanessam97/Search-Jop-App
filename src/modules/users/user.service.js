import fs from "fs";
import { userModel } from "../../db/models/index.js";
import cloudinary from "./../../utils/cloudnary/index.js";
import { Compare, Encrypt, asyncHandler } from "./../../utils/index.js";

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

  res.status(200).json({ message: "User updated", user: updatedUser });
});

//------------------------------------------ getUserData ------------------------------------------------
export const getUserData = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user.id);

  // Await decryptedMobile if it's an async function
  const mobileNumber = await user.decryptedMobile;

  res.status(200).json({ firstName: user.firstName, lastName: user.lastName, email: user.email, mobileNumber });
});

//------------------------------------------ getUserProfile ------------------------------------------------

export const getUserProfile = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.params.id);

  if (!user) return next(new Error("user not found", { cause: 404 }));

  const mobileNumber = await user.decryptedMobile;

  res.status(200).json({
    userName: `${user.firstName} ${user.lastName}`,
    mobileNumber,
    profilePic: user.profilePic,
    coverPic: user.coverPic,
  });
});

//------------------------------------------ updatePassword ------------------------------------------------

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(req.user.id);

  if (!user) return next(new Error("user not found", { cause: 404 }));

  const isMatch = await Compare({ key: oldPassword, hashedKey: user.password });

  if (!isMatch) return next(new Error("old password is incorrect", { cause: 400 }));

  user.password = newPassword;
  await user.save();

  res.status(200).json({ message: "Password updated successfully" });
});

//------------------------------------------ uploadProfilePic ------------------------------------------------

export const uploadProfilePic = asyncHandler(async (req, res, next) => {
  // if (!req.file) return next(new Error("profile picture file not uploaded", { cause: 400 }));

  // Upload to Cloudinary
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "profile_pictures",
  });

  // Delete the local file after upload
  fs.unlinkSync(req.file.path);

  // Update user profile picture in DB
  await userModel.findByIdAndUpdate(req.user._id, {
    profilePic: {
      secure_url: result.secure_url,
      public_id: result.public_id,
    },
  });

  res.status(200).json({
    message: "Profile picture uploaded successfully",
    profilePic: {
      secure_url: result.secure_url,
      public_id: result.public_id,
    },
  });
});

//------------------------------------------ uploadCoverPic ------------------------------------------------

export const uploadCoverPic = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new Error("cover picture file not uploaded", { cause: 400 }));

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "cover_pictures",
  });

  fs.unlinkSync(req.file.path);

  await userModel.findByIdAndUpdate(req.user._id, {
    coverPic: {
      secure_url: result.secure_url,
      public_id: result.public_id,
    },
  });

  res.status(200).json({
    message: "Cover picture uploaded successfully",
    coverPic: {
      secure_url: result.secure_url,
      public_id: result.public_id,
    },
  });
});

//------------------------------------------ deleteProfilePic------------------------------------------------

export const deleteProfilePic = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { profilePic: null });

  res.status(200).json({ message: "Profile picture deleted" });
});

//------------------------------------------ deleteCoverPic------------------------------------------------

export const deleteCoverPic = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { coverPic: null });

  res.status(200).json({ message: "Cover picture deleted" });
});

//------------------------------------------ softDeleteUser------------------------------------------------

export const softDeleteUser = asyncHandler(async (req, res, next) => {
  await userModel.findByIdAndUpdate(req.user.id, { deletedAt: new Date() });

  return res.status(200).json({ message: "Account marked for deletion" });
});
