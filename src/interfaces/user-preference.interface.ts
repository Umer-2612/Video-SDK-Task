import { Types } from "mongoose";

export interface INotificationChannel {
  enabled: boolean;
  quietHours?: {
    start: string; // Format: HH:mm
    end: string; // Format: HH:mm
  };
}

export interface ICategory {
  enabled: boolean;
  channels: Array<"email" | "sms" | "push">;
}

export interface IUserPreference {
  userId: Types.ObjectId;
  notifications: {
    email: INotificationChannel;
    sms: INotificationChannel;
    push: INotificationChannel;
  };
  categories: {
    [key: string]: ICategory;
  };
  timezone: string; // IANA timezone identifier
  updatedAt?: Date;
  createdAt?: Date;
}
