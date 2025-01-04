import { Schema, model } from "mongoose";
import { INotificationPreference } from "../interfaces/notification-preference.interface";

const notificationChannelSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    config: {
      email: String,
      phoneNumber: String,
      deviceTokens: [String],
      webhookUrl: String,
    },
  },
  { _id: false }
);

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    channels: {
      email: {
        type: notificationChannelSchema,
        required: true,
      },
      push: {
        type: notificationChannelSchema,
        required: true,
      },
      sms: {
        type: notificationChannelSchema,
        required: true,
      },
      webhook: notificationChannelSchema,
    },
    categories: {
      marketing: {
        type: Boolean,
        default: true,
      },
      system: {
        type: Boolean,
        default: true,
      },
      security: {
        type: Boolean,
        default: true,
      },
    },
    schedules: {
      quietHours: {
        start: String,
        end: String,
        timezone: String,
      },
      deliveryWindow: {
        start: String,
        end: String,
        timezone: String,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
notificationPreferenceSchema.index({ "channels.email.enabled": 1 });
notificationPreferenceSchema.index({ "channels.push.enabled": 1 });
notificationPreferenceSchema.index({ "channels.sms.enabled": 1 });

export const NotificationPreferenceModel = model<INotificationPreference>(
  "NotificationPreference",
  notificationPreferenceSchema
);
