import mongoose, { Document, Schema } from "mongoose";

import { InterviewKit } from "../types/interviewKit/interviewKit.js";

export interface InterviewKitDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
  source: InterviewKit["source"];
  companyBrief: InterviewKit["companyBrief"];
  role: InterviewKit["role"];
  questions: InterviewKit["questions"];
  flashcards: InterviewKit["flashcards"];
  schedule: InterviewKit["schedule"];
  coverage: InterviewKit["coverage"];
  warnings: InterviewKit["warnings"];
}

const requirementSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["must", "nice"],
      required: true,
    },

    isUserEdited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const questionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },

    question: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "technical",
        "behavioral",
        "system-design",
        "company-fit",
      ],
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },

    requirementIds: {
      type: [String],
      required: true,
    },

    isUserEdited: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const flashcardPracticeSchema = new Schema(
  {
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    covered: {
      type: Boolean,
      required: true,
    },

    reviewCount: {
      type: Number,
      required: true,
      default: 0,
    },

    lastReviewedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const flashcardSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },

    questionId: {
      type: String,
      required: true,
    },

    front: {
      type: String,
      required: true,
    },

    back: {
      type: String,
      required: true,
    },

    requirementIds: {
      type: [String],
      required: true,
    },

    isUserEdited: {
      type: Boolean,
      default: false,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    practice: {
      type: flashcardPracticeSchema,
      required: false,
    },
  },
  { _id: false },
);

const scheduleSchema = new Schema(
  {
    day: {
      type: Number,
      required: true,
    },

    focus: {
      type: String,
      required: true,
    },

    questionIds: {
      type: [String],
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const coverageSchema = new Schema(
  {
    requirementId: {
      type: String,
      required: true,
    },

    covered: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const interviewKitSchema =
  new Schema<InterviewKitDocument>(
    {
      ownerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      source: {
        jobDescription: {
          type: String,
          required: true,
        },

        companyUrl: {
          type: String,
          required: true,
        },
      },

      companyBrief: {
        type: Schema.Types.Mixed,
        required: true,
      },

      role: {
        title: {
          type: String,
          required: true,
        },

        requirements: {
          type: [requirementSchema],
          required: true,
        },
      },

      questions: {
        type: [questionSchema],
        required: true,
      },

      flashcards: {
        type: [flashcardSchema],
        required: true,
      },

      schedule: {
        type: [scheduleSchema],
        required: true,
      },

      coverage: {
        type: [coverageSchema],
        required: true,
      },

      warnings: {
        type: [String],
        required: false,
        default: [],
      },
    },
    {
      timestamps: true,
    },
  );

/**
 * By default Mongoose documents serialize with `_id`/`__v` and without the
 * `id` string virtual, while `createInterviewKit` (create response) manually
 * returns an explicit `id`. Without this, every other endpoint (get/update/
 * builder operations, which all return the raw document) would expose a
 * different identifier shape than the create response. This makes every
 * kit-shaped API response consistent for API consumers.
 */
interviewKitSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const output = ret as unknown as Record<string, unknown>;
    delete output._id;
    delete output.ownerId;
    return output;
  },
});

export const InterviewKitModel =
  mongoose.model<InterviewKitDocument>(
    "InterviewKit",
    interviewKitSchema,
  );