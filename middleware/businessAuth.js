const jwt = require('jsonwebtoken');
const BusinessData = require('../models/business');


const businessAuth = async (req,res,next) => {

    try {
        const token = req.cookies.business;

        const verifyUser = jwt.verify(token , process.env.SECRET_KEY);

        const user = await BusinessData.findOne({_id: verifyUser._id.valueOf()});

        req.token = token;
        req.user = user;
        
        next();

    } catch (error) {
      next();
         
    }

}
module.exports = businessAuth;