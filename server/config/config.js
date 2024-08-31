const { secretKey } = require('../controllers/auth');
require('dotenv').config();
const nodemailer = require('nodemailer');

// Create the email transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email password or app-specific password
    },
});

module.exports = {
    port: process.env.PORT || 5000,
    dbUri: process.env.DB_URI,
    secretKey: process.env.SECRET_KEY,
    transporter, // Export the transporter
};
