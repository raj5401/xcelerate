const nodemailer = require('nodemailer')
const crypto = require('crypto')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.SMTP_FROM_NAME + ' <' + process.env.SMTP_FROM_EMAIL + '>',
    to: email,
    subject: 'Your Xcelerate OTP - ' + otp,
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP for Xcelerate is:</p>
      <h1 style="color: #D85A30; font-weight: bold;">${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">Xcelerate Academy | Online Learning Platform</p>
    `
  }
  
  return transporter.sendMail(mailOptions)
}

const sendWelcomeEmail = async (email, name, role) => {
  const mailOptions = {
    from: process.env.SMTP_FROM_NAME + ' <' + process.env.SMTP_FROM_EMAIL + '>',
    to: email,
    subject: 'Welcome to Xcelerate!',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for joining Xcelerate Academy, India's premier online learning platform for PCMB subjects.</p>
      <p>${role === 'student' ? 'Start learning from India\'s best teachers. Explore our courses and enroll today!' : 'We\'re excited to have you as a teacher. Start creating courses and sharing your expertise!'}</p>
      <a href="${process.env.FRONTEND_URL}/login" style="background-color: #D85A30; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
      <hr>
      <p style="color: #666; font-size: 12px;">Xcelerate Academy | Online Learning Platform</p>
    `
  }
  
  return transporter.sendMail(mailOptions)
}

const sendNotification = async (email, title, message) => {
  const mailOptions = {
    from: process.env.SMTP_FROM_NAME + ' <' + process.env.SMTP_FROM_EMAIL + '>',
    to: email,
    subject: title,
    html: `
      <h2>${title}</h2>
      <p>${message}</p>
      <a href="${process.env.FRONTEND_URL}" style="background-color: #D85A30; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open Xcelerate</a>
      <hr>
      <p style="color: #666; font-size: 12px;">Xcelerate Academy | Online Learning Platform</p>
    `
  }
  
  return transporter.sendMail(mailOptions)
}

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

const generateToken = () => crypto.randomBytes(32).toString('hex')

module.exports = {
  sendOTP,
  sendWelcomeEmail,
  sendNotification,
  generateOTP,
  generateToken
}
