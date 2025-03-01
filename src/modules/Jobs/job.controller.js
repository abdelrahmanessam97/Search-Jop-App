import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./job.service.js";
import * as UV from "./job.validation.js";
import { fileTypes, multerHost, multerLocal } from "../../middleware/multer.js";

const jobRouter = Router();

// 1. Add Job (HR or Company Owner)
jobRouter.post("/addJob/:companyId", authentication, authorization(["Hr", "Owner"]), validation(UV.addJobSchema), US.addJob);

// 2. Update Job (Only the Job Owner)
jobRouter.put("/updateJob/:jobId", authentication, authorization(["Hr", "Owner"]), validation(UV.updateJobSchema), US.updateJob);

// 3. Delete Job (Only HR or Company Owner)
jobRouter.delete("/deleteJob/:jobId", authentication, authorization(["Hr", "Owner"]), validation(UV.deleteJobSchema), US.deleteJob);

// 4. Get all Jobs or specific Job (with filters, pagination, sorting)
jobRouter.get("/getJobs", US.getJobs);
jobRouter.get("/getJobsByCompany/:companyId", validation(UV.getJobsByCompanySchema), US.getJobsByCompany);

// 5. Get Jobs matching filters (workingTime, jobLocation, etc.)
jobRouter.get("/filter", US.getFilteredJobs);

// 6. Get all applications for a Job (Only HR or Owner)
jobRouter.get("/getJobApplications/:jobId", authentication, authorization(["Hr", "Owner"]), validation(UV.getJobApplicationsSchema), US.getJobApplications);

// 7. Apply to Job (User Role Only)
jobRouter.post("/applyToJob/:jobId", authentication, authorization(["User"]), multerHost(fileTypes.pdf).single("userCV"), US.applyToJob);

// 8. Accept or Reject an Applicant (Only HR)
jobRouter.patch("/acceptOrRejectApplicant/:applicationId", authentication, authorization(["Hr"]), validation(UV.acceptOrRejectApplicantSchema), US.acceptOrRejectApplicant);

export default jobRouter;
