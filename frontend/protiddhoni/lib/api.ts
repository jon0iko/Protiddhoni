/* eslint-disable @next/next/no-img-element, react/no-unescaped-entities, jsx-a11y/alt-text, jsx-a11y/role-has-required-aria-props, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars, prefer-const */
/**
 * API Client
 * Handles all API requests to backend with automatic token injection
 */

import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getClientSessionId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const sessionStorageKey = 'protiddhoni_client_session_id';
    let sessionId = sessionStorage.getItem(sessionStorageKey);

    if (!sessionId) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            sessionId = crypto.randomUUID();
        } else {
            sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
        }
        sessionStorage.setItem(sessionStorageKey, sessionId);
    }

    return sessionId;
};

// Helper function to get headers with automatic token injection
const getHeaders = (token?: string | null): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const sessionId = getClientSessionId();
    if (sessionId) {
        headers['X-Client-Session-Id'] = sessionId;
    }
    
    // Use provided token, or auto-fetch from storage
    const authToken = token !== undefined ? token : getAuthToken();
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
};

// Helper function to handle API responses with better error handling
const handleResponse = async (response: Response) => {
    let data;
    try {
        data = await response.json();
    } catch {
        // Handle non-JSON responses
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return { success: true };
    }
    
    if (!response.ok) {
        // For premium content blocking, return the data instead of throwing
        if (data.isPremiumBlocked) {
            return data;
        }
        
        // Enhanced error message with status code
        const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
        const error: Error & { status?: number; response?: { data: any } } = new Error(errorMessage);
        error.status = response.status;
        error.response = { data };
        throw error;
    }
    
    return data;
};

// Helper function for making authenticated requests
const makeAuthRequest = async (url: string, options: RequestInit = {}, explicitToken?: string | null) => {
    const headers = getHeaders(explicitToken);
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });
    return handleResponse(response);
};

