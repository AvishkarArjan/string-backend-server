const mongoose = require("mongoose");

const DB = process.env.DATABASE;

mongoose.connect(DB,{
    // avoid DeprecationWarning
    useNewUrlParser: true,
    // useCreateIndex : true, 
    useUnifiedTopology:true,
    // useFindAndModify:false
  })
  .then(() => {
    console.log("Connection successfull !");
  })
  .catch((err) => {
    console.log("connection Failed");
    console.log(err)});