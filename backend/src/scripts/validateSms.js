/**
 * SMS Service — Console Validation Script
 * Run this script to verify that the Twilio configuration is correct.
 * Usage: node backend/src/scripts/validateSms.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { notificationConfig, validateConfig } = require('../config/notification.config');
const { initTwilioClient, sendSMS } = require('../services/smsService');

console.log('═══════════════════════════════════════════════');
console.log('  Lakwedha SMS Service — Validation');
console.log('═══════════════════════════════════════════════\n');

// Step 1: Check config
console.log('Step 1: Checking notification config...');
validateConfig();

// Step 2: Check Twilio credentials
console.log('\nStep 2: Checking Twilio credentials...');
console.log(`  Account SID: ${notificationConfig.twilio.accountSid ? '✅ Set (' + notificationConfig.twilio.accountSid.substring(0, 8) + '...)' : '❌ Missing'}`);
console.log(`  Auth Token:  ${notificationConfig.twilio.authToken ? '✅ Set (hidden)' : '❌ Missing'}`);
console.log(`  Phone Number: ${notificationConfig.twilio.phoneNumber ? '✅ ' + notificationConfig.twilio.phoneNumber : '❌ Missing'}`);

// Step 3: Try to initialize client
console.log('\nStep 3: Initializing Twilio client...');
const client = initTwilioClient();

if (client) {
  console.log('\n🎉 SMS Service is ready! You can send messages.');
  console.log('   To test, call sendSMS("+94771234567", "Hello from Lakwedha!")');
} else {
  console.log('\n⚠️  SMS Service is NOT ready. Please check your .env credentials.');
}

console.log('\n═══════════════════════════════════════════════\n');
