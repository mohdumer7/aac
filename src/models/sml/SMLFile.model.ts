import { Model, Schema, models, model } from "mongoose";
import { smlfile } from "@/types";

const SmlFileSchema: Schema<smlfile> = new Schema(
    {
        fileName: String,
        description: String,
        fileSize: Number,
        revNo: Number,
        subGroup: {
            type: Schema.Types.ObjectId,
            ref: "SmlSubGroup", // Reference to the Group model
            autopopulate: true
        },
        fileId: { type: Schema.Types.ObjectId, required: true },
        addedBy: { type: String },
        updatedBy: { type: String },
        isActive: { type: Boolean, default: true },
    },

    { timestamps: true }
);

SmlFileSchema.plugin(require('mongoose-autopopulate'));
const SmlFile: Model<smlfile> = models.SmlFile || model<smlfile>("SmlFile", SmlFileSchema);

export default SmlFile;
