
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  username: {
    type: String,
    required: true,
    unique: true, 
    trim: true 
  },
  password: {
    type: String,
    required: true
  },
  vpa:{
    type:String
  },
  isAdmin:{
    type:Boolean,
    required :true
  }
});


const users = mongoose.model('users', userSchema);
module.exports = users;
