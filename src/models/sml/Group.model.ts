import { Model, Schema, models, model } from "mongoose";
import { group } from "@/types";

const GroupSchema: Schema<group> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    addedBy: { type: String },
    updatedBy: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Group: Model<group> = models.SmlGroup || model<group>("SmlGroup", GroupSchema);

export default Group;
