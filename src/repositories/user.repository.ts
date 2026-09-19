import { UserModel } from "./user.model.js";

export const findUserByEmail = async (
  email: string,
) => {
  return UserModel.findOne({
    email: email.toLowerCase(),
  });
};

export const findUserById = async (
  id: string,
) => {
  return UserModel.findById(id);
};

export const createUser = async (
  email: string,
  passwordHash: string,
) => {
  const user = new UserModel({
    email: email.toLowerCase(),
    passwordHash,
  });

  return user.save();
};