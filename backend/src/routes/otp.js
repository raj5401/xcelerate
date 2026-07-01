const router     = require('express').Router()
const nodemailer = require('nodemailer')
const { pool }   = require('../db')

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// POST /api/otp/send
router.post('/send', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email required' })

  const otp     = generateOTP()
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 mins

  try {
    await pool.query('UPDATE otps SET used=true WHERE email=$1', [email])
    await pool.query(
      'INSERT INTO otps (email, otp, expires_at) VALUES ($1,$2,$3)',
      [email, otp, expires]
    )

    // DEV MODE: if no SMTP credentials, skip email and return OTP directly
    const devMode = !process.env.SMTP_USER || !process.env.SMTP_PASS

    if (devMode) {
      console.log(`[DEV] OTP for ${email}: ${otp}`)
      return res.json({ message: 'OTP sent', dev_otp: otp })
    }

    await transporter.sendMail({
      from:    `"Xcelerate" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Your OTP for Xcelerate registration',
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
          <h2 style="color:#6366f1">Xcelerate</h2>
          <p>Your OTP for registration is:</p>
          <h1 style="letter-spacing:8px;color:#1a1a1a">${otp}</h1>
          <p style="color:#888;font-size:13px">Valid for 10 minutes. Do not share this with anyone.</p>
        </div>
      `,
    })
    res.json({ message: 'OTP sent' })
  } catch (err) {
    console.error('OTP send error:', err)
    res.status(500).json({ message: 'Failed to send OTP' })
  }
})

// POST /api/otp/verify
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' })

  try {
    const result = await pool.query(
      'SELECT * FROM otps WHERE email=$1 AND otp=$2 AND used=false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    )
    if (!result.rows.length)
      return res.status(400).json({ message: 'Invalid or expired OTP' })

    await pool.query('UPDATE otps SET used=true WHERE id=$1', [result.rows[0].id])
    res.json({ message: 'OTP verified', verified: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
