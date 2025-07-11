require('dotenv').config();
const Order = require('../models/orders');
const Transaction = require('../models/transactions');
const Product = require('../models/products');
const User = require('../models/users');
const ActivityLog = require('../models/activityLog');
const { getUsername,getUserId } = require('./getusername.js');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { default: mongoose } = require('mongoose');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
const orderController = {
  createOrder: async (req, res) => {
    try {
      
      
      const orderItems = req.body.items;
      // const billAmount = req.body.totalAmount;
      
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
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      const user = await User.findById(userId);
      const username = user.username;
      const email = user.email;
     

      let totalAmount = 0;
      for (const orderedProduct of orderItems) {
        const product = await Product.findById(orderedProduct._id);
        if (orderedProduct.quantity > product.quantity) {
         
          return res.status(409).json({ message: `Requested quantity for product ${orderedProduct.name} exceeds available stock` });
        }
        else{
          totalAmount += orderedProduct.quantity * product.sellingprice;
          orderedProduct.name = product.name;
          orderedProduct.price = product.sellingprice;
          orderedProduct.type_ = product.type;
          orderedProduct.subtypes = product.subtypes;
        }
      }
      var instance = new Razorpay({ key_id: process.env.RZP_KEY, key_secret: process.env.RZP_SECRET })

     const order = await instance.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: "receipt#1",
      
      // notes: {
      //     key1: "value3",
      //     key2: "value2"
      // }
      })

      const newOrder = new Order({
        _id: order.id,
        username,
        order_items: orderItems,
        bill_amt: totalAmount,
        status:"PaymentIncomplete"
      });
      // console.log(orderItems);
      console.log(9);
      await newOrder.save();
      if(!order){
        return res.status(500).send("Error"); 
      }
      console.log(order)
      return res.status(201).json(order)

      
      

      

       
      
      
      // console.log(user);
      
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  },
  confirmOrder : async(req,res) =>{
    try{
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
    const generatedSignature = generateHMAC(msg, 'EqPwegqdzkBek2WYr1ZD5YaX')

    if (generatedSignature === signature){
      
      const order  = await Order.findById(orderId);
      const transaction = new Transaction({
        transactionId:paymentId,
        orderId,
        bill_amt:order.bill_amt,
        transactionFor:'Stationery'
      })
      await transaction.save();
      const orderItems = order.order_items;
      order.transaction_id = paymentId;
      await order.save()
      orderItems.map( async(orderedProduct)=>{
        
        const product = await Product.findByIdAndUpdate(orderedProduct._id);
        product.quantity = product.quantity - orderedProduct.quantity;
        const newActivityLog = new ActivityLog({
          productId: orderedProduct._id,
          name:product.name,
          type:product.type,
          subtype:product.subtypes,
          quantity:orderedProduct.quantity,
          price:product.sellingprice,
          activityType: 'sell'
        });

        await newActivityLog.save();
        
        

      });

      const code = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    //   const mailOptions = {
    //     from: 'shuraihshaikh.cs22@bmsce.ac.in',
    //     to: email,
    //     subject: 'Code for Order Pickup',
    //     text: `Provide with this code when asked while recieving the order: ${code}`
    //   };
    //   transporter.sendMail(mailOptions, (error, info) => { 
    //     if (error) {
    //       console.log('Error sending email:', error);
    //       return res.status(500).json({ message: 'Error sending OTP email' });
    //     }

    //     // res.status(200).json({ message: 'OTP sent to email, please verify' });
    // });
    order.code = code;
    order.status = "pending";
    await order.save();

      res.status(200).json({ success: true, message: 'Order created successfully', order });
    }
    else{
      res.status(400).json({message:'payment could not be verified'})
    }

      
    }
    catch(error){
      console.error(error)
      res.status(500).json({message:"Internal Server Error"});
    }
  },
  createManualOrder: async(req,res) =>{
    try{
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
        const orderItems = req.body.order_items;
      const billAmount = req.body.bill_amt;

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

      const newOrder = new Order({
        _id,
        username:'admin',
        order_items: orderItems,
        bill_amt: billAmount,
        status:'complete'
      });
      newOrder.save();
      orderItems.map( async(orderedProduct)=>{
        try{
        const product = await Product.findByIdAndUpdate(orderedProduct._id);
        product.quantity = product.quantity - orderedProduct.quantity;
        const newActivityLog = new ActivityLog({
          productId: orderedProduct._id,
          name:orderedProduct.name,
          type:orderedProduct.type_,
          subtype:orderedProduct.subtype,
          quantity:orderedProduct.quantity,
          price:orderedProduct.price,
          activityType: 'sell'
        });


        await newActivityLog.save();
        await product.save();

        
      }
      catch{
        console.log('server error');
       
      }
    });
        res.status(200).json({ success: true, message: 'Order created successfully', order: newOrder });
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
      
    }
    catch(error){
      
      console.log(error);
      res.status(500).json({ success: false, message: 'Failed to create order' });
    }
  },
  
  retrieve: async (req, res) => {
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

      
      const orders = await Order.find({ username });

      
      res.status(200).json({ success: true, orders });
    } catch (error) {
      
      res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
  },
  retrieveAll: async (req, res) => {
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
        const status = req.params.status;
  

      const orders = await Order.find({ status });
      
      res.status(200).json({ success: true, orders });
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
      
    } catch (error) {
      
      res.status(500).json({ success: false, message: 'Failed to retrieve orders' });
    }
  },
  markAsReadyToPick: async (req, res) => {
    try{
      const authHeader = req.headers.authorization;
      console.log(req.headers.authorization);
      // console.log(5);
      if (!authHeader) {
        return res.status(401).json({ message: 'User not logged in' });
      }
      console.log(9);
      const tokenArray = authHeader.split(' ');
      const token = tokenArray[1];
      console.log(0)
      if (!token) {
        return res.status(401).json({ message: 'User not logged in' });
      }
      const userId = await getUserId(token);
      const user = await User.findById(userId);
      if(user.isAdmin){
        const orderId = req.params.orderId;
        const order = await Order.findByIdAndUpdate(orderId, {
            status: 'readytopick'
        });
        const email = (await User.findOne({username:order.username})).email;
       
        if (order) {
          res.status(200).json({ message: 'Order marked as ready to pick' });
          const mailOptions = {
            from: 'shuraihshaikh.cs22@bmsce.ac.in',
            to: email,
            subject: 'Order Update',
            text: `Your Order with order id ${orderId} is Ready to be Picked Up`
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log('Error sending email:', error);
              return res.status(500).json({ message: 'Error sending  email' });
            }
            res.status(201).json({ message: 'Confirmation mail sent' });
        });
      } else {
          res.status(404).json({ message: 'Order not found' });
      }
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
   
}
catch{

}
},
markAsComplete: async (req, res) => {
  try{
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
        const orderId = req.params.orderId;
        const recvd_code = req.body.code;
        if((await Order.findById(orderId)).code == recvd_code){
        const order = await Order.findByIdAndUpdate(orderId, {
            status: 'complete'
        });
        if (order) {
          res.status(200).json({ message: 'Order marked as ready to pick' });
      } else {
        res.status(404).json({ message: 'Order not found' });
      }
      }
        else {
          res.status(404).json({ message: 'Code not Matched' });
      }
      }
      else{
        return res.status(400).json({ message:'Invalid Credentials' });
      }
 }
