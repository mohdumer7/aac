import mongoose, { Document, Model, Schema } from "mongoose";

import { productType } from "@/types/master/productType.types";

const ProductTypeSchema: Schema<productType> = new Schema({
    name: { type: String, required:true },
    isActive: { type: Boolean, default:true },
    addedBy: { type: String },
    updatedBy: { type: String },
   
}, { timestamps: true })


const ProductType: Model<productType> = mongoose.models.ProductType || mongoose.model<productType>("ProductType", ProductTypeSchema)

export default ProductType
