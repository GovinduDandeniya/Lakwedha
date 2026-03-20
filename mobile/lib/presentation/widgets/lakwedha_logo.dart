import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  Layout variants
// ─────────────────────────────────────────────────────────────────────────────
enum LogoLayout {
  /// Circular emblem only — no text
  emblemOnly,

  /// Emblem on the left, wordmark to the right
  horizontal,

  /// Emblem on top, wordmark below (centred)
  vertical,
}

// ─────────────────────────────────────────────────────────────────────────────
//  LakwedhaLogo widget
// ─────────────────────────────────────────────────────────────────────────────

/// Premium Lakwedha brand logo.
///
/// Emblem: dark-green circle · gold ring · two botanical leaves with gradient ·
/// golden bud on stem · dashed inner ornament ring.
///
/// ```dart
/// // Emblem only (splash screen)
/// LakwedhaLogo(size: 120)
///
/// // Horizontal with subtitle (sidebar / app-bar)
/// LakwedhaLogo(size: 44, layout: LogoLayout.horizontal, subtitle: 'Admin Portal')
///
/// // Vertical, centred (login page header)
/// LakwedhaLogo(size: 72, layout: LogoLayout.vertical, subtitle: 'Sign In')
/// ```
class LakwedhaLogo extends StatelessWidget {
  const LakwedhaLogo({
    super.key,
    this.size = 48,
    this.layout = LogoLayout.emblemOnly,
    this.textColor = Colors.white,
    this.subtitle,
    this.subtitleColor,
  });

  /// Diameter of the circular emblem in logical pixels.
  final double size;

  /// How to arrange the emblem and wordmark.
  final LogoLayout layout;

  /// Colour of the "Lakwedha" wordmark.
  final Color textColor;

  /// Optional subtitle shown below the wordmark (e.g. "Admin Portal").
  final String? subtitle;

  /// Colour of the subtitle. Defaults to 65 % opacity of [textColor].
  final Color? subtitleColor;

  @override
  Widget build(BuildContext context) {
    final emblem = SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _LakwedhaEmblemPainter()),
    );

    if (layout == LogoLayout.emblemOnly) return emblem;

    final wordmark = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: layout == LogoLayout.vertical
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      children: [
        Text(
          'Lakwedha',
          style: GoogleFonts.playfairDisplay(
            fontSize: size * 0.38,
            fontWeight: FontWeight.w700,
            color: textColor,
            letterSpacing: 0.5,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: size * 0.20,
              fontWeight: FontWeight.w400,
              color: subtitleColor ?? textColor.withValues(alpha:0.65),
              letterSpacing: 0.3,
            ),
          ),
        ],
      ],
    );

    if (layout == LogoLayout.vertical) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          emblem,
          SizedBox(height: size * 0.18),
          wordmark,
        ],
      );
    }

    // horizontal
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        emblem,
        SizedBox(width: size * 0.20),
        wordmark,
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CustomPainter — all coordinates are in a 56 × 56 space, scaled to [size]
// ─────────────────────────────────────────────────────────────────────────────
class _LakwedhaEmblemPainter extends CustomPainter {
  // ── Colour palette ─────────────────────────────────────────────────────────
  static const _bgInner  = Color(0xFF1a6636);
  static const _bgOuter  = Color(0xFF041f0e);
  static const _gold0    = Color(0xFFfef3c7);
  static const _gold1    = Color(0xFFd97706);
  static const _gold2    = Color(0xFFb45309);
  static const _gold3    = Color(0xFFfde68a);
  static const _leaf0    = Color(0xFFa7f3d0);
  static const _leaf1    = Color(0xFF16a34a);
  static const _leaf2    = Color(0xFF14532d);
  static const _bud0     = Color(0xFFfef9c3);
  static const _bud1     = Color(0xFFfbbf24);
  static const _bud2     = Color(0xFFd97706);
  static const _vein     = Color(0xFFbbf7d0);
  static const _ring     = Color(0xFFca8a04);

  @override
  void paint(Canvas canvas, Size size) {
    final sc = size.width / 56.0; // uniform scale

    canvas.save();
    canvas.scale(sc, sc);

    _bg(canvas);
    _goldRing(canvas);
    _innerRing(canvas);
    _stem(canvas);
    _leaf(canvas, left: true);
    _veinLine(canvas, left: true);
    _leaf(canvas, left: false);
    _veinLine(canvas, left: false);
    _bud(canvas);
    _base(canvas);

    canvas.restore();
  }

  // ── Background circle ─────────────────────────────────────────────────────
  void _bg(Canvas canvas) {
    canvas.drawCircle(
      const Offset(28, 28),
      27.5,
      Paint()
        ..shader = ui.Gradient.radial(
          const Offset(19.6, 16.8),
          39.2,
          [_bgInner, _bgOuter],
          [0.0, 1.0],
        ),
    );
  }

