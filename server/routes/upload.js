const express = require('express');
const uploadController = require('../controllers/upload');
const router = express.Router();

router.post('/', uploadController.createOrder);
router.post('/confirm', uploadController.confirmOrder);
router.post('/manualPrintout', uploadController.addManualPrintout);
router.get('/', uploadController.retrieveAll);
router.put('/:uploadId/complete',uploadController.markAsComplete);
router.put('/:uploadId/readytopick',uploadController.markAsReadyToPick);
router.get('/statistics', uploadController.getStatistics);
router.get('/:id', uploadController.download); 
router.get('/user/:status',uploadController.retrieve);
// router.delete('/:id', uploadController.delete); 


module.exports = router;
