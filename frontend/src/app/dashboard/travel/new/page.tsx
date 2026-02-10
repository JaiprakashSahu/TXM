'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib';
import { Card, CardHeader, Button, Input, Textarea, Select } from '@/components/ui';
import { User } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const travelSchema = z.object({
  destination: z.string().min(1, 'Destination is required').max(200),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  estimatedCost: z.coerce.number().min(0, 'Cost must be positive'),
  purpose: z.string().min(1, 'Purpose is required').max(1000),
  managerId: z.string().min(1, 'Please select a manager'),
});

type TravelForm = z.infer<typeof travelSchema>;

export default function NewTravelRequestPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelForm>({
    resolver: zodResolver(travelSchema),
  });

  useEffect(() => {
    // Fetch managers list
    const fetchManagers = async () => {
      try {
        const response = await apiClient.get('/auth/managers');
        const managerList = response.data.data || [];
        setManagers(
          managerList.map((m: User) => ({
            value: m._id,
            label: `${m.name} (${m.email})`,
          }))
        );
      } catch (err) {
        // Fallback if endpoint doesn't exist
        setManagers([]);
      }
    };
    fetchManagers();
  }, []);

  const onSubmit = async (data: TravelForm) => {
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.post('/travel', data);
      router.push('/dashboard/travel');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create travel request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/travel">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-100">New Travel Request</h1>
          <p className="text-surface-400 mt-1">Create a new travel request for approval</p>
        </div>
      </div>

      <Card>
        {error && (
          <div className="mb-4 p-3 bg-danger-600/10 border border-danger-600/30 rounded-xl">
            <p className="text-sm text-danger-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="destination"
            label="Destination"
            placeholder="e.g., Mumbai, India"
            error={errors.destination?.message}
            {...register('destination')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="startDate"
              type="date"
              label="Start Date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />
            <Input
              id="endDate"
              type="date"
              label="End Date"
              error={errors.endDate?.message}
              {...register('endDate')}
            />
          </div>

          <Input
            id="estimatedCost"
            type="number"
            label="Estimated Cost (INR)"
            placeholder="50000"
            error={errors.estimatedCost?.message}
            {...register('estimatedCost')}
          />

          <Textarea
            id="purpose"
            label="Purpose"
            placeholder="Describe the purpose of this travel..."
            rows={4}
            error={errors.purpose?.message}
            {...register('purpose')}
          />

          {managers.length > 0 ? (
            <Select
              id="managerId"
              label="Approving Manager"
              options={[{ value: '', label: 'Select a manager' }, ...managers]}
              error={errors.managerId?.message}
              {...register('managerId')}
            />
          ) : (
            <Input
              id="managerId"
              label="Manager ID"
              placeholder="Enter manager ID"
              error={errors.managerId?.message}
              {...register('managerId')}
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" isLoading={isLoading}>
              Create Request
            </Button>
            <Link href="/dashboard/travel">
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
