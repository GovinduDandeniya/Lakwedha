import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../shell/main_shell.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // ── Animation controllers ─────────────────────────────────────────────────
  late AnimationController _logoCtrl;
  late AnimationController _textCtrl;
  late AnimationController _taglineCtrl;
  late AnimationController _progressCtrl;
  late AnimationController _leafCtrl;

  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _textFade;
  late Animation<Offset> _textSlide;
  late Animation<double> _taglineFade;
  late Animation<Offset> _taglineSlide;
  late Animation<double> _progressValue;
  late Animation<double> _leafRotate;

  // ── Design tokens ─────────────────────────────────────────────────────────
  static const Color _accent = Color(0xFF81C784);

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _navigate();
  }

  void _setupAnimations() {
    // Logo pop-in
    _logoCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _logoScale = CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut)
        .drive(Tween<double>(begin: 0.3, end: 1.0));
    _logoFade  = CurvedAnimation(parent: _logoCtrl, curve: Curves.easeIn)
        .drive(Tween<double>(begin: 0.0, end: 1.0));

    // App name slide up
    _textCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _textFade  = CurvedAnimation(parent: _textCtrl, curve: Curves.easeIn)
        .drive(Tween<double>(begin: 0.0, end: 1.0));
    _textSlide = CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut)
        .drive(Tween<Offset>(begin: const Offset(0, 0.4), end: Offset.zero));

    // Tagline slide up (delayed)
    _taglineCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _taglineFade  = CurvedAnimation(parent: _taglineCtrl, curve: Curves.easeIn)
        .drive(Tween<double>(begin: 0.0, end: 1.0));
    _taglineSlide = CurvedAnimation(parent: _taglineCtrl, curve: Curves.easeOut)
        .drive(Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero));

    // Progress bar
    _progressCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));
    _progressValue = CurvedAnimation(parent: _progressCtrl, curve: Curves.easeInOut)
        .drive(Tween<double>(begin: 0.0, end: 1.0));

    // Subtle leaf rotation
    _leafCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 12))
      ..repeat();
    _leafRotate = Tween<double>(begin: 0, end: 2 * pi).animate(_leafCtrl);

    // Stagger the animations
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _logoCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) _textCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 1050), () {
      if (mounted) _taglineCtrl.forward();
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _progressCtrl.forward();
    });
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2000));
    if (!mounted) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.checkAuthStatus();

    if (!mounted) return;

    if (auth.isSuspended) {
      Navigator.of(context).pushReplacementNamed('/suspended');
    } else if (auth.isAuthenticated) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const MainShell(),
          transitionsBuilder: (_, animation, __, child) =>
              FadeTransition(opacity: animation, child: child),
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    } else {
      Navigator.of(context).pushReplacementNamed('/sign-in');
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _taglineCtrl.dispose();
    _progressCtrl.dispose();
    _leafCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Background gradient ────────────────────────────────────────────
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF1B5E20),
                  Color(0xFF2E7D32),
                  Color(0xFF33691E),
                ],
                stops: [0.0, 0.55, 1.0],
              ),
            ),
          ),

          // ── Decorative herbal leaf patterns ───────────────────────────────
          AnimatedBuilder(
            animation: _leafRotate,
            builder: (_, __) => CustomPaint(
              painter: _LeafPatternPainter(_leafRotate.value),
              size: size,
            ),
          ),

          // ── Frosted top circle glow ────────────────────────────────────────
          Positioned(
            top: -size.width * 0.35,
            left: -size.width * 0.20,
            child: Container(
              width: size.width * 0.9,
              height: size.width * 0.9,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -size.width * 0.25,
            right: -size.width * 0.15,
            child: Container(
              width: size.width * 0.75,
              height: size.width * 0.75,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.04),
              ),
            ),
          ),

          // ── Main content ───────────────────────────────────────────────────
          SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 3),

                // Logo container
                ScaleTransition(
                  scale: _logoScale,
                  child: FadeTransition(
                    opacity: _logoFade,
                    child: Image.asset(
                      'assets/images/splash_logo.png',
                      width: 200,
                      height: 200,
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                // App name
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textFade,
                    child: Column(
                      children: [
                        Text(
                          'Lakwedha',
                          style: GoogleFonts.poppins(
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 1.5,
                            shadows: [
                              Shadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        // Decorative divider
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(width: 24, height: 1.5,
                              color: Colors.white.withValues(alpha: 0.40)),
                            const SizedBox(width: 8),
                            Container(width: 6, height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: _accent.withValues(alpha: 0.80),
                              )),
                            const SizedBox(width: 8),
                            Container(width: 24, height: 1.5,
                              color: Colors.white.withValues(alpha: 0.40)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Tagline
                SlideTransition(
                  position: _taglineSlide,
                  child: FadeTransition(
                    opacity: _taglineFade,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 40),
                      child: Text(
                        'Connecting You with Trusted\nAyurveda Care',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.poppins(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w400,
                          color: Colors.white.withValues(alpha: 0.78),
                          height: 1.6,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ),

                const Spacer(flex: 3),

                // ── Bottom section ─────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: Column(
                    children: [
                      // Companion text
                      FadeTransition(
                        opacity: _taglineFade,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.spa_rounded,
                              size: 14, color: _accent.withValues(alpha: 0.80)),
                            const SizedBox(width: 6),
                            Text(
                              'Your Ayurvedic Health Companion',
                              style: GoogleFonts.poppins(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                                color: Colors.white.withValues(alpha: 0.60),
                                letterSpacing: 0.4,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Progress bar
                      AnimatedBuilder(
                        animation: _progressValue,
                        builder: (_, __) => Column(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: _progressValue.value,
                                minHeight: 3,
                                backgroundColor: Colors.white.withValues(alpha: 0.15),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _accent.withValues(alpha: 0.90)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 36),

                // Footer brand stamp
                FadeTransition(
                  opacity: _taglineFade,
                  child: Text(
                    'Powered by Lakwedha Health',
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      color: Colors.white.withValues(alpha: 0.35),
                      letterSpacing: 0.8,
                    ),
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


// ── Subtle rotating leaf pattern painter ─────────────────────────────────────
class _LeafPatternPainter extends CustomPainter {
  final double rotation;
  _LeafPatternPainter(this.rotation);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..style = PaintingStyle.fill;

    // Draw several decorative leaf shapes at fixed positions
    final positions = [
      Offset(size.width * 0.08, size.height * 0.12),
      Offset(size.width * 0.88, size.height * 0.08),
      Offset(size.width * 0.05, size.height * 0.72),
      Offset(size.width * 0.92, size.height * 0.68),
      Offset(size.width * 0.50, size.height * 0.05),
    ];
    final sizes  = [55.0, 44.0, 48.0, 60.0, 36.0];
    final angles = [0.3, -0.5, 1.1, -0.8, 0.0];

    for (int i = 0; i < positions.length; i++) {
      canvas.save();
      canvas.translate(positions[i].dx, positions[i].dy);
      canvas.rotate(angles[i] + rotation * (i.isEven ? 0.08 : -0.06));
      _drawLeaf(canvas, paint, sizes[i]);
      canvas.restore();
    }
  }

  void _drawLeaf(Canvas canvas, Paint paint, double r) {
    final path = Path();
    path.moveTo(0, -r);
    path.cubicTo(r * 0.9, -r * 0.3, r * 0.9, r * 0.3, 0, r);
    path.cubicTo(-r * 0.9, r * 0.3, -r * 0.9, -r * 0.3, 0, -r);
    canvas.drawPath(path, paint);

    // Vein
    final vein = Paint()
      ..color = Colors.white.withValues(alpha: 0.06)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(0, -r * 0.85), Offset(0, r * 0.85), vein);
  }

  @override
  bool shouldRepaint(_LeafPatternPainter old) => old.rotation != rotation;
}
