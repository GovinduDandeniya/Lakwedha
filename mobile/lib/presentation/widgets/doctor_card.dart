import 'package:flutter/material.dart';
import '../../data/models/doctor_model.dart';

const Color _primary = Color(0xFF2E7D32);

class DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;
  final String buttonLabel;

  const DoctorCard({
    super.key,
    required this.doctor,
    required this.onTap,
    this.buttonLabel = 'Book Now',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.07),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Column(
            children: [
              // Gradient top strip
              Container(
                height: 4,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                      colors: [_primary, Color(0xFF66BB6A)]),
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(18)),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _avatar(),
                        const SizedBox(width: 12),
                        Expanded(child: _doctorInfo()),
                        const SizedBox(width: 8),
                        _feeBadge(),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(height: 1, color: const Color(0xFFF0F0F0)),
                    const SizedBox(height: 12),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(child: _hospitalInfo()),
                        _bookButton(),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _avatar() {
    return Stack(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFE8F5E9), Color(0xFFC8E6C9)],
            ),
            boxShadow: [
              BoxShadow(
                color: _primary.withValues(alpha: 0.15),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: ClipOval(
            child: doctor.profileImage != null
                ? Image.network(
                    doctor.profileImage!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _initials(),
                  )
                : _initials(),
          ),
        ),
      ],
    );
  }

  Widget _initials() {
    final letter =
        doctor.name.isNotEmpty ? doctor.name[0].toUpperCase() : 'D';
    return Center(
      child: Text(letter,
          style: const TextStyle(
              fontSize: 22, fontWeight: FontWeight.bold, color: _primary)),
    );
  }

  Widget _doctorInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                doctor.name,
                style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A2E)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (doctor.isVerified) ...[
              const SizedBox(width: 4),
              const Icon(Icons.verified_rounded, size: 15, color: _primary),
            ],
          ],
        ),
        const SizedBox(height: 3),
        Text(
          doctor.specialization,
          style: const TextStyle(
              fontSize: 12,
              color: _primary,
              fontWeight: FontWeight.w600),
        ),
        if (doctor.qualification.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            doctor.qualification,
            style: TextStyle(fontSize: 11, color: Colors.grey[500]),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        const SizedBox(height: 7),
        _infoRow(),
      ],
    );
  }

  Widget _infoRow() {
    if (doctor.experience <= 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFE3F2FD),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('${doctor.experience} yrs exp',
          style: const TextStyle(
              fontSize: 10,
              color: Color(0xFF1565C0),
              fontWeight: FontWeight.w600)),
    );
  }

  Widget _feeBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE8F5E9), Color(0xFFC8E6C9)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Text('LKR',
              style: TextStyle(
                  fontSize: 9,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 2),
          Text('${doctor.consultationFee.toInt()}',
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: _primary)),
        ],
      ),
    );
  }

  Widget _hospitalInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.local_hospital_outlined,
                size: 13, color: Colors.grey[500]),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                doctor.clinicName,
                style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A2E)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Row(
          children: [
            Icon(Icons.location_on_outlined,
                size: 12, color: Colors.grey[400]),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                doctor.clinicAddress,
                style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _bookButton() {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: _primary,
        foregroundColor: Colors.white,
        padding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(buttonLabel,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
    );
  }
}
