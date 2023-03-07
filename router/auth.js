const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const Otp = require("../model/otpSchema.js");
const Work = require("../model/workSchema.js");
const nodemailer = require("nodemailer");
const Leave = require("../model/leaveSchema.js");
const Event = require("../model/eventSchema");
const authenticate = require("../middleware/authenticate");
const authenEmp = require("../middleware/authenEmp");
const bodyParser = require("body-parser");
const BASE_URL_ADMIN = process.env.BASE_URL_ADMIN
const BASE_URL_EMP = process.env.BASE_URL_EMP
var cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware');



router.use(cookieParser());
router.use(bodyParser.json());
router.use(cors({
  origin:true,
  credentials:true
}));
// router.use(
//   '/',
//   createProxyMiddleware({
//     target: 'http://localhost:5000',
//     changeOrigin: true,
//   })
// );


require("../db/conn.js");
const User = require("../model/userSchema.js");
const Project = require("../model/projectSchema.js");
const { rmSync } = require("fs");

router.get('/', (req,res)=>{
  res.send("all good router.get / ")
})

// router.get("/", async (req, res,next) => {
//   try {
//     const token = req.cookies.jwtoken;
//     const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

//     const rootUser = await User.findOne({
//       _id: verifyToken._id,
//       "tokens.token": token,
//     });

//     console.log(rootUser);
//     console.log("rootUser");
//     if (rootUser) {
//       res.status(201).send("hello");
//       // res.status(200).json({"accType":rootUser})
//     } else {
//       res.status(400).json({ message: "user not found" });
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });



