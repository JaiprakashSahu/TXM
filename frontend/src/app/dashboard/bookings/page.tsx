'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Booking, BookingStatus, BookingType } from '@/types';
import { Card, CardHeader, Badge, Spinner } from '@/components/ui';
import { Plane, Building, CalendarCheck } from 'lucide-react';

const statusVariant: Record<BookingStatus, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  initiated: 'primary',
  confirmed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const typeIcon: Record<BookingType, React.ElementType> = {
  flight: Plane,
  hotel: Building,
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiClient.get('/booking/my');
        setBookings(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-100">Bookings</h1>
        <p className="text-surface-400 mt-1">View your confirmed travel bookings</p>
      </div>

      {error && (
        <div className="p-4 bg-danger-600/10 border border-danger-600/30 rounded-xl">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CalendarCheck className="h-12 w-12 text-surface-500 mx-auto mb-3" />
            <p className="text-surface-400">No bookings yet.</p>
            <p className="text-sm text-surface-500 mt-1">
              Bookings will appear here once your travel requests are approved and booked.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const Icon = typeIcon[booking.type];
            return (
              <Card key={booking._id}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-surface-700 rounded-xl">
                    <Icon className="h-5 w-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-surface-100 capitalize">{booking.type}</h3>
                      <Badge variant={statusVariant[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-400">
                      Inventory: {booking.inventoryId}
                    </p>
                    <p className="text-lg font-semibold text-surface-100 mt-2">
                      {formatCurrency(booking.price, booking.currency)}
                    </p>
                    {booking.confirmedAt && (
                      <p className="text-sm text-success-500 mt-1">
                        Confirmed on {formatDate(booking.confirmedAt)}
                      </p>
                    )}
                    {booking.lastError && (
                      <p className="text-sm text-danger-500 mt-1">
                        Error: {booking.lastError}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
