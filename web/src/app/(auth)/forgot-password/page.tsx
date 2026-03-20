"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, ArrowLeft, CheckCircle2,
  Mail, Phone, Eye, EyeOff, RefreshCw, ShieldCheck,
} from "lucide-react";
import LakwedhaLogo from "@/components/LakwedhaLogo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
type Method = "email" | "phone";
type Step   = "send" | "verify" | "reset" | "success";

/* ─────────────────────────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)                                                        score++;
  if (/[A-Z]/.test(pw))                                                      score++;
  if (/[0-9]/.test(pw))                                                      score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw))                       score++;
  const map: [string, string][] = [
    ["Too short",  "bg-red-400"],
    ["Weak",       "bg-orange-400"],
    ["Fair",       "bg-yellow-400"],
    ["Good",       "bg-blue-400"],
    ["Strong",     "bg-green-500"],
  ];
  const [label, color] = map[score];
  return { score, label, color };
}

/* ─────────────────────────────────────────────────────────────
   OTP INPUT — 5 individual boxes with auto-advance + paste
───────────────────────────────────────────────────────────── */
function OtpInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputs  = useRef<(HTMLInputElement | null)[]>([]);
  const digits  = value.padEnd(5, " ").split("").slice(0, 5);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i] !== " ") {
        next[i] = " ";
      } else if (i > 0) {
        next[i - 1] = " ";
        inputs.current[i - 1]?.focus();
      }
      onChange(next.join("").trimEnd());
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 4) {
      inputs.current[i + 1]?.focus();
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").trimEnd());
    if (i < 4) inputs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 4)]?.focus();
  }

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === " " ? "" : d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
            focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200
            transition-all disabled:bg-gray-100 disabled:cursor-not-allowed
            ${d !== " " && d ? "border-green-500 bg-green-50 text-green-800" : "border-gray-300 text-gray-800"}`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   COUNTDOWN HOOK  (resets when `seconds` changes)
───────────────────────────────────────────────────────────── */
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    if (seconds <= 0) return;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const mm  = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss  = String(remaining % 60).padStart(2, "0");
  return { remaining, display: `${mm}:${ss}` };
}

/* ─────────────────────────────────────────────────────────────
   ERROR BOX
───────────────────────────────────────────────────────────── */
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
      <span className="mt-0.5 shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────────────────────────── */
const STEPS: Step[] = ["send", "verify", "reset", "success"];
const STEP_LABELS   = ["Send OTP", "Verify", "New Password", "Done"];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < idx  ? "bg-green-600 text-white" : ""}
              ${i === idx ? "bg-green-700 text-white ring-2 ring-green-300" : ""}
              ${i > idx  ? "bg-gray-200 text-gray-400" : ""}`}
          >
            {i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 rounded-full transition-all ${i < idx ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const LAST_METHOD_KEY = "lw_fp_last_method";

export default function ForgotPasswordPage() {
  /* ── State ───────────────────────────────────────── */
  const [step,            setStep]           = useState<Step>("send");
  const [method,          setMethod]         = useState<Method>("email");
  const [value,           setValue]          = useState("");
  const [maskedValue,     setMaskedValue]    = useState("");
  const [otp,             setOtp]            = useState("");
  const [resetToken,      setResetToken]     = useState("");
  const [newPassword,     setNewPassword]    = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]        = useState(false);
  const [showConfirm,     setShowConfirm]    = useState(false);
  const [error,           setError]          = useState("");
  const [loading,         setLoading]        = useState(false);

  // OTP expiry: 1800 s; resend cooldown starts at 60 s
  const [otpInitialSecs,  setOtpInitialSecs]  = useState(0);
  const [resendCooldown,  setResendCooldown]  = useState(0);
  const [clipboardHint,   setClipboardHint]  = useState(false);

  const otpTimer    = useCountdown(otpInitialSecs);

  /* ── Restore last-used method from localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_METHOD_KEY) as Method | null;
      if (saved === "email" || saved === "phone") setMethod(saved);
    } catch { /* ignore */ }
  }, []);

  /* ── Resend cooldown ticker ──────────────────────── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  /* ── Clipboard OTP auto-fill hint ───────────────── */
  useEffect(() => {
    if (step !== "verify") return;
    let active = true;
    // Poll clipboard for a 5-digit code if permission allows
    async function checkClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        if (active && /^\d{5}$/.test(text.trim())) {
          setClipboardHint(true);
        }
      } catch { /* permission denied — silently skip */ }
    }
    checkClipboard();
    return () => { active = false; };
  }, [step]);

  /* ── STEP 1: Send OTP ────────────────────────────── */
  const handleSendOtp = useCallback(async () => {
    setError("");
    if (!value.trim()) {
      setError(`Please enter your ${method === "email" ? "email address" : "mobile number"}.`);
      return;
    }
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, value }),
      });
      const data = await res.json();

      if (res.status === 429 && data.waitSeconds) {
        // Server-enforced cooldown
        setResendCooldown(data.waitSeconds);
        setError(data.message ?? "Please wait before requesting another OTP.");
        return;
      }
      if (!res.ok) {
        setError(data.message ?? "Failed to send OTP.");
        return;
      }

      // Persist method choice
      try { localStorage.setItem(LAST_METHOD_KEY, method); } catch { /* ignore */ }

      setMaskedValue(data.maskedValue);
      setOtpInitialSecs(1800); // reset 30-min countdown
      setResendCooldown(60);
      setOtp("");
      setClipboardHint(false);
      setStep("verify");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [method, value]);

  /* ── STEP 2: Verify OTP ──────────────────────────── */
  const handleVerifyOtp = useCallback(async () => {
    setError("");
    if (otp.replace(/\s/g, "").length < 5) {
      setError("Please enter the complete 5-digit OTP.");
      return;
    }
    if (otpTimer.remaining === 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, value, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid OTP.");
        return;
      }
      setResetToken(data.resetToken);
      setStep("reset");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [method, value, otp, otpTimer.remaining]);

  /* ── STEP 3: Reset Password ──────────────────────── */
  const handleResetPassword = useCallback(async () => {
    setError("");
    const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!pwRegex.test(newPassword)) {
      setError("Password must be 8+ characters with an uppercase letter, number, and special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Reset failed.");
        return;
      }
      // Clear remembered method on success
      try { localStorage.removeItem(LAST_METHOD_KEY); } catch { /* ignore */ }
      setStep("success");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [resetToken, newPassword, confirmPassword]);

  const strength = getStrength(newPassword);

  /* ─────────────────────────────────────────────────────────────
     UI
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ──────────────────────────────── */}
        <div className="bg-linear-to-r from-green-900 to-green-700 px-8 py-6">
          <LakwedhaLogo
            size={44}
            textColor="white"
            subtitle="Password Recovery"
            subtitleColor="rgba(187,247,208,0.85)"
          />
        </div>

        <div className="px-8 py-8">
          <StepIndicator current={step} />

          {/* ════════════════════════════════════════
              STEP 1 — SEND OTP
          ════════════════════════════════════════ */}
          {step === "send" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Forgot Password?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose how you&apos;d like to receive your one-time password.
              </p>

              {error && <ErrorBox message={error} />}

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["email", "phone"] as Method[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setValue(""); setError(""); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition
                      ${method === m
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                  >
                    {m === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    {m === "email" ? "Email" : "Mobile Number"}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {method === "email" ? "Email address" : "Mobile number"}
                </label>
                <input
                  type={method === "email" ? "email" : "tel"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  placeholder={method === "email" ? "you@example.com" : "+94 7X XXX XXXX"}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || !value.trim()}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60
                  text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mb-4"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP…</>
                  : "Send OTP"}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 2 — VERIFY OTP
          ════════════════════════════════════════ */}
          {step === "verify" && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => { setStep("send"); setError(""); }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  title="Change recovery method"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Verify OTP</h2>
                  <p className="text-sm text-gray-500">
                    Code sent to{" "}
                    <span className="font-semibold text-green-700">{maskedValue}</span>
                  </p>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              {/* Clipboard auto-fill hint */}
              {clipboardHint && otp.replace(/\s/g, "").length < 5 && (
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      const code = text.replace(/\D/g, "").slice(0, 5);
                      if (code.length === 5) { setOtp(code); setClipboardHint(false); }
                    } catch { setClipboardHint(false); }
                  }}
                  className="w-full mb-4 rounded-lg border border-green-300 bg-green-50 text-green-700
                    text-sm py-2 px-3 flex items-center justify-center gap-2 hover:bg-green-100 transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Tap to paste OTP from clipboard
                </button>
              )}

              {/* Expiry timer */}
              <div className={`mb-5 text-center text-sm font-medium rounded-lg py-2 px-3 transition
                ${otpTimer.remaining === 0
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : otpTimer.remaining < 120
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-green-50 text-green-700 border border-green-100"}`}
              >
                {otpTimer.remaining === 0
                  ? "OTP expired — please request a new code"
                  : `Expires in ${otpTimer.display}`}
              </div>

              {/* OTP boxes */}
              <div className="mb-6">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={otpTimer.remaining === 0 || loading}
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\s/g, "").length < 5 || otpTimer.remaining === 0}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50
                  text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mb-4"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                  : "Verify OTP"}
              </button>

              {/* Resend */}
              <div className="text-center space-y-2">
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-sm text-green-700
                    hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? `Resend OTP in ${resendCooldown}s`
                    : "Resend OTP"}
                </button>

                <div>
                  <button
                    onClick={() => { setStep("send"); setError(""); }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Change recovery method
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 3 — RESET PASSWORD
          ════════════════════════════════════════ */}
          {step === "reset" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Create New Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Choose a strong password to protect your account.
              </p>

              {error && <ErrorBox message={error} />}

              {/* New password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, A-Z, 0-9, symbol"
                    autoFocus
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all
                            ${i <= strength.score ? strength.color : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength:{" "}
                      <span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
                {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Requirements checklist */}
              <ul className="mb-5 space-y-1.5">
                {([
                  ["At least 8 characters",            newPassword.length >= 8],
                  ["One uppercase letter (A–Z)",        /[A-Z]/.test(newPassword)],
                  ["One number (0–9)",                  /[0-9]/.test(newPassword)],
                  ["One special character (!@#…)",      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)],
                ] as [string, boolean][]).map(([label, ok]) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 text-xs transition-colors
                      ${ok ? "text-green-600" : "text-gray-400"}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleResetPassword}
                disabled={loading || strength.score < 4 || newPassword !== confirmPassword}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50
                  text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</>
                  : "Reset Password"}
              </button>
            </>
          )}

          {/* ════════════════════════════════════════
              STEP 4 — SUCCESS
          ════════════════════════════════════════ */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center
                  ring-4 ring-green-200">
                  <CheckCircle2 className="h-11 w-11 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-2">
                Your password has been successfully reset.
              </p>
              <p className="text-xs text-gray-400 mb-8">
                All existing sessions have been invalidated for your security.
                Please sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block w-full rounded-lg bg-green-700 hover:bg-green-800
                  text-white font-semibold py-2.5 text-sm text-center transition"
              >
                Login Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
