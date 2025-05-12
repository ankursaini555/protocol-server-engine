import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    configName: {
      type: String,
      required: true,
    },
    transaction_id: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { strict: false }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
