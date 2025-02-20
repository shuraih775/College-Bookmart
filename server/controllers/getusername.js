require('dotenv').config();
const User = require('../models/users');
const jwt = require('jsonwebtoken');

 

const getUsernameById = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (user) {
            return user.username; 
        } else {
            return null; 
        }
    } catch (error) {
        console.error(error);
        return null; 
    }
};


const getUsername = async (token) => {
    try {
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.userId;

       
        const username = await getUsernameById(userId);
        return username; 
    } catch (error) {
        console.error(error);
        return null; 
}
};

const getUserId = async (token) => {
    try {
        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.userId;

        return userId; 
    } catch (error) {
        console.error(error);
        return null; 
}
};


const fetch = {
    fetchUsername:async(req,res)=>{
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
  
        const username = await getUsername(token);
        
        if (!username) {
          return res.status(401).json({ message: 'Invalid token' });
        }
        res.json({username});
    }
    catch(error){
        
        return res.status(500).json({message : 'Internal Server Error'});
    }
}
};

module.exports = { fetch,getUsername, getUserId};
