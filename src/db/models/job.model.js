import mongoose from "mongoose";
import { jobLocations, jobTypes, seniorityLevels } from "../utils/variables.js";

const jobSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, required: true },
    jobLocation: { type: String, enum: jobLocations, default: jobLocations[0], required: true },
    workingTime: { type: String, enum: jobTypes, default: jobTypes[0], required: true },
    seniorityLevel: {
      type: String,
      enum: seniorityLevels,
      default: seniorityLevels[0],
      required: true,
    },
    jobDescription: { type: String, required: true },
    technicalSkills: [{ type: String, required: true }],
    softSkills: [{ type: String, required: true }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closed: { type: Boolean, default: false },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  },
  { timestamps: true }
);

export const jobModel = mongoose.models.Job || mongoose.model("Job", jobSchema);
