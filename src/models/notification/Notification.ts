import mongoose, { Document, Schema } from 'mongoose';

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: string; // 'info', 'warning', 'success', 'error'
  isRead: boolean;
  source: string; // which feature generated the notification
  link: string; // optional link to navigate when clicked
  data: any; // additional data
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  addedBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
}

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  source: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '',
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  addedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});


NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<NotificationDocument>('Notification', NotificationSchema); 