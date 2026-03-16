import { Violation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface ViolationListProps {
    violations: Violation[];
    className?: string;
}

export function ViolationList({ violations, className }: ViolationListProps) {
    if (violations.length === 0) return null;

    return (
        <div className={`p-4 bg-warning-600/10 border border-warning-600/30 rounded-xl ${className || ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning-500" />
                <h4 className="text-sm font-semibold text-warning-500">
                    Policy Violations ({violations.length})
                </h4>
            </div>
            <div className="space-y-2">
                {violations.map((v, i) => (
                    <div
                        key={i}
                        className="flex items-start justify-between gap-4 text-sm"
                    >
                        <div className="flex-1">
                            <p className="text-gray-800">{v.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Code: {v.code}</p>
                        </div>
                        {(v.amount !== undefined || v.limit !== undefined) && (
                            <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                                {v.amount !== undefined && (
                                    <p>Actual: <span className="text-danger-500">{formatCurrency(v.amount)}</span></p>
                                )}
                                {v.limit !== undefined && (
                                    <p>Limit: <span className="text-gray-700">{formatCurrency(v.limit)}</span></p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
