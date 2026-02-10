'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Policy } from '@/types';
import { RoleGuard } from '@/components/auth';
import { Card, CardHeader, Button, Badge, Spinner, Input } from '@/components/ui';
import { Plus, FileText, CheckCircle, Power } from 'lucide-react';

const policySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  maxFlightCost: z.coerce.number().min(0),
  maxHotelPerDay: z.coerce.number().min(0),
  maxDailyFood: z.coerce.number().min(0),
  maxTripTotal: z.coerce.number().min(0),
  allowedFlightClasses: z.string().min(1, 'At least one flight class required'),
});

type PolicyForm = z.infer<typeof policySchema>;

export default function PoliciesPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <PoliciesContent />
    </RoleGuard>
  );
}

function PoliciesContent() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      maxFlightCost: 25000,
      maxHotelPerDay: 5000,
      maxDailyFood: 1500,
      maxTripTotal: 100000,
      allowedFlightClasses: 'economy,premium_economy',
    },
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await apiClient.get('/policy');
      setPolicies(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: PolicyForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/policy', {
        name: data.name,
        rules: {
          maxFlightCost: data.maxFlightCost,
          maxHotelPerDay: data.maxHotelPerDay,
          maxDailyFood: data.maxDailyFood,
          maxTripTotal: data.maxTripTotal,
          allowedFlightClasses: data.allowedFlightClasses.split(',').map((s) => s.trim()),
        },
      });

      reset();
      setShowForm(false);
      fetchPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    setActivatingId(id);
    try {
      await apiClient.post(`/policy/${id}/activate`);
      fetchPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate policy');
    } finally {
      setActivatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Policies</h1>
          <p className="text-surface-400 mt-1">Manage travel and expense policies</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New Policy
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {/* New Policy Form */}
      {showForm && (
        <Card>
          <CardHeader title="Create New Policy" />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="name"
              label="Policy Name"
              placeholder="e.g., Standard Travel Policy 2026"
              error={errors.name?.message}
              {...register('name')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="maxFlightCost"
                type="number"
                label="Max Flight Cost (INR)"
                error={errors.maxFlightCost?.message}
                {...register('maxFlightCost')}
              />
              <Input
                id="maxHotelPerDay"
                type="number"
                label="Max Hotel Per Day (INR)"
                error={errors.maxHotelPerDay?.message}
                {...register('maxHotelPerDay')}
              />
              <Input
                id="maxDailyFood"
                type="number"
                label="Max Daily Food (INR)"
                error={errors.maxDailyFood?.message}
                {...register('maxDailyFood')}
              />
              <Input
                id="maxTripTotal"
                type="number"
                label="Max Trip Total (INR)"
                error={errors.maxTripTotal?.message}
                {...register('maxTripTotal')}
              />
            </div>
            <Input
              id="allowedFlightClasses"
              label="Allowed Flight Classes (comma-separated)"
              placeholder="economy, premium_economy, business"
              error={errors.allowedFlightClasses?.message}
              {...register('allowedFlightClasses')}
            />
            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={isSubmitting}>
                Create Policy
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Policies List */}
      {policies.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No policies created yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <Card key={policy._id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-surface-100">{policy.name}</h3>
                    <Badge variant="neutral">v{policy.version}</Badge>
                    {policy.isActive && (
                      <Badge variant="success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <p className="text-surface-500">Max Flight</p>
                      <p className="text-surface-100">{formatCurrency(policy.rules.maxFlightCost)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500">Max Hotel/Day</p>
                      <p className="text-surface-100">{formatCurrency(policy.rules.maxHotelPerDay)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500">Max Food/Day</p>
                      <p className="text-surface-100">{formatCurrency(policy.rules.maxDailyFood)}</p>
                    </div>
                    <div>
                      <p className="text-surface-500">Max Trip Total</p>
                      <p className="text-surface-100">{formatCurrency(policy.rules.maxTripTotal)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-surface-400 mt-3">
                    Flight classes: {policy.rules.allowedFlightClasses.join(', ')}
                  </p>
                </div>
                {!policy.isActive && (
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={activatingId === policy._id}
                    onClick={() => handleActivate(policy._id)}
                  >
                    <Power className="h-4 w-4" />
                    Activate
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
