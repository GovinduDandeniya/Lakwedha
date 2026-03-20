"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import LakwedhaLogo from "@/components/LakwedhaLogo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const INPUT =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function getStrength(pw: string) {
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

export default function AdminRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName]           = useState("");
  const [email, setEmail]                 = useState("");
  const [mobile, setMobile]               = useState("");
  const [nic, setNic]                     = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [showCpw, setShowCpw]             = useState(false);
  const [error, setError]                 = useState("");
  const [fieldErrors, setFieldErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]             = useState(false);
  const [success, setSuccess]             = useState(false);

  const strength = getStrength(password);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!mobile.trim()) errs.mobile = "Mobile number is required.";
    else if (!/^\+94\d{9}$/.test(mobile)) errs.mobile = "Must be a valid Sri Lankan number (+94XXXXXXXXX).";
    if (!nic.trim()) errs.nic = "NIC number is required.";
    else if (!/^\d{9}[VvXx]$/.test(nic) && !/^\d{12}$/.test(nic))
      errs.nic = "Enter a valid NIC (9 digits + V/X, or 12 digits).";
    if (!password) errs.password = "Password is required.";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mobile, nic, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Registration failed. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-11 w-11 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          <p className="text-sm text-gray-500 mb-8">
            Your admin account has been created. You can now sign in.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 text-sm transition"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  /* ── Registration form ─────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-green-900 to-green-700 px-8 py-6">
          <LakwedhaLogo
            size={44}
            textColor="white"
            subtitle="Admin Registration"
            subtitleColor="rgba(187,247,208,0.85)"
          />
        </div>

        <div className="px-8 py-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">Create Admin Account</h2>
          <p className="text-sm text-gray-500 mb-6">Fill in your details to register as an administrator.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <Field label="Full Name" error={fieldErrors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Avishka Madushan"
                className={INPUT}
              />
            </Field>

            {/* Email */}
            <Field label="Email Address" error={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lakwedha.lk"
                className={INPUT}
              />
            </Field>

            {/* Mobile */}
            <Field
              label="Mobile Number"
              error={fieldErrors.mobile}
              hint="Sri Lankan format: +94771234567"
            >
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+94771234567"
                className={INPUT}
              />
            </Field>

            {/* NIC */}
            <Field
              label="NIC Number"
              error={fieldErrors.nic}
              hint="Old format: 9 digits + V/X   |   New format: 12 digits"
            >
              <input
                type="text"
                value={nic}
                onChange={(e) => setNic(e.target.value)}
                placeholder="200612345678"
                className={INPUT}
              />
            </Field>

            {/* Password */}
            <Field label="Password" error={fieldErrors.password}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={`${INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
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
                  <p className="text-xs text-gray-500">
                    Strength: <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
              <div className="relative">
                <input
                  type={showCpw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`${INPUT} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowCpw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Registering…" : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-green-700 hover:text-green-900 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
