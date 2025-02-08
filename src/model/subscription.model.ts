import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the schema fields
interface ISubscription extends Document {
  name: string;
  price: number;
}

// Create a schema
const SubscriptionSchema: Schema<ISubscription> = new Schema(
  {
    name: { type: String },
    price: { type: Number }, // Define the data type for the 'price' field
  },
  { timestamps: true }
);

// Create a model using the schema
const SubscriptionModel = mongoose.model<ISubscription>('subscription', SubscriptionSchema);

export default SubscriptionModel;
