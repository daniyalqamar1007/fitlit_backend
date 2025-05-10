// scripts/make-admin.js
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define simplified user schema
const userSchema = new mongoose.Schema({
  userId: Number,
  name: String,
  email: String,
  password: String,
  emailVerified: Boolean,
  otp: String,
  otpExpiry: Date,
  isAdmin: Boolean,
});

// Create model
const User = mongoose.model('User', userSchema);

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address!');
    process.exit(1);
  }

  try {
    // First check if the user has the isAdmin field already
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }

    // Update the user to be an admin
    await User.updateOne({ email }, { $set: { isAdmin: true } });
    console.log(`User ${email} is now an admin!`);
  } catch (error) {
    console.error('Error occurred:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

makeAdmin();
