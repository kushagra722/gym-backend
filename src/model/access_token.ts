import mongoose, { Document, Schema } from 'mongoose';

// Define interface for the schema fields
interface IToken extends Document {
  accessToken: string;
  access_expire_at: Date;
  user_id: mongoose.Schema.Types.ObjectId;
  scope: string;
}

// Create a schema with timestamps
const TokenSchema: Schema<IToken> = new Schema(
  {
    accessToken: { type: String },
    access_expire_at: { type: Date },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scope: { type: String },
  },
  { timestamps: true }
);

// Create a model using the schema
const TokenModel = mongoose.model<IToken>('access_token', TokenSchema);

export default TokenModel;
