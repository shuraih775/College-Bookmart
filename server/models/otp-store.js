const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
    user_mail: {
        type: String,
        required: true,
    },
    otp_code: {
        type: String,
        required: true
    },
    expiry_time: {
        type: Date,
        required: true,
        index: { expires: '1s' } 
       }
});


module.exports = mongoose.model('OTP', otpSchema);
