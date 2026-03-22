import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ravana_app/src/core/api_client.dart';
import 'package:ravana_app/src/data/sri_lanka_locations.dart';
import 'pharmacy_order_screen.dart';

// ─── Colors ─────────────────────────────────────────────────────────────────
const _primary    = Color(0xFF0D5C3E);
const _secondary  = Color(0xFFD4AF37);
const _background = Color(0xFFF8F9FA);

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
  String? _selectedCity;

  List<dynamic> _results = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  String? _error;

  // Multi-select state
  final Set<String> _selectedIds = {};

  List<String> get _availableDistricts =>
      _selectedProvince != null
          ? getDistricts(_selectedProvince!)
          : [];

  List<String> get _availableCities =>
      _selectedProvince != null && _selectedDistrict != null
          ? getCities(_selectedProvince!, _selectedDistrict!)
          : [];

  Future<void> _search() async {
    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _hasSearched = true;
      _error = null;
      _results = [];
      _selectedIds.clear();
    });

    try {
      final dio = ref.read(dioProvider);
      final params = <String, String>{};
      if (_selectedProvince != null) params['province'] = _selectedProvince!;
      if (_selectedDistrict != null) params['district'] = _selectedDistrict!;
      if (_selectedCity != null && _selectedCity!.isNotEmpty) {
        params['city'] = _selectedCity!;
      }

      final response = await dio.get(
        '/api/v1/pharmacy/nearby',
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
      _selectedCity = null;
      _results = [];
      _hasSearched = false;
      _error = null;
      _selectedIds.clear();
    });
  }

  void _toggleSelect(String id) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  void _proceedToOrder() {
    final selected = _results
        .where((p) => _selectedIds.contains((p['_id'] ?? '').toString()))
        .toList();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PharmacyOrderScreen(
          selectedPharmacies: selected.cast<Map<String, dynamic>>(),
          location: {
            'province': _selectedProvince ?? '',
            'district': _selectedDistrict ?? '',
            'city': _selectedCity ?? '',
          },
        ),
      ),
    );
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
      bottomNavigationBar: _selectedIds.isNotEmpty
          ? _buildOrderNowBar()
          : null,
    );
  }

  // ─── Order Now bottom bar ────────────────────────────────────────────────
  Widget _buildOrderNowBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.10),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton.icon(
            onPressed: _proceedToOrder,
            icon: const Icon(Icons.shopping_bag_rounded),
            label: Text(
              'Order Now  (${_selectedIds.length} selected)',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ),
    ).animate().slideY(begin: 1, end: 0, duration: 300.ms, curve: Curves.easeOut);
  }

  // ─── Filter panel ──────────────────────────────────────────────────────────
  Widget _buildFilterPanel() {
    return Container(
      color: _primary,
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(
        children: [
          _buildDropdown(
            hint: 'Select Province',
            value: _selectedProvince,
            items: getProvinces(),
            onChanged: (val) => setState(() {
              _selectedProvince = val;
              _selectedDistrict = null;
              _selectedCity = null;
            }),
          ),
          const SizedBox(height: 12),
          _buildDropdown(
            hint: 'Select District',
            value: _selectedDistrict,
            items: _availableDistricts,
            onChanged: _selectedProvince == null
                ? null
                : (val) => setState(() {
                    _selectedDistrict = val;
                    _selectedCity = null;
                  }),
          ),
          const SizedBox(height: 12),
          _buildDropdown(
            hint: 'Select City (optional)',
            value: _selectedCity,
            items: _availableCities,
            onChanged: _selectedDistrict == null
                ? null
                : (val) => setState(() => _selectedCity = val),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _isLoading ? null : _search,
              icon: _isLoading
                  ? const SizedBox(
                      width: 18, height: 18,
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
              .map((item) => DropdownMenuItem(value: item, child: Text(item)))
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
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
      physics: const BouncingScrollPhysics(),
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final pharmacy = _results[index] as Map<String, dynamic>;
        final id = (pharmacy['_id'] ?? '').toString();
        final isSelected = _selectedIds.contains(id);
        return _PharmacyCard(
          pharmacy: pharmacy,
          index: index,
          isSelected: isSelected,
          onToggleSelect: () => _toggleSelect(id),
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
                  color: _primary, fontSize: 20, fontWeight: FontWeight.w800)),
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
                  color: _primary, fontSize: 20, fontWeight: FontWeight.w800)),
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
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
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

// ─── Pharmacy Card (with selection) ─────────────────────────────────────────
class _PharmacyCard extends StatelessWidget {
  final Map<String, dynamic> pharmacy;
  final int index;
  final bool isSelected;
  final VoidCallback onToggleSelect;

  const _PharmacyCard({
    required this.pharmacy,
    required this.index,
    required this.isSelected,
    required this.onToggleSelect,
  });

  @override
  Widget build(BuildContext context) {
    final name     = pharmacy['name']     as String? ?? pharmacy['pharmacyName'] as String? ?? 'Unnamed Pharmacy';
    final address  = pharmacy['address']  as String? ?? '';
    final city     = pharmacy['city']     as String? ?? '';
    final district = pharmacy['district'] as String? ?? '';
    final province = pharmacy['province'] as String? ?? '';

    final locationParts = [city, district, province]
        .where((s) => s.isNotEmpty)
        .join(', ');

    return GestureDetector(
      onTap: onToggleSelect,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? _primary : Colors.transparent,
            width: 2.5,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? _primary.withValues(alpha: 0.15)
                  : Colors.black.withValues(alpha: 0.05),
              blurRadius: isSelected ? 20 : 16,
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
                      color: isSelected
                          ? _primary
                          : _primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.local_pharmacy_rounded,
                        color: isSelected ? Colors.white : _primary, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      name,
                      style: TextStyle(
                        color: isSelected ? _primary : const Color(0xFF1C2B2C),
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Checkbox(
                    value: isSelected,
                    onChanged: (_) => onToggleSelect(),
                    activeColor: _primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(5)),
                  ),
                ],
              ),
              if (locationParts.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(Icons.location_on_rounded, color: _secondary, size: 16),
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
              if (isSelected) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.check_circle_rounded, color: _primary, size: 14),
                      SizedBox(width: 6),
                      Text('Selected for Order',
                          style: TextStyle(
                              color: _primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    )
        .animate(delay: Duration(milliseconds: 100 + index * 80))
        .fadeIn(duration: 400.ms)
        .slideY(begin: 0.1, end: 0);
  }
}
