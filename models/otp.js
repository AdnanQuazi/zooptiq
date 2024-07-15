require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const otpSchema = new mongoose.Schema({
    otp : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
    },
    isVerified : {
        type : Boolean,
        required : true,
        default : false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires : 300
    }

});


otpSchema.methods.generateToken = async function (){
    try {

        
        const token = jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY);
        await this.save();
        return token;
        

    } catch (error) {

        return error
    }
}

const OtpData = new mongoose.model("OtpData",otpSchema)

module.exports = OtpData;