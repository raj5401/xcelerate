const Razorpay = require('razorpay')
const crypto = require('crypto')

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

const createOrder = async (amount, receipt, notes = {}) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      notes,
    })
    return order
  } catch (error) {
    throw new Error(`Razorpay order creation failed: ${error.message}`)
  }
}

const verifyPayment = (paymentId, orderId, signature) => {
  const data = `${orderId}|${paymentId}`
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(data)
    .digest('hex')
  
  return generated_signature === signature
}

const capturePayment = async (paymentId, amount) => {
  try {
    const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100))
    return payment
  } catch (error) {
    throw new Error(`Payment capture failed: ${error.message}`)
  }
}

const createRefund = async (paymentId, amount, notes = {}) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      notes,
    })
    return refund
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`)
  }
}

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  capturePayment,
  createRefund,
}
