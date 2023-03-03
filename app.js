const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
var cors = require('cors')

const app = express();

app.use(cookieParser());
app.use(cors());

dotenv.config({ path: "./config.env" });
require("./db/conn.js");
app.use(express.json());
const User = require("./model/userSchema.js");

const PORT = process.env.PORT;

app.use(require("./router/auth.js"));

// const middleware = (req, res, next) => {
//   console.log(`middlewareee`);
//   next();
// };

// app.get("/", (req, res) => {
//   res.send(`Hello world from server - app.js`);
// });

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
  res.send(`login StringBackend`);
});

app.get("/admin", (req, res) => {
    res.cookie("jwtoken", "string");
    res.send(`login StringBackend`);
  });

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
