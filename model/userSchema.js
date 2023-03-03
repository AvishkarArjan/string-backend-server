const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
// import { isEmail } from "validator";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    
  },

  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Invalid email"],
  },

  email_acc:{
    type:String,
    required:true,
  },

  password: {
    type: String,
    required: true,
  },

  cpassword: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
    default:""
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  accType:{
    type:String,
    required:true,
    default:"employee"
  }
},
{timestamps:true});

// password hashing

userSchema.pre("save", async function (next) {
  console.log("hi from inside");
  if (this.isModified("password")) {
    this.password = bcrypt.hashSync(this.password, 12);
    this.cpassword = bcrypt.hashSync(this.cpassword, 12);
  }
  next();
});

// generating JWT function
userSchema.methods.generateAuthToken = async function () {
  try {
    let tokenString = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
    this.tokens = this.tokens.concat({token:tokenString})
    await this.save();
    return tokenString;
  } catch (error) {
    console.log(error);
  }
};

const User = mongoose.model("USER", userSchema);

module.exports = User;
