/**
 * API Client
 * Handles all API requests to backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to get headers with optional authentication
const getHeaders = (token?: string) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
    }
    return data;
};

export const api = {
    // Auth endpoints
    auth: {
        register: async (data: any) => {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        login: async (data: any) => {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        logout: async (token: string) => {
            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        getProfile: async (token: string) => {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        }
    },
        
    content: {
        getPublished: async (filters?: any) => {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${API_URL}/api/content/published?${params}`);
            return handleResponse(response);
        },

        search: async (params: any) => {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/api/content/search?${queryString}`);
            return handleResponse(response);
        },
        
        getById: async (id: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}`);
            return handleResponse(response);
        },
        
        getBySlug: async (slug: string) => {
            const response = await fetch(`${API_URL}/api/content/slug/${slug}`);
            return handleResponse(response);
        },
        
        getByCategory: async (categorySlug: string, limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            const response = await fetch(`${API_URL}/api/content/category/${categorySlug}${params}`);
            return handleResponse(response);
        },
        
        getByAuthor: async (authorId: string) => {
            const response = await fetch(`${API_URL}/api/content/author/${authorId}`);
            return handleResponse(response);
        },
        
        getMyDrafts: async (token: string) => {
            const response = await fetch(`${API_URL}/api/content/my/drafts`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        create: async (data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/content`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        update: async (id: string, data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        delete: async (id: string, token: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}`, {
                method: 'DELETE',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        submitForReview: async (id: string, token: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}/submit`, {
                method: 'POST',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        // Admin endpoints
        getPending: async (token: string) => {
            const response = await fetch(`${API_URL}/api/content/admin/pending`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        approve: async (id: string, token: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}/approve`, {
                method: 'POST',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        reject: async (id: string, reason: string, token: string) => {
            const response = await fetch(`${API_URL}/api/content/${id}/reject`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify({ reason })
            });
            return handleResponse(response);
        }
    },
    
    // Series endpoints
    series: {
        getPublished: async (filters?: any) => {
            const params = new URLSearchParams(filters);
            const response = await fetch(`${API_URL}/api/series/published?${params}`);
            return handleResponse(response);
        },

        getById: async (id: string) => {
            const response = await fetch(`${API_URL}/api/series/${id}`);
            return handleResponse(response);
        },

        getBySlug: async (slug: string) => {
            const response = await fetch(`${API_URL}/api/series/slug/${slug}`);
            return handleResponse(response);
        },

        getChapters: async (seriesId: string) => {
            const response = await fetch(`${API_URL}/api/series/${seriesId}/chapters`);
            return handleResponse(response);
        },

        getByAuthor: async (authorId: string) => {
            const response = await fetch(`${API_URL}/api/series/author/${authorId}`);
            return handleResponse(response);
        },

        create: async (data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/series`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        update: async (id: string, data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/series/${id}`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        delete: async (id: string, token: string) => {
            const response = await fetch(`${API_URL}/api/series/${id}`, {
                method: 'DELETE',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        }
    },
    
    // Categories endpoints
    categories: {
        getAll: async (includeCount?: boolean) => {
            const params = includeCount ? '?includeCount=true' : '';
            const response = await fetch(`${API_URL}/api/categories${params}`);
            return handleResponse(response);
        },
        
        getBySlug: async (slug: string) => {
            const response = await fetch(`${API_URL}/api/categories/${slug}`);
            return handleResponse(response);
        },
        
        getContent: async (slug: string, limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            const response = await fetch(`${API_URL}/api/categories/${slug}/content${params}`);
            return handleResponse(response);
        }
    },
    
    // Users endpoints
    users: {
        getProfile: async (username: string) => {
            const response = await fetch(`${API_URL}/api/users/${username}`);
            return handleResponse(response);
        },
        
        updateProfile: async (userId: string, data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        follow: async (userId: string, token: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/follow`, {
                method: 'POST',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        unfollow: async (userId: string, token: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/unfollow`, {
                method: 'POST',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },
        
        getFollowers: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/followers`);
            return handleResponse(response);
        },
        
        getFollowing: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/following`);
            return handleResponse(response);
        },
        
        getContent: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/content`);
            return handleResponse(response);
        },
        
        getSeries: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/users/${userId}/series`);
            return handleResponse(response);
        }
    },
    
    // Reviews endpoints
    reviews: {
        getByContentId: async (contentId: string) => {
            const response = await fetch(`${API_URL}/api/reviews/content/${contentId}`);
            return handleResponse(response);
        },
        
        getByUserId: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/reviews/user/${userId}`);
            return handleResponse(response);
        },
        
        create: async (data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        update: async (id: string, data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/reviews/${id}`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        delete: async (id: string, token: string) => {
            const response = await fetch(`${API_URL}/api/reviews/${id}`, {
                method: 'DELETE',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        }
    },

    // Bookmarks endpoints
    bookmarks: {
        getMyBookmarks: async (token: string) => {
            const response = await fetch(`${API_URL}/api/bookmarks`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },

        addBookmark: async (contentId: string, token: string) => {
            const response = await fetch(`${API_URL}/api/bookmarks`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify({ contentId })
            });
            return handleResponse(response);
        },

        removeBookmark: async (contentId: string, token: string) => {
            const response = await fetch(`${API_URL}/api/bookmarks/${contentId}`, {
                method: 'DELETE',
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },

        checkBookmark: async (contentId: string, token: string) => {
            const response = await fetch(`${API_URL}/api/bookmarks/check/${contentId}`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        }
    },

    // Reading Preferences endpoints
    readingPreferences: {
        getPreferences: async (token: string) => {
            const response = await fetch(`${API_URL}/api/reading-preferences`, {
                headers: getHeaders(token)
            });
            return handleResponse(response);
        },

        updatePreferences: async (data: any, token: string) => {
            const response = await fetch(`${API_URL}/api/reading-preferences`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        }
    }
};
