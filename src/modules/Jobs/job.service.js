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
