import mongoose, { Schema, Document } from 'mongoose';
import { MONGO_MODELS } from '@/shared/constants';

// Interfaces for React Flow data structure
export interface IFlowNodeData {
  userId: mongoose.Types.ObjectId; // Reference to USER_MASTER
  label: string; // Typically user's name or role for display in the node
  departmentId?: mongoose.Types.ObjectId; // Optional, ref to DEPARTMENT_MASTER
  // Add any other data you want to store per node
}

export interface IFlowNode {
  id: string; // React Flow node ID (e.g., '1', 'user-abc')
  type?: string; // Custom node type if any (e.g., 'customUserNode')
  data: IFlowNodeData;
  position: { x: number; y: number }; // Position on the canvas
  // React Flow adds other properties like width, height, selected, dragging etc.
  // We don't need to define all of them in schema unless we specifically manage them.
}

export interface IFlowEdge {
  id: string; // React Flow edge ID (e.g., 'edge-1-2')
  source: string; // Source node ID
  target: string; // Target node ID
  animated?: boolean;
  label?: string; // Optional label for the edge
  type?: string; // Custom edge type if any
  // React Flow adds other properties like selected.
}

export interface IFlowDefinition {
  nodes: IFlowNode[];
  edges: IFlowEdge[];
  viewport?: { x: number; y: number; zoom: number }; // To save the canvas view
}

// Main document interface for ApprovalFlow
export interface IApprovalFlow extends Document {
  flowName: string;
  description?: string;
  flowDefinition: IFlowDefinition; // Stores the React Flow nodes and edges
  createdBy: mongoose.Types.ObjectId; // Ref to User
  companyId: mongoose.Types.ObjectId; // Ref to Organisation
  departmentId?: mongoose.Types.ObjectId; // Optional: if flow is specific to a department. Ref to Department
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ApprovalFlowSchema: Schema<IApprovalFlow> = new Schema(
  {
    flowName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    flowDefinition: {
      type: Schema.Types.Mixed, // Allows storing arbitrary object structure for nodes/edges
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Organisation',
      required: false, // Made optional
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure uniqueness for flowName within a company
ApprovalFlowSchema.index({ flowName: 1 }, { unique: true }); // companyId removed from unique index

// Add a virtual for the createdBy user details if needed (example)
ApprovalFlowSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

export default mongoose.models[MONGO_MODELS.APPROVAL_FLOW_MASTER] ||
  mongoose.model<IApprovalFlow>(MONGO_MODELS.APPROVAL_FLOW_MASTER, ApprovalFlowSchema);