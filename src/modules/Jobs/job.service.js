import { applicationModel, companyModel, jobModel } from "../../db/models/index.js";
import { sendEmail } from "../../service/sendEmail.js";
import cloudinary from "../../utils/cloudnary/index.js";
import { asyncHandler } from "../../utils/index.js";

//------------------------------------------ addJob ------------------------------------------------
export const addJob = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { jobTitle, jobLocation, workingTime, seniorityLevel, jobDescription, technicalSkills, softSkills } = req.body;

  const company = await companyModel.findById(companyId);
  if (!company) return next(new Error("Company not found", { cause: 404 }));

  if (!company.createdBy.equals(req.user._id) && !company.HRs.includes(req.user._id)) {
    return next(new Error("Unauthorized", { cause: 403 }));
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
  if (!job) return next(new Error("Job not found"), { cause: 404 });

  if (!job.addedBy.equals(req.user._id)) {
    return next(new Error("Unauthorized"), { cause: 403 });
  }

  const updatedJob = await jobModel.findByIdAndUpdate(jobId, req.body, { new: true });

  res.status(200).json({ message: "Job updated successfully", job: updatedJob });
});

//------------------------------------------ deleteJob ------------------------------------------------
export const deleteJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const job = await jobModel.findById(jobId);
  if (!job) return next(new Error("Job not found"), { cause: 404 });

  const company = await companyModel.findById(job.companyId);
  if (!company) return next(new Error("Company not found"), { cause: 404 });

  if (!company.HRs.includes(req.user._id)) {
    return next(new Error("Unauthorized"), { cause: 403 });
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
    if (!company) return next(new Error("Company not found", { cause: 404 }));
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

  const totalJobs = await jobModel.countDocuments({ companyId });

  const jobs = await jobModel.find({ companyId }).populate("companyId", "companyName");

  res.status(200).json({ totalJobs, jobs });
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
  if (!job) return next(new Error("Job not found"));

  const applications = await applicationModel.find({ jobId }).populate("userId", "-password");

  res.status(200).json({ totalApplications: applications.length, applications });
});

//------------------------------------------ applyToJob ------------------------------------------------
export const applyToJob = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("No file uploaded"));
  }

  // Upload CV to Cloudinary
  const uploadedCV = await cloudinary.uploader.upload(req.file.path, {
    folder: "jobApplications",
    resource_type: "auto",
  });

  const newApplication = await applicationModel.create({
    jobId: req.params.jobId,
    userId: req.user._id,
    userCV: {
      secure_url: uploadedCV.secure_url,
      public_id: uploadedCV.public_id,
    },
  });

  res.status(201).json({ message: "Application submitted successfully", application: newApplication });
});

//------------------------------------------ acceptOrRejectApplicant ------------------------------------------------
export const acceptOrRejectApplicant = asyncHandler(async (req, res, next) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  const application = await applicationModel.findById(applicationId).populate("userId");

  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  // Update status
  application.status = status;
  await application.save();

  // Prepare email details
  const userEmail = application.userId.email;
  let subject, htmlContent;

  if (status === "accepted") {
    subject = "Application Accepted";
    htmlContent = `<p>Congratulations! Your job application has been accepted.</p>`;
  } else if (status === "rejected") {
    subject = "Application Rejected";
    htmlContent = `<p>We regret to inform you that your application was not selected.</p>`;
  } else {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Send email notification
  await sendEmail(userEmail, subject, htmlContent);

  res.status(200).json({ message: `Application ${status} successfully`, application });
});
