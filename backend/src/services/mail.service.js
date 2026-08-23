import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

const transporter = nodemailer.createTransport({
service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

transporter.verify()
  .then(() => {
    console.log("Ready for sending emails");
  })
  .catch((err) => {
    console.log("Email transporter verification failed");
    console.log(err);
  });

  export async function sendEmail({ to, subject, html,text }){ 
    const mailOptions = {
        from: process.env.GOOGLE_USER,
        to,
        subject,
        html,
        text
    }
  const details = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully");
  }