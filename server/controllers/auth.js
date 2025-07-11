require('dotenv').config();
const User = require('../models/users');
const Uploaded = require('../models/uploads');
const Order = require('../models/orders');
const OTP = require('../models/otp-store');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { getUsername,getUserId } = require('./getusername.js');


const generateToken = async (userId) => {
    return jwt.sign({ userId }, process.env.SECRET_KEY);
};

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
const auth = {
    sendOtp: async (req, res) => {
        try {
            const email = req.body.email;
            const username = req.body.username;
            let existingUsermail = await User.findOne({ email });
            if (existingUsermail) {
                return res.status(400).json({ message: 'User already exists' });
            }
            let existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            
            const otp = otpGenerator.generate(6, { digits: true, alphabets: false, lowerCaseAlphabets: false,upperCaseAlphabets:false, specialChars: false });

    
            await OTP.deleteMany({ user_mail: email }); 
    
            // Create a new OTP record
            const newOTP = new OTP({
                user_mail: email,
                otp_code: otp,
                expiry_time: new Date(Date.now() + 5 * 60 * 1000) 
            });
    
            
            await newOTP.save();
    
            
    
            
            const mailOptions = {
                from: 'collegemart',
                to: email,
                subject: 'Verification OTP',
                text: `Your registration OTP for Campus Bookmart website is: ${otp}`
            };
    
           
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending email:', error);
                    return res.status(500).json({ message: 'Error sending OTP email' });
                }
                res.status(201).json({ message: 'OTP sent to email, please verify' });
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    
    signup: async (req, res) => {
        try {
            const { email, username, password, otp } = req.body;
            const emailRegex = /^[a-z]+\.[a-z]+(\d{2})?@bmsce\.ac\.in$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' }); 
              }
            const doc = await OTP.findOne({ user_mail: email }).exec();
            const storedOTP = doc.otp_code;

            if (!storedOTP || otp !== storedOTP) {
                return res.status(400).json({ message: 'Invalid OTP' });
              }
            let existingUsermail = await User.findOne({ email });
            if (existingUsermail) {
                return res.status(400).json({ message: 'User already exists' });
            }
            let existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const newUser = new User({
                email,
                username,
                password: hashedPassword,
                isAdmin:false
            });
            await newUser.save();
            const deletedOTP = await OTP.findOneAndDelete({ user_mail: email });

            if (deletedOTP) {
                console.log('OTP deleted successfully:', deletedOTP);
            }
            res.status(201).json({ message: 'User registered successfully' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const emailRegex = /^[a-z]+\.[a-z]+(\d{2})?@bmsce\.ac\.in$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' }); 
              }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            
           
            const token = await generateToken(user._id);
            res.status(200).json({ token });
            
        } catch (error) {
            
            res.status(500).json({ message: 'Server error' });
        }
    },
    loginAdmin: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
            
           if(user.isAdmin){
            const token = await generateToken(user._id);
            res.status(200).json({ token });
           }
        else{
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        } catch (error) {
            
            res.status(500).json({ message: 'Server error' });
        }
    },
    saveVPA: async(req,res) =>{
        try{
            const {email, vpa}= req.body;

        const user = await User.findOne({email});

        user.vpa = vpa;
        await user.save();
        res.status(200).json({message: 'vpa added Succesfully'});
        }
        catch{
            res.status(500).json({message:'Internal Server Error'});
        }

    },
    deleteAccount:async(req,res) =>{
        try {
            const authHeader = req.headers.authorization;
  
      if (!authHeader) {
        return res.status(401).json({ message: 'User not logged in' });
      }
  
      const tokenArray = authHeader.split(' ');
      const token = tokenArray[1];
      if (!token) {
        return res.status(401).json({ message: 'User not logged in' });
      }
      const userId = await getUserId(token);
      console.log(userId)
      const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
      await User.findByIdAndDelete(userId);
      await Uploaded.deleteMany({ username: user.username });
      await Order.deleteMany({ username: user.username });
      res.status(200).json({message:"Account deleted Succesfully"});

        } catch(error) {
            console.error(error)
            return res.status(500).json({message: 'Server error'});
        }
    },
    changePassword: async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const newPassword = req.body.newPassword;
            console.log(newPassword)
            if (!authHeader) {
                return res.status(401).json({ message: 'User not logged in' });
            }
            
            

            const tokenArray = authHeader.split(' ');
            const token = tokenArray[1];
            if (!token) {
                return res.status(401).json({ message: 'User not logged in' });
            }
            console.log(token)
            const username = await getUsername(token);
            const userId = await getUserId(token);
            console.log(username)
            const hashedPassword = await bcrypt.hash(newPassword, 10); 
            await User.findByIdAndUpdate(userId, { password: hashedPassword });
            res.status(200).json({ message: "Password Changed Successfully" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Server error' });
        }
    },
    
    sendResetCode: async(req,res)=>{
        try {
            const email = req.body.email;
            let existingUsermail = await User.findOne({ email });
            if (!existingUsermail) {
                return res.status(400).json({ message: 'User does not exist' });
            }
            
            
            const otp = otpGenerator.generate(6, { digits: true, alphabets: false, lowerCaseAlphabets: false,upperCaseAlphabets:false, specialChars: false });

    
            await OTP.deleteMany({ user_mail: email }); 
    
            const newOTP = new OTP({
                user_mail: email,
                otp_code: otp,
                expiry_time: new Date(Date.now() + 5 * 60 * 1000) 
            });
    
            
            await newOTP.save();
    
            const mailOptions = {
                from: 'collegemart',
                to: email,
                subject: 'Verification OTP',
                text: `Your  OTP for reset password request for Campus Bookmart website is: ${otp}`
            };
    
           
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Error sending email:', error);
                    return res.status(500).json({ message: 'Error sending OTP email' });
                }
                res.status(200).json({ message: 'OTP sent to email' });
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server error' });
        }
    },
    verifyResetCode: async (req, res) => {
        try {
            const { email, code } = req.body;
            const doc = await OTP.findOne({ user_mail: email }).exec();
            if (!doc) {
                return res.status(400).json({ message: 'Invalid request' });
            }
            const storedOTP = doc.otp_code;
            if (storedOTP === code) {
                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(400).json({ message: 'User not found' });
                }
                const token = await generateToken(user._id);
                return res.status(200).json({ token });
            } else {
                res.status(400).json({ message: 'Wrong code entered' });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Server error' });
        }
    }
    
};

module.exports = { auth};
