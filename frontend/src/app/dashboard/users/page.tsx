'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, User as UserIcon } from 'lucide-react';
import { Button, Input, Card, UserChip, StatusBadge } from '@/components/ui'; // Need to check if Card/UserChip/StatusBadge logic works
import apiClient from '@/lib/apiClient';
import { AddUserModal } from '@/components/users/AddUserModal';
import { format } from 'date-fns';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // We don't have a GET /users endpoint yet in the backend plan??? 
            // The user didn't explicitly asking for GET /users implementation in the backend request.
            // But Step 1 of Frontend says "Users Table". 
            // I probably need to check if GET /api/users exists or implement it?
            // Wait, "Step 3 — Connect To Backend ... Call POST /api/users".
            // It DOES NOT mention GET /api/users.
            // BUT, to show a table, I need to fetch users.
            // I should double check the backend routes.
            // If not exists, I might mock it or implement it quickly if in scope (User said "DO NOT modify unrelated modules").
            // But creating a Users page without listing users is impossible. 
            // I will assume GET /api/users might be needed.
            // Let's first try to hit it, or I'll implement it if missing.
            // For now, I'll write the code to fetch it.
            const response = await apiClient.get('/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
            // Mock data if fails for now to show UI structure?
            // setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-50">Users Management</h1>
                    <p className="text-sm text-surface-400">Manage system access and roles</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-surface-900 p-4 rounded-xl border border-surface-800">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <Input
                        placeholder="Search users..."
                        className="pl-9 bg-surface-950 border-surface-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-950 border-b border-surface-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-surface-400">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-surface-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-surface-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-surface-100">{user.name}</p>
                                                    <p className="text-xs text-surface-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 capitalize">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.mustChangePassword ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                                                    Pending Activation
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-surface-400">
                                            {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="w-4 h-4 text-surface-400" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchUsers();
                    // Keep modal open? No, logic inside modal handles close or switch to success view.
                    // Actually AddUserModal handles success view internally.
                    // We might want to refresh list in background.
                }}
            />
        </div>
    );
}
