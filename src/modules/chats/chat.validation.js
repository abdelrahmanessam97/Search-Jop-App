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
