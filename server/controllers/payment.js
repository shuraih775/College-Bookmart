const Transaction = require('../models/transactions');

const TransactionController = {
    fetchTransactions: async (req,res)=>{
        const transactions = await Transaction.find();
        res.status(200).json({transactions});
    }
}
module.exports = TransactionController;