'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { validatePasswordStrength } from '@/lib/validations';

interface PasswordStrengthIndicatorProps {
    password: string;
    showRules?: boolean; // show checklist beneath bar (default true)
}

const rules = [
    { label: 'At least 8 characters',  test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter',    test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter',    test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number',              test: (p: string) => /[0-9]/.test(p) },
    { label: 'One special character',   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrengthIndicator({
    password,
    showRules = true,
}: PasswordStrengthIndicatorProps) {
    if (!password) return null;

    const strength = validatePasswordStrength(password);

    return (
        <div className="mt-2 space-y-2">
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                />
            </div>

            {/* Text label */}
            {strength.label && (
                <p className={`text-xs font-semibold ${
                    strength.score === 1 ? 'text-red-500' :
                    strength.score === 2 ? 'text-orange-500' :
                    'text-green-500'
                }`}>
                    Password strength: {strength.label}
                </p>
            )}

            {/* Checklist */}
            {showRules && (
                <div className="space-y-1">
                    {rules.map((rule, i) => {
                        const met = rule.test(password);
                        return (
                            <div key={i} className="flex items-center text-xs gap-1.5">
                                {met
                                    ? <Check className="h-3 w-3 text-green-500 shrink-0" />
                                    : <X     className="h-3 w-3 text-muted-foreground shrink-0" />
                                }
                                <span className={met ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
                                    {rule.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PasswordStrengthIndicator;
