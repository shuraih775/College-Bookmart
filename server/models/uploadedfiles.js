const mongoose = require('mongoose');

const uploadedSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        ref:"users",
        trim: true 
      },
    files: [{
        data: Buffer, 
        contentType: String,
        name:String, 
        size: Number 
    }],
    Color:{
        type:String
    },
    printMode:{
        type:String
    },
    isReport:{
        type:String
    },
    department:{
        type:String
    },
    numCopies:{
        type:Number
    },
    extraInstructions:{
        type:String
    },
    price:{
        type:Number
    },
    pageCount:{
        type:Number
    },
    status:{
        type:String
    },
    code:{
        type:String
    },
    actualPrice:{
        type:Number
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
    
    
    
});
uploadedSchema.pre('save', function (next) {
    const currentDate = new Date();
    const oneDay = 24 * 60 * 60 * 1000; 

    if (currentDate - this.uploadDate >= oneDay) {
        this.files = [];
    }
    
    next();
});

setInterval(async () => {
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
    await mongoose.model('uploadedfiles').updateMany(
        { uploadDate: { $lt: oneDayAgo } },
        { $unset: { files: 1 } }
    );
}, 12 * 60 * 60 * 1000);
const uploadedfiles = mongoose.model('uploadedfiles', uploadedSchema);

module.exports = uploadedfiles;
