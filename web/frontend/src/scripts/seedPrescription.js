const axios = require('axios');

async function seed() {
  try {
    console.log('🌱 Starting Manual Seed...');

    // We need a dummy patient ID. Since we are in dev, we can try to fetch users or just use a placeholder
    // If the backend requires a real Mongo ID, ensure your DB has one.
    // Based on our previous seed.js, we know 'test@example.com' exists.

    const payload = {
      userId: "65cb7e1a9f1a2b3c4d5e6f70", // Placeholder Mongo ID
      patientName: "Gamini Perera",
      imageUrl: "https://placehold.co/600x400/5D4037/FFF8E1?text=Ayu+Prescription+Test",
      pharmacyStatus: "pending",
      doctorStatus: "approved"
    };

    const response = await axios.post('http://localhost:5000/api/prescriptions', payload);

    console.log('✅ Seed Successful!');
    console.log('📦 Data:', response.data);
  } catch (error) {
    console.error('❌ Seed Failed!');
    console.error('Cause:', error.response?.data || error.message);
    console.log('\nTip: Ensure your backend is running at http://localhost:5000');
  }
}

seed();
