import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_colors.dart';
import '../models/emergency_center.dart';
import '../services/emergency_api_service.dart';
import '../services/location_service.dart';
import '../widgets/center_details_sheet.dart';

class EmergencyMapScreen extends StatefulWidget {
  final String? initialEmergencyType;

  const EmergencyMapScreen({super.key, this.initialEmergencyType});

  @override
  State<EmergencyMapScreen> createState() => _EmergencyMapScreenState();
}

class _EmergencyMapScreenState extends State<EmergencyMapScreen>
    with TickerProviderStateMixin {
  GoogleMapController? _mapController;
  late final AnimationController _stateAnimController;
  late final Animation<double> _fadeAnimation;
  final LocationService _locationService = LocationService();
  final EmergencyApiService _apiService = EmergencyApiService();

  static const LatLng _defaultCenter = LatLng(7.8731, 80.7718);
  static const double _defaultZoom = 8.0;

  Position? _currentPosition;
  bool _isLoadingLocation = true;
  String? _locationError;

  List<EmergencyCenter> _centers = [];
  Set<Marker> _markers = {};
  bool _isLoadingCenters = false;
  String? _centersError;
  String _searchQuery = '';
  String? _selectedType;
  String? _highlightedCenterId;
  bool _isExpandedSearch = false;
  final TextEditingController _searchController = TextEditingController();

  static const List<Map<String, String>> _centerTypes = [
    {'value': 'ayurvedic_hospital', 'label': 'Hospitals'},
    {'value': 'ayurvedic_clinic', 'label': 'Clinics'},
    {'value': 'panchakarma_center', 'label': 'Panchakarma'},
    {'value': 'herbal_pharmacy', 'label': 'Herbal Pharmacy'},
    {'value': 'wellness_center', 'label': 'Wellness'},
  ];

  @override
  void initState() {
    super.initState();
    _stateAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _stateAnimController,
      curve: Curves.easeOut,
    );
    _stateAnimController.forward();
    _initEmergency();
  }

  @override
  void dispose() {
    _mapController?.dispose();
    _searchController.dispose();
    _stateAnimController.dispose();
    super.dispose();
  }

  Future<void> _initEmergency() async {
    setState(() => _isLoadingCenters = true);
    await _fetchUserLocation();
    await _fetchEmergencyCenters();
  }

  Future<void> _refreshLocation() async {
    await _fetchUserLocation();
    await _fetchEmergencyCenters();
  }

  Future<void> _fetchUserLocation() async {
    try {
      final position = await _locationService.getCurrentLocation();
      setState(() {
        _currentPosition = position;
        _isLoadingLocation = false;
        _locationError = null;
      });
      _animateToUserLocation();
    } on LocationServiceException catch (e) {
      setState(() {
        _locationError = e.message;
        _isLoadingLocation = false;
      });
    }
  }

  void _animateToUserLocation() {
    if (_currentPosition != null && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(
              _currentPosition!.latitude,
              _currentPosition!.longitude,
            ),
            zoom: 12.0,
          ),
        ),
      );
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_currentPosition != null) _animateToUserLocation();
  }

  Future<void> _fetchEmergencyCenters() async {
    setState(() {
      _isLoadingCenters = true;
      _centersError = null;
      _isExpandedSearch = false;
    });
    try {
      List<EmergencyCenter> centers;
      if (_currentPosition != null) {
        // First try 7 km
        centers = await _apiService.fetchNearbyCenters(
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
          radiusKm: 7,
          emergencyType: widget.initialEmergencyType,
        );
        // Auto-expand to 15 km if empty
        if (centers.isEmpty) {
          setState(() => _isExpandedSearch = true);
          centers = await _apiService.fetchNearbyCenters(
            latitude: _currentPosition!.latitude,
            longitude: _currentPosition!.longitude,
            radiusKm: 15,
            emergencyType: widget.initialEmergencyType,
          );
        }
      } else {
        // No location — fetch all (filtered by emergency type)
        centers = await _apiService.fetchEmergencyCenters(
          emergencyType: widget.initialEmergencyType,
        );
      }
      setState(() {
        _centers = centers;
        _isLoadingCenters = false;
      });
      _buildMarkers();
    } catch (e) {
      setState(() {
        _isLoadingCenters = false;
        _centersError = 'Failed to load emergency centers. Please try again.';
      });
    }
  }

  double _getMarkerHue(String type, String centerId) {
    if (centerId == _highlightedCenterId) return BitmapDescriptor.hueRed;
    switch (type) {
      case 'ayurvedic_hospital':
        return BitmapDescriptor.hueGreen;
      case 'ayurvedic_clinic':
        return BitmapDescriptor.hueOrange;
      case 'panchakarma_center':
        return BitmapDescriptor.hueCyan;
      case 'herbal_pharmacy':
        return BitmapDescriptor.hueViolet;
      case 'wellness_center':
        return BitmapDescriptor.hueYellow;
      default:
        return BitmapDescriptor.hueGreen;
    }
  }

  void _buildMarkers() {
    final markers = <Marker>{};
    for (final center in _filteredCenters) {
      markers.add(
        Marker(
          markerId: MarkerId(center.id),
          position: LatLng(center.latitude, center.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            _getMarkerHue(center.type, center.id),
          ),
          onTap: () => _showCenterDetails(center),
        ),
      );
    }
    setState(() => _markers = markers);
  }

  void _showCenterDetails(EmergencyCenter center) {
    setState(() => _highlightedCenterId = center.id);
    _buildMarkers();
    final distance = _getCenterDistance(center);
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => CenterDetailsSheet(
        center: center,
        formattedDistance: distance != null ? _formatDistance(distance) : null,
        userLatitude: _currentPosition?.latitude,
        userLongitude: _currentPosition?.longitude,
      ),
    );
  }

  void _viewCenterOnMap(EmergencyCenter center) {
    setState(() => _highlightedCenterId = center.id);
    _buildMarkers();
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(center.latitude, center.longitude),
          zoom: 15.0,
        ),
      ),
    );
  }

  void _onSearchChanged(String query) {
    setState(() => _searchQuery = query.trim().toLowerCase());
    _buildMarkers();
  }

  void _onFilterTypeChanged(String? type) {
    setState(() {
      _selectedType = _selectedType == type ? null : type;
    });
    _buildMarkers();
  }

  List<EmergencyCenter> get _filteredCenters {
    var filtered = _centers;
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((c) {
        return c.name.toLowerCase().contains(_searchQuery) ||
            c.address.toLowerCase().contains(_searchQuery) ||
            c.typeLabel.toLowerCase().contains(_searchQuery);
      }).toList();
    }
    if (_selectedType != null) {
      filtered = filtered.where((c) => c.type == _selectedType).toList();
    }
    return filtered;
  }

  double? _getCenterDistance(EmergencyCenter center) {
    if (_currentPosition == null) return null;
    return _locationService.calculateDistance(
      startLat: _currentPosition!.latitude,
      startLng: _currentPosition!.longitude,
      endLat: center.latitude,
      endLng: center.longitude,
    );
  }

  String _formatDistance(double km) {
    if (km < 1) return '${(km * 1000).round()} m';
    return '${km.toStringAsFixed(1)} km';
  }

  Future<void> _callCenter(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Ayurvedic Emergency Centers',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
            letterSpacing: 0.3,
          ),
        ),
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppColors.primaryDark, AppColors.primary],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 2,
        shadowColor: AppColors.primary.withValues(alpha: 0.4),
      ),
      body: Column(
        children: [
          // ── Map section (top 55%) ──────────────────────────────────────────
          Expanded(
            flex: 55,
            child: Stack(
              children: [
                GoogleMap(
                  onMapCreated: _onMapCreated,
                  initialCameraPosition: const CameraPosition(
                    target: _defaultCenter,
                    zoom: _defaultZoom,
                  ),
                  markers: _markers,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: true,
                  mapToolbarEnabled: false,
                  compassEnabled: true,
                ),
                // Search bar
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.only(
                        top: 8, left: 16, right: 16, bottom: 44),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.white.withValues(alpha: 0.92),
                          Colors.white.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                    child: Material(
                      elevation: 4,
                      shadowColor: Colors.black26,
                      borderRadius: BorderRadius.circular(12),
                      child: TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        decoration: InputDecoration(
                          hintText: 'Search Ayurvedic centers...',
                          hintStyle: TextStyle(color: AppColors.textLight),
                          prefixIcon:
                              Icon(Icons.search, color: AppColors.textMedium),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: Icon(Icons.clear,
                                      color: AppColors.textMedium),
                                  onPressed: () {
                                    _searchController.clear();
                                    _onSearchChanged('');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: Colors.white,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Filter chips
                Positioned(
                  top: 64,
                  left: 0,
                  right: 0,
                  child: SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _centerTypes.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final type = _centerTypes[index];
                        final isSelected = _selectedType == type['value'];
                        return FilterChip(
                          label: Text(type['label']!),
                          selected: isSelected,
                          onSelected: (_) =>
                              _onFilterTypeChanged(type['value']),
                          selectedColor:
                              AppColors.accentLight.withValues(alpha: 0.2),
                          checkmarkColor: AppColors.accentLight,
                          backgroundColor: Colors.white,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? AppColors.accentLight
                                : AppColors.textMedium,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
                            fontSize: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(
                              color: isSelected
                                  ? AppColors.accentLight
                                  : Colors.grey.shade300,
                            ),
                          ),
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        );
                      },
                    ),
                  ),
                ),
                // Emergency type badge
                if (widget.initialEmergencyType != null)
                  Positioned(
                    top: 112,
                    left: 16,
                    right: 16,
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFBF360C),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.18),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.emergency,
                                color: Colors.white, size: 14),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                widget.initialEmergencyType!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                // Location error banner
                if (_locationError != null)
                  Positioned(
                    top: widget.initialEmergencyType != null ? 158 : 112,
                    left: 16,
                    right: 16,
                    child: Material(
                      elevation: 4,
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.location_off,
                                color: Colors.orange.shade700, size: 18),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _locationError!,
                                style: TextStyle(
                                    color: Colors.orange.shade900,
                                    fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                // My location FAB
                Positioned(
                  bottom: 10,
                  right: 12,
                  child: Tooltip(
                    message: 'Refresh nearby centers',
                    child: Material(
                      elevation: 6,
                      shadowColor: AppColors.primary.withValues(alpha: 0.3),
                      shape: const CircleBorder(),
                      child: FloatingActionButton(
                        mini: true,
                        backgroundColor: Colors.white,
                        elevation: 0,
                        onPressed: _isLoadingLocation ? null : _refreshLocation,
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child: _isLoadingLocation
                              ? const SizedBox(
                                  key: ValueKey('loading'),
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2),
                                )
                              : Icon(
                                  key: const ValueKey('icon'),
                                  Icons.my_location,
                                  color: AppColors.primary,
                                ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // ── Centers list (bottom 45%) ──────────────────────────────────────
          Expanded(
            flex: 45,
            child: _buildCentersList(),
          ),
        ],
      ),
    );
  }

  // ── Centers list panel ─────────────────────────────────────────────────────

  Widget _buildCentersList() {
    return Container(
      color: const Color(0xFFF0F4F8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: Row(
              children: [
                Icon(Icons.local_hospital, color: AppColors.primary, size: 17),
                const SizedBox(width: 8),
                Expanded(
                  child: _isLoadingCenters
                      ? Text(
                          _isExpandedSearch
                              ? 'Expanding search to 15 km…'
                              : 'Finding nearby centers…',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textMedium),
                        )
                      : Text(
                          _centersError != null
                              ? 'Failed to load centers'
                              : _filteredCenters.isEmpty
                                  ? 'No centers found'
                                  : '${_filteredCenters.length} center${_filteredCenters.length == 1 ? '' : 's'}'
                                      '${_currentPosition != null ? ' near you' : ''}',
                          style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textDark),
                        ),
                ),
                if (_currentPosition != null && !_isLoadingCenters)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _isExpandedSearch
                          ? Colors.orange.shade50
                          : AppColors.accentLight.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _isExpandedSearch
                            ? Colors.orange.shade200
                            : AppColors.accentLight.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.gps_fixed,
                            size: 11,
                            color: _isExpandedSearch
                                ? Colors.orange.shade700
                                : AppColors.accentLight),
                        const SizedBox(width: 3),
                        Text(
                          _isExpandedSearch ? '15 km' : '7 km',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _isExpandedSearch
                                ? Colors.orange.shade700
                                : AppColors.accentLight,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          // Expanded search notice
          if (_isExpandedSearch && !_isLoadingCenters)
            Container(
              width: double.infinity,
              color: Colors.orange.shade50,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
              child: Row(
                children: [
                  Icon(Icons.radar, size: 13, color: Colors.orange.shade700),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'No nearby emergency centers found. Expanding search…',
                      style: TextStyle(
                          fontSize: 11.5, color: Colors.orange.shade800),
                    ),
                  ),
                ],
              ),
            ),
          // List content
          Expanded(child: _buildListContent()),
        ],
      ),
    );
  }

  Widget _buildListContent() {
    if (_isLoadingCenters) {
      return Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                  color: AppColors.primary, strokeWidth: 2),
              const SizedBox(height: 12),
              Text(
                _isExpandedSearch
                    ? 'Expanding to 15 km…'
                    : 'Finding centers near you…',
                style: TextStyle(color: AppColors.textMedium, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    if (_centersError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, color: Colors.red.shade400, size: 36),
              const SizedBox(height: 8),
              Text(_centersError!,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textMedium, fontSize: 13)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _fetchEmergencyCenters,
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (_filteredCenters.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.local_hospital_outlined,
                  size: 36, color: AppColors.textLight),
              const SizedBox(height: 8),
              Text(
                _centers.isEmpty
                    ? 'No Ayurveda emergency centers found\nin your area.'
                    : 'No centers match your search or filter.',
                textAlign: TextAlign.center,
                style:
                    TextStyle(color: AppColors.textMedium, fontSize: 13),
              ),
              if (_centers.isEmpty && _currentPosition != null) ...[
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: _fetchEmergencyCenters,
                  icon:
                      Icon(Icons.refresh, color: AppColors.primary, size: 16),
                  label: Text('Search again',
                      style: TextStyle(color: AppColors.primary)),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      itemCount: _filteredCenters.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final center = _filteredCenters[index];
        final distance = _getCenterDistance(center);
        return _CenterListCard(
          center: center,
          distance: distance != null ? _formatDistance(distance) : null,
          isHighlighted: center.id == _highlightedCenterId,
          onCall: () => _callCenter(center.phone),
          onViewMap: () => _viewCenterOnMap(center),
          onDetails: () => _showCenterDetails(center),
        );
      },
    );
  }
}

// ── Center list card ───────────────────────────────────────────────────────

class _CenterListCard extends StatelessWidget {
  final EmergencyCenter center;
  final String? distance;
  final bool isHighlighted;
  final VoidCallback onCall;
  final VoidCallback onViewMap;
  final VoidCallback onDetails;

  const _CenterListCard({
    required this.center,
    required this.onCall,
    required this.onViewMap,
    required this.onDetails,
    this.distance,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onDetails,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isHighlighted ? AppColors.primary : const Color(0xFFE8EDF2),
            width: isHighlighted ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isHighlighted
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : Colors.black.withValues(alpha: 0.04),
              blurRadius: isHighlighted ? 12 : 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Name + distance badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      center.name,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                  if (distance != null) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.near_me,
                              size: 11, color: AppColors.primary),
                          const SizedBox(width: 3),
                          Text(
                            distance!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 5),
              // Type label + 24h + phone
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.accentLight.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      center.typeLabel,
                      style: TextStyle(
                          fontSize: 10.5,
                          color: AppColors.accentLight,
                          fontWeight: FontWeight.w600),
                    ),
                  ),
                  if (center.is24Hours) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '24h',
                        style: TextStyle(
                            fontSize: 10.5,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                  const SizedBox(width: 8),
                  Icon(Icons.phone_outlined,
                      size: 11, color: AppColors.textLight),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(
                      center.phone,
                      style: TextStyle(
                          fontSize: 11.5, color: AppColors.textMedium),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 32,
                      child: ElevatedButton.icon(
                        onPressed: onCall,
                        icon: const Icon(Icons.phone, size: 13),
                        label: const Text('Call Now',
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accentLight,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: SizedBox(
                      height: 32,
                      child: OutlinedButton.icon(
                        onPressed: onViewMap,
                        icon: const Icon(Icons.map_outlined, size: 13),
                        label: const Text('View Location',
                            style: TextStyle(
                                fontSize: 12, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: BorderSide(color: AppColors.primary),
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
