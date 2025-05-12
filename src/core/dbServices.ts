import { Transaction } from "./model";

export const upsertTransaction = async (transactionData: any) => {
  try {
    const filter = { transaction_id: transactionData.transaction_id }; // Filter by unique field
    const options = { new: true, upsert: true }; // Create a new document if it doesn't exist, and return the updated document

    const updatedTransaction = await Transaction.findOneAndUpdate(
      filter,
      transactionData,
      options
    );

    console.log("Transaction upserted:", transactionData.transaction_id);
    return updatedTransaction;
  } catch (error) {
    console.error("Error upserting transaction:", error);
    throw error;
  }
};

export const fetchTransactionById = async (transactionId: string) => {
  try {
    const transaction = await Transaction.findOne({
      transaction_id: transactionId,
    });
    if (!transaction) {
      console.log("Transaction not found");
      return null;
    }
    console.log("Transaction found:", transactionId);
    return (transaction as any)._doc;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

export const fetchAllTransactionsIDs = async () => {
  try {
    const transactions = await Transaction.find({}, "transaction_id -_id"); // Only select the transaction_id field and exclude the _id field
    const transactionIds = transactions.map(
      (transaction) => transaction.transaction_id
    );
    console.log("All transaction IDs:", transactionIds);
    return transactionIds;
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    throw error;
  }
};
