
const otpGenerator = require('otp-generator');
const OTP = require('../models/otp-store');
const Printout = require('../models/uploads');
const Order = require('../models/orders.js');

const transporter = require('../config/config'); 

class OtpService {
    

    async generateOtp() {
        const otp = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });
        return otp;
    }
    

    async storeOtp(action, email, id, otp){
        let document;
        switch (model) {
            case "order":
                 document = await Order.findByIdAndUpdate(id, {
                    code: otp.toString(),
                }, { new: true });
                break;
            case "printout":
                 document = await Printout.findByIdAndUpdate(id, {
                    code: otp.toString(),
                }, { new: true });
                break;
                
            case "auth":
                document = new OTP({
                    user_mail: email,
                    otp_code: otp,
                    expiry_time: new Date(Date.now() + 5 * 60 * 1000) 
                });
                await document.save();
                break;
        
            default:
                throw new Error("Model Unspecified");
                
        }
    }

    async verifyOtp(action, email, id, otp){
        let document;
        switch (action) {
            case "order":
                 document = await Order.findById(id);
                 if (document.code === otp){
                    return true;
                 }
                 return false;
            case "printout":
                document = await Printout.findById(id);
                if (document.code === otp){
                   return true;
                }
                return false;
                
            case "auth":
                document = await Printout.find({email});
                if (document.otp_code === otp){
                    return true;
                 }
                 return false;
        
            default:
                throw new Error("Model Unspecified");
                
        }
    }

    async sendOtpEmail(action, email, otp) {
        let msg;
        if(action === 'order'){
            msg = `Provide with this code when asked while recieving the order: ${otp}`;
        }
        else if(action === 'printout'){
            msg = `Provide with this code when asked while recieving the printout: ${otp}`;
        }
        else if(action === 'auth'){
            msg = `Your registration OTP for Campus Bookmart website is: ${otp}`;
        }
        const mailOptions = {
            from: 'collegemart',
            to: email,
            subject: 'Verification OTP',
            text: msg
        };

        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(new Error('Error sending OTP email'));
                } else {
                    resolve();
                }
            });
        });
    }
}

module.exports = new OtpService();
