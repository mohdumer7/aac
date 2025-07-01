import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
            required: true,
            autopopulate: true
        },
        contactPerson: { type: String, required: true },
        contactNumber: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            autopopulate: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            autopopulate: true,
        },
    },
    {
        timestamps: true,
    }
);

WarehouseSchema.plugin(require("mongoose-autopopulate"));

const Warehouse = mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);

export default Warehouse;