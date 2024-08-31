const { default: mongoose } = require('mongoose');
const Uploaded = require('../models/uploadedfiles');
const User = require('../models/users');
const PrintLog = require('../models/printLog');
const { getUsername, getUserId } = require('./getusername.js');
const multer = require('multer');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shuraihshaikh.cs22@bmsce.ac.in',
    pass: '763513rakshitanhihai'
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
  upload:async (req, res) =>{
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
        const calculatePrice = (numCopies, Color, printMode, pageCount, isReport) => {
          if (isReport) {
            return (20 + pageCount * 2) * numCopies;
          }
          const colorPrice = Color === 'color' ? 8 : 0;
          const duplexPrice = printMode === 'duplex' ? 0.5 : 1;
          const basePrice = 1;
          return (basePrice + colorPrice + duplexPrice) * numCopies * pageCount;
        };

        const code = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
        const mailOptions = {
          from: 'shuraihshaikh.cs22@bmsce.ac.in',
          to: email,
          subject: 'Code for Prinout Pickup',
          text: `Provide with this code when asked while recieving the printout: ${code}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log('Error sending email:', error);
            return res.status(500).json({ message: 'Error sending OTP email' });
          }
          res.status(201).json({ message: 'OTP sent to email, please verify' });
      });
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
        const status = 'pending';
        const newUpload = new Uploaded({
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
          code
        });
        await newUpload.save();

        const newPrintLog = new PrintLog({
          price,
          actualPrice
        });
        await newPrintLog.save();
        return res.status(201).json({ message: 'Uploaded successfully' });
      });
    } catch (error) {
     
      
      return res.status(500).json({ message: 'Server error' });
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
        const newUpload = new Uploaded({
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
    }
      catch{

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
