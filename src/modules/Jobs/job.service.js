import { asyncHandler } from "../../utils/index.js";
import { companyModel, jobModel } from "../../db/models/index.js";
import fs from "fs";
import cloudinary from "../../utils/cloudnary/index.js";

//------------------------------------------ addJob ------------------------------------------------
export const addJob = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { jobTitle, jobLocation, workingTime, seniorityLevel, jobDescription, technicalSkills, softSkills } = req.body;

  const company = await companyModel.findById(companyId);
  if (!company) return res.status(404).json({ message: "Company not found" });

  if (!company.createdBy.equals(req.user._id) && !company.HRs.includes(req.user._id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const job = await jobModel.create({
    jobTitle,
    jobLocation,
    workingTime,
    seniorityLevel,
    jobDescription,
    technicalSkills,
    softSkills,
    addedBy: req.user._id,
    companyId,
  });

  res.status(201).json({ message: "Job added successfully", job });
});

//------------------------------------------ updateJob ------------------------------------------------
export const updateJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await jobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (!job.addedBy.equals(req.user._id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const updatedJob = await jobModel.findByIdAndUpdate(jobId, req.body, { new: true });

  res.status(200).json({ message: "Job updated successfully", job: updatedJob });
});

//------------------------------------------ deleteJob ------------------------------------------------
export const deleteJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const job = await jobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const company = await companyModel.findById(job.companyId);
  if (!company) return res.status(404).json({ message: "Company not found" });

  if (!company.HRs.includes(req.user._id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await jobModel.findByIdAndDelete(jobId);
  res.status(200).json({ message: "Job deleted successfully" });
});

//------------------------------------------ getJobs ------------------------------------------------
export const getJobs = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, sort = "-createdAt", companyName } = req.query;
  const filter = {};

  if (companyName) {
    const company = await companyModel.findOne({ companyName: new RegExp(companyName, "i") });
    if (!company) return res.status(404).json({ message: "Company not found" });
    filter.companyId = company._id;
  }

  const totalJobs = await jobModel.countDocuments(filter);
  const jobs = await jobModel
    .find(filter)
    .populate("companyId", "companyName")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ totalJobs, page, limit, jobs });
});

//------------------------------------------ getJobsByCompany ------------------------------------------------
export const getJobsByCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

  const totalJobs = await jobModel.countDocuments({ companyId });
  const jobs = await jobModel
    .find({ companyId })
    .populate("companyId", "companyName")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ totalJobs, page, limit, jobs });
});

//------------------------------------------ getFilteredJobs ------------------------------------------------
export const getFilteredJobs = asyncHandler(async (req, res, next) => {
  const { workingTime, jobLocation, seniorityLevel, jobTitle, technicalSkills, page = 1, limit = 10, sort = "-createdAt" } = req.query;
  const filter = {};

  if (jobTitle) filter.jobTitle = new RegExp(jobTitle, "i");
  if (jobLocation) filter.jobLocation = jobLocation;
  if (workingTime) filter.workingTime = workingTime;
  if (seniorityLevel) filter.seniorityLevel = seniorityLevel;
  if (technicalSkills) filter.technicalSkills = { $in: technicalSkills.split(",") };

  const totalJobs = await jobModel.countDocuments(filter);
  const jobs = await jobModel
    .find(filter)
    .populate("companyId", "companyName")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.status(200).json({ totalJobs, page, limit, jobs });
});

//------------------------------------------ getJobApplications ------------------------------------------------
export const getJobApplications = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const job = await jobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const applications = await applicationModel.find({ jobId }).populate("userId", "-password");

  res.status(200).json({ totalApplications: applications.length, applications });
});

//------------------------------------------ applyToJob ------------------------------------------------
export const applyToJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const { userCV } = req.body;

  const job = await jobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const existingApplication = await applicationModel.findOne({ jobId, userId: req.user._id });
  if (existingApplication) return res.status(400).json({ message: "You already applied" });

  const newApplication = await applicationModel.create({ jobId, userId: req.user._id, userCV });

  io.emit("newApplication", { jobId, message: "New job application received" });

  res.status(201).json({ message: "Applied successfully", application: newApplication });
});

//------------------------------------------ acceptOrRejectApplicant ------------------------------------------------
export const acceptOrRejectApplicant = asyncHandler(async (req, res, next) => {
  const { jobId, applicationId } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });

  const job = await jobModel.findById(jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });

  const application = await applicationModel.findById(applicationId).populate("userId");
  if (!application) return res.status(404).json({ message: "Application not found" });

  application.status = status;
  await application.save();

  if (status === "accepted") {
    // Send acceptance email (Assuming sendEmail function exists)
    sendEmail(application.userId.email, "Application Accepted", "Congratulations! You have been accepted.");
  } else {
    sendEmail(application.userId.email, "Application Rejected", "We regret to inform you that your application has been rejected.");
  }

  res.status(200).json({ message: `Application ${status}` });
});
