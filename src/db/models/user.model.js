import mongoose from "mongoose";
import { genderTypes, loginTypes, OTP_Types, roleTypes } from "../utils/variables.js";
import { Decrypt, Hash } from "../../utils/index.js";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    provider: { type: String, enum: loginTypes, default: loginTypes[1] },
    gender: { type: String, enum: Object.values(genderTypes), default: genderTypes.Male, required: true },
    DOB: {
      type: Date,
      required: function () {
        return this.provider !== loginTypes[0];
      },
    },
    mobileNumber: {
      type: String,
      required: function () {
        return this.provider !== loginTypes[0];
      },
    },
    role: { type: String, enum: Object.values(roleTypes), default: roleTypes.User },
    isConfirmed: { type: Boolean, default: false },
    deletedAt: { type: Date },
    bannedAt: { type: Date },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: roleTypes.User },
    changeCredentialTime: { type: Date },
    profilePic: { secure_url: String, public_id: String },
    coverPic: { secure_url: String, public_id: String },
    OTP: [
      {
        code: String,
        type: { type: String, enum: OTP_Types },
        expiresIn: Date,
      },
    ],
  },
  { timestamps: true }
);

userSchema.virtual("username").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("decryptedMobile").get(function () {
  return Decrypt({ key: this.mobileNumber, SECRET_KEY: process.env.SIGNATURE_PHONE });
});

userSchema.pre("save", async function (next) {
  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

  // Hash password
  if (this.isModified("password")) {
    this.password = await Hash({ key: this.password, SALT_ROUNDS: saltRounds });
  }

  // Hash mobileNumber
  if (this.isModified("mobileNumber")) {
    this.mobileNumber = await Hash({ key: this.mobileNumber, SALT_ROUNDS: saltRounds });
  }

  // Hash OTP codes
  if (this.isModified("OTP")) {
    this.OTP = await Promise.all(
      this.OTP.map(async (otp) => ({
        ...otp,
        code: await Hash({ key: otp.code, SALT_ROUNDS: saltRounds }),
      }))
    );
  }

  next();
});

export const userModel = mongoose.models.User || mongoose.model("User", userSchema);
