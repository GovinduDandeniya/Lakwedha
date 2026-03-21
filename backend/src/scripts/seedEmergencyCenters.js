require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const EmergencyCenter = require('../models/EmergencyCenter');

const MONGO_URI = process.env.MONGODB_URI ||
    'mongodb+srv://admin:lakdb1234@lakwedha.i8uzmqo.mongodb.net/lakwedha';

const centers = [
    {
        name: 'Government Ayurveda Hospital - Borella',
        type: 'ayurvedic_hospital',
        address: 'Cotta Road, Borella, Colombo 08',
        phone: '+94112695438',
        location: { type: 'Point', coordinates: [79.8783, 6.9147] },
        emergencyTypes: [
            'Snake Bite', 'Fractures (Hand / Leg Broken)', 'Joint Dislocation',
            'Burn Injuries', 'Wounds & Cuts', 'Poisoning (Herbal First Aid)',
            'Fever & Infection', 'Allergic Reactions', 'Paralysis (Initial Care)',
            'Head Injury (Mild)',
        ],
        country: 'Sri Lanka',
        is24Hours: true,
    },
    {
        name: 'Bandaranaike Memorial Ayurveda Research Institute',
        type: 'ayurvedic_hospital',
        address: 'Navinna, Maharagama',
        phone: '+94112850333',
        location: { type: 'Point', coordinates: [79.9264, 6.8489] },
        emergencyTypes: [
            'Snake Bite', 'Fractures (Hand / Leg Broken)', 'Poisoning (Herbal First Aid)',
            'Fever & Infection', 'Allergic Reactions', 'Skin Diseases (Severe)',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Siddhalepa Ayurveda Hospital',
        type: 'ayurvedic_hospital',
        address: 'Mount Lavinia, Colombo',
        phone: '+94112738622',
        location: { type: 'Point', coordinates: [79.8658, 6.8390] },
        emergencyTypes: [
            'Snake Bite', 'Fractures (Hand / Leg Broken)', 'Joint Dislocation',
            'Burn Injuries', 'Wounds & Cuts', 'Fever & Infection', 'Head Injury (Mild)',
        ],
        country: 'Sri Lanka',
        is24Hours: true,
    },
    {
        name: 'Hettigoda Ayurvedic Clinic',
        type: 'ayurvedic_clinic',
        address: 'No. 2, Galle Road, Ratmalana',
        phone: '+94112636774',
        location: { type: 'Point', coordinates: [79.8722, 6.8218] },
        emergencyTypes: [
            'Wounds & Cuts', 'Fever & Infection', 'Allergic Reactions',
            'Insect Bites & Stings', 'Skin Diseases (Severe)',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Ayurveda Panchakarma Centre - Kandy',
        type: 'panchakarma_center',
        address: '56 Peradeniya Road, Kandy',
        phone: '+94812233456',
        location: { type: 'Point', coordinates: [80.6350, 7.2906] },
        emergencyTypes: [
            'Muscle Sprain / Ligament Injury', 'Joint Dislocation',
            'Paralysis (Initial Care)', 'Fractures (Hand / Leg Broken)',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Barberyn Ayurveda Wellness Center',
        type: 'wellness_center',
        address: 'Weligama, Southern Province',
        phone: '+94412250572',
        location: { type: 'Point', coordinates: [80.4297, 5.9745] },
        emergencyTypes: [
            'Fever & Infection', 'Muscle Sprain / Ligament Injury',
            'Digestive Emergencies', 'Respiratory Distress (Asthma)', 'Skin Diseases (Severe)',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Link Natural Herbal Pharmacy',
        type: 'herbal_pharmacy',
        address: '44 Bauddhaloka Mawatha, Colombo 04',
        phone: '+94112508969',
        location: { type: 'Point', coordinates: [79.8612, 6.8940] },
        emergencyTypes: [
            'Allergic Reactions', 'Insect Bites & Stings',
            'Skin Diseases (Severe)', 'Fever & Infection', 'Wounds & Cuts',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'National Institute of Traditional Medicine',
        type: 'ayurvedic_hospital',
        address: 'Navinna Road, Maharagama',
        phone: '+94112853500',
        location: { type: 'Point', coordinates: [79.9280, 6.8505] },
        emergencyTypes: [
            'Snake Bite', 'Fractures (Hand / Leg Broken)', 'Poisoning (Herbal First Aid)',
            'Fever & Infection', 'Head Injury (Mild)', 'Paralysis (Initial Care)',
            'Burn Injuries', 'Allergic Reactions',
        ],
        country: 'Sri Lanka',
        is24Hours: true,
    },
    {
        name: 'Hela Bojun Ayurveda Clinic - Galle',
        type: 'ayurvedic_clinic',
        address: '12 Church Street, Galle Fort',
        phone: '+94912234567',
        location: { type: 'Point', coordinates: [80.2170, 6.0267] },
        emergencyTypes: [
            'Fever & Infection', 'Wounds & Cuts', 'Insect Bites & Stings',
            'Skin Diseases (Severe)', 'Allergic Reactions',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Auroville Panchakarma Retreat',
        type: 'panchakarma_center',
        address: 'Negombo Road, Chilaw',
        phone: '+94322255789',
        location: { type: 'Point', coordinates: [79.7953, 7.5758] },
        emergencyTypes: [
            'Muscle Sprain / Ligament Injury', 'Joint Dislocation',
            'Digestive Emergencies', 'Paralysis (Initial Care)',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Beam Hela Herbal Pharmacy',
        type: 'herbal_pharmacy',
        address: '108 High Level Road, Nugegoda',
        phone: '+94112814567',
        location: { type: 'Point', coordinates: [79.8862, 6.8728] },
        emergencyTypes: [
            'Insect Bites & Stings', 'Allergic Reactions',
            'Skin Diseases (Severe)', 'Wounds & Cuts',
        ],
        country: 'Sri Lanka',
        is24Hours: false,
    },
    {
        name: 'Sri Jayawardenepura Ayurveda Centre',
        type: 'wellness_center',
        address: 'Kotte, Sri Jayawardenepura',
        phone: '+94112865432',
        location: { type: 'Point', coordinates: [79.9000, 6.8868] },
        emergencyTypes: [
            'Fever & Infection', 'Digestive Emergencies',
            'Respiratory Distress (Asthma)', 'Muscle Sprain / Ligament Injury',
        ],
        country: 'Sri Lanka',
        is24Hours: true,
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        await EmergencyCenter.deleteMany({});
        console.log('Cleared existing emergency centers');

        const result = await EmergencyCenter.insertMany(centers);
        console.log(`Seeded ${result.length} emergency centers`);

        await mongoose.disconnect();
        console.log('Done!');
    } catch (err) {
        console.error('Seed error:', err.message);
        process.exit(1);
    }
}

seed();
