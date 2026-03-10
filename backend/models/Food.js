const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    default: ''
  },
  servingSize: {
    type: Number,
    required: true,
    default: 100
  },
  servingUnit: {
    type: String,
    default: 'g'
  },
  nutrients: {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
    fiber: { type: Number, default: 0, min: 0 },
    sugar: { type: Number, default: 0, min: 0 },
    sodium: { type: Number, default: 0, min: 0 }
  },
  category: {
    type: String,
    enum: ['protein', 'vegetable', 'fruit', 'grain', 'dairy', 'fat', 'beverage', 'snack', 'other'],
    default: 'other'
  },
  isCustom: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

foodSchema.index({ name: 'text', brand: 'text' });

module.exports = mongoose.model('Food', foodSchema);
