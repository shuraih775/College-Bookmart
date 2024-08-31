const express = require('express');
const {auth} = require('../controllers/auth');
const {fetch} = require('../controllers/getusername');

const router = express.Router();

router.post('/signup', auth.signup);
router.post('/login', auth.login);
router.post('/loginAdmin', auth.loginAdmin);
router.post('/vpa', auth.saveVPA);
router.post('/send-otp', auth.sendOtp);
router.get('/fetchusername', fetch.fetchUsername);
router.delete('/',auth.deleteAccount);
router.post('/send-reset-code',auth.sendResetCode);
router.post('/verify-reset-code',auth.verifyResetCode);
router.put('/change-password',auth.changePassword);


module.exports = router;
