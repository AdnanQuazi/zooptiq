require('dotenv').config();
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');


const adminAuth = async (req,res,next) => {

    try {
        const token = req.cookies.admin;
        const verifyUser = jwt.verify(token , process.env.SECRET_KEY);
       
        const admin = await Admin.findOne({_id: verifyUser._id.valueOf()});
        req.token = token;
        req.admin = admin;
        next();

    } catch (error) {
      next()
         
    }

}
module.exports = adminAuth;