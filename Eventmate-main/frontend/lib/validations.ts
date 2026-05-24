export const validateName = (name: string): string => {
    if (!name || name.trim().length === 0) return 'Name is required';
    if (name.length < 2 || name.length > 100) return 'Name must be between 2 and 100 characters';
    if (!/^[a-zA-Z\s\'\-]+$/.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    if (!/[a-zA-Z]/.test(name)) return 'Name must contain at least one letter';
    return '';
};

export const validateEmail = (email: string): string => {
    if (!email || email.trim().length === 0) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address (e.g., name@domain.com)';
    return '';
};

export const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
    return '';
};

export interface PasswordStrength {
    score: number;          // 0 = empty, 1 = weak, 2 = medium, 3 = strong
    label: 'Weak' | 'Medium' | 'Strong' | '';
    color: string;          // Tailwind bg-* class
    width: string;          // Tailwind w-* class for progress bar
}

export function validatePasswordStrength(password: string): PasswordStrength {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200', width: 'w-0' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: 'Weak',   color: 'bg-red-500',    width: 'w-1/3' };
    if (score === 2) return { score: 2, label: 'Medium', color: 'bg-orange-400', width: 'w-2/3' };
    return            { score: 3, label: 'Strong', color: 'bg-green-500',  width: 'w-full' };
}

export const validatePhone = (phone: string): string => {
    if (!phone || phone.trim().length === 0) return '';  // optional field
    if (!/^\+?[0-9\s\-().]{7,20}$/.test(phone.trim())) return 'Please enter a valid phone number';
    return '';
};
