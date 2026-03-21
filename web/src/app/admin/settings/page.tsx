'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Shield, User, Mail, Lock, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();

    /* ---- Profile form ---- */
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileSaved, setProfileSaved] = useState(false);

    /* ---- Password form ---- */
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSaved, setPasswordSaved] = useState(false);

    const handleProfileSave = (e: FormEvent) => {
        e.preventDefault();
        // Update user in localStorage so Topbar reflects the change
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = name;
            parsed.email = email;
            localStorage.setItem('user', JSON.stringify(parsed));
        }
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
    };

    const handlePasswordChange = (e: FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        // In production this would call an API endpoint
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold text-green-800">Settings</h1>
                <p className="text-sm text-gray-500">Manage your admin profile and security preferences</p>
            </div>

            {/* PROFILE CARD */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
                        <p className="text-xs text-gray-400">Update your personal details</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                    {/* Avatar preview */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                            {name ? name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                            <p className="font-medium text-gray-800">{name || 'Admin'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Shield className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs text-green-600 font-medium capitalize">{user?.role || 'admin'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="Your name"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border px-3 py-2 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                    placeholder="admin@lakwedha.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {profileSaved && (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" /> Profile updated
                            </span>
                        )}
                        <button
                            type="submit"
                            className="ml-auto flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                        >
                            <Save className="h-4 w-4" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* PASSWORD CARD */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <Lock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
                        <p className="text-xs text-gray-400">Ensure your account stays secure</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                            required
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                required
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                required
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                    )}

                    <div className="flex items-center justify-between pt-2">
                        {passwordSaved && (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" /> Password changed
                            </span>
                        )}
                        <button
                            type="submit"
                            className="ml-auto flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
                        >
                            <Lock className="h-4 w-4" /> Update Password
                        </button>
                    </div>
                </form>
            </div>

            {/* ACCOUNT INFO */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Details</h2>
                <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div>
                        <dt className="text-gray-400">User ID</dt>
                        <dd className="font-mono text-gray-600 mt-0.5">{user?._id || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Role</dt>
                        <dd className="mt-0.5">
                            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 capitalize">
                                {user?.role || 'admin'}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Account Status</dt>
                        <dd className="mt-0.5">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 capitalize">
                                {user?.status || 'active'}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-gray-400">Platform</dt>
                        <dd className="font-medium text-gray-600 mt-0.5">Lakwedha Admin v1.0</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
