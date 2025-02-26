import jwt from "jsonwebtoken";

export const verifyToken = async ({ token, SIGNATURE }) => {
  try {
    return jwt.verify(token, SIGNATURE);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("token is expired", { cause: 400 });
    }
  }
};
