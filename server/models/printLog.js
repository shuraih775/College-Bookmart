const mongoose = require('mongoose');

const printLogSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  actualPrice:{type:Number, required:true},
  date: { type: Date, default: Date.now },
  
});

const PrintLog = mongoose.model('PrintLog', printLogSchema);

module.exports = PrintLog;
