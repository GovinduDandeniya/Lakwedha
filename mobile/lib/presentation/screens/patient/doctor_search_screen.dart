import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';
import '../../../data/datasources/remote/api_service.dart';
import '../../../data/models/doctor_model.dart';
import '../../widgets/doctor_card.dart';
import 'booking_screen.dart';
import 'doctor_availability_screen.dart';

const Color _primary = Color(0xFF2E7D32);
const Color _bg = Color(0xFFF4FAF4);

class DoctorSearchScreen extends StatefulWidget {
  const DoctorSearchScreen({super.key});

  @override
  State<DoctorSearchScreen> createState() => _DoctorSearchScreenState();
}

class _DoctorSearchScreenState extends State<DoctorSearchScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _hospitalController = TextEditingController();
  final FocusNode _nameFocusNode = FocusNode();
  final FocusNode _hospitalFocusNode = FocusNode();

  List<Doctor> _doctors = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  bool _isNameOnlyMode = false;
  String? _selectedSpecialty;
  DateTime? _selectedDate;

  final List<String> _specialties = [
    // General
    'Kayachikitsa (General Ayurveda)',
    // Surgery
    'Shalya Tantra (Ayurveda Surgery)',
    'Kshara Sutra (Para-Surgical)',
    // ENT / Head
    'Shalakya Tantra (ENT & Eye)',
    'Netra Roga (Eye Diseases)',
    'Karna Roga (Ear Diseases)',
    'Nasa Roga (Nose Diseases)',
    // Child & Women Health
    'Kaumarbhritya / Bala Roga (Pediatrics)',
    'Stri Roga (Gynecology)',
    'Prasuti Tantra (Obstetrics)',
    // Toxicology
    'Agada Tantra (Toxicology)',
    'Snake Bite Treatment',
    // Mental Health
    'Bhuta Vidya (Mental Health)',
    // Rejuvenation & Wellness
    'Rasayana Therapy (Rejuvenation)',
    'Anti-Aging Ayurveda',
    // Reproductive Health
    'Vajikarana (Fertility & Sexual Health)',
    // Practical Specialties
    'Panchakarma (Detox Therapy)',
    'Sandhi Roga (Joint Diseases)',
    'Arthritis Treatment',
    'Orthopedic Ayurveda',
    'Fracture Treatment (Traditional Bone Setter)',
    'Paralysis Treatment',
    'Neurological Disorder Treatment',
    // Skin, Hair & Beauty
    'Twak Roga (Skin Diseases)',
    'Ayurveda Dermatology',
    'Hair Loss Treatment',
    'Ayurveda Cosmetics',
    // Lifestyle & Chronic Disease
    'Diabetes Ayurveda',
    'Obesity & Weight Loss',
    'Digestive Disorder Treatment',
    'Liver Disease Treatment',
    'Asthma & Respiratory Treatment',
    // Therapy Based
    'Abhyanga Therapy',
    'Shirodhara Therapy',
    'Nasya Therapy',
    'Vasti Therapy',
    'Herbal Medicine',
  ];

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _hospitalController.dispose();
    _nameFocusNode.dispose();
    _hospitalFocusNode.dispose();
    super.dispose();
  }

  static const List<String> _doctorNameOptions = [];
  static const List<String> _hospitalOptions = [];

  Future<void> _searchDoctors() async {
    FocusScope.of(context).unfocus();
    final nameOnly = _isNameOnlySearch;
    setState(() {
      _isLoading = true;
      _isNameOnlyMode = nameOnly;
    });
    try {
      _doctors = await _apiService.searchDoctors(
        specialty: _selectedSpecialty,
        location: _hospitalController.text.trim().isNotEmpty ? _hospitalController.text.trim() : null,
      );
    } catch (_) {
      _doctors = [];
    } finally {
      setState(() {
        _isLoading = false;
        _hasSearched = true;
      });
    }
  }

  Future<void> _openAvailability(Doctor doctor) async {
    final result = await _apiService.getDoctorAvailabilityResult(doctor.id);
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DoctorAvailabilityScreen(availability: result),
      ),
    );
  }

  void _clearFilters() {
    setState(() {
      _nameController.clear();
      _hospitalController.clear();
      _selectedSpecialty = null;
      _selectedDate = null;
      _doctors = [];
      _hasSearched = false;
    });
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: _primary,
            onPrimary: Colors.white,
            surface: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  void _showSpecializationSheet() {
    final searchCtrl = TextEditingController();
    List<String> filtered = List.from(_specialties)..sort();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          final grouped = <String, List<String>>{};
          for (final s in filtered) {
            grouped.putIfAbsent(s[0].toUpperCase(), () => []).add(s);
          }
          final keys = grouped.keys.toList()..sort();

          return Container(
            height: MediaQuery.of(context).size.height * 0.65,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Specialization',
                          style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                      if (_selectedSpecialty != null)
                        TextButton(
                          onPressed: () {
                            setState(() => _selectedSpecialty = null);
                            Navigator.pop(ctx);
                          },
                          child: const Text('Clear', style: TextStyle(color: Colors.red)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: TextField(
                    controller: searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Search...',
                      hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                      prefixIcon: const Icon(Icons.search, size: 20),
                      filled: true,
                      fillColor: Colors.grey[100],
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onChanged: (val) {
                      setS(() {
                        filtered = _specialties
                            .where((s) => s.toLowerCase().contains(val.toLowerCase()))
                            .toList()
                          ..sort();
                      });
                    },
                  ),
                ),
                const SizedBox(height: 4),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    children: keys.map((letter) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 14, bottom: 4, left: 4),
                            child: Text(letter,
                                style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: _primary,
                                    letterSpacing: 1.4)),
                          ),
                          ...grouped[letter]!.map((spec) {
                            final sel = _selectedSpecialty == spec;
                            return ListTile(
                              dense: true,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              tileColor: sel ? const Color(0xFFE8F5E9) : null,
                              title: Text(spec,
                                  style: TextStyle(
                                      fontSize: 14,
                                      color: sel ? _primary : const Color(0xFF1A1A2E),
                                      fontWeight: sel ? FontWeight.w600 : FontWeight.normal)),
                              trailing: sel
                                  ? const Icon(Icons.check_circle, color: _primary, size: 18)
                                  : null,
                              onTap: () {
                                setState(() => _selectedSpecialty = sel ? null : spec);
                                Navigator.pop(ctx);
                              },
                            );
                          }),
                        ],
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  bool get _hasFilters =>
      _nameController.text.isNotEmpty ||
      _hospitalController.text.isNotEmpty ||
      _selectedSpecialty != null ||
      _selectedDate != null;

  bool get _isNameOnlySearch =>
      _nameController.text.trim().isNotEmpty &&
      _hospitalController.text.trim().isEmpty &&
      _selectedSpecialty == null &&
      _selectedDate == null;

  String _fmtDate(DateTime d) {
    const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const w = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return '${w[d.weekday - 1]}, ${m[d.month - 1]} ${d.day}';
  }

  @override
  Widget build(BuildContext context) {
    final booking = Provider.of<BookingProvider>(context, listen: false);
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            _header(),
            Expanded(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(child: _searchPanel()),
                  SliverToBoxAdapter(child: _resultsHeader()),
                  if (_isLoading)
                    const SliverFillRemaining(
                      child: Center(
                        child: CircularProgressIndicator(color: _primary, strokeWidth: 2.5),
                      ),
                    )
                  else if (!_hasSearched)
                    SliverFillRemaining(child: _searchPrompt())
                  else if (_doctors.isEmpty)
                    SliverFillRemaining(child: _emptyState())
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, i) => TweenAnimationBuilder<double>(
                            key: ValueKey('${_doctors[i].id}_$i'),
                            tween: Tween(begin: 0.0, end: 1.0),
                            duration: Duration(milliseconds: 250 + i * 40),
                            curve: Curves.easeOutCubic,
                            builder: (_, val, child) => Opacity(
                              opacity: val,
                              child: Transform.translate(
                                  offset: Offset(0, 18 * (1 - val)), child: child),
                            ),
                            child: DoctorCard(
                              doctor: _doctors[i],
                              buttonLabel: _isNameOnlyMode
                                  ? 'View Availability'
                                  : 'Book Now',
                              onTap: () {
                                if (_isNameOnlyMode) {
                                  _openAvailability(_doctors[i]);
                                } else {
                                  booking.selectDoctor(_doctors[i]);
                                  Navigator.push(context,
                                      MaterialPageRoute(builder: (_) => const BookingScreen()));
                                }
                              },
                            ),
                          ),
                          childCount: _doctors.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha:0.06), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 19, color: Color(0xFF1A1A2E)),
            onPressed: () => Navigator.of(context).maybePop(),
            tooltip: 'Back',
          ),
          const Expanded(
            child: Center(
              child: Text('Lakwedha',
                  style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      color: _primary,
                      letterSpacing: -0.5)),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.account_circle_outlined, size: 26, color: Color(0xFF1A1A2E)),
            onPressed: () {},
            tooltip: 'Account',
          ),
        ],
      ),
    );
  }

  Widget _searchPanel() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha:0.07), blurRadius: 18, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          _autocompleteField(
            controller: _nameController,
            focusNode: _nameFocusNode,
            hint: 'Doctor name',
            icon: Icons.person_search_outlined,
            options: _doctorNameOptions,
          ),
          const SizedBox(height: 10),
          _autocompleteField(
            controller: _hospitalController,
            focusNode: _hospitalFocusNode,
            hint: 'Hospital or clinic',
            icon: Icons.local_hospital_outlined,
            options: _hospitalOptions,
          ),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _specField()),
            const SizedBox(width: 10),
            Expanded(child: _dateField()),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _searchDoctors,
                icon: const Icon(Icons.search_rounded, size: 18),
                label: const Text('Search', style: TextStyle(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
              ),
            ),
            if (_hasFilters) ...[
              const SizedBox(width: 10),
              OutlinedButton(
                onPressed: _clearFilters,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.grey[600],
                  side: BorderSide(color: Colors.grey[300]!),
                  padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Icon(Icons.close_rounded, size: 18),
              ),
            ],
          ]),
        ],
      ),
    );
  }

  InputDecoration _fieldDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
      prefixIcon: Icon(icon, size: 20, color: Colors.grey[500]),
      filled: true,
      fillColor: const Color(0xFFF8F8F8),
      contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[200]!)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[200]!)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primary, width: 1.5)),
    );
  }

  Widget _autocompleteField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hint,
    required IconData icon,
    required List<String> options,
  }) {
    return RawAutocomplete<String>(
      textEditingController: controller,
      focusNode: focusNode,
      optionsBuilder: (TextEditingValue val) {
        if (val.text.trim().isEmpty) return const Iterable<String>.empty();
        return options.where(
            (o) => o.toLowerCase().contains(val.text.trim().toLowerCase()));
      },
      onSelected: (String selection) {
        controller.text = selection;
      },
      fieldViewBuilder: (context, ctrl, fn, onFieldSubmitted) => TextField(
        controller: ctrl,
        focusNode: fn,
        style: const TextStyle(fontSize: 14, color: Color(0xFF1A1A2E)),
        decoration: _fieldDecoration(hint, icon),
        onSubmitted: (_) {
          onFieldSubmitted();
          _searchDoctors();
        },
      ),
      optionsViewBuilder: (context, onSelected, options) => Align(
        alignment: Alignment.topLeft,
        child: Material(
          elevation: 6,
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 200, maxWidth: 500),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 4),
              shrinkWrap: true,
              itemCount: options.length,
              itemBuilder: (context, index) {
                final option = options.elementAt(index);
                return InkWell(
                  onTap: () => onSelected(option),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    child: Row(
                      children: [
                        Icon(icon, size: 16, color: Colors.grey[400]),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(option,
                              style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF1A1A2E))),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _specField() {
    final active = _selectedSpecialty != null;
    return GestureDetector(
      onTap: _showSpecializationSheet,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFE8F5E9) : const Color(0xFFF8F8F8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: active ? _primary.withValues(alpha:0.5) : Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.medical_services_outlined,
                size: 16, color: active ? _primary : Colors.grey[500]),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                _selectedSpecialty ?? 'Specialization',
                style: TextStyle(
                    fontSize: 13,
                    color: active ? _primary : Colors.grey[400],
                    fontWeight: active ? FontWeight.w500 : FontWeight.normal),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dateField() {
    final active = _selectedDate != null;
    return GestureDetector(
      onTap: _pickDate,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
        decoration: BoxDecoration(
          color: active ? const Color(0xFFE8F5E9) : const Color(0xFFF8F8F8),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: active ? _primary.withValues(alpha:0.5) : Colors.grey[200]!),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today_outlined,
                size: 17, color: active ? _primary : Colors.grey[500]),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                active ? _fmtDate(_selectedDate!) : 'Any date',
                style: TextStyle(
                    fontSize: 13,
                    color: active ? _primary : Colors.grey[400],
                    fontWeight: active ? FontWeight.w500 : FontWeight.normal),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _resultsHeader() {
    if (!_hasSearched || _isLoading) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 6),
      child: Row(
        children: [
          Text(
            '${_doctors.length} doctor${_doctors.length != 1 ? 's' : ''} found',
            style: TextStyle(fontSize: 13, color: Colors.grey[600], fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _searchPrompt() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                color: Color(0xFFE8F5E9),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search_rounded, size: 44, color: _primary),
            ),
            const SizedBox(height: 20),
            const Text('Find your doctor',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E))),
            const SizedBox(height: 8),
            Text('Use the filters above to search\nby name, hospital or specialization.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[500], height: 1.5)),
          ],
        ),
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.search_off_rounded, size: 44, color: Colors.grey[400]),
            ),
            const SizedBox(height: 20),
            Text('No doctors found',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[700])),
            const SizedBox(height: 8),
            Text('Try clearing filters or searching\nwith a different term.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 14, color: Colors.grey[500], height: 1.5)),
            const SizedBox(height: 28),
            OutlinedButton.icon(
              onPressed: _clearFilters,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Clear filters'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _primary,
                side: const BorderSide(color: _primary),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
