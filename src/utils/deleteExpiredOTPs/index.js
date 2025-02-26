export const deleteExpiredOTPs = async (model) => {
  await model.updateMany({ "OTP.expiresIn": { $lt: Date.now() } }, { $pull: { OTP: { expiresIn: { $lt: Date.now() } } } });
};
