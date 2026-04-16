const express = require('express')
const multer = require('multer')
const path = require('path')
const Product = require('../models/Product')

const router = express.Router()

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/')
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

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('section').sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ message: 'خطأ في جلب المنتجات' })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('section')
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'خطأ في جلب المنتج' })
  }
})

// Create product
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const { name, section, description, price, variants, mainImageIndex } = req.body
    
    // Handle multiple images
    const images = req.files ? req.files.map((file, index) => ({
      path: `/uploads/products/${file.filename}`,
      isMain: parseInt(mainImageIndex || 0) === index
    })) : []
    
    // Set main image for backward compatibility
    const mainImage = images.find(img => img.isMain)
    const image = mainImage ? mainImage.path : (images[0]?.path || null)

    const product = new Product({
      name,
      section,
      description,
      price,
      variants: JSON.parse(variants || '[]'),
      images,
      image
    })

    await product.save()
    await product.populate('section')

    // Emit socket event
    const io = req.app.get('io')
    io.emit('new-product', product)

    res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ message: 'خطأ في إنشاء المنتج' })
  }
})

// Update product
router.put('/:id', upload.array('images', 10), async (req, res) => {
  try {
    const { name, section, description, price, variants, mainImageIndex, keepExistingImages } = req.body
    const updateData = {
      name,
      section,
      description,
      price,
      variants: JSON.parse(variants || '[]')
    }

    // Handle images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        path: `/uploads/products/${file.filename}`,
        isMain: parseInt(mainImageIndex || 0) === index
      }))
      
      if (keepExistingImages === 'true') {
        // Append new images to existing ones
        const existingProduct = await Product.findById(req.params.id)
        updateData.images = [...(existingProduct.images || []), ...newImages]
      } else {
        // Replace all images
        updateData.images = newImages
      }
      
      // Update main image for backward compatibility
      const mainImage = updateData.images.find(img => img.isMain)
      updateData.image = mainImage ? mainImage.path : (updateData.images[0]?.path || null)
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('section')

    // Emit socket event
    const io = req.app.get('io')
    io.emit('update-product', product)

    res.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ message: 'خطأ في تحديث المنتج' })
  }
})

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'تم حذف المنتج بنجاح' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'خطأ في حذف المنتج' })
  }
})

module.exports = router
