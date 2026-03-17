const Doctor = require('./doctor-channeling/models/doctor.model');
const Availability = require('./doctor-channeling/models/availability.model');

// Same doctors as Flutter's _sampleDoctors list in doctor_search_screen.dart
const DOCTORS = [
    { name: 'Dr. Kumari Jayawardena', specialization: 'General', qualification: 'BAMS, MD (Ayurveda)', experience: 12, rating: 4.8, reviewCount: 134, clinicName: 'Nawaloka Hospital', clinicAddress: '23 Galle Rd, Colombo 02', consultationFee: 1500, isVerified: true },
    { name: 'Dr. Suresh Perera', specialization: 'Panchakarma', qualification: 'BAMS, PG Dip (Panchakarma)', experience: 9, rating: 4.6, reviewCount: 89, clinicName: 'Asiri Hospital', clinicAddress: '181 Kirula Rd, Colombo 05', consultationFee: 2000, isVerified: true },
    { name: 'Dr. Malini Fernando', specialization: 'Skin Diseases', qualification: 'BAMS, MSc (Dermatology)', experience: 7, rating: 4.7, reviewCount: 112, clinicName: 'Lanka Hospitals', clinicAddress: 'Narahenpita, Colombo 05', consultationFee: 1800, isVerified: true },
    { name: 'Dr. Rohan Wickramasinghe', specialization: 'Kadum Bidum', qualification: 'BAMS, Dip (Traumatology)', experience: 15, rating: 4.9, reviewCount: 201, clinicName: 'Durdans Hospital', clinicAddress: '3 Alfred Place, Colombo 03', consultationFee: 2500, isVerified: true },
    { name: 'Dr. Priyanka Gunasekara', specialization: 'Sarpa Visha', qualification: 'BAMS, MD (Agada Tantra)', experience: 11, rating: 4.5, reviewCount: 76, clinicName: 'Ninewells Hospital', clinicAddress: '55/1 Kirimandala Mawatha, Colombo 05', consultationFee: 2200, isVerified: false },
    { name: 'Dr. Amara Bandara', specialization: 'General', qualification: 'BAMS', experience: 5, rating: 4.3, reviewCount: 48, clinicName: 'National Ayurveda Teaching Hospital', clinicAddress: 'Rajagiriya, Colombo', consultationFee: 800, isVerified: true },
    { name: 'Dr. Tharanga Ratnayake', specialization: 'Panchakarma', qualification: 'BAMS, MD (Kayachikitsa)', experience: 8, rating: 4.4, reviewCount: 63, clinicName: 'Nawaloka Hospital', clinicAddress: '23 Galle Rd, Colombo 02', consultationFee: 1900, isVerified: false },
    { name: 'Dr. Nirosha Silva', specialization: 'Skin Diseases', qualification: 'BAMS, PG Cert (Cosmetic Ayurveda)', experience: 6, rating: 4.6, reviewCount: 95, clinicName: 'Asiri Central Hospital', clinicAddress: '114 Norris Canal Rd, Colombo 10', consultationFee: 1700, isVerified: true },
];

// Mix of available / limited / full per session
const SESSION_BOOKED = [3, 8, 10, 2, 7];
const SESSION_DAY_OFFSETS = [1, 3, 5, 8, 12];

function makeSlots(bookedCount) {
    const slots = [];
    let hour = 9, min = 0;
    for (let i = 0; i < 10; i++) {
        const startH = hour.toString().padStart(2, '0');
        const startM = min.toString().padStart(2, '0');
        min += 30;
        if (min >= 60) { min -= 60; hour++; }
        const endH = hour.toString().padStart(2, '0');
        const endM = min.toString().padStart(2, '0');
        const isBooked = i < bookedCount;
        slots.push({
            startTime: `${startH}:${startM}`,
            endTime: `${endH}:${endM}`,
            status: isBooked ? 'booked' : 'available',
            isBooked,
        });
    }
    return slots;
}

async function seedDatabase() {
    const count = await Doctor.countDocuments();
    if (count > 0) {
        console.log(`Seed skipped — ${count} doctors already in DB`);
        return;
    }

    const doctors = await Doctor.insertMany(DOCTORS);

    for (const doctor of doctors) {
        const records = SESSION_DAY_OFFSETS.map((offset, i) => {
            const date = new Date();
            date.setDate(date.getDate() + offset);
            date.setHours(0, 0, 0, 0);
            return { doctorId: doctor._id, date, slots: makeSlots(SESSION_BOOKED[i]) };
        });
        await Availability.insertMany(records);
    }

    console.log(`Seeded ${doctors.length} doctors with availability`);
}

module.exports = seedDatabase;
