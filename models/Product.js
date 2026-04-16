const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  variants: [{
    color: {
      type: String,
      required: true
    },
    sizes: [{
      size: {
        type: String,
        required: true
      },
      stock: {
        type: Number,
        required: true,
        default: 0
      }
    }]
  }],
  // Support multiple images
  images: [{
    path: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  // Keep backward compatibility
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Product', productSchema)
