const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  user_id:{
    type:String,
    required:true
  }
},{
    timestamps:true
});

const Event = mongoose.model("EVENT", eventSchema);
module.exports = Event;
