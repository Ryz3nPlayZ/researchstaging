'use client';

import { useCallback, useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { Search, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AdminUser {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    credits_remaining: number;
    project_count: number;
    created_at: string;
    is_admin: boolean;
}

interface UsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    page_size: number;
}

export default function AdminUsersPage() {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Add credits modal
    const [creditsModal, setCreditsModal] = useState<{ user: AdminUser } | null>(null);
    const [creditAmount, setCreditAmount] = useState('100');
    const [granting, setGranting] = useState(false);
    const [grantError, setGrantError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const params = new URLSearchParams({ page: String(page), page_size: '20' });
        if (search) params.set('search', search);
        const res = await fetch(`/api/admin/users?${params}`, { headers });
        if (res.ok) setData(await res.json());
        setLoading(false);
    }, [page, search]);

    useEffect(() => {
        const t = setTimeout(fetchUsers, 300);
        return () => clearTimeout(t);
    }, [fetchUsers]);

    const handleGrantCredits = async () => {
        if (!creditsModal) return;
        setGranting(true);
        setGrantError(null);
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/users/${creditsModal.user.id}/credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ amount: parseInt(creditAmount, 10), reason: 'Admin grant' }),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error((e as { detail?: string }).detail || 'Failed to grant credits');
            }
            setCreditsModal(null);
            setCreditAmount('100');
            fetchUsers();
        } catch (err) {
            setGrantError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setGranting(false);
        }
    };

    const totalPages = data ? Math.ceil(data.total / 20) : 1;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {data ? `${data.total.toLocaleString()} total users` : 'Loading...'}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by name or email..."
                    className="pl-9"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                            <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
                            <th className="text-right px-5 py-3 font-medium text-gray-500">Credits</th>
                            <th className="text-right px-5 py-3 font-medium text-gray-500">Projects</th>
                            <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
                            <th className="text-right px-5 py-3 font-medium text-gray-500 w-32">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    <td className="px-5 py-3">
                                        <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                                    </td>
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <td key={j} className="px-5 py-3">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse w-16" />
                                        </td>
                                    ))}
                                    <td className="px-5 py-3" />
                                </tr>
                            ))
                        ) : (data?.users ?? []).map((u) => (
                            <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-900">{u.name ?? '—'}</p>
                                    <p className="text-xs text-gray-400">{u.email}</p>
                                </td>
                                <td className="px-5 py-3 capitalize text-gray-600">{u.role ?? 'user'}</td>
                                <td className="px-5 py-3 text-right font-mono text-gray-700">{u.credits_remaining.toLocaleString()}</td>
                                <td className="px-5 py-3 text-right text-gray-600">{u.project_count}</td>
                                <td className="px-5 py-3 text-gray-400 text-xs">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button
                                        onClick={() => { setCreditsModal({ user: u }); setCreditAmount('100'); setGrantError(null); }}
                                        className="inline-flex items-center gap-1 text-xs bg-[#1C7C54]/10 text-[#1C7C54] hover:bg-[#1C7C54]/20 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Credits
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {!loading && data?.users.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <span>Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Credits Modal */}
            {creditsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreditsModal(null)} />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900">Add Credits</h2>
                            <button onClick={() => setCreditsModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Adding credits to <span className="font-medium text-gray-900">{creditsModal.user.email}</span>.
                            Current balance: <span className="font-mono font-medium">{creditsModal.user.credits_remaining.toLocaleString()}</span>
                        </p>

                        <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium text-gray-700">Amount</label>
                            <Input
                                type="number"
                                min="1"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                className="font-mono"
                            />
                            <div className="flex gap-1.5 flex-wrap">
                                {[100, 500, 1000, 5000].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setCreditAmount(String(n))}
                                        className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                    >
                                        {n.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {grantError && (
                            <p className="text-sm text-red-600 mb-3">{grantError}</p>
                        )}

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setCreditsModal(null)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleGrantCredits}
                                disabled={granting || !creditAmount || parseInt(creditAmount) <= 0}
                                className="flex-1 bg-[#1C7C54] hover:bg-[#1B512D] text-white"
                            >
                                {granting ? 'Granting...' : 'Grant Credits'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
