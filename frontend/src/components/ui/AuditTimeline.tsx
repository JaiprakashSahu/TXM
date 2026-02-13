import { AuditLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface AuditTimelineProps {
    logs: AuditLog[];
    className?: string;
}

export function AuditTimeline({ logs, className }: AuditTimelineProps) {
    if (logs.length === 0) return null;

    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-surface-400" />
                <h4 className="text-sm font-semibold text-surface-100">Audit Trail</h4>
            </div>
            <div className="relative pl-6 space-y-4">
                {/* Vertical line */}
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-surface-700" />

                {logs.map((log, i) => (
                    <div key={i} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-surface-600 bg-surface-800" />

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-surface-200">
                                    {log.action}
                                </span>
                                <span className="text-xs text-surface-500">
                                    by {log.actorRole}
                                </span>
                            </div>
                            <p className="text-xs text-surface-500 mt-0.5">
                                {formatDateTime(log.timestamp)}
                            </p>
                            {log.note && (
                                <p className="text-sm text-surface-400 mt-1 pl-3 border-l-2 border-surface-700">
                                    {log.note}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
