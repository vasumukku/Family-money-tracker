const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create default admin if not exists
    await createDefaultAdmin();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ username: process.env.ADMIN_USERNAME || 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'FamilyTracker@2024', 
        12
      );
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        name: 'Family Admin',
      });
      console.log('✅ Default admin user created');
      console.log(`   Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'FamilyTracker@2024'}`);
    }
  } catch (err) {
    console.error('Warning: Could not create default admin:', err.message);
  }
};

module.exports = connectDB;
