// src/models/ticket/UserSkill.model.ts
import mongoose, { Document, Model, Schema } from "mongoose";
import { Query } from "mongoose";

export interface UserSkillDocument extends Document {
  user: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  rating: number;
  isActive: boolean;
  addedBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSkillSchema: Schema<UserSkillDocument> = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TicketCategory",
    required: true
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  isActive: { type: Boolean, default: true },
  addedBy: { type: String },
  updatedBy: { type: String }
}, { timestamps: true });

UserSkillSchema.pre<Query<any, UserSkillDocument>>(/^find/, function (next) {
  this.populate([
    { path: "user" },
    { path: "category" }
  ]);
  next();
});

const UserSkill: Model<UserSkillDocument> = 
  mongoose.models.UserSkill || mongoose.model<UserSkillDocument>("UserSkill", UserSkillSchema);

export default UserSkill;