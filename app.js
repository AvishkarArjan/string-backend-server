const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
var cors = require('cors')
var cookieSession = require("cookie-session");
const compression = require("compression")

const app = express();
app.set('trust proxy', 1)
app.use(cookieParser());
app.use(
  cookieSession({
    name: "__session",
    keys: ["key1"],
      maxAge: 1000*3600*24*30*100,
      secure: true,
      httpOnly: false,
      SameSite: 'none'
  })
);
app.use(cors({
  origin:"https://stringbackend.in", // change to stringbackend.in
  credentials:true
}));

app.use(compression({
  level:6,
  threshold:0,
}))

dotenv.config({ path: "./config.env" });
require("./db/conn.js");
app.use(express.json());
const User = require("./model/userSchema.js");

const PORT = process.env.PORT;

app.use(require("./router/auth.js"));


app.get("/admin/projects", (req, res) => {
  res.send(`string backend project`);
});

app.get("/register", (req, res) => {
  res.send(`register StringBackend`);
});


app.get("/admin/employees", (req, res) => {
  User.find({},(err,data)=>{
    if(err){
      res.status(500).send(err.message)
    }
    else{

      res.status(200).send(data);
    }
  }).toArr
  // res.send(`employees StringBackend`);
});

app.get("/login", (req, res) => {
  res.send(`login String Backend`);
});

app.get("/admin", (req, res) => {
    res.cookie("jwtoken", "string");
    res.send(`login StringBackend`);
  });

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
