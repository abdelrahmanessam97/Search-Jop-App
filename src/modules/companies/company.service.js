import { asyncHandler } from "../../utils/index.js";
import { companyModel } from "../../db/models/index.js";
import fs from "fs";
import cloudinary from "../../utils/cloudnary/index.js";

//------------------------------------------ addCompany ------------------------------------------------
export const addCompany = asyncHandler(async (req, res, next) => {
  const { companyName, companyEmail, description, industry, address, numberOfEmployees } = req.body;

  // Check if company exists
  const existingCompany = await companyModel.findOne({ $or: [{ companyName }, { companyEmail }] });
  if (existingCompany) return next(new Error("Company already exists", { cause: 409 }));

  // Create company
  const newCompany = await companyModel.create({
    companyName,
    companyEmail,
    description,
    industry,
    address,
    numberOfEmployees,
    createdBy: req.user._id,
  });

  res.status(201).json({ message: "Company created successfully", company: newCompany });
});

//------------------------------------------ updateCompany ------------------------------------------------
export const updateCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });
  if (!company) return next(new Error("Company not found", { cause: 404 }));

  // Only owner can update
  if (company.createdBy.toString() !== req.user._id.toString()) {
    return next(new Error("You are not allowed to update this company", { cause: 403 }));
  }

  // Prevent updating legalAttachment
  const { legalAttachment, ...updateData } = req.body;

  const updatedCompany = await companyModel.findByIdAndUpdate(companyId, updateData, { new: true });

  res.status(200).json({ message: "Company updated successfully", company: updatedCompany });
});

//------------------------------------------ deleteCompany ------------------------------------------------
export const deleteCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find the company
  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  // Soft delete by setting deletedAt
  company.deletedAt = new Date();
  await company.save();

  res.status(200).json({ message: "Company deleted successfully" });
});

//------------------------------------------ getCompanyWithJobs ------------------------------------------------
export const getCompanyWithJobs = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null }).populate("jobs");
  if (!company) return next(new Error("Company not found", { cause: 404 }));

  res.status(200).json({ company });
});

//------------------------------------------ searchCompany ------------------------------------------------
export const searchCompany = asyncHandler(async (req, res, next) => {
  const { name } = req.params;

  const companies = await companyModel.find({ companyName: { $regex: name, $options: "i" }, deletedAt: null });

  res.status(200).json({ companies });
});

//------------------------------------------ uploadCompanyLogo ------------------------------------------------
export const uploadCompanyLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new Error("Company logo file not uploaded", { cause: 400 }));

  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });

  if (!company) return next(new Error("Company not found", { cause: 404 }));

  const result = await cloudinary.uploader.upload(req.file.path, { folder: "companyLogos" });

  fs.unlinkSync(req.file.path);
  company.logo = { secure_url: result.secure_url, public_id: result.public_id };
  await company.save();

  res.status(200).json({ message: "Company logo uploaded successfully", logo: company.logo });
});

//------------------------------------------ uploadCompanyCover ------------------------------------------------
export const uploadCompanyCover = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new Error("Company cover picture file not uploaded", { cause: 400 }));

  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });

  if (!company) return next(new Error("Company not found", { cause: 404 }));

  const result = await cloudinary.uploader.upload(req.file.path, { folder: "companyCovers" });

  fs.unlinkSync(req.file.path);
  company.coverPic = { secure_url: result.secure_url, public_id: result.public_id };
  await company.save();

  res.status(200).json({ message: "Company cover picture uploaded successfully", coverPic: company.coverPic });
});

//------------------------------------------ deleteCompanyLogo ------------------------------------------------
export const deleteCompanyLogo = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });

  if (!company) return next(new Error("Company not found", { cause: 404 }));

  if (company.logo?.public_id) await cloudinary.uploader.destroy(company.logo.public_id);
  company.logo = undefined;
  await company.save();

  res.status(200).json({ message: "Company logo deleted successfully" });
});

//------------------------------------------ deleteCompanyCover ------------------------------------------------
export const deleteCompanyCover = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  const company = await companyModel.findOne({ _id: companyId, deletedAt: null });

  if (!company) return next(new Error("Company not found", { cause: 404 }));

  if (company.coverPic?.public_id) await cloudinary.uploader.destroy(company.coverPic.public_id);
  company.coverPic = undefined;
  await company.save();

  res.status(200).json({ message: "Company cover picture deleted successfully" });
});
