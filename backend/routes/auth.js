const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { generateOTP, sendOTPEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = { code: otp, expiresAt: otpExpiresAt, attempts: 0 };
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        otp: { code: otp, expiresAt: otpExpiresAt, attempts: 0 }
      });
    }

    await sendOTPEmail(email, name, otp, 'verify');

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for the verification OTP.',
      email
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create account. Please try again.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    if (!user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }

    if (user.otp.code !== otp.trim()) {
      user.otp.attempts += 1;
      await user.save();
      const remaining = 5 - user.otp.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt(s) remaining.`
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully. Welcome to CalorieTrack!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified.' });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    };
    await user.save();

    await sendOTPEmail(email, user.name, otp, 'verify');

    res.json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP. Please try again.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide your email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

if (!user) {
  return res.status(404).json({ success: false, message: 'No account found with this email. Please sign up.' });
}

const isPasswordValid = await user.comparePassword(password);

if (!isPasswordValid) {
  return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your password.' });
}

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in.',
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, message: 'Sign in failed. Please try again.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

   if (!user) {
  return res.status(404).json({ success: false, message: 'No account found with this email.' });
}

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    };
    await user.save();

    await sendOTPEmail(email, user.name, otp, 'reset');

    res.json({ success: true, message: 'If an account exists with this email, an OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Request failed. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Password reset failed. Please try again.' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profile: req.user.profile,
      isVerified: req.user.isVerified,
      createdAt: req.user.createdAt
    }
  });
});

module.exports = router;
