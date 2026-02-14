'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import apiClient from '@/lib/apiClient';
import { Button, Input, Card } from '@/components/ui';

export default function ChangePasswordPage() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/change-password', {
                oldPassword,
                newPassword,
            });

            if (response.data.success) {
                // Force logout or redirect to dashboard?
                // Usually good to force re-login or just update state.
                // For simplicity/security, let's redirect to dashboard which will now allow access.
                // But we might need to refresh the user context to update mustChangePassword.
                // The easiest way is to reload or manually update context if exposed.
                // Since useAuth fetches profile on mount, a full page reload or router.push('/dashboard') 
                // AND somehow triggering re-fetch would be good. 
                // For now, let's just push to dashboard, ProtectedLayout might fetch again if we invalidate?
                // Actually, AuthContext only fetches on mount/token refresh. 
                // We might want to logout the user to be safe and force them to login with new password.
                logout();
                router.push('/login');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-surface-50">Change Password</h1>
                    <p className="text-sm text-surface-400">
                        For security reasons, you must change your password to continue.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-200">Current Password</label>
                        <Input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-200">New Password</label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-surface-200">Confirm New Password</label>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={isLoading}
                    >
                        Change Password
                    </Button>
                </form>
            </Card>
        </div>
    );
}
