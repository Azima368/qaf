const express = require('express')
const multer = require('multer')
const path = require('path')
const Section = require('../models/Section')

const router = express.Router()

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/sections/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('صيغة الصورة غير مدعومة'))
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Get all sections
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find().sort({ createdAt: -1 })
    res.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    res.status(500).json({ message: 'خطأ في جلب الأقسام' })
  }
})

// Get single section
router.get('/:id', async (req, res) => {
  try {
    const section = await Section.findById(req.params.id)
    if (!section) {
      return res.status(404).json({ message: 'القسم غير موجود' })
    }
    res.json(section)
  } catch (error) {
    console.error('Error fetching section:', error)
    res.status(500).json({ message: 'خطأ في جلب القسم' })
  }
})

// Create section
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body
    const image = req.file ? `/uploads/sections/${req.file.filename}` : null
    
    const section = new Section({ name, image })
    await section.save()
    
    // Emit socket event
    const io = req.app.get('io')
    io.emit('new-section', section)
    
    res.status(201).json(section)
  } catch (error) {
    console.error('Error creating section:', error)
    res.status(500).json({ message: 'خطأ في إنشاء القسم' })
  }
})

// Delete section
router.delete('/:id', async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id)
    res.json({ message: 'تم حذف القسم بنجاح' })
  } catch (error) {
    console.error('Error deleting section:', error)
    res.status(500).json({ message: 'خطأ في حذف القسم' })
  }
})

module.exports = router
