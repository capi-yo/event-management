'use client';

import { createContext, useContext, useState, useEffect, ReactNode, JSX } from 'react';
import { authApi, setToken, removeToken, setUser as setStoredUser, removeUser } from '@/lib/api';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
}

interface UserData {
    displayName: string;
    role: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string, role?: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    getRedirectUrl: (role: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('eventmate_token');
            if (token) {
                // Ensure token is set in API module
                setToken(token);
                
                try {
                    const response = await authApi.getCurrentUser();
                    const userInfo = response.data.user;
                    setUser(userInfo);
                    setStoredUser(userInfo);
                    setUserData({
                        displayName: userInfo.name,
                        role: userInfo.role,
                        email: userInfo.email,
                    });
                } catch (error: any) {
                    console.error('Failed to load user:', error);
                    // Only remove token if it's a token-related error
                    if (error.message === 'Token expired' || 
                        error.message === 'Invalid token' || 
                        error.message === 'No token provided') {
                        removeToken();
                        removeUser();
                    }
                    // For other errors (network, server), keep the token and try again later
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const refreshUser = async () => {
        try {
            const response = await authApi.getCurrentUser();
            const userInfo = response.data.user;
            setUser(userInfo);
            setStoredUser(userInfo);
            setUserData({
                displayName: userInfo.name,
                role: userInfo.role,
                email: userInfo.email,
            });
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const getRedirectUrl = (role: string): string => {
        switch (role) {
            case 'Administrator':
                return '/admin';
            case 'Organizer':
                return '/organiser';
            default:
                return '/events';
        }
    };

    const signIn = async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        const { user: userInfo, token } = response.data;

        setToken(token);
        setStoredUser(userInfo);
        setUser(userInfo);
        setUserData({
            displayName: userInfo.name,
            role: userInfo.role,
            email: userInfo.email,
        });
    };

    const signUp = async (name: string, email: string, password: string, role?: string) => {
        const response = await authApi.register({ name, email, password, role });
        const { user: userInfo, token } = response.data;

        setToken(token);
        setStoredUser(userInfo);
        setUser(userInfo);
        setUserData({
            displayName: userInfo.name,
            role: userInfo.role,
            email: userInfo.email,
        });
    };

    const signOut = async () => {
        removeToken();
        removeUser();
        setUser(null);
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, signIn, signUp, signOut, refreshUser, getRedirectUrl }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
