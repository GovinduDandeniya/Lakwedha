"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import LakwedhaLogo from "@/components/LakwedhaLogo";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Login failed. Please try again.");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      window.location.href = "/admin/dashboard";
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LakwedhaLogo
            size={56}
            layout="v"
            textColor="#14532d"
            subtitle="Admin Portal"
            subtitleColor="#6b7280"
          />
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Sign in to your account to continue</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lakwedha.lk"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-green-700 hover:text-green-900 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an admin account?{" "}
          <Link href="/admin-register" className="text-green-700 hover:text-green-900 font-medium">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
