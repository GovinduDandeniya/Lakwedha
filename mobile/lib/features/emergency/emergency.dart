/// Emergency Health Center Finder feature
///
/// Provides a Google Maps-based interface for locating nearby
/// Ayurvedic emergency health centers in Sri Lanka.
///
/// Feature structure:
/// - models/     — Data models (EmergencyCenter)
/// - services/   — API and location services
/// - screens/    — Map screen UI
/// - widgets/    — Reusable UI components (CenterDetailsSheet)
library emergency;

export 'models/emergency_center.dart';
export 'screens/emergency_map_screen.dart';
export 'screens/emergency_type_screen.dart';
export 'services/emergency_api_service.dart';
export 'services/location_service.dart';
export 'widgets/center_details_sheet.dart';