export const api = {
    // Auth endpoints
    auth: {
        register: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/auth/register`, {
                method: 'POST',
                body: JSON.stringify(data)
            }, null); // Explicitly no token for registration
        },
        
        login: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/auth/login`, {
                method: 'POST',
                body: JSON.stringify(data)
            }, null); // Explicitly no token for login
        },
        
        logout: async (token?: string) => {
            return makeAuthRequest(`${API_URL}/api/auth/logout`, {
                method: 'POST'
            }, token);
        },
        
        getProfile: async (token?: string) => {
            return makeAuthRequest(`${API_URL}/api/auth/profile`, {}, token);
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
            return makeAuthRequest(`${API_URL}/api/content/${id}`, {});
        },
        
        getBySlug: async (slug: string) => {
            return makeAuthRequest(`${API_URL}/api/content/slug/${slug}`, {});
        },
        
        getByCategory: async (categorySlug: string, limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            return makeAuthRequest(`${API_URL}/api/content/category/${categorySlug}${params}`, {});
        },
        
        getByAuthor: async (authorId: string, filters?: any) => {
            const params = filters ? `?${new URLSearchParams(filters).toString()}` : '';
            return makeAuthRequest(`${API_URL}/api/content/author/${authorId}${params}`);
        },
        
        getAuthorStats: async (authorId: string) => {
            return makeAuthRequest(`${API_URL}/api/content/stats/author/${authorId}`);
        },
        
        getRecentActivity: async (authorId: string, limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            return makeAuthRequest(`${API_URL}/api/content/recent-activity/${authorId}${params}`);
        },
        
        getMyDrafts: async () => {
            return makeAuthRequest(`${API_URL}/api/content/my/drafts`);
        },
        
        create: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/content`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        update: async (id: string, data: any) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}`, {
                method: 'DELETE'
            });
        },
        
        submitForReview: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}/submit`, {
                method: 'POST'
            });
        },
        
        // Admin endpoints
        getPending: async () => {
            return makeAuthRequest(`${API_URL}/api/content/admin/pending`);
        },
        
        approve: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}/approve`, {
                method: 'POST'
            });
        },
        
        reject: async (id: string, reason: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
        },

        unpublish: async (id: string, reason?: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}/unpublish`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
        },

        republish: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/content/${id}/republish`, {
                method: 'POST'
            });
        },

        getAdminActionHistory: async (page?: number, limit?: number) => {
            const params = new URLSearchParams();
            if (page) params.set('page', String(page));
            if (limit) params.set('limit', String(limit));
            return makeAuthRequest(`${API_URL}/api/content/admin/action-history?${params}`);
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

        create: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/series`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        update: async (id: string, data: any) => {
            return makeAuthRequest(`${API_URL}/api/series/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        delete: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/series/${id}`, {
                method: 'DELETE'
            });
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
        },

        create: async (categoryData: { name: string; description?: string; icon?: string }) => {
            const url = `${API_URL}/api/categories`;
            return makeAuthRequest(url, {
                method: 'POST',
                body: JSON.stringify(categoryData),
            });
        },

        delete: async (categoryId: string) => {
            const url = `${API_URL}/api/categories/${categoryId}`;
            return makeAuthRequest(url, {
                method: 'DELETE',
            });
        },
    },
    
    // Users endpoints
    users: {
        getProfile: async (username: string) => {
            const encodedUsername = encodeURIComponent(username);
            const url = `${API_URL}/api/users/${encodedUsername}`;
            // Uses auto token injection if available
            return makeAuthRequest(url);
        },
        
        updateProfile: async (userId: string, data: any) => {
            return makeAuthRequest(`${API_URL}/api/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        follow: async (userId: string) => {
            return makeAuthRequest(`${API_URL}/api/users/${userId}/follow`, {
                method: 'POST'
            });
        },
        
        unfollow: async (userId: string) => {
            return makeAuthRequest(`${API_URL}/api/users/${userId}/unfollow`, {
                method: 'POST'
            });
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
    
    // Comments endpoints (new comment system with replies)
    comments: {
        getByContentId: async (contentId: string) => {
            const response = await fetch(`${API_URL}/api/comments/content/${contentId}`);
            return handleResponse(response);
        },
        
        getByUserId: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/comments/user/${userId}`);
            return handleResponse(response);
        },
        
        getReplies: async (commentId: string) => {
            const response = await fetch(`${API_URL}/api/comments/replies/${commentId}`);
            return handleResponse(response);
        },
        
        create: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/comments`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        update: async (id: string, data: any) => {
            return makeAuthRequest(`${API_URL}/api/comments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/comments/${id}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Ratings endpoints (separate from comments, anonymous allowed)
    ratings: {
        getStats: async (contentId: string) => {
            // Public endpoint, but auto-inject token if available for user-specific data
            const response = await fetch(`${API_URL}/api/ratings/stats/${contentId}`, {
                headers: getHeaders() // Auto-injects token if available
            });
            return handleResponse(response);
        },
        
        getUserRating: async (contentId: string) => {
            // Auto-inject token if available
            const response = await fetch(`${API_URL}/api/ratings/user/${contentId}`, {
                headers: getHeaders()
            });
            return handleResponse(response);
        },
        
        submit: async (data: { content_id: string; rating: number }, token?: string) => {
            // Can be anonymous or authenticated - auto-inject token if available
            const response = await fetch(`${API_URL}/api/ratings`, {
                method: 'POST',
                headers: getHeaders(token), // Auto-injects token if available
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        
        delete: async (ratingId: string) => {
            return makeAuthRequest(`${API_URL}/api/ratings/${ratingId}`, {
                method: 'DELETE'
            });
        }
    },
    
    // Reviews endpoints (legacy - kept for backward compatibility)
    reviews: {
        getByContentId: async (contentId: string) => {
            const response = await fetch(`${API_URL}/api/reviews/content/${contentId}`);
            return handleResponse(response);
        },
        
        getByUserId: async (userId: string) => {
            const response = await fetch(`${API_URL}/api/reviews/user/${userId}`);
            return handleResponse(response);
        },
        
        create: async (data: any, token?: string) => {
            return makeAuthRequest(`${API_URL}/api/reviews`, {
                method: 'POST',
                body: JSON.stringify(data)
            }, token);
        },
        
        update: async (id: string, data: any, token?: string) => {
            return makeAuthRequest(`${API_URL}/api/reviews/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, token);
        },
        
        delete: async (id: string, token?: string) => {
            return makeAuthRequest(`${API_URL}/api/reviews/${id}`, {
                method: 'DELETE'
            }, token);
        }
    },

    // Bookmarks endpoints
    bookmarks: {
        getMyBookmarks: async () => {
            return makeAuthRequest(`${API_URL}/api/bookmarks`);
        },

        addBookmark: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/bookmarks`, {
                method: 'POST',
                body: JSON.stringify({ contentId })
            });
        },

        removeBookmark: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/bookmarks/${contentId}`, {
                method: 'DELETE'
            });
        },

        checkBookmark: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/bookmarks/check/${contentId}`);
        }
    },

    // Likes endpoints
    likes: {
        getMyLikes: async () => {
            return makeAuthRequest(`${API_URL}/api/likes`);
        },

        addLike: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/likes`, {
                method: 'POST',
                body: JSON.stringify({ contentId })
            });
        },

        removeLike: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/likes/${contentId}`, {
                method: 'DELETE'
            });
        },

        checkLike: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/likes/check/${contentId}`);
        },

        getLikeCount: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/likes/count/${contentId}`);
        }
    },

    // Drafts endpoints
    drafts: {
        getMyDrafts: async () => {
            return makeAuthRequest(`${API_URL}/api/drafts/my`);
        },

        getDraftById: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/drafts/${id}`);
        },

        createDraft: async (data: any) => {
            return makeAuthRequest(`${API_URL}/api/drafts`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        updateDraft: async (id: string, data: any) => {
            return makeAuthRequest(`${API_URL}/api/drafts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        deleteDraft: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/drafts/${id}`, {
                method: 'DELETE'
            });
        }
    },

    // Reading Preferences endpoints
    readingPreferences: {
        getPreferences: async (token?: string) => {
            return makeAuthRequest(`${API_URL}/api/reading-preferences`, {}, token);
        },

        updatePreferences: async (data: any, token?: string) => {
            return makeAuthRequest(`${API_URL}/api/reading-preferences`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }, token);
        }
    },

    // Notifications endpoints
    notifications: {
        getAll: async (limit?: number) => {
            const params = limit ? `?limit=${limit}` : '';
            return makeAuthRequest(`${API_URL}/api/notifications${params}`);
        },

        getUnreadCount: async () => {
            return makeAuthRequest(`${API_URL}/api/notifications/unread-count`);
        },

        markAsRead: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/notifications/${id}/read`, {
                method: 'PUT'
            });
        },

        markAllAsRead: async () => {
            return makeAuthRequest(`${API_URL}/api/notifications/read-all`, {
                method: 'PUT'
            });
        }
    },

    // Push notification endpoints
    push: {
        getVapidPublicKey: async () => {
            const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
            return handleResponse(response);
        },

        subscribe: async (subscription: { endpoint: string; keys: { p256dh?: string; auth?: string } }) => {
            return makeAuthRequest(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                body: JSON.stringify(subscription)
            });
        },

        unsubscribe: async (endpoint: string) => {
            return makeAuthRequest(`${API_URL}/api/push/unsubscribe`, {
                method: 'POST',
                body: JSON.stringify({ endpoint })
            });
        }
    },
    
    // Payments & Wallet endpoints
    payments: {
        getWallet: async () => {
            return makeAuthRequest(`${API_URL}/api/payments/wallet`);
        },
        
        getTransactions: async (limit: number = 20, offset: number = 0) => {
            return makeAuthRequest(`${API_URL}/api/payments/transactions?limit=${limit}&offset=${offset}`);
        },
        
        getPayoutable: async () => {
            return makeAuthRequest(`${API_URL}/api/payments/payoutable`);
        },
        
        getPayoutSimulation: async () => {
            return makeAuthRequest(`${API_URL}/api/payments/payout-simulation`);
        },
        
        processPayout: async (amount?: number) => {
            return makeAuthRequest(`${API_URL}/api/payments/payout`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        },
        
        tipAuthor: async (authorId: string, amount: number) => {
            return makeAuthRequest(`${API_URL}/api/payments/tip/${authorId}`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        },
        
        initiateTopUp: async (data: { amount: number; paymentMethod?: string }) => {
            return makeAuthRequest(`${API_URL}/api/payments/checkout`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    },

    // Content Purchase endpoints
    purchases: {
        checkPurchase: async (contentId: string) => {
            return makeAuthRequest(`${API_URL}/api/purchases/check/${contentId}`);
        },

        purchaseContent: async (contentId: string, amount: number) => {
            return makeAuthRequest(`${API_URL}/api/purchases/${contentId}`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        },

        getUserPurchases: async () => {
            return makeAuthRequest(`${API_URL}/api/purchases`);
        }
    },

    // Quiz endpoints
    quizzes: {
        listPublished: async () => {
            return makeAuthRequest(`${API_URL}/api/quizzes`);
        },

        getPreview: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/quizzes/${id}`);
        },

        start: async (id: string) => {
            return makeAuthRequest(`${API_URL}/api/quizzes/${id}/start`, {
                method: 'POST'
            });
        },

        submit: async (attemptId: string, payload: { answers: Array<{ question_id: string; selected_index: number }>; duration_ms?: number }) => {
            return makeAuthRequest(`${API_URL}/api/quizzes/attempts/${attemptId}/submit`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        },

        getAttempt: async (attemptId: string) => {
            return makeAuthRequest(`${API_URL}/api/quizzes/attempts/${attemptId}`);
        },

        myAttempts: async () => {
            return makeAuthRequest(`${API_URL}/api/quizzes/me/attempts`);
        },

        globalLeaderboard: async (limit: number = 50) => {
            const response = await fetch(`${API_URL}/api/quizzes/leaderboard?limit=${limit}`);
            return handleResponse(response);
        },

        quizLeaderboard: async (id: string, limit: number = 25) => {
            const response = await fetch(`${API_URL}/api/quizzes/${id}/leaderboard?limit=${limit}`);
            return handleResponse(response);
        },

        admin: {
            listAll: async () => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/all`);
            },
            get: async (id: string) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/${id}`);
            },
            create: async (data: {
                title: string;
                description?: string;
                source_material: string;
                difficulty?: 'easy' | 'medium' | 'hard';
                entry_cost?: number;
                reward_per_correct?: number;
                question_count?: number;
                language?: 'bn' | 'en';
            }) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },
            createFromContent: async (
                contentId: string,
                data?: {
                    title?: string;
                    description?: string;
                    difficulty?: 'easy' | 'medium' | 'hard';
                    entry_cost?: number;
                    reward_per_correct?: number;
                    question_count?: number;
                    language?: 'bn' | 'en';
                }
            ) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/from-content/${contentId}`, {
                    method: 'POST',
                    body: JSON.stringify(data || {})
                });
            },
            update: async (id: string, data: Record<string, unknown>) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
            },
            updateQuestion: async (
                questionId: string,
                data: {
                    question_text?: string;
                    options?: string[];
                    correct_index?: number;
                    explanation?: string | null;
                }
            ) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/questions/${questionId}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
            },
            regenerate: async (id: string, data?: { question_count?: number; language?: 'bn' | 'en' }) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/${id}/regenerate`, {
                    method: 'POST',
                    body: JSON.stringify(data || {})
                });
            },
            remove: async (id: string) => {
                return makeAuthRequest(`${API_URL}/api/quizzes/admin/${id}`, {
                    method: 'DELETE'
                });
            }
        }
    },

    // Content Reports endpoints
    reports: {
        create: async (data: {
            content_id: string;
            reason_category: string;
            reason_details?: string;
        }) => {
            return makeAuthRequest(`${API_URL}/api/reports`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        getPending: async () => {
            return makeAuthRequest(`${API_URL}/api/reports/admin/pending`);
        },

        resolve: async (data: {
            content_id: string;
            action: 'takedown' | 'dismiss';
            reason?: string;
        }) => {
            return makeAuthRequest(`${API_URL}/api/reports/admin/resolve`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    }
};
