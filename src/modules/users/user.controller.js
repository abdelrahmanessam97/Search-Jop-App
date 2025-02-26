import { Router } from "express";
import { validation } from "./../../middleware/validation.js";
import { authorization, authentication } from "./../../middleware/auth.js";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { fileTypes, multerLocal } from "../../middleware/multer.js";

const userRouter = Router();

userRouter.patch("/update_user", authentication, US.updateUser);
userRouter.get("/me", authentication, US.getUserData);
userRouter.get("/getUserProfile/:id", authentication, US.getUserProfile);
userRouter.patch("/update-password", authentication, US.updatePassword);
userRouter.post("/upload-profile-pic", authentication, multerLocal(fileTypes.image, "profilePics").single("profilePic"), US.uploadProfilePic);
userRouter.post("/upload-cover-pic", authentication, multerLocal(fileTypes.image, "coverPics").single("coverPic"), US.uploadCoverPic);
userRouter.delete("/delete-profile-pic", authentication, US.deleteProfilePic);
userRouter.delete("/delete-cover-pic", authentication, US.deleteCoverPic);
userRouter.delete("/soft-delete", authentication, authorization(["Admin"]), US.softDeleteUser);

export default userRouter;
