// In the browser, use the Next.js /api proxy (see next.config.ts) unless overridden.
// On the server, call the backend directly.
function resolveApiBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined') {
        return '/api';
    }
    return 'http://localhost:3001';
}

export const API_BASE_URL = resolveApiBaseUrl();

// Helper to get the auth token from localStorage
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('eventmate_token');
}

// Helper to set the auth token
export function setToken(token: string): void {
    localStorage.setItem('eventmate_token', token);
}

// Helper to set the user data
export function setUser(user: any): void {
    localStorage.setItem('eventmate_user', JSON.stringify(user));
}

// Helper to get the user data
export function getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('eventmate_user');
    return userStr ? JSON.parse(userStr) : null;
}

// Helper to remove the user data
export function removeUser(): void {
    localStorage.removeItem('eventmate_user');
}

// Helper to remove the auth token
export function removeToken(): void {
    localStorage.removeItem('eventmate_token');
}

function isAuthError(message: string): boolean {
    return message === 'Token expired' || message === 'Invalid token' || message === 'No token provided';
}

// Generic fetch wrapper
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });
    } catch (error) {
        const isNetworkError =
            error instanceof TypeError &&
            (error.message === 'Failed to fetch' || error.message.includes('NetworkError'));

        if (isNetworkError) {
            throw new Error(
                'Cannot reach the EventMate API. Start the backend with: cd backend && npm run dev'
            );
        }
        throw error;
    }

    // Handle 401 - Unauthorized
    if (response.status === 401) {
        const data = await response.json().catch(() => ({ message: 'Unauthorized' }));
        
        if (isAuthError(data.message)) {
            removeToken();
            removeUser();
        }
        
        const error: any = new Error(data.message || 'Unauthorized');
        error.errors = data.errors;
        throw error;
    }

    const data = await response.json();

    if (!response.ok) {
        const error: any = new Error(data.message || 'An error occurred');
        error.errors = data.errors;
        error.needsVerification = data.needsVerification;
        throw error;
    }

    return data;
}

// ============ AUTH API ============

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        };
        token: string;
    };
}

export const authApi = {
    login: (credentials: LoginRequest) =>
        fetchApi<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        }),

    register: (userData: RegisterRequest) =>
        fetchApi<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    verify: (email: string, code: string) =>
        fetchApi<{
            success: boolean;
            message: string;
            data?: {
                user: { id: number; name: string; email: string; role: string };
                token: string;
            };
        }>('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        }),

    getCurrentUser: () =>
        fetchApi<{ success: boolean; data: { user: any } }>('/auth/me'),

    forgotPassword: (email: string) =>
        fetchApi<{ success: boolean; message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    resetPassword: (data: any) =>
        fetchApi<{ success: boolean; message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    resendOtp: (email: string, type: 'verification' | 'reset') =>
        fetchApi<{ success: boolean; message: string }>('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ email, type }),
        }),
};

// ============ USER API ============

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
    phone?: string | null;
    bio?: string | null;
    created_at: string;
}

export const userApi = {
    getProfile: () =>
        fetchApi<{ success: boolean; data: { user: UserProfile } }>('/user/profile'),

    updateProfile: (data: { name?: string; phone?: string; bio?: string }) =>
        fetchApi<{ success: boolean; data: { user: UserProfile } }>('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    uploadAvatar: (file: File): Promise<{ success: boolean; message: string; data: { user: UserProfile } }> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(`${API_BASE_URL}/user/avatar`, {
            method: 'POST',
            headers,
            body: formData,
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            return data;
        });
    },

    changePassword: (currentPassword: string, newPassword: string) =>
        fetchApi<{ success: boolean; message: string }>('/user/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        }),
};

// ============ EVENTS API ============

export interface Event {
    id: number;
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    location_venue: string;
    location_latitude?: number | null;
    location_longitude?: number | null;
    organizer_id: number;
    organizer_name?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    capacity: number;
    is_paid: boolean;
    image_url?: string;
    city?: string;
    country?: string;
    created_at: string;
    updated_at: string;
    registration_count?: number;
    min_price?: number;
    discount_type?: string;
    discount_value?: number;
    original_price?: number;
    discount_percentage?: number;
    discounted_price?: number;
}

