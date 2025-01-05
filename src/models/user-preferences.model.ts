import { Schema, model } from "mongoose";
import { IUserPreference } from "@/interfaces/user-preference.interface";

const notificationChannelSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    quietHours: {
      start: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: "Quiet hours must be in HH:mm format",
        },
      },
      end: {
        type: String,
        validate: {
          validator: function (v: string) {
            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
          },
          message: "Quiet hours must be in HH:mm format",
        },
      },
    },
  },
  { _id: false }
);

const categorySchema = new Schema(
  {
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    channels: {
      type: [
        {
          type: String,
          enum: ["email", "sms", "push"],
        },
      ],
      default: ["email", "push"],
    },
  },
  { _id: false }
);

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    notifications: {
      email: notificationChannelSchema,
      sms: notificationChannelSchema,
      push: notificationChannelSchema,
    },
    categories: {
      type: Map,
      of: categorySchema,
      default: {},
    },
    timezone: {
      type: String,
      default: "UTC",
      validate: {
        validator: function (v: string) {
          try {
            Intl.DateTimeFormat(undefined, { timeZone: v });
            return true;
          } catch (e) {
            return false;
          }
        },
        message: "Invalid timezone identifier",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure notifications object always has all channels
userPreferenceSchema.pre("save", function (next) {
  if (!this.notifications) {
    this.notifications = {
      email: { enabled: true },
      sms: { enabled: false },
      push: { enabled: true },
    };
  }
  next();
});

export const UserPreferencesModel = model<IUserPreference>(
  "UserPreferences",
  userPreferenceSchema
);
