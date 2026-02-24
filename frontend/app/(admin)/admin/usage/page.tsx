'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface UsageDay {
    date: string;
    credits_used: number;
}

interface TopUser {
    user_id: string;
    email: string;
    name: string | null;
    total_credits_used: number;
}

interface UsageResponse {
    daily_usage: UsageDay[];
    top_users: TopUser[];
}

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function AdminUsagePage() {
    const [data, setData] = useState<UsageResponse | null>(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`/api/admin/usage?days=${days}`, { headers })
            .then(r => r.json())
            .then(d => setData(d))
            .finally(() => setLoading(false));
    }, [days]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Credit consumption over time.</p>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                    {DAYS_OPTIONS.map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days === d
                                    ? 'bg-[#1C7C54] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Area chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Credit Consumption</h2>
                {loading ? (
                    <div className="h-56 rounded-xl bg-gray-100 animate-pulse" />
                ) : !data?.daily_usage?.length ? (
                    <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                        No usage data for this period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data.daily_usage} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1C7C54" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1C7C54" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                tickFormatter={(v) => v.slice(5)}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                            <Tooltip
                                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                                labelFormatter={(l) => `Date: ${l}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="credits_used"
                                stroke="#1C7C54"
                                strokeWidth={2}
                                fill="url(#creditsGrad)"
                                name="Credits"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Top users table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-900">Top Users by Consumption</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left px-5 py-3 font-medium text-gray-500">#</th>
                            <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                            <th className="text-right px-5 py-3 font-medium text-gray-500">Credits Used</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    {[40, 200, 80].map((w, j) => (
                                        <td key={j} className="px-5 py-3">
                                            <div className={`h-4 bg-gray-100 rounded animate-pulse w-${w === 200 ? '40' : w === 80 ? '20' : '6'}`} />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (data?.top_users ?? []).map((u, i) => (
                            <tr key={u.user_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-3 text-gray-400 font-medium">{i + 1}</td>
                                <td className="px-5 py-3">
                                    <p className="font-medium text-gray-900">{u.name ?? '—'}</p>
                                    <p className="text-xs text-gray-400">{u.email}</p>
                                </td>
                                <td className="px-5 py-3 text-right font-mono font-semibold text-gray-900">
                                    {u.total_credits_used.toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {!loading && !data?.top_users?.length && (
                            <tr>
                                <td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">
                                    No usage yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