router.post("/admin/employees", authenticate, async (req, res) => {
  const { _id, name, email,email_acc, phone, password, cpassword, requestType, profile } =
    req.body;
  // console.log(req.body);

  try {
    if (requestType == "new") {
      if (!name || !email || !phone || !password || !cpassword || !email_acc) {
        return res
          .status(422)
          .json({ error: "One or more fields are incorrect" });
      }
      const userExist = await User.findOne({ email: email });
      if (userExist) {
        return res.status(422).json({ error: "Email already exists" });
      } else if (password != cpassword) {
        return res.status(422).json({ error: "Passwords do not match" });
      } else {
        const user = new User({
          name: name,
          email: email,
          email_acc:email_acc,
          phone: phone,
          password: password,
          cpassword: cpassword,
          profile: profile,
        });

        const userRegister = await user.save();
        // console.log(`${user} user reg succ`);
        // console.log(userRegister);

        if (userRegister) {
          res.status(200).json({ message: "user registered successfully" });
        } else {
          res.status(500).json({ error: " Failed to register" });
        }
      }
    } else if (requestType == "update") {
      const res2 = await User.updateOne(
        { _id: _id },
        {
          $set: {
            name: name,
            email: email,
            email_acc:email_acc,
            phone: phone,
            profile: profile,
          },
        }
      );

      if (res2) {
        res.status(200).send("Project updated successfully");
      }
    } else if (requestType == "delete") {
      const resultt = await User.deleteOne({ _id: _id });
      // console.log(resultt);
      if (resultt) {
        res.status(200).send("User deleted successfully");
      } else {
        res.status(400).send("Failed to delete user");
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// router.post("/register", async (req, res) => {
//   // object destructuring
//   const { name, email, phone, password, cpassword } = req.body;

//   if (!name || !email || !phone || !password || !cpassword) {
//     return res.status(422).json({ error: "One or more fields are incorrect" });
//   }

//   try {
//     const userExist = await User.findOne({ email: email });
//     if (userExist) {
//       return res.status(422).json({ error: "Email already exists" });
//     } else if (password != cpassword) {
//       return res.status(422).json({ error: "Passwords do not match" });
//     } else {
//       const user = new User({
//         name: name,
//         email: email,
//         phone: phone,
//         password: password,
//         cpassword: cpassword,
//       });

//       const userRegister = await user.save();
//       // console.log(`${user} user reg succ`);
//       // console.log(userRegister);

//       if (userRegister) {
//         res.status(201).json({ message: "user registered successfully" });
//       } else {
//         res.status(500).json({ error: " Failed to register" });
//       }
//     }
//   } catch (error) {
//     console.log(error);
//   }
// });

// Login Route

router.post("/login", async (req, res) => {
  try {
    res.setHeader('Set-Cookie', 'isLoggedin=true; SameSite=None; Secure');
    
    let token;
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "One or more field missing" });
    }

    const userLogin = await User.findOne({ email: email });
    const accType = userLogin.accType;

    // console.log(userLogin);

    if (userLogin) {
      const isMatch = await bcrypt.compare(password, userLogin.password);
      // adding JWT - json web token

      token = await userLogin.generateAuthToken();
      // adding cookies
      res.cookie("jwtoken", token,{
        expires: new Date(Date.now() + 258920000000), // 300 days
        httpOnly: false,
        sameSite: 'none',
        secure: true,
      })
        

      if (!isMatch) {
        res.status(400).json({ error: "Invalid credentials" });
      } else {
        res.json({ message: "Login successfull", accType: accType });
      }
    } else {
      res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/logout", (req, res) => {
  // console.log("logout page");
  res.clearCookie("jwtoken", { path: "/" });
  res.status(200).send("user lougout");
});

// employees details page

// router.get("/admin/employees", authenticate, (req, res) => {
//   // console.log("Hello Employee - router");
//   res.send(req.rootUser);
// });

router.get("/admin", authenticate, (req, res) => {
  Work.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      Project.find({}, (e, d) => {
        if (e) {
          res.status(500).send(e.message);
        } else {
          res.status(200).json({ works: data, projects: d });
        }
      });
    }
  });
});

router.post("/admin", authenticate, async (req, res) => {
  const {
    title,
    roughCut,
    roughCutAdmin,
    multiCamRoughCut,
    multiCamRoughCutAdmin,
    firstCut,
    firstCutAdmin,
    secondCut,
    secondCutAdmin,
    lastCut,
    lastCutAdmin,
    backupAdmin,
    backup,
    adminRemarks,
    regarding,
    completedOn,
  } = req.body;

  // console.log(req.body);
  try {
    if (title) {
      if (roughCutAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              roughCutAdmin: roughCutAdmin,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Word reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at 
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed rca");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev rc");
        }
      } else if (roughCut == false) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              roughCut: roughCut,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed rc");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev rc");
        }
      } else if (multiCamRoughCutAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              multiCamRoughCutAdmin: multiCamRoughCutAdmin,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed mcrca");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev mcrca");
        }
      } else if (multiCamRoughCut == false) {
        // console.log(multiCamRoughCut);
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              multiCamRoughCut: multiCamRoughCut,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed mcrc");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev mcrc");
        }
      } else if (firstCut == false) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              firstCut: firstCut,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed fc");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev fc");
        }
      } else if (firstCutAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              firstCutAdmin: firstCutAdmin,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed fca");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev fca");
        }
      } else if (secondCutAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              secondCutAdmin: secondCutAdmin,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed sca");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev sca");
        }
      } else if (secondCut == false) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              secondCut: secondCut,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed sc");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev sc");
        }
      } else if (lastCutAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              lastCutAdmin: lastCutAdmin,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed lca");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev lca");
        }
      } else if (backupAdmin) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              backupAdmin: backupAdmin,
              workStatus: "completed",
            },
          }
        );
        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });


        const res2 = await Project.updateOne(
          { title: title },
          {
            $set: {
              workStatus: "completed",
              completedAt: completedOn,
            },
          }
        );

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res3 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2 && res3) {
            res.status(200).send("Admin work reviewed -backupA");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1 && res2) {
          res.status(200).send("Admin work rev -backupA");
        }
      } else if (backup == false) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              backup: backup,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });


        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed bkp");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev bkp");
        }
      } else if (lastCut == false) {
        const res1 = await Work.updateOne(
          { title: title },
          {
            $set: {
              lastCut: lastCut,
            },
          }
        );

        const project = await Project.findOne({title:title})
        const mailEditor = await User.findOne({name:project.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to: mailEditor.email_acc,
          subject: "STRING BACKEND - Work reviewed",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Assigned to  : ${mailEditor.name}
                  Project : ${project.title}
                  
                  
                  Dear editor,
                  The admin has reviewed your work. Kindly check your dashboard at ${BASE_URL_EMP}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });

        if (adminRemarks && regarding) {
          const d = new Date();
          let strDate = d.toString();
          const res2 = await Work.updateOne(
            { title: title },
            {
              $push: {
                adminRemarks: {
                  regarding: regarding,
                  createdOn: strDate,
                  remark: adminRemarks,
                },
              },
            }
          );
          if (res1 && res2) {
            res.status(200).send("Admin work reviewed lc");
          } else {
            res.status(400).send("error something happened");
          }
        } else if (res1) {
          res.status(200).send("Admin work rev lc");
        }
      }
    }

    // const result = await Work.updateOne(
    //   { _id: _id },
    //   {
    //     $set: {
    //       adminRev: adminRev,
    //       workStatus: workStatus,
    //     },
    //   }
    // );

    // const result2 = await Project.updateOne(
    //   { title: title },
    //   {
    //     $set: {
    //       workStatus: workStatus,
    //     },
    //   }
    // );

    // if (result && result2) {
    //   res.status(201).json({ message: "work reviewed successfully" });
    // } else {
    //   res.status(500).json({ error: " Failed to review" });
    // }
  } catch (error) {
    console.log(error);
  }
});

