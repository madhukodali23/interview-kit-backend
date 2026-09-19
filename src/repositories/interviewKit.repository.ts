import mongoose from "mongoose";

import { InterviewKit } from "../types/interviewKit/interviewKit.js";
import { InterviewKitModel } from "./interviewKit.model.js";

export const saveInterviewKit = async (
  kit: InterviewKit,
  ownerId: string,
) => {
  const document = new InterviewKitModel({
    ...kit,
    ownerId: new mongoose.Types.ObjectId(ownerId),
  });

  return document.save();
};

export const findInterviewKitById = async (
  id: string,
  ownerId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return InterviewKitModel.findOne({
    _id: id,
    ownerId,
  });
};

export const findInterviewKitsByOwner = async (
  ownerId: string,
) => {
  return InterviewKitModel.find({
    ownerId,
  }).sort({
    createdAt: -1,
  });
};

export const updateInterviewKitById = async (
  id: string,
  ownerId: string,
  updates: Partial<InterviewKit>,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return InterviewKitModel.findOneAndUpdate(
    {
      _id: id,
      ownerId,
    },
    {
      $set: updates,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

export const deleteInterviewKitById = async (
  id: string,
  ownerId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return InterviewKitModel.findOneAndDelete({
    _id: id,
    ownerId,
  });
};