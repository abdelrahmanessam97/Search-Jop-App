import joi from "joi";
import { generalsRules } from "../../utils/index.js";
import { genderTypes, roleTypes } from "../../db/utils/variables.js";

export const addJobSchema = joi
  .object({
    companyId: generalsRules.id,
    jobTitle: joi.string().required(),
    jobLocation: joi.string().required(),
    workingTime: joi.string().required(),
    seniorityLevel: joi.string().required(),
    jobDescription: joi.string().required(),
    technicalSkills: joi.array().required(),
    softSkills: joi.array().required(),
  })
  .required();

export const updateJobSchema = joi
  .object({
    jobId: generalsRules.id,
    jobTitle: joi.string().required(),
    jobLocation: joi.string().required(),
    workingTime: joi.string().required(),
    seniorityLevel: joi.string().required(),
    jobDescription: joi.string().required(),
    technicalSkills: joi.array().required(),
    softSkills: joi.array().required(),
  })
  .required();

export const getJobApplicationsSchema = joi
  .object({
    jobId: generalsRules.id,
  })
  .required();

export const deleteJobSchema = joi
  .object({
    jobId: generalsRules.id,
  })
  .required();

export const getJobsByCompanySchema = joi
  .object({
    companyId: generalsRules.id,
  })
  .required();

export const acceptOrRejectApplicantSchema = joi
  .object({
    applicationId: generalsRules.id,
    status: joi.string().required(),
  })
  .required();

