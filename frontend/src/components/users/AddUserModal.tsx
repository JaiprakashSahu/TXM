'use client';

import { useState } from 'react';
import { Button, Input, Select, Spinner } from '@/components/ui';
import apiClient from '@/lib/apiClient';
import { X, Copy, Check } from 'lucide-react';
import { UserRole } from '@/types';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('employee');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Success state
    const [tempPassword, setTempPassword] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/users', {
                name,
                email,
                role,
            });

            if (response.data.success) {
                setTempPassword(response.data.data.tempPassword);
                onSuccess(); // Refresh table
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        // Reset state when closing
        setName('');
        setEmail('');
        setRole('employee');
        setTempPassword('');
        setError('');
        onClose();
    };

    // If password generated, show success view
    if (tempPassword) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-6 shadow-2xl">
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                            <Check className="w-6 h-6 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">User Created Successfully</h2>
                        <p className="text-sm text-gray-500">
                            Share this temporary password with the user. They will be required to change it on first login.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-2">
                            <code className="text-primary-400 font-mono text-lg">{tempPassword}</code>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-800"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>

                        <Button onClick={handleClose} className="w-full">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-800">Full Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-800">Email Address</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. rahul@test.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-800">Role</label>
                        <Select
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                            options={[
                                { value: 'employee', label: 'Employee' },
                                { value: 'manager', label: 'Manager' },
                                { value: 'finance', label: 'Finance' },
                            ]}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Create User
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
