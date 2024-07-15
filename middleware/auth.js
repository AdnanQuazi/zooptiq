require('dotenv').config();
const jwt = require('jsonwebtoken');
const UserData = require('../models/users');


const auth = async (req,res,next) => {

    try {
        const token = req.cookies.jwt;

        const verifyUser = jwt.verify(token , process.env.SECRET_KEY);

        const user = await UserData.findOne({_id: verifyUser._id.valueOf()});
        req.token = token;
        req.user = user;
        
        next();

    } catch (error) {
      next();
         
    }

}
module.exports = auth;