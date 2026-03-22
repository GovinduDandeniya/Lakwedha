// Sri Lanka Province → District → Cities hierarchy
const kSriLankaLocations = <Map<String, Object>>[
  {
    'province': 'Western',
    'districts': <Map<String, Object>>[
      {
        'name': 'Colombo',
        'cities': <String>[
          'Colombo', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Maharagama',
          'Sri Jayawardenepura Kotte', 'Kaduwela', 'Homagama', 'Kolonnawa',
          'Avissawella', 'Padukka', 'Hanwella', 'Boralesgamuwa', 'Kesbewa',
        ],
      },
      {
        'name': 'Gampaha',
        'cities': <String>[
          'Gampaha', 'Negombo', 'Ja-Ela', 'Wattala', 'Kelaniya',
          'Minuwangoda', 'Divulapitiya', 'Mirigama', 'Veyangoda',
          'Ganemulla', 'Ragama', 'Katunayake',
        ],
      },
      {
        'name': 'Kalutara',
        'cities': <String>[
          'Kalutara', 'Panadura', 'Beruwala', 'Aluthgama', 'Horana',
          'Matugama', 'Bandaragama', 'Wadduwa', 'Ingiriya',
        ],
      },
    ],
  },
  {
    'province': 'Central',
    'districts': <Map<String, Object>>[
      {
        'name': 'Kandy',
        'cities': <String>[
          'Kandy', 'Peradeniya', 'Katugastota', 'Gampola', 'Nawalapitiya',
          'Kundasale', 'Digana', 'Galagedara',
        ],
      },
      {
        'name': 'Matale',
        'cities': <String>['Matale', 'Dambulla', 'Sigiriya', 'Ukuwela', 'Rattota'],
      },
      {
        'name': 'Nuwara Eliya',
        'cities': <String>['Nuwara Eliya', 'Hatton', 'Talawakele', 'Ragala', 'Walapane'],
      },
    ],
  },
  {
    'province': 'Southern',
    'districts': <Map<String, Object>>[
      {
        'name': 'Galle',
        'cities': <String>[
          'Galle', 'Ambalangoda', 'Hikkaduwa', 'Elpitiya', 'Baddegama', 'Karapitiya',
        ],
      },
      {
        'name': 'Matara',
        'cities': <String>['Matara', 'Weligama', 'Akuressa', 'Dikwella', 'Kamburugamuwa'],
      },
      {
        'name': 'Hambantota',
        'cities': <String>['Hambantota', 'Tangalle', 'Beliatta', 'Tissamaharama', 'Ambalantota'],
      },
    ],
  },
  {
    'province': 'Northern',
    'districts': <Map<String, Object>>[
      {
        'name': 'Jaffna',
        'cities': <String>['Jaffna', 'Nallur', 'Chavakachcheri', 'Point Pedro', 'Karainagar'],
      },
      {
        'name': 'Kilinochchi',
        'cities': <String>['Kilinochchi', 'Poonakary', 'Paranthan'],
      },
      {
        'name': 'Mullaitivu',
        'cities': <String>['Mullaitivu', 'Oddusuddan', 'Puthukudiyiruppu'],
      },
      {
        'name': 'Mannar',
        'cities': <String>['Mannar', 'Talaimannar', 'Murunkan'],
      },
      {
        'name': 'Vavuniya',
        'cities': <String>['Vavuniya', 'Cheddikulam', 'Nelukkulam'],
      },
    ],
  },
  {
    'province': 'Eastern',
    'districts': <Map<String, Object>>[
      {
        'name': 'Trincomalee',
        'cities': <String>['Trincomalee', 'Kinniya', 'Kantale', 'Mutur'],
      },
      {
        'name': 'Batticaloa',
        'cities': <String>['Batticaloa', 'Eravur', 'Kattankudy', 'Kaluwanchikudy'],
      },
      {
        'name': 'Ampara',
        'cities': <String>[
          'Ampara', 'Kalmunai', 'Akkaraipattu', 'Sammanthurai', 'Dehiattakandiya',
        ],
      },
    ],
  },
  {
    'province': 'North Western',
    'districts': <Map<String, Object>>[
      {
        'name': 'Kurunegala',
        'cities': <String>[
          'Kurunegala', 'Kuliyapitiya', 'Pannala', 'Wariyapola', 'Narammala', 'Polgahawela',
        ],
      },
      {
        'name': 'Puttalam',
        'cities': <String>['Puttalam', 'Chilaw', 'Wennappuwa', 'Marawila', 'Anamaduwa'],
      },
    ],
  },
  {
    'province': 'North Central',
    'districts': <Map<String, Object>>[
      {
        'name': 'Anuradhapura',
        'cities': <String>[
          'Anuradhapura', 'Kekirawa', 'Medawachchiya', 'Thambuttegama', 'Galenbindunuwewa',
        ],
      },
      {
        'name': 'Polonnaruwa',
        'cities': <String>['Polonnaruwa', 'Kaduruwela', 'Hingurakgoda', 'Medirigiriya'],
      },
    ],
  },
  {
    'province': 'Uva',
    'districts': <Map<String, Object>>[
      {
        'name': 'Badulla',
        'cities': <String>['Badulla', 'Bandarawela', 'Ella', 'Welimada', 'Haputale'],
      },
      {
        'name': 'Monaragala',
        'cities': <String>['Monaragala', 'Wellawaya', 'Bibile', 'Kataragama'],
      },
    ],
  },
  {
    'province': 'Sabaragamuwa',
    'districts': <Map<String, Object>>[
      {
        'name': 'Ratnapura',
        'cities': <String>['Ratnapura', 'Balangoda', 'Embilipitiya', 'Pelmadulla', 'Eheliyagoda'],
      },
      {
        'name': 'Kegalle',
        'cities': <String>['Kegalle', 'Mawanella', 'Rambukkana', 'Warakapola', 'Ruwanwella'],
      },
    ],
  },
];

List<String> getProvinces() =>
    kSriLankaLocations.map((p) => p['province'] as String).toList();

List<String> getDistricts(String province) {
  final found = kSriLankaLocations.firstWhere(
    (p) => p['province'] == province,
    orElse: () => {},
  );
  if (found.isEmpty) return [];
  return (found['districts'] as List<Map<String, Object>>)
      .map((d) => d['name'] as String)
      .toList();
}

List<String> getCities(String province, String district) {
  final prov = kSriLankaLocations.firstWhere(
    (p) => p['province'] == province,
    orElse: () => {},
  );
  if (prov.isEmpty) return [];
  final dist = (prov['districts'] as List<Map<String, Object>>).firstWhere(
    (d) => d['name'] == district,
    orElse: () => {},
  );
  if (dist.isEmpty) return [];
  return (dist['cities'] as List<String>);
}
