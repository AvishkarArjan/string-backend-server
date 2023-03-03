const mongoose = require("mongoose");

const workSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    editor: {
      type: String,
      required: true,
    },
    compName: {
      type: String,
      required: true,
    },
    folderPath: {
      type: String,
      required: true,
    },
    backupFolder: {
      type: String,
    },

    image: {
      type: String,
      default:null
    },

    backupImage:{
      type:String,
      default:""
    },

    revScript: {
      type: Boolean,
      required: true,
    },
    adminRemarks: [
      {
        regarding:{
          type:String,
        },
        createdOn:{
          type:String,
        },
        remark:{
          type:String,
        }
      }
    ],
    
    roughCut: {
      type: Boolean,
      default:false
    },
    roughCutAdmin: {
      type: Boolean,
      default: false,
    },
    multiCamRoughCut: {
      type: Boolean,
      default:false

    },
    multiCamRoughCutAdmin: {
      type: Boolean,
      default: false,
    },
    firstCut: {
      type: Boolean,
      default:false

    },
    firstCutAdmin: {
      type: Boolean,
      default: false,
    },
    secondCut: {
      type: Boolean,
      default:false

    },
    secondCutAdmin: {
      type: Boolean,
      default: false,
    },
    lastCut: {
      type: Boolean,
      default:false

    },
    lastCutAdmin: {
      type: Boolean,
      default: false,
    },
    backup:{
      type:Boolean,
      default:false
    },
    backupAdmin:{
      type:Boolean,
      default:false
    },
    workStatus: {
      type: String,
      required: true,
      default: "pending",
    },
  },
  { timestamps: true }
);

const Work = mongoose.model("WORK", workSchema);

module.exports = Work;
