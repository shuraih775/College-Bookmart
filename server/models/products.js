const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    img: {
        data: Buffer,
        name: String,
        size: Number
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    subtypes: {
        type: Map,
        of: String
    },
    quantity: {
        type: Number
    },
    sellingprice: {
        type: Number,
        required: true
    }
});


productSchema.index({ name: 1, type: 1, subtypes:1 }, { unique: true });

const Product = mongoose.model('products', productSchema);

module.exports = Product;