catch{

}
},
cancelOrder: async (req, res) => {
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
      return res.status(401).json({ message: 'Invalid Credentials' });
    }

    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order doesn't exist" });
    }

    if (username !== order.username) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Refund 
    const razorpay = new Razorpay({
      key_id: process.env.RZP_KEY,
      key_secret: process.env.RZP_SECRET,
    });

    if (order.transaction_id) {
      try {
        await razorpay.payments.refund(order.transaction_id, {
          amount: order.bill_amt*100 
        });
      } catch (err) {
        console.error('Refund failed:', err);
        return res.status(500).json({ message: 'Refund failed' });
      }
    }

    order.status = 'canceled';
    await order.save();

    for (const orderedProduct of order.order_items) {
      try {
        const product = await Product.findById(orderedProduct._id);
        if (product) {
          product.quantity += orderedProduct.quantity;
          await product.save();

          const newActivityLog = new ActivityLog({
            productId: orderedProduct._id,
            name: orderedProduct.name,
            type: orderedProduct.type_,
            subtype: orderedProduct.subtype,
            quantity: orderedProduct.quantity,
            price: orderedProduct.price,
            activityType: 'sellCancel'
          });

          await newActivityLog.save();
        }
      } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Server error while updating product' });
      }
    }

    res.status(200).json({ message: 'Order cancelled and refunded successfully' });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error while cancelling order' });
  }
}
// cancelOrderAdmin: async (req,res) =>{
//   const orderId = req.params.orderId;
  
//   const order = await Order.findByIdAndUpdate(orderId, {
//       status: 'canceled by Admin [out of stock]'
//   });
//   console.log(order);
//   order.order_items.map( async(orderedProduct)=>{
//     try{
//     const product = await Product.findByIdAndUpdate(orderedProduct._id);
//     product.quantity = product.quantity + orderedProduct.quantity;
//     await product.save();
//     const newActivityLog = new ActivityLog({
//       productId: orderedProduct._id,
//       name:orderedProduct.name,
//       type:orderedProduct.type_,
//       subtype:orderedProduct.subtype,
//       quantity:orderedProduct.quantity,
//       price:orderedProduct.price,
//       activityType: 'sellCancel'
//     });
//     await newActivityLog.save();
//     }
//     catch{
//       console.log('server error');
//     }

//   });
//   if (order) {
//     res.status(200).json({ message: 'Order marked as ready to pick' });
// } else {
//   res.status(404).json({ message: 'Order not found' });
// }

// },

};

module.exports = orderController;
