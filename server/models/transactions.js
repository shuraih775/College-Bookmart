const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    orderId: {
        type: String,
        ref: 'orders', 
        required: true
    },
    bill_amt: {
        type: Number,
        required: true
    },
    date:{
        type: Date,
        default: Date.now
    },
    transactionFor:{
        type:String
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
