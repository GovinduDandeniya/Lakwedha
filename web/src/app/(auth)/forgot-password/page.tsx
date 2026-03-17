"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Leaf, Loader2, ArrowLeft, CheckCircle2, Mail, Phone, Eye, EyeOff, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/* ── types ─────────────────────────────────────────── */
type Method = "email" | "phone";
type Step = "send" | "verify" | "reset" | "success";

/* ── password strength helper ───────────────────────── */
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
  const map: [string, string][] = [
    ["Too short", "bg-red-400"],
    ["Weak", "bg-orange-400"],
    ["Fair", "bg-yellow-400"],
    ["Good", "bg-blue-400"],
    ["Strong", "bg-green-500"],
  ];
  const [label, color] = map[score];
  return { score, label, color };
}

/* ── OTP Box component ──────────────────────────────── */
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(5, " ").split("").slice(0, 5);

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      const next = [...digits];
      next[i] = " ";
      onChange(next.join("").trimEnd());
      if (i > 0) inputs.current[i - 1]?.focus();
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
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition text-gray-800"
          style={{ borderColor: d !== " " && d ? "#16a34a" : undefined }}
        />
      ))}
    </div>
  );
}

/* ── Countdown Timer ────────────────────────────────── */
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { remaining, display: `${mm}:${ss}` };
}

/* ── Main Page ──────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("send");
  const [method, setMethod] = useState<Method>("email");
  const [value, setValue] = useState("");
  const [maskedValue, setMaskedValue] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP expiry: 30 min = 1800s; resend cooldown: 60s
  const [otpTimestamp, setOtpTimestamp] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpExpiry = useCountdown(otpTimestamp ? Math.max(0, 1800 - Math.floor((Date.now() - otpTimestamp) / 1000)) : 0);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  /* ── Send OTP ─────────────────────────── */
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
      const res = await fetch(`${API}/api/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, value }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to send OTP."); return; }
      setMaskedValue(data.maskedValue);
      setOtpTimestamp(Date.now());
      setResendCooldown(60);
      setOtp("");
      setStep("verify");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [method, value]);

  /* ── Verify OTP ───────────────────────── */
  const handleVerifyOtp = useCallback(async () => {
    setError("");
    if (otp.replace(/\s/g, "").length < 5) {
      setError("Please enter the complete 5-digit OTP.");
      return;
    }
    if (otpExpiry.remaining === 0) {
      setError("OTP has expired. Please request a new one.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, value, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Invalid OTP."); return; }
      setResetToken(data.resetToken);
      setStep("reset");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [method, value, otp, otpExpiry.remaining]);

  /* ── Reset Password ───────────────────── */
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
      const res = await fetch(`${API}/api/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Reset failed."); return; }
      setStep("success");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [resetToken, newPassword, confirmPassword]);

  const strength = getStrength(newPassword);

  /* ── UI ───────────────────────────────── */
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-700 px-8 py-6 flex items-center gap-3">
          <Leaf className="h-6 w-6 text-green-300" />
          <div>
            <h1 className="text-white font-bold text-lg">Lakwedha</h1>
            <p className="text-green-200 text-xs">Password Recovery</p>
          </div>
        </div>

        <div className="px-8 py-8">
          {/* ── STEP 1: Send OTP ─────────────────── */}
          {step === "send" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Forgot Password</h2>
              <p className="text-sm text-gray-500 mb-6">Choose how you'd like to receive your OTP.</p>

              {error && <ErrorBox message={error} />}

              {/* Method selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(["email", "phone"] as Method[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setValue(""); setError(""); }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition ${
                      method === m
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {m === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                    {m === "email" ? "Email" : "Mobile Number"}
                  </button>
                ))}
              </div>

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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mb-4"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>

              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 font-medium">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}

          {/* ── STEP 2: Verify OTP ───────────────── */}
          {step === "verify" && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => { setStep("send"); setError(""); }} className="text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Verify OTP</h2>
                  <p className="text-sm text-gray-500">
                    OTP sent to <span className="font-semibold text-green-700">{maskedValue}</span>
                  </p>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              {/* Timer */}
              <div className={`mb-5 text-center text-sm font-medium rounded-lg py-2 ${
                otpExpiry.remaining === 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
              }`}>
                {otpExpiry.remaining === 0 ? "OTP expired — request a new one" : `Expires in ${otpExpiry.display}`}
              </div>

              <div className="mb-6">
                <OtpInput value={otp} onChange={setOtp} />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.replace(/\s/g, "").length < 5 || otpExpiry.remaining === 0}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mb-4"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Verifying…" : "Verify OTP"}
              </button>

              {/* Resend */}
              <div className="text-center">
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={() => { setStep("send"); setError(""); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Change recovery method
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Reset Password ───────────── */}
          {step === "reset" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">New Password</h2>
              <p className="text-sm text-gray-500 mb-6">Create a strong password for your account.</p>

              {error && <ErrorBox message={error} />}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, A-Z, 0-9, symbol"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            i <= strength.score ? strength.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                    placeholder="Re-enter your password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
              </div>

              {/* Rules */}
              <ul className="mb-5 mt-3 space-y-1">
                {[
                  ["At least 8 characters", newPassword.length >= 8],
                  ["One uppercase letter (A-Z)", /[A-Z]/.test(newPassword)],
                  ["One number (0-9)", /[0-9]/.test(newPassword)],
                  ["One special character (!@#…)", /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)],
                ].map(([label, ok]) => (
                  <li key={label as string} className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    {label as string}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleResetPassword}
                disabled={loading || strength.score < 4 || newPassword !== confirmPassword}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </>
          )}

          {/* ── STEP 4: Success ──────────────────── */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-8">
                Your password has been successfully reset. Please log in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block w-full rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 text-sm text-center transition"
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

/* ── Shared error box ───────────────────────────────── */
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
