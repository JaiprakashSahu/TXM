'use client';

import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { CheckCircle, XCircle } from 'lucide-react';

interface ApprovalPanelProps {
    onApprove: (comment: string) => Promise<void>;
    onReject: (comment: string) => Promise<void>;
    isLoading?: boolean;
    title?: string;
}

export function ApprovalPanel({
    onApprove,
    onReject,
    isLoading = false,
    title = 'Take Action',
}: ApprovalPanelProps) {
    const [comment, setComment] = useState('');

    const rejectDisabled = isLoading || comment.trim().length === 0;

    return (
        <Card>
            <h3 className="text-lg font-semibold text-surface-100 mb-4">{title}</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-surface-300 mb-1.5">
                        Comment <span className="text-surface-500">(required for rejection)</span>
                    </label>
                    <Textarea
                        placeholder="Add a comment..."
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="success"
                        onClick={() => onApprove(comment)}
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                    </Button>
                    <Button
                        variant="danger-outline"
                        onClick={() => onReject(comment)}
                        isLoading={isLoading}
                        disabled={rejectDisabled}
                    >
                        <XCircle className="h-4 w-4" />
                        Reject
                    </Button>
                </div>
                {comment.trim().length === 0 && (
                    <p className="text-xs text-surface-500">
                        A comment is required to reject.
                    </p>
                )}
            </div>
        </Card>
    );
}
