const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const calculateTDEE = (profile) => {
  const { age, gender, height, weight, activityLevel, goal } = profile;

  if (!age || !gender || !height || !weight) return 2000;

  let bmr;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

  const goalAdjustments = {
    lose: -500,
    maintain: 0,
    gain: 300
  };

  return Math.round(tdee + (goalAdjustments[goal] || 0));
};

router.put('/profile', protect, async (req, res) => {
  try {
    const { age, gender, height, weight, activityLevel, goal } = req.body;

    const user = await User.findById(req.user._id);

    user.profile = {
      ...user.profile,
      age, gender, height, weight, activityLevel, goal
    };

    const dailyCalorieGoal = calculateTDEE(user.profile);
    const proteinGoal = Math.round(weight * 2.2 * (goal === 'gain' ? 1 : 0.8));

    user.profile.dailyCalorieGoal = dailyCalorieGoal;
    user.profile.dailyProteinGoal = proteinGoal;
    user.profile.dailyCarbGoal = Math.round((dailyCalorieGoal * 0.45) / 4);
    user.profile.dailyFatGoal = Math.round((dailyCalorieGoal * 0.30) / 9);

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: user.profile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

router.put('/goals', protect, async (req, res) => {
  try {
    const { dailyCalorieGoal, dailyProteinGoal, dailyCarbGoal, dailyFatGoal } = req.body;

    const user = await User.findById(req.user._id);

    if (dailyCalorieGoal) user.profile.dailyCalorieGoal = dailyCalorieGoal;
    if (dailyProteinGoal) user.profile.dailyProteinGoal = dailyProteinGoal;
    if (dailyCarbGoal) user.profile.dailyCarbGoal = dailyCarbGoal;
    if (dailyFatGoal) user.profile.dailyFatGoal = dailyFatGoal;

    await user.save();

    res.json({ success: true, message: 'Goals updated.', profile: user.profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update goals.' });
  }
});

router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

module.exports = router;
