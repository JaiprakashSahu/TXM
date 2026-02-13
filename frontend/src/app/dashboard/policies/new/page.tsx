'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Button, Input } from '@/components/ui';
import { useToast } from '@/contexts';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const FLIGHT_CLASSES = ['economy', 'premium_economy', 'business', 'first'];

export default function NewPolicyPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <NewPolicyContent />
        </RoleGuard>
    );
}

function NewPolicyContent() {
    const router = useRouter();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [maxFlightCost, setMaxFlightCost] = useState('25000');
    const [maxHotelPerDay, setMaxHotelPerDay] = useState('5000');
    const [maxDailyFood, setMaxDailyFood] = useState('1500');
    const [maxTripTotal, setMaxTripTotal] = useState('100000');
    const [selectedClasses, setSelectedClasses] = useState<string[]>(['economy', 'premium_economy']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleClass = (cls: string) => {
        setSelectedClasses((prev) =>
            prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Policy name is required');
            return;
        }
        if (selectedClasses.length === 0) {
            setError('Select at least one flight class');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await apiClient.post('/policy', {
                name: name.trim(),
                rules: {
                    maxFlightCost: Number(maxFlightCost),
                    maxHotelPerDay: Number(maxHotelPerDay),
                    maxDailyFood: Number(maxDailyFood),
                    maxTripTotal: Number(maxTripTotal),
                    allowedFlightClasses: selectedClasses,
                },
            });

            toast.success('Policy created successfully');
            router.push('/dashboard/policies');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create policy');
            toast.error('Failed to create policy');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/policies">
                    <button className="p-2 rounded-lg text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">Create New Policy</h1>
                    <p className="text-surface-400 mt-1">Define expense limits and allowed flight classes</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
                    <p className="text-sm text-danger-500">{error}</p>
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        id="name"
                        label="Policy Name"
                        placeholder="e.g., Standard Travel Policy 2026"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="maxFlightCost"
                            type="number"
                            label="Max Flight Cost (₹)"
                            value={maxFlightCost}
                            onChange={(e) => setMaxFlightCost(e.target.value)}
                        />
                        <Input
                            id="maxHotelPerDay"
                            type="number"
                            label="Max Hotel Per Day (₹)"
                            value={maxHotelPerDay}
                            onChange={(e) => setMaxHotelPerDay(e.target.value)}
                        />
                        <Input
                            id="maxDailyFood"
                            type="number"
                            label="Max Daily Food (₹)"
                            value={maxDailyFood}
                            onChange={(e) => setMaxDailyFood(e.target.value)}
                        />
                        <Input
                            id="maxTripTotal"
                            type="number"
                            label="Max Trip Total (₹)"
                            value={maxTripTotal}
                            onChange={(e) => setMaxTripTotal(e.target.value)}
                        />
                    </div>

                    {/* Flight Class Multi-Select */}
                    <div>
                        <label className="block text-sm font-medium text-surface-200 mb-2">
                            Allowed Flight Classes
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FLIGHT_CLASSES.map((cls) => (
                                <button
                                    key={cls}
                                    type="button"
                                    onClick={() => toggleClass(cls)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedClasses.includes(cls)
                                            ? 'bg-primary-600/20 border-primary-500 text-primary-400'
                                            : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-500'
                                        }`}
                                >
                                    {cls.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" isLoading={isSubmitting}>
                            Create Policy
                        </Button>
                        <Link href="/dashboard/policies">
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}
