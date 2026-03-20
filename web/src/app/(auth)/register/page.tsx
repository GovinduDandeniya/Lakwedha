"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, ArrowLeft, CheckCircle2,
  Eye, EyeOff, RefreshCw, ChevronDown,
} from "lucide-react";
import LakwedhaLogo from "@/components/LakwedhaLogo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/* ── Countries (ISO code, name, dial) ───────────────────── */
const COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial: "+93" },
  { name: "Albania", code: "AL", dial: "+355" },
  { name: "Algeria", code: "DZ", dial: "+213" },
  { name: "Angola", code: "AO", dial: "+244" },
  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Armenia", code: "AM", dial: "+374" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Azerbaijan", code: "AZ", dial: "+994" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Belarus", code: "BY", dial: "+375" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Bolivia", code: "BO", dial: "+591" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387" },
  { name: "Botswana", code: "BW", dial: "+267" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "Brunei", code: "BN", dial: "+673" },
  { name: "Bulgaria", code: "BG", dial: "+359" },
  { name: "Cambodia", code: "KH", dial: "+855" },
  { name: "Cameroon", code: "CM", dial: "+237" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Cuba", code: "CU", dial: "+53" },
  { name: "Cyprus", code: "CY", dial: "+357" },
  { name: "Czech Republic", code: "CZ", dial: "+420" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Ecuador", code: "EC", dial: "+593" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "Ethiopia", code: "ET", dial: "+251" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "Georgia", code: "GE", dial: "+995" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Ghana", code: "GH", dial: "+233" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Guatemala", code: "GT", dial: "+502" },
  { name: "Hong Kong", code: "HK", dial: "+852" },
  { name: "Hungary", code: "HU", dial: "+36" },
  { name: "Iceland", code: "IS", dial: "+354" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Iran", code: "IR", dial: "+98" },
  { name: "Iraq", code: "IQ", dial: "+964" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kazakhstan", code: "KZ", dial: "+7" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996" },
  { name: "Laos", code: "LA", dial: "+856" },
  { name: "Latvia", code: "LV", dial: "+371" },
  { name: "Lebanon", code: "LB", dial: "+961" },
  { name: "Libya", code: "LY", dial: "+218" },
  { name: "Lithuania", code: "LT", dial: "+370" },
  { name: "Luxembourg", code: "LU", dial: "+352" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Maldives", code: "MV", dial: "+960" },
  { name: "Malta", code: "MT", dial: "+356" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Moldova", code: "MD", dial: "+373" },
  { name: "Mongolia", code: "MN", dial: "+976" },
  { name: "Morocco", code: "MA", dial: "+212" },
  { name: "Mozambique", code: "MZ", dial: "+258" },
  { name: "Myanmar", code: "MM", dial: "+95" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Oman", code: "OM", dial: "+968" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Palestine", code: "PS", dial: "+970" },
  { name: "Panama", code: "PA", dial: "+507" },
  { name: "Peru", code: "PE", dial: "+51" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Romania", code: "RO", dial: "+40" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Senegal", code: "SN", dial: "+221" },
  { name: "Serbia", code: "RS", dial: "+381" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "Slovakia", code: "SK", dial: "+421" },
  { name: "Slovenia", code: "SI", dial: "+386" },
  { name: "Somalia", code: "SO", dial: "+252" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Sudan", code: "SD", dial: "+249" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Syria", code: "SY", dial: "+963" },
  { name: "Taiwan", code: "TW", dial: "+886" },
  { name: "Tajikistan", code: "TJ", dial: "+992" },
  { name: "Tanzania", code: "TZ", dial: "+255" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Tunisia", code: "TN", dial: "+216" },
  { name: "Turkey", code: "TR", dial: "+90" },
  { name: "Turkmenistan", code: "TM", dial: "+993" },
  { name: "Uganda", code: "UG", dial: "+256" },
  { name: "Ukraine", code: "UA", dial: "+380" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "Uruguay", code: "UY", dial: "+598" },
  { name: "Uzbekistan", code: "UZ", dial: "+998" },
  { name: "Venezuela", code: "VE", dial: "+58" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Yemen", code: "YE", dial: "+967" },
  { name: "Zimbabwe", code: "ZW", dial: "+263" },
];

/** Convert ISO-2 country code → flag emoji  e.g. "LK" → 🇱🇰 */
function flag(code: string) {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

/* ── Types ──────────────────────────────────────────────── */
type Step = "details" | "otp" | "profile" | "success";

/* ── Password strength ──────────────────────────────────── */
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

/* ── 5-digit OTP input ──────────────────────────────────── */
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

/* ── Countdown hook ─────────────────────────────────────── */
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

/* ── Shared error box ───────────────────────────────────── */
function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

/* ── Step progress indicator ────────────────────────────── */
function StepIndicator({ current }: { current: number }) {
  const labels = ["Details", "Verify", "Profile", "Done"];
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              done ? "bg-green-600 text-white" : active ? "bg-green-700 text-white ring-2 ring-green-300" : "bg-gray-200 text-gray-400"
            }`}>
              {done ? <CheckCircle2 className="h-4 w-4" /> : n}
            </div>
            {i < labels.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${n < current ? "bg-green-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────── */
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const INPUT =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";
const SELECT = `${INPUT} appearance-none`;

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const stepNum = { details: 1, otp: 2, profile: 3, success: 4 }[step];

  /* ── Step 1 state ───────────────────────── */
  const [nationality, setNationality] = useState("Sri Lankan");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryDial, setCountryDial] = useState("+94");
  const [phone, setPhone] = useState("");

  /* ── Step 2 state ───────────────────────── */
  const [otp, setOtp] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpTimestamp, setOtpTimestamp] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── Step 3 state ───────────────────────── */
  const [verifyToken, setVerifyToken] = useState("");
  const [title, setTitle] = useState("Mr");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [nicType, setNicType] = useState("NIC");
  const [nicNumber, setNicNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  /* ── Shared state ───────────────────────── */
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const otpExpiry = useCountdown(
    otpTimestamp ? Math.max(0, 1800 - Math.floor((Date.now() - otpTimestamp) / 1000)) : 0
  );

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  /* ── API: Send OTP ──────────────────────── */
  const handleSendOtp = useCallback(async () => {
    setError("");
    const errs: Record<string, string> = {};
    if (!nationality.trim()) errs.nationality = "Nationality is required.";
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!phone.trim()) errs.phone = "Mobile number is required.";
    else if (!/^\d{5,15}$/.test(phone)) errs.phone = "Enter a valid mobile number (digits only, 5–15 digits).";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country_code: countryDial }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to send OTP."); return; }
      setMaskedPhone(data.maskedPhone);
      setOtpTimestamp(Date.now());
      setResendCooldown(60);
      setOtp("");
      setStep("otp");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [nationality, firstName, lastName, phone, countryDial]);

  /* ── API: Verify OTP ────────────────────── */
  const handleVerifyOtp = useCallback(async () => {
    setError("");
    if (otp.replace(/\s/g, "").length < 5) { setError("Please enter the complete 5-digit OTP."); return; }
    if (otpExpiry.remaining === 0) { setError("OTP has expired. Please request a new one."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, country_code: countryDial, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Invalid OTP."); return; }
      setVerifyToken(data.verifyToken);
      setStep("profile");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [phone, countryDial, otp, otpExpiry.remaining]);

  /* ── API: Register ──────────────────────── */
  const handleRegister = useCallback(async () => {
    setError("");
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";
    if (!birthday) errs.birthday = "Date of birth is required.";
    if (!nicNumber.trim()) errs.nicNumber = `${nicType} number is required.`;
    const pwRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!password) errs.password = "Password is required.";
    else if (!pwRegex.test(password)) errs.password = "Password does not meet the requirements below.";
    if (!confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifyToken,
          title,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          nationality,
          phone,
          country_code: countryDial,
          email: email.trim(),
          birthday,
          nic_type: nicType,
          nic_number: nicNumber.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Registration failed."); return; }
      setStep("success");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [verifyToken, title, firstName, lastName, nationality, phone, countryDial,
      email, birthday, nicType, nicNumber, password, confirmPassword]);

  const strength = getStrength(password);

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-linear-to-r from-green-900 to-green-700 px-8 py-6">
          <LakwedhaLogo
            size={44}
            textColor="white"
            subtitle="Create your account"
            subtitleColor="rgba(187,247,208,0.85)"
          />
        </div>

        <div className="px-8 py-8">
          <StepIndicator current={stepNum} />

          {/* ══════════════════════════════════
              STEP 1 – BASIC DETAILS
          ══════════════════════════════════ */}
          {step === "details" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Basic Details</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us about yourself to get started.</p>

              {error && <ErrorBox message={error} />}

              {/* Nationality */}
              <Field label="Nationality" error={fieldErrors.nationality}>
                <div className="relative">
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className={SELECT}
                  >
                    <option value="Sri Lankan">Sri Lankan</option>
                    {COUNTRIES.filter((c) => c.name !== "Sri Lanka").map((c) => (
                      <option key={c.code} value={`${c.name}n`}>{c.name}n</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* First / Last name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" error={fieldErrors.firstName}>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Avishka"
                    className={INPUT}
                  />
                </Field>
                <Field label="Last Name" error={fieldErrors.lastName}>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Madushan"
                    className={INPUT}
                  />
                </Field>
              </div>

              {/* Country code + phone */}
              <Field label="Mobile Number" error={fieldErrors.phone}>
                <div className="flex gap-2">
                  <div className="relative w-36 flex-shrink-0">
                    <select
                      value={countryDial}
                      onChange={(e) => setCountryDial(e.target.value)}
                      className={SELECT}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={`${c.code}-${c.dial}`} value={c.dial}>
                          {flag(c.code)} {c.dial}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="771234567"
                    className={`${INPUT} flex-1`}
                  />
                </div>
                {countryDial && phone && (
                  <p className="mt-1 text-xs text-gray-400">Full number: {countryDial}{phone}</p>
                )}
              </Field>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2 mb-4"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending OTP…" : "Continue"}
              </button>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-green-700 hover:text-green-900 font-medium">
                  Sign In
                </Link>
              </div>
            </>
          )}

          {/* ══════════════════════════════════
              STEP 2 – OTP VERIFICATION
          ══════════════════════════════════ */}
          {step === "otp" && (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => { setStep("details"); setError(""); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Verify Number</h2>
                  <p className="text-sm text-gray-500">
                    OTP sent to{" "}
                    <span className="font-semibold text-green-700">
                      {countryDial} ******{maskedPhone}
                    </span>
                  </p>
                </div>
              </div>

              {error && <ErrorBox message={error} />}

              {/* OTP expiry timer */}
              <div className={`mb-5 text-center text-sm font-medium rounded-lg py-2 ${
                otpExpiry.remaining === 0
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}>
                {otpExpiry.remaining === 0
                  ? "OTP expired — request a new one"
                  : `Expires in ${otpExpiry.display}`}
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

              <div className="text-center mb-2">
                <button
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => { setStep("details"); setError(""); }}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Change number
                </button>
              </div>
            </>
          )}

          {/* ══════════════════════════════════
              STEP 3 – COMPLETE PROFILE
          ══════════════════════════════════ */}
          {step === "profile" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Complete Profile</h2>
              <p className="text-sm text-gray-500 mb-5">Almost done! Fill in your remaining details.</p>

              {error && <ErrorBox message={error} />}

              {/* Auto-filled summary (read-only) */}
              <div className="mb-5 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{firstName} {lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Mobile:</span>
                  <span>{countryDial} ******{maskedPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Nationality:</span>
                  <span>{nationality}</span>
                </div>
              </div>

              {/* Title */}
              <Field label="Title">
                <div className="relative">
                  <select value={title} onChange={(e) => setTitle(e.target.value)} className={SELECT}>
                    {["Mr", "Ms", "Mrs", "Dr", "Prof"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>

              {/* Email */}
              <Field label="Email Address" error={fieldErrors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT}
                />
              </Field>

              {/* Birthday */}
              <Field label="Date of Birth" error={fieldErrors.birthday}>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={INPUT}
                />
              </Field>

              {/* NIC / Passport */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="ID Type">
                  <div className="relative">
                    <select value={nicType} onChange={(e) => setNicType(e.target.value)} className={SELECT}>
                      <option value="NIC">NIC</option>
                      <option value="Passport">Passport</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </Field>
                <Field
                  label={nicType === "NIC" ? "NIC Number" : "Passport No."}
                  error={fieldErrors.nicNumber}
                >
                  <input
                    type="text"
                    value={nicNumber}
                    onChange={(e) => setNicNumber(e.target.value)}
                    placeholder={nicType === "NIC" ? "200612345678" : "N1234567"}
                    className={INPUT}
                  />
                </Field>
              </div>

              {/* Password */}
              <Field label="Password" error={fieldErrors.password}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, A-Z, 0-9, symbol"
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

              {/* Confirm password */}
              <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
                <div className="relative">
                  <input
                    type={showCpw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
              </Field>

              {/* Password rules checklist */}
              <ul className="mb-5 space-y-1">
                {[
                  ["At least 8 characters", password.length >= 8],
                  ["One uppercase letter (A-Z)", /[A-Z]/.test(password)],
                  ["One number (0-9)", /[0-9]/.test(password)],
                  ["One special character (!@#…)", /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)],
                ].map(([label, ok]) => (
                  <li
                    key={label as string}
                    className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-gray-400"}`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    {label as string}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleRegister}
                disabled={loading || strength.score < 4 || password !== confirmPassword}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </>
          )}

          {/* ══════════════════════════════════
              STEP 4 – SUCCESS
          ══════════════════════════════════ */}
          {step === "success" && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-11 w-11 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Registration Successful!
              </h2>
              <p className="text-sm text-gray-500 mb-1">
                Welcome,{" "}
                <span className="font-semibold text-green-700">
                  {firstName} {lastName}
                </span>
                !
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Your account has been created. Sign in to access Lakwedha.
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold py-2.5 text-sm text-center transition"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
