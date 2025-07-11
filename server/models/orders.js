const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    _id: { type: String },
    username: {
        type: String,
        ref: 'User',
        required: true
    },
    order_date: {
        type: Date,
        default: Date.now
    },
    order_items: [{
        name: String,
        quantity: Number,
        price: Number,
        type_: String,
        subtypes: {
            type: Map,
            of: String
        },
    }],
    bill_amt: {
        type: Number,
        required: true
    },
    code: {
        type: String
    },
    status: {
        type: String,
        default: "pending"
    },
    transaction_id: {
        type: String, 
        default: null
    }
});

const Order = mongoose.model('orders', orderSchema);
module.exports = Order;
