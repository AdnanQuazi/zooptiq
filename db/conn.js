require('dotenv').config();
const mongoose = require('mongoose');
 mongoose.connect(process.env.DB)
 .then( ()=>{
    console.log("connection established");
}).catch((e)=>{
    console.log(`ERROR: ${e}`)
});