router.post("/admin/leaves", authenticate, async (req, res) => {
  const { _id, approval } = req.body;
  try {
    const leaveExists = await Leave.findOne({_id:_id})
    const result = await Leave.updateOne(
      { _id: _id },
      {
        $set: {
          approval: approval,
        },
      }
    );

    
    const mailEditor = await User.findOne({name:leaveExists.name})

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "stringbackend@gmail.com",
        pass: "irgxoogxxmipnqlv",
      },
    });

    const mailOptions = {
      from: "stringbackend@gmail.com",
      to: mailEditor.email_acc,
      subject: "STRING BACKEND - Leave Approval",
      text: `This email is auto-generated from STRING-BACKEND. 
              
              Leave applied by : ${mailEditor.name}
              
              Leave Status : ${approval=="yes"?"ACCEPTED":"REJECTED"}
              
              `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
        // do something useful
      }
    });

    if (result) {
      res.status(201).json({ message: "approval submitted" });
    } else {
      res.status(500).json({ error: "approval submission failed" });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/employee", authenEmp, async (req, res) => {
  try {
    const {
      title,
      editor,
      compName,
      folderPath,
      image,
      revScript,
      adminRemarks,
      roughCut,
      multiCamRoughCut,
      firstCut,
      secondCut,
      lastCut,
      workCreated,
      backup,
      backupFolder,
      backupImage,
    } = req.body;

    // console.log(req.body);

    const workExist = await Work.findOne({ title: title });
    // console.log("this is work", workExist);
    if (workExist) {
      if (roughCut) {
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });


        const res2 = await Work.updateOne(
          { title: title },
          {
            $set: {
              roughCut: roughCut,
            },
          }
        );

        
        
        // console.log(res2);
      } else if (multiCamRoughCut) {
        const res3 = await Work.updateOne(
          { title: title },
          {
            $set: {
              multiCamRoughCut: multiCamRoughCut,
            },
          }
        );
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });
        // console.log(res3);
      } else if (firstCut) {
        const res4 = await Work.updateOne(
          { title: title },
          {
            $set: {
              firstCut: firstCut,
            },
          }
        );
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });
      } else if (secondCut) {
        const res5 = await Work.updateOne(
          { title: title },
          {
            $set: {
              secondCut: secondCut,
            },
          }
        );
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });
      } else if (lastCut) {
        const res6 = await Work.updateOne(
          { title: title },
          {
            $set: {
              lastCut: lastCut,
            },
          }
        );
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });
      } else if (backupFolder && backupImage && backup) {
        const res7 = await Work.updateOne(
          { title: title },
          {
            $set: {
              backupFolder: backupFolder,
              backupImage: backupImage,
              backup: backup,
            },
          }
        );
        const mailEditor = await User.findOne({name:workExist.editor})

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "stringbackend@gmail.com",
            pass: "irgxoogxxmipnqlv",
          },
        });
  
        const mailOptions = {
          from: "stringbackend@gmail.com",
          to:"stringbackend@gmail.com" ,
          subject: "STRING BACKEND - Work updated by Editor",
          text: `This email is auto-generated from STRING-BACKEND. 
                  
                  Editor assigned : ${mailEditor.name}
                  Project : ${workExist.title}
                  
                  Dear Admin,
                  The Editor has has updated the work. Kindly check your dashboard at ${BASE_URL_ADMIN}
                  
                  `,
        };
  
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            // do something useful
          }
        });
      }

      const result = await Work.updateOne(
        { title: title },
        {
          $set: {
            editor: editor,
            compName: compName,
            folderPath: folderPath,
            backupFolder: backupFolder,
            image: image,
            revScript: revScript,
            completedCuts: completedCuts,
            remarks: remarks,
            adminRev: adminRev,
          },
        }
      );

      // const projectUpdate = await result.save();
      // if (result && result2) {
      //   res.status(201).json({ message: "project updated successfully" });
      // } else {
      //   res.status(500).json({ error: " Failed to update" });
      // }
    } else {
      const work = new Work({
        title,
        editor,
        compName,
        folderPath,
        image,
        revScript,
        adminRemarks,
      });
      

      const createWork = await work.save();
      // console.log(createWork);

      const updateProject = await Project.updateOne(
        { title: title },
        {
          $set: {
            workCreated: workCreated,
          },
        }
      );
    }
    // const result2 = await Project.updateOne(
    //   { title: title },
    //   {
    //     $set: {
    //       workStatus: workStatus,
    //     },
    //   }
    // );

    if (!createWork || !updateProject) {
      res.status(400).send({ error: "Failed to upload work" });
    } else {
      res.status(200).send({ message: "Work uploaded successfully" });
    }
  } catch (error) {
    res.send(error);
  }
});

