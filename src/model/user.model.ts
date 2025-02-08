import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the schema fields
interface IUser extends Document {
  email: string;
  first_name?: string;
  gender?: string;
  last_name?: string;
  phone: string;
  dob: string;
  address: string;
  password: string;
  scope: string;
}

// Create a schema
const UserSchema: Schema<IUser> = new Schema(
  {
    first_name: { type: String },
    last_name: { type: String },
    email: { type: String },
    phone: { type: String },
    gender: { type: String },
    dob: { type: String },
    address: { type: String, default: 'N/A' },
    password: { type: String },
    scope: { type: String },
  },
  { timestamps: true }
);

// Create a model using the schema
const UserModel = mongoose.model<IUser>('user', UserSchema);

export default UserModel;
