const mongoose = require("mongoose");


const otpSchema = new mongoose.Schema({
  email:String,
  stringEmail: String,
  code:String,
  expireIn:Number
 
},{
    timestamps:true
});

const Otp = mongoose.model("OTP",otpSchema);

module.exports = Otp;
