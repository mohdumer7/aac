import { Model, Schema, models, model } from "mongoose";
import { smlsubgroup } from "@/types";

const SubGroupSchema: Schema<smlsubgroup> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    group: {
      type: Schema.Types.ObjectId,
      ref: "SmlGroup", // Reference to the Group model
      autopopulate: true
    },
    addedBy: { type: String },
    updatedBy: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
SubGroupSchema.plugin(require('mongoose-autopopulate'));
const SubGroup: Model<smlsubgroup> = models.SmlSubGroup || model<smlsubgroup>("SmlSubGroup", SubGroupSchema);

export default SubGroup;
