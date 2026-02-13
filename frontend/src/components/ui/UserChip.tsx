import { cn } from '@/lib/utils';

interface UserChipProps {
    name: string;
    email?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function UserChip({ name, email, size = 'md', className }: UserChipProps) {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const avatarSize = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';

    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <div
                className={cn(
                    'rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center font-semibold flex-shrink-0',
                    avatarSize
                )}
            >
                {initials}
            </div>
            <div className="min-w-0">
                <p className={cn('font-medium text-surface-100 truncate', size === 'sm' ? 'text-xs' : 'text-sm')}>
                    {name}
                </p>
                {email && (
                    <p className={cn('text-surface-400 truncate', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
                        {email}
                    </p>
                )}
            </div>
        </div>
    );
}
