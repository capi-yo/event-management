'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Loader2, type LucideIcon } from 'lucide-react';
import type { FeedbackType } from '@/hooks/useButtonFeedback';

interface FeedbackButtonProps extends React.ComponentProps<typeof Button> {
    loading?: boolean;
    feedback?: FeedbackType;
    defaultLabel: string;
    loadingLabel?: string;
    savedLabel?: string;
    confirmedLabel?: string;
    icon?: LucideIcon;
}

export function FeedbackButton({
    loading = false,
    feedback = 'idle',
    defaultLabel,
    loadingLabel = 'Saving...',
    savedLabel = 'Saved',
    confirmedLabel = 'Confirmed',
    icon: Icon,
    className,
    disabled,
    children,
    ...props
}: FeedbackButtonProps) {
    const isSuccess = feedback === 'saved' || feedback === 'confirmed';
    const label =
        loading
            ? loadingLabel
            : feedback === 'saved'
              ? savedLabel
              : feedback === 'confirmed'
                ? confirmedLabel
                : defaultLabel;

    const LeadingIcon = loading ? Loader2 : isSuccess ? Check : Icon;

    return (
        <Button
            {...props}
            disabled={disabled || loading || isSuccess}
            className={cn(
                isSuccess && 'bg-green-600 hover:bg-green-600 text-white border-green-600',
                className
            )}
        >
            {LeadingIcon && (
                <LeadingIcon
                    className={cn('mr-2 h-4 w-4', loading && 'animate-spin')}
                />
            )}
            {children ?? label}
        </Button>
    );
}
