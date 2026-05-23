import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const rules = [
    { label: 'At least 8 characters', regex: /^.{8,}$/ },
    { label: 'One uppercase letter', regex: /[A-Z]/ },
    { label: 'One lowercase letter', regex: /[a-z]/ },
    { label: 'One number', regex: /[0-9]/ },
    { label: 'One special character', regex: /[^A-Za-z0-9]/ },
  ];

  return (
    <div className="mt-2 space-y-1">
      {rules.map((rule, index) => {
        const isMet = rule.regex.test(password);
        return (
          <div key={index} className="flex items-center text-xs">
            {isMet ? (
              <Check className="mr-2 h-3 w-3 text-green-500" />
            ) : (
              <X className="mr-2 h-3 w-3 text-muted-foreground" />
            )}
            <span className={isMet ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
