import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./company.service.js";
import * as UV from "./company.validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";

const companyRouter = Router();

// Add a new company (Only authenticated users)
companyRouter.post("/addCompany", authentication, validation(UV.addCompanySchema), US.addCompany);

// // Update company (Only owner)
companyRouter.patch("/updateCompany/:companyId", authentication, validation(UV.updateCompanySchema), US.updateCompany);

// Soft delete company (Only admin or owner)
companyRouter.delete("/deleteCompany/:companyId", authentication, validation(UV.deleteCompanySchema), authorization(["Admin", "Owner"]), US.deleteCompany);

// Get company with related jobs
companyRouter.get("/getCompanyWithJobs/:companyId", validation(UV.getCompanyWithJobsSchema), US.getCompanyWithJobs);

// Search for a company by name
companyRouter.get("/searchCompany/:name", validation(UV.searchCompanySchema), US.searchCompany);

// Upload Company Logo
companyRouter.post("/upload-logo/:companyId", authentication, validation(UV.uploadCompanyLogoSchema), multerHost(fileTypes.image).single("logo"), US.uploadCompanyLogo);

// Upload Company Cover Pic
companyRouter.post("/upload-cover/:companyId", authentication, validation(UV.uploadCompanyCoverSchema), multerHost(fileTypes.image).single("coverPic"), US.uploadCompanyCover);

// Delete Company Logo
companyRouter.delete("/delete-logo/:companyId", authentication, validation(UV.deleteCompanyLogoSchema), US.deleteCompanyLogo);

// Delete Company Cover Pic
companyRouter.delete("/delete-cover/:companyId", authentication, validation(UV.deleteCompanyCoverSchema), US.deleteCompanyCover);

export default companyRouter;
