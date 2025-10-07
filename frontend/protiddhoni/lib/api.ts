/**
 * API Client
 * Handles all API requests to backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
    // Auth endpoints
    auth: {
        register: (data: any) => fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
        login: (data: any) => fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }),
    },
    
    // Content endpoints
    content: {
        getPublished: () => fetch(`${API_URL}/api/content/published`),
        getById: (id: string) => fetch(`${API_URL}/api/content/${id}`),
        create: (data: any, token: string) => fetch(`${API_URL}/api/content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        }),
    },
    
    // More endpoints to be added...
};
