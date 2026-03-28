/**
 * Sri Lanka province -> district -> cities hierarchy.
 * Must stay in sync with mobile/lib/src/data/sri_lanka_locations.dart
 */
const SRI_LANKA_LOCATIONS = {
  'Western': {
    'Colombo': [
      'Colombo', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Maharagama',
      'Sri Jayawardenepura Kotte', 'Kaduwela', 'Homagama', 'Kolonnawa',
      'Avissawella', 'Padukka', 'Hanwella', 'Boralesgamuwa', 'Kesbewa',
    ],
    'Gampaha': [
      'Gampaha', 'Negombo', 'Ja-Ela', 'Wattala', 'Kelaniya',
      'Minuwangoda', 'Divulapitiya', 'Mirigama', 'Veyangoda',
      'Ganemulla', 'Ragama', 'Katunayake',
    ],
    'Kalutara': [
      'Kalutara', 'Panadura', 'Beruwala', 'Aluthgama', 'Horana',
      'Matugama', 'Bandaragama', 'Wadduwa', 'Ingiriya',
    ],
  },
  'Central': {
    'Kandy': [
      'Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya',
      'Kundasale', 'Digana', 'Galagedara',
    ],
    'Matale': ['Matale', 'Dambulla', 'Sigiriya', 'Ukuwela', 'Rattota'],
    'Nuwara Eliya': ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ragala', 'Walapane'],
  },
  'Southern': {
    'Galle': ['Galle', 'Ambalangoda', 'Hikkaduwa', 'Elpitiya', 'Baddegama', 'Karapitiya'],
    'Matara': ['Matara', 'Weligama', 'Akuressa', 'Dikwella', 'Kamburugamuwa'],
    'Hambantota': ['Hambantota', 'Tangalle', 'Beliatta', 'Tissamaharama', 'Ambalantota'],
  },
  'Northern': {
    'Jaffna': ['Jaffna', 'Nallur', 'Chavakachcheri', 'Point Pedro', 'Karainagar'],
    'Kilinochchi': ['Kilinochchi', 'Poonakary', 'Paranthan'],
    'Mullaitivu': ['Mullaitivu', 'Oddusuddan', 'Puthukudiyiruppu'],
    'Mannar': ['Mannar', 'Talaimannar', 'Murunkan'],
    'Vavuniya': ['Vavuniya', 'Cheddikulam', 'Nelukkulam'],
  },
  'Eastern': {
    'Trincomalee': ['Trincomalee', 'Kinniya', 'Kantale', 'Mutur'],
    'Batticaloa': ['Batticaloa', 'Eravur', 'Kattankudy', 'Kaluwanchikudy'],
    'Ampara': ['Ampara', 'Kalmunai', 'Akkaraipattu', 'Sammanthurai', 'Dehiattakandiya'],
  },
  'North Western': {
    'Kurunegala': [
      'Kurunegala', 'Kuliyapitiya', 'Pannala', 'Wariyapola', 'Narammala', 'Polgahawela',
    ],
    'Puttalam': ['Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Anamaduwa'],
  },
  'North Central': {
    'Anuradhapura': [
      'Anuradhapura', 'Kekirawa', 'Medawachchiya', 'Thambuttegama', 'Galenbindunuwewa',
    ],
    'Polonnaruwa': ['Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya'],
  },
  'Uva': {
    'Badulla': ['Badulla', 'Bandarawela', 'Ella', 'Welimada', 'Haputale'],
    'Monaragala': ['Monaragala', 'Wellawaya', 'Bibile', 'Kataragama'],
  },
  'Sabaragamuwa': {
    'Ratnapura': ['Ratnapura', 'Balangoda', 'Embilipitiya', 'Pelmadulla', 'Eheliyagoda'],
    'Kegalle': ['Kegalle', 'Mawanella', 'Rambukkana', 'Warakapola', 'Ruwanwella'],
  },
};

/**
 * Find the canonical province name by case-insensitive lookup.
 * Returns the correctly-cased province name, or null if not found.
 */
function findProvince(input) {
  if (!input) return null;
  const lower = input.trim().toLowerCase();
  return Object.keys(SRI_LANKA_LOCATIONS).find((p) => p.toLowerCase() === lower) || null;
}

/**
 * Find the canonical district name for a given province (case-insensitive).
 * Returns the correctly-cased district name, or null if not found.
 */
function findDistrict(province, input) {
  if (!province || !input) return null;
  const districts = SRI_LANKA_LOCATIONS[province];
  if (!districts) return null;
  const lower = input.trim().toLowerCase();
  return Object.keys(districts).find((d) => d.toLowerCase() === lower) || null;
}

module.exports = { SRI_LANKA_LOCATIONS, findProvince, findDistrict };
