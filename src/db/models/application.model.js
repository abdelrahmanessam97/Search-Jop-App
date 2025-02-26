import mongoose from "mongoose";
import { statusTypes } from "../utils/variables.js";

const applicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userCV: { secure_url: { type: String, required: true }, public_id: { type: String, required: true } },
    status: {
      type: String,
      enum: statusTypes,
      default: statusTypes[0],
    },
  },
  { timestamps: true }
);

export const applicationModel = mongoose.models.Application || mongoose.model("Application", applicationSchema);