  // ── Outer gold ring ───────────────────────────────────────────────────────
  void _goldRing(Canvas canvas) {
    canvas.drawCircle(
      const Offset(28, 28),
      26.2,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.6
        ..shader = ui.Gradient.linear(
          Offset.zero,
          const Offset(56, 56),
          [_gold0, _gold1, _gold2, _gold3],
          [0.0, 0.4, 0.75, 1.0],
        ),
    );
  }

  // ── Inner dashed ornament ring ────────────────────────────────────────────
  void _innerRing(Canvas canvas) {
    const center = Offset(28, 28);
    const radius = 21.5;
    final p = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.45
      ..color = _ring.withValues(alpha: 0.4);

    const dashArc = math.pi / 18;   // each dash = 10°
    const gapArc  = math.pi / 36;   // each gap = 5°
    const total   = 2 * math.pi;
    final rect    = Rect.fromCircle(center: center, radius: radius);
    double angle  = 0;
    while (angle < total) {
      final sweep = math.min(dashArc, total - angle);
      canvas.drawArc(rect, angle, sweep, false, p);
      angle += dashArc + gapArc;
    }
  }

  // ── Gold stem ─────────────────────────────────────────────────────────────
  void _stem(Canvas canvas) {
    canvas.drawLine(
      const Offset(28, 43),
      const Offset(28, 17),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..strokeCap = StrokeCap.round
        ..shader = ui.Gradient.linear(
          const Offset(28, 43),
          const Offset(28, 17),
          [_gold1, _gold0],
          [0.0, 1.0],
        ),
    );
  }

  // ── Botanical leaf (left or right mirror) ────────────────────────────────
  ui.Gradient get _leafShader => ui.Gradient.linear(
        const Offset(28, 8),
        const Offset(28, 42),
        [_leaf0, _leaf1, _leaf2],
        [0.0, 0.55, 1.0],
      );

  void _leaf(Canvas canvas, {required bool left}) {
    final path = Path();
    if (left) {
      path.moveTo(27.8, 31);
      path.cubicTo(20, 27, 12, 20, 15, 12.5);
      path.cubicTo(17.5, 7, 27.8, 20, 27.8, 29);
    } else {
      path.moveTo(28.2, 31);
      path.cubicTo(36, 27, 44, 20, 41, 12.5);
      path.cubicTo(38.5, 7, 28.2, 20, 28.2, 29);
    }
    path.close();

    canvas.drawPath(
      path,
      Paint()
        ..shader = _leafShader
        ..style = PaintingStyle.fill,
    );
  }

  // ── Leaf centre vein ──────────────────────────────────────────────────────
  void _veinLine(Canvas canvas, {required bool left}) {
    final path = Path();
    if (left) {
      path.moveTo(27, 27);
      path.cubicTo(21, 23, 16.5, 17, 17, 13);
    } else {
      path.moveTo(29, 27);
      path.cubicTo(35, 23, 39.5, 17, 39, 13);
    }
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.55
        ..strokeCap = StrokeCap.round
        ..color = _vein.withValues(alpha:0.5),
    );
  }

  // ── Gold bud ──────────────────────────────────────────────────────────────
  void _bud(Canvas canvas) {
    final path = Path()
      ..moveTo(28, 18)
      ..cubicTo(25, 13.5, 25.5, 8.5, 28, 7)
      ..cubicTo(30.5, 8.5, 31, 13.5, 28, 18)
      ..close();

    canvas.drawPath(
      path,
      Paint()
        ..shader = ui.Gradient.linear(
          const Offset(28, 7),
          const Offset(28, 18),
          [_bud0, _bud1, _bud2],
          [0.0, 0.5, 1.0],
        ),
    );

    // Inner highlight on the bud
    canvas.save();
    canvas.translate(27.2, 10.5);
    canvas.rotate(-8 * math.pi / 180);
    canvas.drawOval(
      Rect.fromCenter(center: Offset.zero, width: 1.8, height: 4.4),
      Paint()..color = _bud0.withValues(alpha:0.55),
    );
    canvas.restore();
  }

  // ── Base ornament lines ───────────────────────────────────────────────────
  void _base(Canvas canvas) {
    final long = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.9
      ..strokeCap = StrokeCap.round
      ..color = _ring.withValues(alpha:0.7);
    final short = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.6
      ..strokeCap = StrokeCap.round
      ..color = _ring.withValues(alpha:0.45);

    canvas.drawLine(const Offset(22, 43.5), const Offset(34, 43.5), long);
    canvas.drawLine(const Offset(24.5, 45.5), const Offset(31.5, 45.5), short);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
