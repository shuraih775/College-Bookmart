const express = require('express');
const paymentController = require('../controllers/payment');
const router = express.Router();

router.get('/',paymentController.fetchTransactions);
module.exports = router;

