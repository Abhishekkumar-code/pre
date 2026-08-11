import bcrypt from "bcryptjs";
import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken"
import { sendEmail } from "../services/mail.service.js";

export async function registercontroller(req, res) {
    const { email, username, password } = req.body

    const isuseralreadyexists = await userModel.findOne({
        $or: [
            { email }, { username }
        ]
    })

    if (isuseralreadyexists) {
        return res.status(400).json({
            message: isuseralreadyexists.email === email ? "emial already exists" : "username is alreaduy exists",
            success: false,
            err: "user already exists"
        })
    }


    const user = await userModel.create({
        username, email, password
    })

    const emailverificationtoken = jwt.sign({
        email: user.email,
    }, process.env.JWT_SECRET, {
        expiresIn: "1h"
    })
 
    
    await sendEmail({
        to: user.email,
        subject: "welcone to perplexity",
        html: `<p>${user.username}</p> 
        <p> Thank you for registering at <strong>Perplexity</strong>.We are excited to have you on board!</p>
        <p> Please click on the link below to verify your email address:</p>
         <a href="http://localhost:3000/api/auth/verify?token=${emailverificationtoken}">Verify</a>
         <p>If you did not create an account, no further action is required.</p>
         <p>Best regards,<br>Perplexity Team</p>`

    })

    return res.status(200).json({
        message: "email sent succesfully and user created",
    })
} 

export async function verifyemail(req, res) {
    const { token } = req.query;

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findOne({ email: decoded.email })

    if (!user) {
        return res.status(400).json({
            message: "invalidtoken",
            success: false,
            err: "user not found"
        })
    }

    user.verified = true;
    await user.save();
    const html =
        `<h1>Email verified successfully</h1>
          <p>Dear ${user.username},</p>
           <p>Thank you for verifying your email address. You can now log in to your account.</p>`
    res.send(html);

}

export async function logincontroller(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({
            message: "Invalid credentials",
            success: false
        })
    }
  

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid credentials",
            success: false,
            err: "invalid credentials"
        })
    }
    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "email not verified"
        })
    }

     const token = jwt.sign({
        id: user._id,
        username: user.username,
        email: user.email
     }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.cookie("token", token);

    return res.status(200).json({
        message: "Login successful",
        success: true,
     user: {
        username: user.username,
        email: user.email,
        id: user._id
     }})
}

export async function getme(req,res){
   const userId = req.user.id;

   const user = await userModel.findById(userId)
    if(!user){
    return res.status(404).json({
        message: "User not found",
        success: false
    })
  }
 res.status(200).json({
    message: "User found",
    success: true,
    user
})
}
