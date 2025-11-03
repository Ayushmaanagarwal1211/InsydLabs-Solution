import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  type: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema: Schema = new Schema(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model<ISetting>("Setting", SettingSchema);
