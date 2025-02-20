const express = require('express');
const cors = require('cors');
const app = express();
const helmet = require('helmet');
const connectDB = require('./config/db');
const uploadRoute = require('./routes/upload');
const authroute = require('./routes/auth');
const productRoute = require('./routes/product');
const orderRoute = require('./routes/orders');
const paymentRoute = require('./routes/payment');

const bodyParser = require('body-parser');

const corsOptions = {
  origin: '*',
};


app.use(cors(corsOptions));
app.use(helmet());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
 
connectDB();




app.use(express.json());


app.use('/api/auth', authroute);
app.use('/api/upload',uploadRoute);
app.use('/api/product',productRoute);
app.use('/api/orders',orderRoute);
app.use('/api/transaction',paymentRoute);

module.exports = app;
