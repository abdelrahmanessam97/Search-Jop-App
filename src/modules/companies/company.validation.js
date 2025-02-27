import joi from "joi";
import { generalsRules } from "../../utils/index.js";
import { genderTypes, roleTypes } from "../../db/utils/variables.js";

export const addCompanySchema = joi
  .object({
    companyName: joi.string().min(3).max(30).required(),
    companyEmail: generalsRules.email.required(),
    address: joi.string().required(),
    description: joi.string().required(),
    industry: joi.string().required(),
    numberOfEmployees: joi.string().required(),
  })
  .required();

export const updateCompanySchema = joi
  .object({
    companyName: joi.string().min(3).max(30),
    companyEmail: generalsRules.email,
    address: joi.string(),
    description: joi.string(),
    industry: joi.string(),
    numberOfEmployees: joi.string(),
    companyId: generalsRules.id,
  })
  .required();

export const deleteCompanySchema = joi
  .object({
    companyId: generalsRules.id,
  })
  .required();

export const getCompanyWithJobsSchema = joi
  .object({
    companyId: generalsRules.id,
  })
  .required();

export const searchCompanySchema = joi
  .object({
    name: joi.string().min(3).max(30),
  })
  .required();

export const uploadCompanyLogoSchema = joi
  .object({
    companyId: generalsRules.id,
    logo: generalsRules.headers,
  })
  .required();

export const uploadCompanyCoverSchema = joi
  .object({
    companyId: generalsRules.id,
    coverPic: generalsRules.headers,
  })
  .required();

export const deleteCompanyLogoSchema = joi
  .object({
    companyId: generalsRules.id,
  })
  .required();

export const deleteCompanyCoverSchema = joi
  .object({
    companyId: generalsRules.id,
  })
  .required();
