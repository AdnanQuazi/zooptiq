require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
    UID : {
        type : String,
        required : true,
        unique : true
    },
    password: {
        type: String,
        required: true
    },
    stores : [{
        type : Object
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }

});

adminSchema.methods.generateToken = async function (){
    try {

        const token = jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY);
        await this.save();
        return token;
        

    } catch (error) {
        return error
    }
}

const admin = new mongoose.model("admin",adminSchema)

module.exports = admin;