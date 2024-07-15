require('dotenv').config();
const jwt = require('jsonwebtoken');
const OtpData = require('../models/otp');


const otpAuth = async (req,res,next) => {

    try {
        const token = req.cookies.otp;

        const verifyUser = jwt.verify(token , process.env.SECRET_KEY);

        const user = await OtpData.findOne({_id: verifyUser._id.valueOf()});
        req.token = token;
        req.user = user;
        
        next();

    } catch (error) {
      next();
         
    }

}
module.exports = otpAuth;