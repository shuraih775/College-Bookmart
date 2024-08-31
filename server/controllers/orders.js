const Order = require('../models/orders');
const Product = require('../models/products');
const User = require('../models/users');
const ActivityLog = require('../models/activityLog');
const { getUsername,getUserId } = require('./getusername.js');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { default: mongoose } = require('mongoose');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shuraihshaikh.cs22@bmsce.ac.in',
    pass: '763513rakshitanhihai'
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

      const username = await getUsername(token);
      if (!username) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
     

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

      

       
      
      const user = await User.findOne({username});
      const email = user.email;
      // console.log(user);
      const code = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
      const mailOptions = {
        from: 'shuraihshaikh.cs22@bmsce.ac.in',
        to: email,
        subject: 'Code for Order Pickup',
        text: `Provide with this code when asked while recieving the order: ${code}`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
          return res.status(500).json({ message: 'Error sending OTP email' });
        }
        res.status(201).json({ message: 'OTP sent to email, please verify' });
    });

    const newOrder = new Order({
      username,
      order_items: orderItems,
      bill_amt: totalAmount,
      code:code
    });
    // console.log(orderItems);
    
    await newOrder.save();

      
      res.status(201).json({ success: true, message: 'Order created successfully', order: newOrder });
    } catch (error) {
      console.log(error);
      
      res.status(500).json({ success: false, message: 'Failed to create order' });
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

   

      const newOrder = new Order({
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
cancelOrder :async (req, res) => {
  
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

    
    res.status(200).json({ message: 'Order cancelled' });

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
