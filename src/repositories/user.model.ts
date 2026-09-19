import mongoose, { Document, Schema } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel =
  mongoose.model<UserDocument>("User", userSchema);