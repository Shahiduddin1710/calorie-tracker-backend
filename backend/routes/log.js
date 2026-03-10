const express = require('express');
const router = express.Router();
const FoodLog = require('../models/FoodLog');
const Food = require('../models/Food');
const { protect } = require('../middleware/auth');

router.get('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;

    const logs = await FoodLog.find({ user: req.user._id, date }).populate('food').sort({ createdAt: 1 });

    const grouped = {
      breakfast: logs.filter(l => l.meal === 'breakfast'),
      lunch: logs.filter(l => l.meal === 'lunch'),
      dinner: logs.filter(l => l.meal === 'dinner'),
      snack: logs.filter(l => l.meal === 'snack')
    };

    const totals = logs.reduce((acc, log) => {
      acc.calories += log.nutrients.calories || 0;
      acc.protein += log.nutrients.protein || 0;
      acc.carbs += log.nutrients.carbs || 0;
      acc.fat += log.nutrients.fat || 0;
      acc.fiber += log.nutrients.fiber || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

    res.json({ success: true, logs: grouped, totals, allLogs: logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch food logs.' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { foodId, date, meal, servings } = req.body;

    if (!foodId || !date || !meal || !servings) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const food = await Food.findOne({
      _id: foodId,
      $or: [{ isPublic: true }, { createdBy: req.user._id }]
    });

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found.' });
    }

    const multiplier = servings / (food.servingSize / 100);

    const nutrients = {
      calories: Math.round(food.nutrients.calories * multiplier * 10) / 10,
      protein: Math.round(food.nutrients.protein * multiplier * 10) / 10,
      carbs: Math.round(food.nutrients.carbs * multiplier * 10) / 10,
      fat: Math.round(food.nutrients.fat * multiplier * 10) / 10,
      fiber: Math.round((food.nutrients.fiber || 0) * multiplier * 10) / 10,
      sugar: Math.round((food.nutrients.sugar || 0) * multiplier * 10) / 10,
      sodium: Math.round((food.nutrients.sodium || 0) * multiplier * 10) / 10
    };

    const log = await FoodLog.create({
      user: req.user._id,
      date,
      meal,
      food: foodId,
      servings,
      nutrients
    });

    await log.populate('food');

    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error('Add log error:', error);
    res.status(500).json({ success: false, message: 'Failed to log food.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const { servings } = req.body;

    const log = await FoodLog.findOne({ _id: req.params.id, user: req.user._id }).populate('food');

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found.' });
    }

    const food = log.food;
    const multiplier = servings / (food.servingSize / 100);

    log.servings = servings;
    log.nutrients = {
      calories: Math.round(food.nutrients.calories * multiplier * 10) / 10,
      protein: Math.round(food.nutrients.protein * multiplier * 10) / 10,
      carbs: Math.round(food.nutrients.carbs * multiplier * 10) / 10,
      fat: Math.round(food.nutrients.fat * multiplier * 10) / 10,
      fiber: Math.round((food.nutrients.fiber || 0) * multiplier * 10) / 10,
      sugar: Math.round((food.nutrients.sugar || 0) * multiplier * 10) / 10,
      sodium: Math.round((food.nutrients.sodium || 0) * multiplier * 10) / 10
    };

    await log.save();

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update log.' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const log = await FoodLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found.' });
    }

    res.json({ success: true, message: 'Food log deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete log.' });
  }
});

router.get('/stats/weekly', protect, async (req, res) => {
  try {
    const { startDate } = req.query;

    const start = startDate || new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];

    const logs = await FoodLog.find({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    const dailyStats = {};
    logs.forEach(log => {
      if (!dailyStats[log.date]) {
        dailyStats[log.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyStats[log.date].calories += log.nutrients.calories || 0;
      dailyStats[log.date].protein += log.nutrients.protein || 0;
      dailyStats[log.date].carbs += log.nutrients.carbs || 0;
      dailyStats[log.date].fat += log.nutrients.fat || 0;
    });

    res.json({ success: true, stats: dailyStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
