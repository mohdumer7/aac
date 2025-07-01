import mongoose, { Document, Model } from 'mongoose';
import Inventory, { IInventoryModel } from './Inventory.model';

interface IMaintenanceRecord {
    date: Date;
    type: 'preventive' | 'corrective' | 'upgrade';
    description: string;
    cost: number;
    performedBy: string;
    nextMaintenanceDate?: Date;
}

interface IAssignment {
    assignedTo: mongoose.Types.ObjectId;
    assignedType: 'User' | 'Department';
    assignedDate: Date;
    assignedBy: mongoose.Types.ObjectId;
    location: mongoose.Types.ObjectId;
    remarks?: string;
    returnedDate?: Date;
}

interface IAsset extends Document {
    _id: mongoose.Types.ObjectId;
    serialNumber: string;
    product: mongoose.Types.ObjectId;
    warehouse: mongoose.Types.ObjectId;
    inventory: mongoose.Types.ObjectId; // Reference to the inventory record
    status: 'available' | 'assigned' | 'maintenance' | 'retired';
    // Warranty Information
    warrantyStartDate: Date;
    warrantyEndDate: Date;
    // Asset Details
    specifications: Map<string, any>;
    currentAssignment?: IAssignment;
    assignmentHistory: IAssignment[];
    maintenanceRecords: IMaintenanceRecord[];
    isActive: boolean;
    addedBy: mongoose.Types.ObjectId;
    updatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

interface IAssetMethods {
    assign(assignedTo: string, assignedType: 'User' | 'Department', assignedBy: string, location: string, remarks?: string): Promise<void>;
    return(remarks?: string): Promise<void>;
    transfer(toWarehouseId: string): Promise<void>;
    addMaintenanceRecord(record: Omit<IMaintenanceRecord, 'date'>): Promise<void>;
    completeMaintenance(): Promise<void>;
    retire(remarks?: string): Promise<void>;
}

interface IAssetModel extends Model<IAsset, {}, IAssetMethods> {}

const AssetSchema = new mongoose.Schema({
    // Basic Information
    serialNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        autopopulate: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    inventory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
        autopopulate: true
    },
    status: {
        type: String,
        enum: ['available', 'assigned', 'maintenance', 'retired'],
        default: 'available'
    },
    // Warranty Information
    warrantyStartDate: {
        type: Date,
        required: true
    },
    warrantyEndDate: {
        type: Date,
        required: true
    },
    // Asset Details
    specifications: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // Assignment Information
    currentAssignment: {
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'currentAssignment.assignedType'
        },
        assignedType: {
            type: String,
            enum: ['User', 'Department']
        },
        assignedDate: {
            type: Date
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location'
        },
        remarks: String
    },

    // Assignment History
    assignmentHistory: [{
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'assignmentHistory.assignedType'
        },
        assignedType: {
            type: String,
            enum: ['User', 'Department']
        },
        assignedDate: {
            type: Date
        },
        returnedDate: Date,
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        location: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Location'
        },
        remarks: String
    }],

    // Maintenance Records
    maintenanceRecords: [{
        date: Date,
        type: {
            type: String,
            enum: ['preventive', 'corrective', 'upgrade']
        },
        description: String,
        cost: Number,
        performedBy: String,
        nextMaintenanceDate: Date
    }],

    isActive: {
        type: Boolean,
        default: true
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
    timestamps: true
});

AssetSchema.plugin(require('mongoose-autopopulate'));

// Update inventory when asset is created
AssetSchema.post('save', async function(this: IAsset) {
    const inventory = mongoose.model('Inventory') as IInventoryModel;
    await inventory.updateInventoryForAsset(
        this.warehouse.toString(),
        this._id.toString()
    );
});

// Handle asset assignment
AssetSchema.methods.assign = async function(assignedTo: string, assignedType: 'User' | 'Department', assignedBy: string, location: string, remarks?: string) {
    // If already assigned, add to history first
    if (this.currentAssignment) {
        this.assignmentHistory.push({
            ...this.currentAssignment,
            returnedDate: new Date()
        });
    }

    // Update current assignment
    this.currentAssignment = {
        assignedTo: new mongoose.Types.ObjectId(assignedTo),
        assignedType,
        assignedDate: new Date(),
        assignedBy: new mongoose.Types.ObjectId(assignedBy),
        location: new mongoose.Types.ObjectId(location),
        remarks
    };

    this.status = 'assigned';
    await this.save();
};

// Handle asset return
AssetSchema.methods.return = async function(remarks?: string) {
    if (this.currentAssignment) {
        this.assignmentHistory.push({
            ...this.currentAssignment,
            returnedDate: new Date(),
            remarks: remarks || this.currentAssignment.remarks
        });
    }

    this.currentAssignment = undefined;
    this.status = 'available';
    await this.save();
};

// Handle asset transfer between warehouses
AssetSchema.methods.transfer = async function(toWarehouseId: string) {
    const fromWarehouseId = this.warehouse.toString();
    this.warehouse = new mongoose.Types.ObjectId(toWarehouseId);
    await this.save();

    const inventory = mongoose.model('Inventory') as IInventoryModel;
    await inventory.transferAsset(
        this._id.toString(),
        fromWarehouseId,
        toWarehouseId
    );
};

// Add maintenance record
AssetSchema.methods.addMaintenanceRecord = async function(record: Omit<IMaintenanceRecord, 'date'>) {
    this.maintenanceRecords.push({
        ...record,
        date: new Date()
    });

    this.status = 'maintenance';
    await this.save();
};

// Complete maintenance
AssetSchema.methods.completeMaintenance = async function() {
    this.status = 'available';
    await this.save();
};

// Retire asset
AssetSchema.methods.retire = async function(remarks?: string) {
    this.status = 'retired';
    if (remarks) {
        this.remarks = remarks;
    }
    await this.save();
};

const Asset = mongoose.models.Asset || mongoose.model<IAsset, IAssetModel>('Asset', AssetSchema);

export type { IAsset, IAssetModel, IMaintenanceRecord, IAssignment };
export default Asset;