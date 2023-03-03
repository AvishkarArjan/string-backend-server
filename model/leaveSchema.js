const mongoose = require("mongoose")

const leaveSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    startDate:{
        type:Date
    },
    endDate:{
        type:Date
    },
    reason:{
        type:String,
        required:true
    },
    approval:{
        type:String,
        required:true,
        default:"pending"
    }

},
{ timestamps: true })

const Leave = mongoose.model("LEAVE", leaveSchema);

module.exports = Leave;