const express = require('express')
const Order = require('../models/Order')
const Product = require('../models/Product')

const router = express.Router()

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ message: 'خطأ في جلب الطلبات' })
  }
})

// Create order
router.post('/', async (req, res) => {
  try {
    const { productId, productName, price, quantity, selectedColor, selectedSize, customerName, customerPhone, customerAddress } = req.body
    
    // Find product and check stock
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' })
    }
    
    // Find variant and size
    const variant = product.variants.find(v => v.color === selectedColor)
    if (!variant) {
      return res.status(400).json({ message: 'اللون غير موجود' })
    }
    
    const sizeItem = variant.sizes.find(s => s.size === selectedSize)
    if (!sizeItem) {
      return res.status(400).json({ message: 'المقاس غير موجود' })
    }
    
    // Check if enough stock
    if (sizeItem.stock < quantity) {
      return res.status(400).json({ message: `الكمية المتوفرة: ${sizeItem.stock} فقط` })
    }
    
    // Reduce stock
    sizeItem.stock -= quantity
    await product.save()
    
    const order = new Order({
      productId,
      productName,
      price,
      quantity,
      selectedColor,
      selectedSize,
      customerName,
      customerPhone,
      customerAddress
    })
    
    await order.save()
    
    // Emit socket event
    const io = req.app.get('io')
    io.emit('new-order', order)
    
    res.status(201).json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'خطأ في إنشاء الطلب' })
  }
})

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    
    res.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({ message: 'خطأ في تحديث الطلب' })
  }
})

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id)
    res.json({ message: 'تم حذف الطلب بنجاح' })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ message: 'خطأ في حذف الطلب' })
  }
})

module.exports = router
