/**
 * Pharmacy Seed Script
 * Inserts 10 dummy pharmacy users for testing the pharmacy finder feature.
 * Run: cd backend && node src/seeds/pharmacySeed.js
 * Safe to run multiple times — skips on duplicate emails.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lakwedha';

const pharmacies = [
  {
    name: 'Ayur Wellness Pharmacy',
    email: 'ayurwellness@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0112345678',
    address: '45 Galle Road',
    city: 'Colombo',
    district: 'Colombo',
    province: 'Western',
  },
  {
    name: 'Green Leaf Ayurveda',
    email: 'greenleaf@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0113456789',
    address: '12 Kandy Road',
    city: 'Gampaha',
    district: 'Gampaha',
    province: 'Western',
  },
  {
    name: 'Nature Cure Pharmacy',
    email: 'naturecure@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0812345678',
    address: '78 Peradeniya Road',
    city: 'Kandy',
    district: 'Kandy',
    province: 'Central',
  },
  {
    name: 'Herbal Life Pharmacy',
    email: 'herballife@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0912345678',
    address: '23 Matara Road',
    city: 'Galle',
    district: 'Galle',
    province: 'Southern',
  },
  {
    name: 'Pure Ayur Centre',
    email: 'pureayur@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0212345678',
    address: '5 Hospital Road',
    city: 'Jaffna',
    district: 'Jaffna',
    province: 'Northern',
  },
  {
    name: 'Traditional Remedies',
    email: 'traditional@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0652345678',
    address: '34 Main Street',
    city: 'Trincomalee',
    district: 'Trincomalee',
    province: 'Eastern',
  },
  {
    name: 'Wellness Ayur Pharmacy',
    email: 'wellness@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0372345678',
    address: '67 Colombo Road',
    city: 'Kurunegala',
    district: 'Kurunegala',
    province: 'North Western',
  },
  {
    name: 'Ancient Herbs Pharmacy',
    email: 'ancientherbs@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0252345678',
    address: '89 Anuradhapura Road',
    city: 'Anuradhapura',
    district: 'Anuradhapura',
    province: 'North Central',
  },
  {
    name: 'Healing Roots Pharmacy',
    email: 'healingroots@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0552345678',
    address: '12 Badulla Road',
    city: 'Badulla',
    district: 'Badulla',
    province: 'Uva',
  },
  {
    name: 'Sacred Ayur Pharmacy',
    email: 'sacredayur@lakwedha.com',
    password: 'pharmacy123',
    role: 'pharmacy',
    phone: '0452345678',
    address: '56 Colombo Road',
    city: 'Ratnapura',
    district: 'Ratnapura',
    province: 'Sabaragamuwa',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI);

    // We'll use the User model directly via mongoose
    const User = require('../models/user');

    let inserted = 0;
    let skipped = 0;

    for (const pharmacy of pharmacies) {
      const exists = await User.findOne({ email: pharmacy.email });
      if (exists) {
        console.log(`⏭  Skipping (already exists): ${pharmacy.name} <${pharmacy.email}>`);
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(pharmacy.password, 10);
      await User.create({ ...pharmacy, password: hashedPassword });
      console.log(`✅ Inserted: ${pharmacy.name} [${pharmacy.province} → ${pharmacy.district} → ${pharmacy.city}]`);
      inserted++;
    }

    console.log('\n─────────────────────────────────────────');
    console.log(`Done! Inserted: ${inserted} | Skipped: ${skipped}`);
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
