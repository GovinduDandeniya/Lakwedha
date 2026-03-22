import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

enum AuthButtonStyle { primary, secondary }

class AuthButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;
  final AuthButtonStyle style;
  final double? width;

  const AuthButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.style = AuthButtonStyle.primary,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final isPrimary = style == AuthButtonStyle.primary;

    return SizedBox(
      width: width ?? double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimary ? AppColors.accent : Colors.transparent,
          side: isPrimary
              ? null
              : const BorderSide(color: AppColors.accent, width: 2),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          disabledBackgroundColor:
              isPrimary ? AppColors.accent.withValues(alpha: 0.5) : Colors.transparent,
        ),
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isPrimary ? Colors.white : AppColors.accent,
                ),
              ),
      ),
    );
  }
}