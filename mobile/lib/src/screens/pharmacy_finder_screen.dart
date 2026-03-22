import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/data/sri_lanka_locations.dart';

// ─── Colors matching team palette ───────────────────────────────────────────
const _primary    = Color(0xFF0D5C3E);
const _secondary  = Color(0xFFD4AF37);
const _background = Color(0xFFF8F9FA);
const _accent     = Color(0xFF28A745);

// ─── Screen ─────────────────────────────────────────────────────────────────
class PharmacyFinderScreen extends ConsumerStatefulWidget {
  const PharmacyFinderScreen({super.key});

  @override
  ConsumerState<PharmacyFinderScreen> createState() =>
      _PharmacyFinderScreenState();
}

class _PharmacyFinderScreenState extends ConsumerState<PharmacyFinderScreen> {
  String? _selectedProvince;
  String? _selectedDistrict;
  final TextEditingController _cityCtrl = TextEditingController();

  List<dynamic> _results = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  String? _error;

  List<String> get _availableDistricts =>
      _selectedProvince != null
          ? sriLankaLocations[_selectedProvince!] ?? []
          : [];

  @override
  void dispose() {
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _hasSearched = true;
      _error = null;
      _results = [];
    });

    try {
      final dio = ref.read(dioProvider);
      final params = <String, String>{};
      if (_selectedProvince != null) params['province'] = _selectedProvince!;
      if (_selectedDistrict != null) params['district'] = _selectedDistrict!;
      if (_cityCtrl.text.trim().isNotEmpty) params['city'] = _cityCtrl.text.trim();

      final response = await dio.get(
        '/pharmacy/nearby',
        queryParameters: params,
      );

      setState(() {
        _results = response.data['data'] ?? [];
      });
    } on DioException catch (e) {
      setState(() {
        _error = e.response?.data?['message'] ??
            'Could not reach the server. Please try again.';
      });
    } catch (e) {
      setState(() {
        _error = 'Unexpected error: $e';
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _clearFilters() {
    HapticFeedback.selectionClick();
    setState(() {
      _selectedProvince = null;
      _selectedDistrict = null;
      _cityCtrl.clear();
      _results = [];
      _hasSearched = false;
      _error = null;
    });
  }

  Future<void> _callPharmacy(String? phone) async {
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No phone number available.')),
      );
      return;
    }
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open phone dialer.')),
        );
      }
    }
  }

  // ─── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Find a Pharmacy',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.3),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_hasSearched)
            TextButton.icon(
              onPressed: _clearFilters,
              icon: const Icon(Icons.clear_all_rounded, color: Colors.white70),
              label: const Text('Clear',
                  style: TextStyle(color: Colors.white70, fontSize: 13)),
            ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterPanel(),
          Expanded(child: _buildResultsSection()),
        ],
      ),
    );
  }

  // ─── Filter panel ──────────────────────────────────────────────────────────
  Widget _buildFilterPanel() {
    return Container(
      color: _primary,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(
        children: [
          // Province
          _buildDropdown(
            hint: 'Select Province',
            value: _selectedProvince,
            items: sriLankaLocations.keys.toList(),
            onChanged: (val) => setState(() {
              _selectedProvince = val;
              _selectedDistrict = null;
            }),
          ),
          const SizedBox(height: 12),

          // District
          _buildDropdown(
            hint: 'Select District',
            value: _selectedDistrict,
            items: _availableDistricts,
            onChanged: _selectedProvince == null
                ? null
                : (val) => setState(() => _selectedDistrict = val),
          ),
          const SizedBox(height: 12),

          // City text field
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: TextField(
              controller: _cityCtrl,
              style: const TextStyle(color: Colors.white, fontSize: 15),
              decoration: InputDecoration(
                hintText: 'City / Town (optional)',
                hintStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55), fontSize: 15),
                prefixIcon:
                    Icon(Icons.location_city_rounded,
                        color: Colors.white.withValues(alpha: 0.7)),
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Search button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _search,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.search_rounded),
              label: Text(_isLoading ? 'Searching...' : 'Search Pharmacies',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w800)),
              style: ElevatedButton.styleFrom(
                backgroundColor: _secondary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildDropdown({
    required String hint,
    required String? value,
    required List<String> items,
    required ValueChanged<String?>? onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: value,
          hint: Text(hint,
              style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.55), fontSize: 15)),
          dropdownColor: _primary,
          style: const TextStyle(color: Colors.white, fontSize: 15),
          icon: Icon(Icons.keyboard_arrow_down_rounded,
              color: Colors.white.withValues(alpha: 0.7)),
          items: items
              .map((item) => DropdownMenuItem(
                    value: item,
                    child: Text(item),
                  ))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  // ─── Results section ───────────────────────────────────────────────────────
  Widget _buildResultsSection() {
    if (_isLoading) return _buildShimmer();
    if (_error != null) return _buildError();
    if (!_hasSearched) return _buildIdle();
    if (_results.isEmpty) return _buildEmpty();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
      physics: const BouncingScrollPhysics(),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final pharmacy = _results[index] as Map<String, dynamic>;
        return _PharmacyCard(
          pharmacy: pharmacy,
          index: index,
          onCall: () => _callPharmacy(pharmacy['phone']),
        );
      },
    );
  }

  Widget _buildIdle() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_pharmacy_rounded,
                color: _primary, size: 56),
          ),
          const SizedBox(height: 20),
          const Text('Find Pharmacies Near You',
              style: TextStyle(
                  color: _primary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text('Select your province, district\nand search above.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms);
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.search_off_rounded,
                color: Colors.orange, size: 56),
          ),
          const SizedBox(height: 20),
          const Text('No Pharmacies Found',
              style: TextStyle(
                  color: _primary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              'No pharmacies registered in this area yet.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.wifi_off_rounded,
                  color: Colors.red.shade400, size: 52),
            ),
            const SizedBox(height: 20),
            Text('Connection Error',
                style: TextStyle(
                    color: Colors.red.shade700,
                    fontSize: 20,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(_error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _search,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primary,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _buildShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade100,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
        itemCount: 4,
        itemBuilder: (_, __) => Container(
          margin: const EdgeInsets.only(bottom: 16),
          height: 130,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
    );
  }
}

// ─── Pharmacy Card ───────────────────────────────────────────────────────────
class _PharmacyCard extends StatelessWidget {
  final Map<String, dynamic> pharmacy;
  final int index;
  final VoidCallback onCall;

  const _PharmacyCard({
    required this.pharmacy,
    required this.index,
    required this.onCall,
  });

  @override
  Widget build(BuildContext context) {
    final name     = pharmacy['name']     as String? ?? 'Unnamed Pharmacy';
    final address  = pharmacy['address']  as String? ?? '';
    final city     = pharmacy['city']     as String? ?? '';
    final district = pharmacy['district'] as String? ?? '';
    final province = pharmacy['province'] as String? ?? '';
    final phone    = pharmacy['phone']    as String? ?? '';

    final locationParts = [city, district, province]
        .where((s) => s.isNotEmpty)
        .join(', ');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.local_pharmacy_rounded,
                      color: _primary, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    name,
                    style: const TextStyle(
                      color: _primary,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            if (locationParts.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.location_on_rounded,
                      color: _secondary, size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(locationParts,
                        style: const TextStyle(
                            color: _primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
            if (address.isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.home_work_rounded,
                      color: Colors.grey.shade400, size: 16),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(address,
                        style: TextStyle(
                            color: Colors.grey.shade600, fontSize: 13)),
                  ),
                ],
              ),
            ],
            if (phone.isNotEmpty) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.phone_rounded,
                      color: Colors.grey.shade400, size: 16),
                  const SizedBox(width: 6),
                  Text(phone,
                      style:
                          TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                ],
              ),
            ],
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: ElevatedButton.icon(
                onPressed: phone.isNotEmpty ? onCall : null,
                icon: const Icon(Icons.call_rounded, size: 18),
                label: const Text('Call Now',
                    style:
                        TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _accent,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    )
        .animate(delay: Duration(milliseconds: 100 + index * 80))
        .fadeIn(duration: 400.ms)
        .slideY(begin: 0.1, end: 0);
  }
}
