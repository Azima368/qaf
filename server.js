const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')

// Load env variables
dotenv.config()

// Initialize upload directories (optional)
try {
  require('./multerConfig')
} catch (err) {
  console.log('multerConfig not loaded:', err.message)
}

const app = express()
const server = http.createServer(app)

// ✅ CORS مفتوح (عشان يشتغل في أي مكان)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
})

app.use(cors({
  origin: '*',
  credentials: true
}))

// Middleware
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ✅ MongoDB connection مع validation
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is missing')
  process.exit(1)
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err)
  process.exit(1)
})

// Socket.io
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id)
  })
})

// Make io accessible to routes
app.set('io', io)

// Routes (protected with try/catch عشان ما يقعش السيرفر)
try {
  app.use('/api/auth', require('./routes/auth'))
  app.use('/api/sections', require('./routes/sections'))
  app.use('/api/products', require('./routes/products'))
  app.use('/api/orders', require('./routes/orders'))
} catch (err) {
  console.error('❌ Route loading error:', err.message)
}

// Health check route (مهم عشان Render)
app.get('/', (req, res) => {
  res.send('🚀 API is running')
})

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack)
  res.status(500).json({ message: 'Internal Server Error' })
})

// Start server
const PORT = process.env.PORT || 10000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})