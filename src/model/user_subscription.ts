import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the schema fields
interface IUserSubscription extends Document {
  user_id: mongoose.Schema.Types.ObjectId;
  subscription_id: mongoose.Schema.Types.ObjectId;
  end_date: Date;
  price: number;
  status: string;
  type: string;
  discount: number;
}

// Create a schema
const UserSubscriptionSchema: Schema<IUserSubscription> = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subscription_id: { type: mongoose.Schema.Types.ObjectId, ref: "Subscriptions" },
    end_date: { type: Date },
    price: { type: Number },
    status: { type: String },
    type: { type: String },
    discount: { type: Number,default:null },
  },
  { timestamps: true }
);

// Create a model using the schema
const UserSubscriptionModel = mongoose.model<IUserSubscription>('user_subscription', UserSubscriptionSchema);

export default UserSubscriptionModel;
