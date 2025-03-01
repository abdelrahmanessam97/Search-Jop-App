import { userModel } from "../db/models/index.js";
import { verifyToken } from "../utils/index.js";
import { asyncHandler } from "./../utils/error/index.js";
import jwt from "jsonwebtoken";

export const authentication = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;

  const [prefix, token] = authorization?.split(" ") ?? ["", ""];

  // Check if any of the required fields are missing
  if (!prefix || !token) {
    return next(new Error("token not found", { cause: 400 }));
  }

  // Check if prefix is valid
  let SIGNATURE_TOKEN = undefined;

  if (prefix === process.env.PREFIX_TOKEN_USER) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_USER;
  } else if (prefix === process.env.PREFIX_TOKEN_ADMIN) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_ADMIN;
  } else if (prefix === process.env.PREFIX_TOKEN_HR) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_HR;
  } else if (prefix === process.env.PREFIX_TOKEN_OWNER) {
    SIGNATURE_TOKEN = process.env.SIGNATURE_TOKEN_OWNER;
  } else {
    return next(new Error("prefix is invalid", { cause: 400 }));
  }

  // verify a token symmetric - synchronous
  const decoded = await verifyToken({ token, SIGNATURE: SIGNATURE_TOKEN });
  console.log(decoded);

  if (!decoded?.id) {
    return next(new Error("token is invalid", { cause: 400 }));
  }

  // get user
  const user = await userModel.findById(decoded.id);
  if (!user) {
    return next(new Error("user not found", { cause: 400 }));
  }

  // check if user changed password after the token was issued
  if (parseInt(user?.passwordChangedAt?.getTime() / 1000) > decoded.iat) {
    return next(new Error("token expired please login again", { cause: 400 }));
  }

  // check if user is deleted
  if (user?.isDeleted) {
    return next(new Error("user is deleted", { cause: 400 }));
  }

  // add user to request
  req.user = user;

  // pass the request to the next middleware
  next();
});

export const authorization = (accessRoles = []) => {
  return asyncHandler((req, res, next) => {
    const { role } = req?.user;
    console.log("User Role:", role);
    console.log("Allowed Roles:", accessRoles);
    console.log("Access Granted:", accessRoles.includes(role));

    if (!accessRoles.includes(role)) {
      return next(new Error("you are not authorized", { cause: 400 }));
    }
    next();
  });
};