router.get("/employee/completedprojects", authenEmp, async (req, res) => {
  const token = req.cookies.jwtoken;
  const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
  const empUser = await User.findOne({
    _id: verifyToken._id,
    "tokens.token": token,
    accType: "employee",
  });

  Work.find({ editor: empUser.name }, async (err, data) => {
    if (err) {
      res.status(400).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});

router.get("/employee", authenEmp, async (req, res) => {
  try {
    let projectArr = [];
    let workArr = [];

    Project.find({}, async (err, data) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        const token = req.cookies.jwtoken;
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
        const rootUser = await User.findOne({
          _id: verifyToken._id,
          "tokens.token": token,
          accType: "employee",
        });
        for (let i = 0; i < data.length; i++) {
          if (data[i].editor == rootUser.name) {
            projectArr.push(data[i]);
          } else {
            continue;
          }
        }

        Work.find({}, async (er, da) => {
          if (er) {
            console.log(`employee get work error : ${er}`);
          } else {
            const token = req.cookies.jwtoken;
            const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
            const rootUser = await User.findOne({
              _id: verifyToken._id,
              "tokens.token": token,
              accType: "employee",
            });

            for (let i = 0; i < da.length; i++) {
              if (da[i].editor == rootUser.name) {
                workArr.push(da[i]);
              } else {
                continue;
              }
            }
            // console.log(projectArr, workArr);
            res.status(200).json({ projectArr: projectArr, workArr: workArr });
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/admin/employees", authenticate, async (req, res) => {
  // console.log(req.cookies,"<---cookies")
  User.find({}, async (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      // console.log(data);
      res.status(200).send(data);
    }
  });
  // res.send(`employees StringBackend`);
});

router.get("/admin/projects", authenticate, async (req, res) => {
  Project.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});

router.get("/admin/allprojects", authenticate, (req, res) => {
  Project.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});

router.post("/admin/allprojects", authenticate, async (req, res) => {
  const requestType = req.body.requestType;

  if (requestType === "delete") {
    const { _id } = req.body;
    if (!_id) {
      return res.status(422).json({ error: "One or more fields are lol" });
    }

    try {
      const the_project = await Project.findOne({ _id: _id });
      const the_title = the_project.title;
      const result = await Project.deleteOne({ _id: _id });
      const result2 = await Work.deleteOne({ title: the_title });
      // console.log(result);
      // console.log(result2);

      if (result && result2) {
        res.status(201).json({ message: "project deleted successfully" });
      } else {
        res.status(500).json({ error: " Failed to delete project" });
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    const {
      _id,
      title,
      editor,
      completedAt,
      language,
      channel,
      description,
      thumbnail,
      remarks,
      projectStatus,
    } = req.body;

    if (!_id || !title || !editor || !language || !channel) {
      return res
        .status(422)
        .json({ error: "One or more fields are incorrect" });
    }
    else{
      try {
        const result = await Project.updateOne(
          { _id: _id },
          {
            $set: {
              title: title,
              editor: editor,
              completedAt: completedAt,
              language: language,
              channel: channel,
              description: description,
              thumbnail: thumbnail,
              remarks: remarks,
              projectStatus: projectStatus,
            },
          }
        );
        // const projectUpdate = await result.save();
        if (result) {
          res.status(201).json({ message: "project updated successfully" });
        } else {
          res.status(500).json({ error: " Failed to update" });
        }
      } catch (error) {
        console.log(error);
      }
    }
    
  }
});

// router.post("/admin/allprojects",authenticate, async(req,res)=>{
//   const {_id} = req.body
//   if(!_id){
//     return res.status(422).json({ error: "One or more fields are lol" });
//   }

//   try {
//     const result = await Project.deleteOne({_id:_id});
//     console.log(result);
//   } catch (error) {
//     console.log(error);
//   }
// })

router.get("/admin/createproject", authenticate, (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});

// router.post("/employee" , authenticate, (req,res)=>{
//   const {compName,folderPath,backupFolder,file,revScript,completedCuts,remarks} = req.body;
// })

router.post("/admin/createproject", authenticate, async (req, res) => {
  const {
    title,
    editor,
    completedAt,
    language,
    channel,
    thumbnail,
    description,
    remarks,
  } = req.body;

  if (!title || !editor || !language || !channel) {
    return res.status(422).json({ error: "One or more fields are missing" });
  }

  try {
    const projectExist = await Project.findOne({ title: title });
    if (projectExist) {
      return res.status(422).json({ error: "Title already exists" });
    } else {
      const project = new Project({
        title,
        editor,
        completedAt,
        language,
        channel,
        thumbnail,
        description,
        remarks,
      });

      const createProject = await project.save();
      // console.log(`${user} user reg succ`);
      // console.log(createProject);

      const mailEditor = await User.findOne({name:editor})


      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "stringbackend@gmail.com",
          pass: "irgxoogxxmipnqlv",
        },
      });

      const mailOptions = {
        from: "stringbackend@gmail.com",
        to: mailEditor.email_acc,
        subject: "STRING BACKEND - New Work assigned",
        text: `This email is auto-generated from STRING-BACKEND. 
                
                Assigned to  : ${mailEditor.name}
                
                Dear editor, new work has been assigned to you. 
                Kindly check your dashboard at  ${BASE_URL_EMP}
                
                `,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          // do something useful
        }
      });

      if (createProject) {
        res.status(201).json({ message: "project created successfully" });
      } else {
        res.status(500).json({ error: " Failed to create project" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/change-password", async (req, res) => {
  let data = await Otp.find({
    stringEmail: req.body.stringEmail,
    code: req.body.otpCode,
  });

  if (data) {
    let currentTime = new Date().getTime();
    let diff = data.expireIn - currentTime;
    if (diff < 0) {
      res.status(400).send("token expired");
    } else {
      let user = await User.findOne({ email: req.body.stringEmail });

      // deleting previous account
      const result = await User.deleteOne({ _id: user._id });
      // console.log(result);
      // creating new account with previous details

      const updatedUser = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        email_acc:user.email_acc,
        password: req.body.password,
        cpassword: req.body.cpassword,
      });

      const userUpdated = await updatedUser.save();

      if (userUpdated) {
        res.status(201).json({ message: "user updated successfully" });
      } else {
        res.status(500).json({ error: " Failed to update" });
      }
    }
  } else {
    res.status(400).send("Error - wrong verification code");
  }
});

router.get("/employee/leaves", authenEmp, async (req, res) => {
  const token = req.cookies.jwtoken;
  const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
  const empUser = await User.findOne({
    _id: verifyToken._id,
    "tokens.token": token,
    accType: "employee",
  });

  Leave.find({ name: empUser.name }, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});
router.post("/employee/leaves", authenEmp, async (req, res) => {
  const { startDate, endDate, reason, approval } = req.body;
  const token = req.cookies.jwtoken;
  const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
  const rootUser = await User.findOne({
    _id: verifyToken._id,
    "tokens.token": token,
    accType: "employee",
  });

  try {
    if (rootUser) {
      const empName = rootUser.name;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "stringbackend@gmail.com",
          pass: "irgxoogxxmipnqlv",
        },
      });

      const mailOptions = {
        from: "stringbackend@gmail.com",
        to: "stringbackend@gmail.com",
        subject: "STRING BACKEND - Leave Application",
        text: `This email is auto-generated from STRING-BACKEND. 
                
                LEAVE APPLICATION :- 

                Employee Name : ${empName}
                From : ${startDate}
                To : ${endDate}
                
                Reason : ${reason}`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          // do something useful
        }
      });

      const leave = new Leave({
        name: empName,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
        approval: approval,
      });

      const leaveCreate = await leave.save();

      if (leaveCreate) {
        res.status(201).json({ message: "user updated successfully" });
      } else {
        res.status(500).json({ error: " Failed to update" });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/admin/leaves", authenticate, (req, res) => {
  Leave.find({}, (err, data) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.status(200).send(data);
    }
  });
});

router.get("/admin/calendar", authenticate, (req, res) => {
  Event.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).send(data);
    }
  });
});

