import { Model, Schema, models, model } from "mongoose";
import { access } from "@/types";


const AccessSchema: Schema<access> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true }, // e.g., "menu", "submenu", "accessor"
    isMenuItem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    url: { type: String, default: "/#" }, // Only for menu items
    parent: { type: Schema.Types.ObjectId, ref: "Access" }, // Single parent
    addedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    order: { type: Number, default : 1},
    icon: { type: String},
  },
  { timestamps: true }
);

const Access: Model<access> = models.Access || model<access>("Access", AccessSchema);

export default Access;
