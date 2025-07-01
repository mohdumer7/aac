import mongoose from 'mongoose';
import { unique } from 'next/dist/build/utils';

const ProductSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductCategory',
        required: true,
        autopopulate: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

ProductSchema.plugin(require('mongoose-autopopulate'));
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;