router.get("/employee/calendar", authenEmp, (req, res) => {
  Event.find({}, (err, data) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).send(data);
    }
  });
});

router.post("/admin/calendar", authenticate, async (req, res) => {
  const { title, start, end, delEvent } = req.body;
  const token = req.cookies.jwtoken;
  const verifyToken = jwt.verify(token, process.env.SECRET_KEY);
  const user_id = verifyToken._id;
  if (title && start && end) {
    const eventExist = await Event.findOne({ title: title });
    if (!eventExist) {
      try {
        const createEvent = await Event.create({
          title: title,
          start: start,
          end: end,
          user_id: user_id,
        });
        if (!createEvent) {
          res.status(400).json({ error: "Failed to create event" });
        }
        const saveEvent = await createEvent.save();
        if (saveEvent) {
          res.status(200).json({ message: "Successfully created event" });
        } else {
          res.status(400).json({ error: "Failed to save event" });
        }
      } catch (error) {
        console.log(error);
        res.status(400).json({ error: "Calendar router post error" });
      }
    } else {
      res.status(400).send("Event already exists");
    }
  } else if (delEvent) {
    try {
      const deleteEvent = await Event.deleteOne({ title: delEvent });
      // console.log(deleteEvent);

      if (deleteEvent) {
        res.status(200).json({ message: "Event deleted successfully" });
      } else {
        res.status(400).json({ error: "failed to delete event" });
      }
    } catch (error) {
      console.log(`no delEvent`);
      console.log(error);
    }
  } else {
    res.status(400).send({ error: "Event Data not recieved" });
  }
});

router.post("/send-email", async (req, res) => {
  let data = await User.findOne({ username: req.body.stringEmail });
  if (data) {
    let otpcode = Math.floor(Math.random() * 10000 + 1);
    let otpData = new Otp({
      email: req.body.email,
      stringEmail: req.body.stringEmail,
      code: otpcode,
      expireIn: new Date().getTime() + 900 * 1000, // 15 mins
    });
    let otpResponse = await otpData.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "stringbackend@gmail.com",
        pass: "irgxoogxxmipnqlv",
      },
    });

    const mailOptions = {
      from: "stringbackend@gmail.com",
      to: req.body.email,
      subject: "STRING BACKEND - password change request",
      text:
        "Hi this email is generated from STRING BACKEND, here is your verification code : " +
        otpData.code,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        // console.log("Email sent: " + info.response);
        // do something useful
      }
    });
  } else {
    res.status(400).send({ error: "Account not found" });
  }
  res.status(200).send({ message: "Success! Please check you email account" });
});

module.exports = router;
