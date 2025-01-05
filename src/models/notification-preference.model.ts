import { Schema, model } from "mongoose";
import {
  INotificationPreference,
  IChannelPreference,
} from "../interfaces/notification-preference.interface";

const channelPreferenceSchema = new Schema<IChannelPreference>(
  {
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    quietHours: {
      start: String,
      end: String,
    },
    limits: {
      hourly: {
        type: Number,
        min: 0,
        default: 10,
      },
      daily: {
        type: Number,
        min: 0,
        default: 50,
      },
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
      index: true,
    },
    channels: {
      email: channelPreferenceSchema,
      sms: channelPreferenceSchema,
      push: channelPreferenceSchema,
    },
    globalQuietHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      start: String,
      end: String,
    },
    globalLimits: {
      hourly: {
        type: Number,
        min: 0,
        default: 20,
      },
      daily: {
        type: Number,
        min: 0,
        default: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
notificationPreferenceSchema.index({ "channels.email.enabled": 1 });
notificationPreferenceSchema.index({ "channels.sms.enabled": 1 });
notificationPreferenceSchema.index({ "channels.push.enabled": 1 });

export const NotificationPreferenceModel = model<INotificationPreference>(
  "NotificationPreference",
  notificationPreferenceSchema
);
