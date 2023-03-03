const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    editor: {
      type: String,
      required: true,
    },
    completedAt: {
      type: String,
      default:""
    },
    language: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    description: {
      type: String,
    },
    remarks: {
      type: String,
      default: "no remarks",
    },
    projectStatus: {
      type: String,
      default: "pending",
    },
    workStatus: {
      type: String,
      default: "pending",
    },
    workDate: {
      type: Date,
      default: Date.now,
    },
    workCreated:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

// generating JWT function
// projectSchema.methods.generateAuthToken = async function () {
//     try {
//       let tokenString = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
//       this.tokens = this.tokens.concat({token:tokenString})
//       await this.save();
//       return tokenString;
//     } catch (error) {
//       console.log(error);
//     }
//   };

const Project = mongoose.model("PROJECT", projectSchema);

module.exports = Project;
