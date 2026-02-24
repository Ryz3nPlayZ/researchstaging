'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';
import { Users, FolderOpen, Zap, TrendingUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface Stats {
    total_users: number;
    new_users_7d: number;
    new_users_30d: number;
    total_projects: number;
    active_projects: number;
    credits_issued: number;
    credits_consumed: number;
}

interface UsageDay {
    date: string;
    credits_used: number;
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [usage, setUsage] = useState<UsageDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        Promise.all([
            fetch('/api/admin/stats', { headers }).then(r => r.json()),
            fetch('/api/admin/usage?days=30', { headers }).then(r => r.json()),
        ]).then(([s, u]) => {
            setStats(s);
            setUsage(u.daily_usage ?? []);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
                <div className="h-72 rounded-2xl bg-gray-100 animate-pulse" />
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Users',
            value: stats?.total_users ?? 0,
            sub: `+${stats?.new_users_7d ?? 0} this week`,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Projects',
            value: stats?.total_projects ?? 0,
            sub: `${stats?.active_projects ?? 0} active`,
            icon: FolderOpen,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            label: 'Credits Issued',
            value: (stats?.credits_issued ?? 0).toLocaleString(),
            sub: 'all time',
            icon: Zap,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
        {
            label: 'Credits Used',
            value: (stats?.credits_consumed ?? 0).toLocaleString(),
            sub: `${Math.round(((stats?.credits_consumed ?? 0) / Math.max(stats?.credits_issued ?? 1, 1)) * 100)}% utilization`,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <p className="text-sm text-gray-500 mt-1">Platform activity at a glance.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500 font-medium">{card.label}</span>
                            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-4 h-4 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Daily credit usage chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Credit Usage — Last 30 Days</h2>
                {usage.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No usage data yet.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={usage} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
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
                            <Line
                                type="monotone"
                                dataKey="credits_used"
                                stroke="#1C7C54"
                                strokeWidth={2}
                                dot={false}
                                name="Credits Used"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
