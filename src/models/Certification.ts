import mongoose, { Document, Schema } from 'mongoose';

export interface ICertification extends Document {
  name: string;
  issuer: string;
  issueDate: string;
  credentialId: string;
  credentialUrl: string;
  imageUrl: string;
  visible: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const certificationSchema = new Schema<ICertification>(
  {
    name: {
      type: String,
      required: [true, 'Certificate name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true,
      maxlength: [200, 'Issuer cannot exceed 200 characters'],
    },
    issueDate: {
      type: String,
      default: '',
    },
    credentialId: {
      type: String,
      default: '',
    },
    credentialUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    visible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

certificationSchema.index({ visible: 1, order: 1 });

export const Certification = mongoose.model<ICertification>('Certification', certificationSchema);
