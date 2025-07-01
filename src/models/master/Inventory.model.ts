import mongoose, { Document, Model } from 'mongoose';

interface IInventory extends Document {
    warehouse: mongoose.Types.ObjectId;
    // Invoice Information
    purchaseDate: Date;
    vendor: mongoose.Types.ObjectId;
    poNumber: string;
    prNumber?: string;
    invoiceNumber: string;
    // Assets in this invoice
    assets: mongoose.Types.ObjectId[];
    // Status
    status: 'draft' | 'pending' | 'received' | 'cancelled';
    isActive: boolean;
    addedBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

interface IInventoryMethods {
    addAssets(assetIds: string[]): Promise<void>;
    removeAssets(assetIds: string[]): Promise<void>;
}

interface IInventoryModel extends Model<IInventory, {}, IInventoryMethods> {
    updateInventoryForAsset(warehouseId: string, assetId: string): Promise<void>;
    transferAsset(assetId: string, fromWarehouseId: string, toWarehouseId: string): Promise<void>;
    getWarehouseInventory(warehouseId: string): Promise<IInventory[]>;
}

const InventorySchema = new mongoose.Schema({
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    // Invoice Information
    purchaseDate: {
        type: Date,
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    poNumber: {
        type: String,
        required: true
    },
    prNumber: String,
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    // Assets in this invoice
    assets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    }],
    // Status
    status: {
        type: String,
        enum: ['draft', 'pending', 'received', 'cancelled'],
        default: 'draft'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Add assets to inventory
InventorySchema.methods.addAssets = async function(assetIds: string[]) {
    this.assets.push(...assetIds);
    await this.save();
};

// Remove assets from inventory
InventorySchema.methods.removeAssets = async function(assetIds: string[]) {
    this.assets = this.assets.filter((id: mongoose.Types.ObjectId) => 
        !assetIds.includes(id.toString())
    );
    await this.save();
};

// Create or update inventory when an asset is added
InventorySchema.statics.updateInventoryForAsset = async function(warehouseId: string, assetId: string) {
    const inventory = await this.findOne({ warehouse: warehouseId });
    
    if (inventory) {
        await this.findByIdAndUpdate(inventory._id, {
            $push: { assets: assetId }
        });
    } else {
        await this.create({
            warehouse: warehouseId,
            assets: [assetId],
            status: 'received'
        });
    }
};

// Update inventory when an asset is transferred
InventorySchema.statics.transferAsset = async function(assetId: string, fromWarehouseId: string, toWarehouseId: string) {
    // Remove from source warehouse inventory
    await this.findOneAndUpdate(
        { warehouse: fromWarehouseId },
        { $pull: { assets: assetId } }
    );

    // Add to destination warehouse inventory
    const toInventory = await this.findOne({ warehouse: toWarehouseId });
    if (toInventory) {
        await this.findByIdAndUpdate(toInventory._id, {
            $push: { assets: assetId }
        });
    } else {
        await this.create({
            warehouse: toWarehouseId,
            assets: [assetId],
            status: 'received'
        });
    }
};

// Get inventory levels for a warehouse
InventorySchema.statics.getWarehouseInventory = async function(warehouseId: string) {
    return this.find({ warehouse: warehouseId })
        .populate({
            path: 'assets',
            populate: {
                path: 'product',
                model: 'Product'
            }
        })
        .populate('vendor');
};

const Inventory = mongoose.models.Inventory || mongoose.model<IInventory, IInventoryModel>('Inventory', InventorySchema);

export type { IInventory, IInventoryModel };
export default Inventory;