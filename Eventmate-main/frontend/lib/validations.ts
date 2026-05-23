export const validateName = (name: string): string => {
    if (!name || name.trim().length === 0) return 'Name is required';
    if (name.length < 2 || name.length > 50) return 'Name must be between 2 and 50 characters';
    if (!/^[a-zA-Z\s\'-]+$/.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
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
    // Removed length check to allow any password length
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
    return '';
};
