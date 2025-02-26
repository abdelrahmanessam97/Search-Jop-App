import joi from "joi";
import { generalsRules } from "../../utils/index.js";
import { genderTypes, roleTypes } from "../../db/utils/variables.js";

export const updateUserSchema = joi
  .object({
    firstName: joi.string().min(3).max(30).required(),
    lastName: joi.string().min(3).max(30).required(),
    mobileNumber: joi
      .string()
      .regex(/^01[0125][0-9]{8}$/)
      .required(),
    gender: joi.string().valid(genderTypes.Male, genderTypes.Female).required(),
    DOB: joi.date().required(),
  })
  .required();

export const updatePasswordSchema = joi
  .object({
    oldPassword: generalsRules.password.required(),
    newPassword: generalsRules.password.required(),
    confirm_newPassword: generalsRules.password.valid(joi.ref("newPassword")).required(),
  })
  .required();
