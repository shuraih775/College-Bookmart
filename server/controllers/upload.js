require('dotenv').config();
const { default: mongoose } = require('mongoose');
const Uploaded = require('../models/uploads.js');
const Transaction = require('../models/transactions');
const User = require('../models/users');
const PrintLog = require('../models/printLog');
const { getUsername, getUserId } = require('./getusername.js');
const multer = require('multer');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');


const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    
    cb(null, Date.now() + '-' + file.originalname) 
  }
});


const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 25 * 1024 * 1024 } 
});


const uploadController = {
  createOrder:async (req, res) =>{
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
      

      const username = await getUsername(token);
      if (!username) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      const user = await User.findOne({username});
      const email = user.email;
      upload.array('files')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
          
         
          return res.status(400).json({ message: 'Error uploading files' });
        } else if (err) {
          
          
          
          return res.status(500).json({ message: 'Server error' });
        }
        
        
        const files = req.files.map((file) => {
          
          return {
            data: file.buffer, 
            contentType: file.mimetype, 
            name: file.originalname,
            size: file.size 
          };
        });
        
        if (!files || files.length === 0) {
          return res.status(400).json({ message: 'No files uploaded' });
        }
        function findActualPrice(pageCount,isReport,printMode,numCopies,Color){
          if(isReport=== 'true'){
            return (10+pageCount*1)*numCopies;
          }
          const colorPrice = Color === 'color' ? 5 : 0;
          const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
          const basePrice = 0.5;
          

    return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount; 

        }
        const calculatePrice = (numCopies, colorType, printMode, pageCount, isReport) => {
          if (isReport == 'true') {
            return (20 + pageCount * 2) * numCopies;
          }
          const colorPrice = colorType === 'color' ? 8 : 0;
          const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
          const basePrice = 1;
          return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount;
        };

        
        const pageCount = req.body.pageCount;
       
        
        const Color = req.body.Color;
        const printMode = req.body.printMode;
        const isReport = req.body.isReport;
        // console.log(isReport);
        const department = req.body.dept;
        const numCopies = req.body.numCopies;
        const price = calculatePrice(numCopies, Color, printMode, pageCount, isReport);
        const actualPrice = findActualPrice(pageCount,isReport,printMode,numCopies,Color);
        const extraInstructions = req.body.extraInstructions;
        const status = 'paymentIncomplete';

        var instance = new Razorpay({ key_id: process.env.RZP_KEY, key_secret: process.env.RZP_SECRET })
       
     const order = await instance.orders.create({
      amount: price * 100,
      currency: "INR",
      receipt: "receipt#1",
      
      // notes: {
      //     key1: "value3",
      //     key2: "value2"
      // }
      })
      if(!order){
        return res.status(500).send("Error"); 
      }

      const newUpload = new Uploaded({
        _id:order.id,
        username,
        files,
        Color,
        printMode,
        numCopies,
        extraInstructions,
        isReport,
        department,
        price,
        pageCount, 
        actualPrice,
        status,
      });
      await newUpload.save();
      console.log(order)
      return res.status(201).json(order)
        

        
      });
    } catch (error) {
      
      return res.status(500).json({ message: 'Server error' });
    }
  },
  confirmOrder:async (req,res)=>{
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
      const user = await User.findById(userId);
      const email = user.email;
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      const orderId  = req.body.orderId;
      const paymentId  = req.body.paymentId;
      const signature  = req.body.signature;

      function generateHMAC(message, secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(message);
        return hmac.digest('hex');
    }
    const msg = orderId+"|"+paymentId
    const generatedSignature = generateHMAC(msg, 'KPVnDBEcFTrILEFmGxWDVw8E')

    if (generatedSignature === signature){
      
      const order  = await Uploaded.findById(orderId);
      const transaction = new Transaction({
        transactionId:paymentId,
        orderId,
        bill_amt:order.price,
        transactionFor:'Printout'
      })
      await transaction.save();
      
    const code = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      //   const mailOptions = {
      //     from: 'shuraihshaikh.cs22@bmsce.ac.in',
      //     to: email,
      //     subject: 'Code for Prinout Pickup',
      //     text: `Provide with this code when asked while recieving the printout: ${code}`
      //   };
      //   transporter.sendMail(mailOptions, (error, info) => {
      //     if (error) {
      //       console.log('Error sending email:', error);
      //       return res.status(500).json({ message: 'Error sending OTP email' });
      //     }
      //     res.status(201).json({ message: 'OTP sent to email, please verify' });
      // });
      order.code = code;
      order.status = 'pending';
      await order.save()
      const newPrintLog = new PrintLog({
        price:order.price,
        actualPrice:order.actualPrice
      });
      await newPrintLog.save();
      return res.status(201).json({ message: 'Uploaded successfully' });
    }
  },
  addManualPrintout: async (req,res)=>{
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
      const user = await User.findById(userId);
      if(user.isAdmin){
        function findActualPrice(pageCount,isReport,printMode,numCopies,Color){
          if(isReport=== 'true'){
            return (10+pageCount*1)*numCopies;
          }
          const colorPrice = Color === 'color' ? 5 : 0;
          const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
          const basePrice = 0.5;
          return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount; 
        }

        const calculatePrice = (numCopies, Color, printMode, pageCount, isReport) => {
          if (isReport) {
            return (20 + pageCount * 2) * numCopies;
          }
          const colorPrice = Color === 'color' ? 8 : 0;
          const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
          const basePrice = 1;
          return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount;
        };
        const printout = JSON.parse(req.body.printout);
        const pageCount = parseInt(printout.pages);
        console.log(printout);
        
        const Color = printout.Color;
        const printMode = printout.printMode;
        const isReport = printout.isReport;
        // console.log(isReport);
        const department = printout.department;
        const numCopies = parseInt(printout.numCopies);
        const price = calculatePrice(numCopies, Color, printMode, pageCount, isReport);
        const actualPrice = findActualPrice(pageCount,isReport,printMode,numCopies,Color);
        const extraInstructions = "";
        const status = 'complete';


        function generateRandomObjectId() {
          const hexChars = '0123456789abcdef';
          let objectId = '';
          for (let i = 0; i < 24; i++) {
              const randomIndex = Math.floor(Math.random() * hexChars.length);
              objectId += hexChars[randomIndex];
          }
          return objectId;
      }
    
     const _id = generateRandomObjectId()

        const newUpload = new Uploaded({
          _id,
          username:'admin',
          files:[],
          Color,
          printMode,
          numCopies,
          extraInstructions,
          isReport,
          department,
          price,
          pageCount, 
          actualPrice,
          status,
          code:""
        });
        await newUpload.save();

        const newPrintLog = new PrintLog({
          price,
          actualPrice
        });
        await newPrintLog.save();
        
      }
      res.status(200).json({message:"order created"})
    }
      catch(error){
        console.error(error)
        res.status(500).json({message:"order created"})
      }
  },
  retrieve: async (req, res) => {
    try {
      const status = req.params.status;
      const authHeader = req.headers.authorization;
  
      if (!authHeader) {
        return res.status(401).json({ message: 'User not logged in' });
      }
  
      const tokenArray = authHeader.split(' ');
      const token = tokenArray[1];
      if (!token) {
        return res.status(401).json({ message: 'User not logged in' });
      }
  
      const username = await getUsername(token);
      if (!username) {
        return res.status(401).json({ message: 'Invalid token' });
      }
  
      const uploads = await Uploaded.find({ username, status });
  
      const response = uploads.map(upload => ({
        _id:upload._id,
        Color: upload.Color,
        printMode:upload.printMode,
        isReport: upload.isReport,
        department: upload.department,
        numCopies: upload.numCopies,
        extraInstructions: upload.extraInstructions,
        price:upload.price,
        pageCount:upload.pageCount,
        status: upload.status,
        uploadDate: upload.uploadDate,
        files: upload.files.map(file => ({
          name: file.name,
          _id:file._id,
          size: file.size
        }))
      }));
  
      res.status(200).json({ success: true, uploads: response });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to retrieve uploads' });
    }
  },
  
  download: async (req, res) => {
    try {
      const fileId = req.params.id; 
      const document = await Uploaded.findById(fileId);
      
  
      if (!document) {
        
        return res.status(404).json({ message: 'Document not found' });
      }
  
      
      const fileIdToDownload = req.query.fileId;
      
      const file = document.files.find(f => f._id.toString() === fileIdToDownload);
  
      if (!file) {
        
        return res.status(404).json({ message: 'File not found' });
      }
  
      
      res.set('Content-Type', file.contentType);
      res.set('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(file.data);
    } catch (error) {
      
      res.status(500).json({ message: 'Server error' });
    }
  },
  retrieveAll: async(req,res)=>{
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
      const user = await User.findById(userId);
      if(user.isAdmin){
        const documents = await Uploaded.find({});
      return res.status(200).json({ documents });
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
    } catch (error) {
      
      return res.status(500).json({ message: 'Server error' });
    }
  },
  markAsReadyToPick: async(req,res) => {
    try {
      const authHeader = req.headers.authorization;
      console.log(req.headers)
      if (!authHeader) {
        return res.status(401).json({ message: 'User not logged in' });
      }
  
      const tokenArray = authHeader.split(' ');
      const token = tokenArray[1];
      if (!token) {
        return res.status(401).json({ message: 'User not logged in' });
      }
      const userId = await getUserId(token);
      const user = await User.findById(userId);
      if(user.isAdmin){
        const documentId = req.params.uploadId;
    console.log(documentId);
    const updatedUploaded = await Uploaded.findById(documentId);
    if (!updatedUploaded) {
      
      return res.status(404).json({ error: 'updatedUploaded not found' });
    }
    updatedUploaded.status= 'readytopick';
    await updatedUploaded.save();
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
    
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }


  },
  markAsComplete: async(req,res) => {
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
      const user = await User.findById(userId);
      if(user.isAdmin){
        const documentId = req.params.uploadId;
    const code = req.body.code;
    const updatedUploaded = await Uploaded.findById(documentId);
    
    if (!updatedUploaded) {
      return res.status(404).json({ error: 'updatedUploaded not found' });
    }
    if(code === updatedUploaded.code){
      updatedUploaded.files.map((file)=>{file.data = null})
      updatedUploaded.status= 'complete';
      await updatedUploaded.save();
      res.status(200).json({message : 'succesfully updated'});
    }
    else{
      res.status(400).json({message : 'incorrect code'});
    }
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
    
   
    
  } catch (error) {
    
    res.status(500).json({ error: 'Server error' });
  }


  },
  getStatistics: async(req,res)=>{
    try{
      const authHeader = req.headers.authorization;
      // console.log(req.headers.authorization)
      if (!authHeader) {
        return res.status(401).json({ message: 'User not logged in' });
      }
  
      const tokenArray = authHeader.split(' ');
      const token = tokenArray[1];
      // console.log(token)
      if (!token) {
        return res.status(401).json({ message: 'User not logged in' });
      }
      const userId = await getUserId(token);
      const user = await User.findById(userId);
      console.log(user);
      if(user.isAdmin){
        
        const { month, year } = req.query;
      
      let startDate, endDate;
      let logs;
  
      
      if (month) {
        startDate = new Date(year, month - 1, 1); 
        endDate = new Date(year, month, 0); 
      } else {
        startDate = new Date(year, 0, 1); 
        endDate = new Date(year + 1, 0, 1); 
      }
      
       logs = await PrintLog.find({
        date: {
          $gte: startDate,
          $lt: endDate
        }
      });
      let totalRevenue = 0;
      let totalProfit = 0;

      
      logs.forEach(log => {
        const revenue = log.price;
        const profit = log.price-log.actualPrice;
  
        totalRevenue += revenue;
        totalProfit += profit;
      });
      res.status(200).json({
        totalRevenue,
        totalProfit,
        activities: logs
      });
  
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
      
  
} catch (error) {
  res.status(500).json({ message: 'Error fetching statistics', error });
  
}
}

};

module.exports = uploadController;
