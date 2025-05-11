import axios, { AxiosInstance, AxiosError, AxiosDefaults, HeadersDefaults, AxiosHeaderValue } from 'axios';
import { Message, Conversation, MessageRole } from '../../store/types';
import { store } from '../state/store';
import {
    setApiConnection,
    setLoading,
    setError,
    incrementRetry,
    updateLastSync
} from '../state/slices/apiSlice';

type CustomAxiosConfig = Omit<AxiosDefaults, 'headers'> & {
    headers: HeadersDefaults & { [key: string]: AxiosHeaderValue };
    retryAttempts: number;
};

const defaultConfig: AxiosDefaults = {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'common': {
            'Content-Type': 'application/json'
        },
        'delete': {},
        'get': {},
        'head': {},
        'post': {},
        'put': {},
        'patch': {}
    }
};

const customConfig: CustomAxiosConfig = {
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '2', 10), // Configure retry attempts
    headers: {
        'common': {
            'Content-Type': 'application/json'
        },
        'delete': {},
        'get': {},
        'head': {},
        'post': {},
        'put': {},
        'patch': {}
    }
} as CustomAxiosConfig;

// Create axios instance with default config
const api: AxiosInstance = axios.create(Object.assign(defaultConfig, customConfig));

// Add request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Log the request
        console.log(`Requesting ${config.method?.toUpperCase()} ${config.url} with data:`, config.data);
        return config;
    },
    (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // Update API connection status on successful response
        store.dispatch(setApiConnection(true));
        store.dispatch(updateLastSync());
        return response;
    },
    async (error: AxiosError) => {
        const requestId = error.config?.url || 'unknown';
        const baseURL = error.config?.baseURL || '';
        const requestUrl = `${baseURL}${requestId}`;

        // Log the error
        console.error(`API Error for ${requestUrl}:`, error.message, error.response?.data);

        // Update connection status for network errors
        if (error.code === 'ECONNABORTED' || !error.response) {
            store.dispatch(setApiConnection(false));
        }

        // Retry logic for network errors or 5xx responses
        if (error.code === 'ECONNABORTED' || (error.response?.status ?? 0) >= 500) {
            const config = error.config;
            const retryCount = (api.defaults as CustomAxiosConfig).retryAttempts || 2;

            if (!config || (config as any)._retryCount >= retryCount) {
                store.dispatch(setError({
                    key: requestId,
                    error: `Maximum retry attempts reached for ${requestUrl}`
                }));
                return Promise.reject(error);
            }

            store.dispatch(incrementRetry(requestId));
            (config as any)._retryCount = ((config as any)._retryCount || 0) + 1;

            const backoff = Math.pow(2, (config as any)._retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, backoff));

            console.log(`Retrying ${requestUrl} (attempt ${(config as any)._retryCount})`);
            return api(config);
        }

        store.dispatch(setError({
            key: requestId,
            error: `API request failed for ${requestUrl}: ${error.message}`
        }));
        return Promise.reject(error);
    }
);

// API Error class
class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Request caching
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(method: string, url: string, data?: any): string {
    return `${method}:${url}:${data ? JSON.stringify(data) : ''}`;
}

// API methods
// Helper function to wrap API calls with loading and error states
async function withLoadingState<T>(
    key: string,
    apiCall: () => Promise<T>,
    errorMessage: string
): Promise<T> {
    store.dispatch(setLoading({ key, isLoading: true }));
    store.dispatch(setError({ key, error: null }));

    try {
        const result = await apiCall();
        store.dispatch(setLoading({ key, isLoading: false }));
        return result;
    } catch (error) {
        store.dispatch(setLoading({ key, isLoading: false }));
        if (error instanceof AxiosError) {
            const apiError = new ApiError(
                errorMessage,
                error.response?.status,
                error
            );
            store.dispatch(setError({ key, error: apiError.message }));
            throw apiError;
        }
        throw error;
    }
}

export async function sendChatMessage(message: string): Promise<Message> {
    return withLoadingState(
        'sendChatMessage',
        async () => {
            const response = await api.post<{ response: Message }>('/chat', { message });
            return {
                ...response.data.response,
                timestamp: new Date(response.data.response.timestamp)
            };
        },
        'Failed to send chat message'
    );
}

export async function getConversation(): Promise<Conversation | null> {
    const cacheKey = getCacheKey('GET', '/conversation');
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    return withLoadingState(
        'getConversation',
        async () => {
            const response = await api.get<Conversation>('/conversation');

            // Transform dates from strings to Date objects
            const conversation: Conversation = {
                ...response.data,
                startTime: new Date(response.data.startTime),
                lastActivity: new Date(response.data.lastActivity),
                messages: response.data.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            };

            // Cache the response
            cache.set(cacheKey, {
                data: conversation,
                timestamp: Date.now()
            });

            return conversation;
        },
        'Failed to fetch conversation'
    );
}

// Clear cache when needed (e.g., after mutations)
export function clearApiCache(): void {
    cache.clear();
}

export async function getCommandHistory(limit: number = 10): Promise<string[]> {
    return withLoadingState(
        'getCommandHistory',
        async () => {
            const response = await api.get<string[]>(`/command_history?limit=${limit}`);
            return response.data;
        },
        'Failed to fetch command history'
    );
}

export default api;