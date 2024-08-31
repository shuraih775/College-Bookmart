const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        ref:"users",
        trim: true 
      },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productQuantity: {
        type: Number,
        required: true,
        default: 1 // Assuming default quantity is 1
    }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
