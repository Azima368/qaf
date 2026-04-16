const fs = require('fs')
const path = require('path')

// Create upload directories if they don't exist
const uploadDirs = [
  'uploads',
  'uploads/sections',
  'uploads/products'
]

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
})
