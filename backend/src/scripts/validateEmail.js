/**
 * Email Service — Console Validation Script
 * Run this script to verify that the email configuration is correct.
 * Usage: node backend/src/scripts/validateEmail.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { notificationConfig, validateConfig } = require('../config/notification.config');
const { initEmailTransporter } = require('../services/emailService');

console.log('═══════════════════════════════════════════════');
console.log('  Lakwedha Email Service — Validation');
console.log('═══════════════════════════════════════════════\n');

// Step 1: Check config
console.log('Step 1: Checking notification config...');
validateConfig();

// Step 2: Check email credentials
console.log('\nStep 2: Checking email credentials...');
console.log(`  Host: ${notificationConfig.email.host || '❌ Missing'}`);
console.log(`  Port: ${notificationConfig.email.port || '❌ Missing'}`);
console.log(`  User: ${notificationConfig.email.user ? '✅ ' + notificationConfig.email.user : '❌ Missing'}`);
console.log(`  Pass: ${notificationConfig.email.pass ? '✅ Set (hidden)' : '❌ Missing'}`);

// Step 3: Try to initialize transporter
console.log('\nStep 3: Initializing Nodemailer transporter...');
const trans = initEmailTransporter();

if (trans) {
  console.log('\nStep 4: Verifying SMTP connection...');
  trans.verify()
    .then(() => {
      console.log('🎉 Email Service is ready! SMTP connection verified.');
    })
    .catch((err) => {
      console.log(`⚠️  SMTP verification failed: ${err.message}`);
      console.log('   Check your EMAIL_USER and EMAIL_PASS in .env');
    });
} else {
  console.log('\n⚠️  Email Service is NOT ready. Please check your .env credentials.');
}
