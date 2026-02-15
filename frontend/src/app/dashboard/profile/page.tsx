'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { Card, Button, Input, Badge, Spinner } from '@/components/ui';
import { AlertCircle, CheckCircle2, ShieldCheck, User as UserIcon, Calendar, Mail, Key } from 'lucide-react';
import apiClient from '@/lib/apiClient';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const forceChange = searchParams.get('forceChange') === 'true';

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (formData.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/change-password', {
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: 'Password changed successfully. Logging out...' });
                setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });

                // Auto logout after 2 seconds
                setTimeout(() => {
                    logout();
                    router.push('/login');
                }, 2000);
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (!user) return <div className="flex justify-center p-12"><Spinner /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-surface-50">User Profile</h2>
                {user.role === 'admin' && (
                    <Badge variant="primary" className="border-primary-500/50 text-primary-400">System Administrator</Badge>
                )}
            </div>

            {forceChange && (
                <div className="bg-error-900/20 border border-error-500/50 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-error-400 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-semibold text-error-100">Action Required</h3>
                        <p className="text-xs text-error-300 mt-1">
                            Your account security requires a password update. Most dashboard features are restricted until you set a new password.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Section 1: Account Information */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="p-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 bg-surface-800 rounded-full flex items-center justify-center border-2 border-surface-700">
                                <UserIcon className="h-10 w-10 text-surface-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-surface-50">{user.name}</h3>
                                <p className="text-sm text-surface-400">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                <Badge variant="neutral" className="capitalize">{user.role}</Badge>
                                <Badge variant={user.isActive ? 'success' : 'danger'}>
                                    {user.isActive ? 'Active' : 'Deactivated'}
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-surface-500" />
                                <div>
                                    <p className="text-surface-500 text-[10px] uppercase font-bold tracking-wider">Joined</p>
                                    <p className="text-surface-200">{formatDate(user.createdAt)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <ShieldCheck className="h-4 w-4 text-surface-500" />
                                <div>
                                    <p className="text-surface-500 text-[10px] uppercase font-bold tracking-wider">Password Last Updated</p>
                                    <p className="text-surface-200">{formatDate(user.passwordChangedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Section 2: Change Password */}
                <div className="md:col-span-2">
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Key className="h-5 w-5 text-primary-400" />
                            <h3 className="text-lg font-bold text-surface-50">Security & Credentials</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-surface-300">Current Password</label>
                                <Input
                                    type="password"
                                    name="oldPassword"
                                    value={formData.oldPassword}
                                    onChange={handleChange}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-surface-300">New Password</label>
                                    <Input
                                        type="password"
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        placeholder="Minimal 8 characters"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-surface-300">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Repeat new password"
                                        required
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg flex items-center gap-3 text-sm ${message.type === 'success' ? 'bg-success-900/20 text-success-400' : 'bg-error-900/20 text-error-400'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                                    {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
