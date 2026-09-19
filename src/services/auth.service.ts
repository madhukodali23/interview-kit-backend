import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository.js";
import { UserDocument } from "../repositories/user.model.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

const SALT_ROUNDS = 10;

export const registerUser = async (
  email: string,
  password: string,
): Promise<UserDocument> => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError(
      ERROR_CODES.EMAIL_ALREADY_REGISTERED,
      ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED,
      409,
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    SALT_ROUNDS,
  );

  return createUser(email, passwordHash);
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<UserDocument | null> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    return null;
  }

  return user;
};

export const getUserById = async (
  id: string,
): Promise<UserDocument | null> => {
  return findUserById(id);
};
