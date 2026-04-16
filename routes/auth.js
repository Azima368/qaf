const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

const router = express.Router()

// Initialize admin user
const initializeAdmin = async () => {
  const adminExists = await User.findOne({ username: 'admin' })
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await User.create({ username: 'admin', password: hashedPassword })
    console.log('Admin user created')
  }
}

initializeAdmin()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم غير صحيح' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'كلمة المرور غير صحيحة' })
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'qaf_secret_key_2024',
      { expiresIn: '24h' }
    )

    res.json({ token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'خطأ في تسجيل الدخول' })
  }
})

module.exports = router