export interface EventsResponse {
    success: boolean;
    data: {
        events: Event[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface EventResponse {
    success: boolean;
    data: {
        event: Event;
    };
}

export interface OrganizerEventsResponse {
    success: boolean;
    data: {
        events: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export const eventsApi = {
    getAll: (params?: {
        category?: string;
        date?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) => {
        const searchParams = new URLSearchParams();
        if (params?.category) searchParams.set('category', params.category);
        if (params?.date) searchParams.set('date', params.date);
        if (params?.search) searchParams.set('search', params.search);
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());

        const query = searchParams.toString();
        return fetchApi<EventsResponse>(`/events${query ? `?${query}` : ''}`);
    },

    getById: (id: number) =>
        fetchApi<EventResponse>(`/events/${id}`),

    create: (eventData: Partial<Event>) =>
        fetchApi<EventResponse>('/events', {
            method: 'POST',
            body: JSON.stringify(eventData),
        }),

    update: (id: number, eventData: Partial<Event>) =>
        fetchApi<EventResponse>(`/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        }),

    delete: (id: number) =>
        fetchApi<{ success: boolean }>(`/events/${id}`, {
            method: 'DELETE',
        }),

    getOrganizerEvents: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        const query = searchParams.toString();
        return fetchApi<OrganizerEventsResponse>(`/events/organizer/my-events${query ? `?${query}` : ''}`);
    },

    updateEvent: (eventId: number, eventData: any) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        }),

    getOrganizerRegistrations: (filters?: { event_id?: number | string; status?: string; page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (filters?.event_id) searchParams.set('event_id', filters.event_id.toString());
        if (filters?.status && filters.status !== 'all') searchParams.set('status', filters.status);
        if (filters?.page) searchParams.set('page', filters.page.toString());
        if (filters?.limit) searchParams.set('limit', filters.limit.toString());
        const query = searchParams.toString();
        return fetchApi<{
            success: boolean;
            data: {
                registrations: Array<{
                    id: number;
                    user_id: number;
                    event_id: number;
                    status: string;
                    created_at: string;
                    user_name: string;
                    user_email: string;
                    event_title: string;
                    ticket_type: string | null;
                    paid_amount: number | null;
                }>;
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    totalPages: number;
                };
            };
        }>(`/events/organizer/registrations${query ? `?${query}` : ''}`);
    },

    updateRegistrationStatus: (registrationId: number, status: string) =>
        fetchApi<{ success: boolean; message: string }>(`/events/registrations/${registrationId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    getOrganizerStats: () =>
        fetchApi<{
            success: boolean;
            data: {
                total_events: number;
                pending_events: number;
                active_events: number;
                total_attendees: number;
                total_revenue: number;
            }
        }>('/events/organizer/stats'),

    getOrganizerTickets: (params?: { page?: number; limit?: number }) => {
        const query = params ? new URLSearchParams(params as any).toString() : '';
        return fetchApi<{ success: boolean; data: { tickets: any[]; pagination: any } }>(
            `/events/organizer/tickets${query ? `?${query}` : ''}`
        );
    },

    updateTicketCategory: (ticketId: number, data: { name: string; price: string; capacity: string; discount_type?: string; discount_value?: string; discount_percentage?: string }) =>
        fetchApi<{ success: boolean; message: string }>(`/events/ticket-categories/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteTicketCategory: (ticketId: number) =>
        fetchApi<{ success: boolean; message: string }>(`/events/ticket-categories/${ticketId}`, {
            method: 'DELETE',
        }),

    rsvp: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/rsvp`, {
            method: 'POST',
        }),

    cancelRsvp: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/register`, {
            method: 'DELETE',
        }),

    getTicketCategories: (eventId: number) =>
        fetchApi<{ success: boolean; data: { categories: any[] } }>(`/events/${eventId}/ticket-categories`),

    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        // Custom fetch for multipart/form-data as fetchApi sets Content-Type to application/json
        const token = getToken();
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        return fetch(`${API_BASE_URL}/events/upload`, {
            method: 'POST',
            headers,
            body: formData,
        }).then(async res => {
            if (res.status === 401) {
                const data = await res.json().catch(() => ({ message: 'Unauthorized' }));
                
                if (isAuthError(data.message)) {
                    removeToken();
                    removeUser();
                }
                throw new Error(data.message || 'Unauthorized');
            }
            return res.json();
        }) as Promise<{ success: boolean; data: { imageUrl: string } }>;
    },
};

// ============ REGISTRATIONS API ============

export interface Registration {
    id: number;
    event_id: number;
    user_id: number;
    status: string;
    created_at: string;
}

export const registrationsApi = {
    getMyEvents: () =>
        fetchApi<{ success: boolean; data: { events: any[] } }>('/user/my-events'),

    register: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/register`, {
            method: 'POST',
        }),

    purchase: (eventId: number, data: { ticket_category_id: number; payment_method: string; transaction_ref: string }) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/purchase`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    cancelRegistration: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/register`, {
            method: 'DELETE',
        }),
};

// ============ PUBLIC API ============

export const publicApi = {
    getStats: () =>
        fetchApi<{
            success: boolean;
            data: {
                stats: {
                    total_users: number;
                    total_events: number;
                    total_registrations: number;
                }
            }
        }>('/public/stats'),

    sendContactMessage: (data: { name: string; email: string; subject: string; message: string }) =>
        fetchApi<{ success: boolean; message: string }>('/public/contact', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============ FAVORITES API ============

export const favoritesApi = {
    getMyFavorites: () =>
        fetchApi<{ success: boolean; data: { favorites: any[] } }>('/user/favorites'),

    addFavorite: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/favorite`, {
            method: 'POST',
        }),

    removeFavorite: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/events/${eventId}/favorite`, {
            method: 'DELETE',
        }),

    getFavorites: () =>
        fetchApi<{ success: boolean; data: { events: any[] } }>('/user/favorites'),
};

// ============ NOTIFICATIONS API ============

export interface Notification {
    id: number;
    user_id: number;
    message: string;
    is_read: boolean;
    sent_at: string;
}

export const notificationsApi = {
    getMyNotifications: (role?: string) =>
        fetchApi<{ success: boolean; data: { notifications: Notification[] } }>(
            role ? `/user/notifications?role=${role}` : '/user/notifications'
        ),

    markAsRead: (notificationId: number) =>
        fetchApi<{ success: boolean }>(`/user/notifications/${notificationId}/read`, {
            method: 'PATCH',
        }),

    markAllAsRead: () =>
        fetchApi<{ success: boolean }>('/user/notifications/read-all', {
            method: 'PATCH',
        }),

    send: (userId: number | null, event_id: number | null, message: string) => {
        const body: any = { message };
        if (userId) body.user_id = userId;
        if (event_id) body.event_id = event_id;
        return fetchApi<{ success: boolean }>('/notifications/send', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    sendBulk: (user_ids: number[], message: string) =>
        fetchApi<{ success: boolean }>('/notifications/send-bulk', {
            method: 'POST',
            body: JSON.stringify({ user_ids, message }),
        }),

    getTemplates: () =>
        fetchApi<{ success: boolean; data: { templates: any[] } }>('/notifications/templates'),
};

// ============ ADMIN API ============

export interface AdminStats {
    total_users: number;
    total_events: number;
    approved_events: number;
    pending_events: number;
    total_registrations: number;
    users_by_role: { role: string; count: number }[];
    events_by_status: { status: string; count: number }[];
}

export const adminApi = {
    getStats: () =>
        fetchApi<{ success: boolean; data: { stats: AdminStats } }>('/admin/stats'),

    getPendingEvents: (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { events: any[]; pagination: any } }>(`/admin/pending-events${query ? `?${query}` : ''}`);
    },

    updateEventStatus: (eventId: number, status: string) =>
        fetchApi<{ success: boolean }>(`/admin/events/${eventId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    deleteEvent: (eventId: number) =>
        fetchApi<{ success: boolean }>(`/admin/events/${eventId}`, {
            method: 'DELETE',
        }),

    getAuditLogs: (params?: { page?: number; limit?: number; category?: string; status?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.category) searchParams.set('category', params.category);
        if (params?.status) searchParams.set('status', params.status);
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { logs: any[]; stats: any; total: number; pagination: any } }>(`/admin/audit${query ? `?${query}` : ''}`);
    },

    getEvents: (params?: { page?: number; limit?: number; status?: string; category?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.status) searchParams.set('status', params.status);
        if (params?.category) searchParams.set('category', params.category);
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { events: any[]; pagination: any } }>(`/admin/events${query ? `?${query}` : ''}`);
    },

    getUserDetails: (userId: number) =>
        fetchApi<{ success: boolean; data: { user: any; events_organized: any[]; events_booked: any[]; stats: any } }>(`/admin/users/${userId}`),

    getUsers: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.role) searchParams.set('role', params.role);
        if (params?.status) searchParams.set('status', params.status);
        if (params?.search) searchParams.set('search', params.search);
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { users: any[]; pagination: any } }>(`/admin/users${query ? `?${query}` : ''}`);
    },

    updateUserRole: (userId: number, role: string) =>
        fetchApi<{ success: boolean }>(`/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),

    updateUserStatus: (userId: number, status: string) =>
        fetchApi<{ success: boolean }>(`/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    updateUser: (userId: number, data: { name?: string; role?: string; status?: string }) =>
        fetchApi<{ success: boolean; data: { user: any } }>(`/admin/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    getReports: (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.status) searchParams.set('status', params.status);
        if (params?.type) searchParams.set('type', params.type);
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { reports: any[]; pagination: any } }>(`/admin/reports${query ? `?${query}` : ''}`);
    },

    updateReportStatus: (reportId: number, status: string) =>
        fetchApi<{ success: boolean }>(`/admin/reports/${reportId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    deleteUser: (userId: number) =>
        fetchApi<{ success: boolean }>(`/admin/users/${userId}`, {
            method: 'DELETE',
        }),

    getLogs: (params?: { page?: number; limit?: number; user_id?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.user_id) searchParams.set('user_id', params.user_id.toString());
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { logs: any[]; pagination: any } }>(`/admin/logs${query ? `?${query}` : ''}`);
    },

    getRegistrations: (params?: { page?: number; limit?: number; event_id?: number; status?: string; user_id?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set('page', params.page.toString());
        if (params?.limit) searchParams.set('limit', params.limit.toString());
        if (params?.event_id) searchParams.set('event_id', params.event_id.toString());
        if (params?.status) searchParams.set('status', params.status);
        if (params?.user_id) searchParams.set('user_id', params.user_id.toString());
        const query = searchParams.toString();
        return fetchApi<{ success: boolean; data: { registrations: any[]; pagination: any } }>(`/admin/registrations${query ? `?${query}` : ''}`);
    },

    updateRegistrationStatus: (registrationId: number, status: string) =>
        fetchApi<{ success: boolean }>(`/admin/registrations/${registrationId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
};
