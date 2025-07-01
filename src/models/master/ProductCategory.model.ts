import mongoose, { Model, Schema } from "mongoose";
import { productCategory } from "@/types/master/productCategory.types";

const ProductCategorySchema: Schema<productCategory> = new Schema({
    name: { type: String, required: true},
    description: { type: String },
    specsRequired: { type: mongoose.Schema.Types.Mixed}, // Stores the JSON object of required specs
    productType: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType', required: true },
    isActive: { type: Boolean, default: true },
    addedBy: { type: String },
    updatedBy: { type: String }
}, { timestamps: true });

const ProductCategory: Model<productCategory> = mongoose.models.ProductCategory || mongoose.model<productCategory>("ProductCategory", ProductCategorySchema);

export default ProductCategory;