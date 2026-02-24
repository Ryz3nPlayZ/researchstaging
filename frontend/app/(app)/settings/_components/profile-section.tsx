'use client';

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Camera, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getToken, getUserInitials } from "@/lib/auth";

export function ProfileSection() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Populate form from real user when loaded
    useEffect(() => {
        if (user) {
            setName(user.name ?? '');
            setBio((user as { bio?: string }).bio ?? '');
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const token = getToken();
            const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ name: name.trim(), bio: bio.trim() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as { detail?: string }).detail || 'Failed to save');
            }
            await refreshUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="glass rounded-2xl p-8 backdrop-blur-md bg-white/70 border border-white/20 shadow-sm transition-all hover:shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 font-ui">Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Update your personal information and public profile.</p>
                </div>

                <div className="lg:col-span-2 space-y-8 max-w-2xl">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                                {user?.picture_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={user.picture_url} alt={user.name ?? ''} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-500 select-none">
                                        {getUserInitials(user?.name)}
                                    </span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">Profile Picture</h3>
                            <p className="text-sm text-gray-500 mb-2">Synced from your Google account</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-white/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <Input
                                value={user?.email ?? ''}
                                disabled
                                className="bg-white/30 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full min-h-[100px] rounded-lg border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Brief description for your profile."
                            />
                            <p className="text-xs text-gray-500">Brief description for your profile. URLs are hyperlinked.</p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex justify-end pt-4 items-center gap-3">
                        {saved && (
                            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                                <CheckCircle className="w-4 h-4" /> Saved
                            </span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-[#1C7C54] hover:bg-[#1B512D] text-white rounded-lg px-6"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
