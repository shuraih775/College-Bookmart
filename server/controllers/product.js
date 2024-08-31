const Product = require('../models/products');
const multer = require('multer');
const User = require('../models/users');
const ActivityLog = require('../models/activityLog');
const {getUserId} = require('./getusername');
const mongoose = require('mongoose');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const productController = {
  add: async (req, res) => {
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
        upload.single('img')(req, res, async (err) => {
          try {
            if (err instanceof multer.MulterError) {
              return res.status(400).json({ message: 'Error uploading files' });
            } else if (err) {
              return res.status(500).json({ message: 'Server error' });
            }
  
            const { name, quantity, buyingprice, sellingprice, type } = req.body;
            const subtypes = JSON.parse(req.body.subtypes);
            
            const img = {
              data: req.file.buffer,
              size: req.file.size,
              name: req.file.originalname
            };
            
            const newProduct = new Product({
              name,
              img,
              type,
              subtypes,
              quantity,
              sellingprice
            });
            
            await newProduct.save();
            console.log(subtypes);
            const newActivityLog = new ActivityLog({
              productId: newProduct._id,
              name,
              type,
              subtypes,
              quantity,
              price:buyingprice,
              activityType: 'add'
            });
  
            await newActivityLog.save();
  
            res.status(201).json({ success: true, message: 'Product added successfully', product: newProduct });
          } catch (error) {
            console.log(error);
            res.status(500).json({ success: false, message: 'Failed to add product' });
          }
        });
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
      
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to handle file upload' });
    }
  },
  
  fetch: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      // console.log(req.headers)
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
        // console.log(req.query)
        const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      console.log(skip,limit);
      const { type, subtypes } = JSON.parse(req.query.filters);
      const searchTerm = req.query.searchName;
      // console.log(req.query);
      // Initialize the base filter for products that are in stock (quantity > 0)
      let filters = {};
  
      // Add search term filter if it exists
      if (searchTerm) {
        filters.name = { $regex: new RegExp(searchTerm, 'i') }; // Case-insensitive search
      }
  
      // Add type filter if it is not 'all'
      if (type !== 'all') {
        filters.type = type;
  
        // Add subtypes filter if subtypes are provided
        if (Object.keys(subtypes).length > 0) {
          // Handle subtypes as a dynamic object filter
          for (const [key, value] of Object.entries(subtypes)) {
            filters[`subtypes.${key}`] = value;
          }
        }
      }
  
      // Fetch the filtered products with pagination
      const products = await Product.find(filters)
        .skip(skip)
        .limit(limit);
  
      const totalProducts = await Product.countDocuments(filters);
      console.log(totalProducts,filters,type);
      res.status(200).json({
        page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        products,
      });
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
      
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  fetchAvailable: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      console.log(skip,limit);
      const { type, subtypes } = JSON.parse(req.query.filters);
      const searchTerm = req.query.searchName;
      // console.log(req.query);
      // Initialize the base filter for products that are in stock (quantity > 0)
      let filters = { quantity: { $gt: 0 } };
  
      // Add search term filter if it exists
      if (searchTerm) {
        filters.name = { $regex: new RegExp(searchTerm, 'i') }; // Case-insensitive search
      }
  
      // Add type filter if it is not 'all'
      if (type !== 'all') {
        filters.type = type;
  
        // Add subtypes filter if subtypes are provided
        if (Object.keys(subtypes).length > 0) {
          // Handle subtypes as a dynamic object filter
          for (const [key, value] of Object.entries(subtypes)) {
            filters[`subtypes.${key}`] = value;
          }
        }
      }
  
      // Fetch the filtered products with pagination
      const products = await Product.find(filters)
        .skip(skip)
        .limit(limit);
  
      const totalProducts = await Product.countDocuments(filters);
      console.log(totalProducts,filters,type);
      res.status(200).json({
        page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        products,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  
  

  downloadImage: async (req, res) => {
    try {
      // console.log(9);
      const productId = req.params.productId;
      const product = await Product.findOne({ _id: productId });

      if (!product || !product.img || !product.img.data) {
        return res.status(404).json({ message: 'Image not found' });
      }
      // console.log(product.img.data);
      res.setHeader('Content-Type', 'image/jpeg');
      res.send(product.img.data);

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateQuantity: async (req, res) => {
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
        const { quantity, buyingprice } = req.body;

        
        

        const product = await Product.findById(req.params.id);
        if (!product) {
          
          return res.status(404).json({ message: 'Product not found' });
        }
  
        product.quantity += parseInt(quantity, 10);
        if (buyingprice) {
          product.buyingprice = buyingprice;
        }
        await product.save();
  
        const newActivityLog = new ActivityLog({
          productId: product._id,
          name: product.name,
          type: product.type,
          subtype: product.subtypes,
          quantity: parseInt(quantity, 10),
          price: product.buyingprice,
          activityType: 'add'
        });
  
        await newActivityLog.save();
  
        res.json(product);
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
    
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error updating product quantity', error });
    }
  },

  update: async (req, res) => {
    try{
    console.log(9);
    const id = req.body._id;
    const name = req.body.name;
    const type = req.body.type;
    const subtypes = JSON.parse(req.body.subtypes);
    const sellingprice = req.body.sellingprice;
      console.log(id);
    
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
        
        try{
          
        
        const updatedProduct = await Product.findByIdAndUpdate(id, {
          name: name,
          type: type,
          subtypes: subtypes,
          sellingprice: sellingprice
        }, { new: true });
  
        if (!updatedProduct) {
          
          return res.status(404).json({ message: 'Product not found' });
        }
        
       
        res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
        }
        catch(error){
          
          console.log(error);
          res.status(500).json({ message: 'Internal server error' });
        }
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
     
    } catch (error) {
      
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  getStatistics: async (req, res) => {
    try {
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
  
      logs = await ActivityLog.find({
        date: {
          $gte: startDate,
          $lt: endDate
        }
      });
  
      let totalRevenue = 0;
      let totalProfit = 0;
  
      logs.forEach(log => {
        
        if(log.activityType === 'add' || log.activityType === 'sellCancel'){
        const revenue = log.price * log.quantity;
        // console.log(revenue);
        totalRevenue += revenue;
        }
        else if(log.activityType === 'sell'){
        const profit = log.price * log.quantity;
        totalProfit += profit;
        }
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

module.exports = productController;
