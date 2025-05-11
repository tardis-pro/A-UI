import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { AxiosHeaders, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { store } from '../../state/store';
import { sendChatMessage, getConversation } from '../api';

// Mock axios with proper types
const mockAxios = {
    create: vi.fn(() => ({
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() },
        },
        post: vi.fn(),
        get: vi.fn(),
    })),
};

vi.mock('axios', () => ({
    default: mockAxios,
}));

// Mock store
vi.mock('../../state/store', () => ({
    store: {
        dispatch: vi.fn(),
        getState: vi.fn(() => ({
            api: {
                isConnected: true,
                wsConnected: true,
                loading: {},
                errors: {},
            },
        })),
    },
}));

describe('API Service', () => {
    const mockMessage = { text: 'Hello', timestamp: new Date().toISOString() };
    const mockConversation = {
        id: '1',
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messages: [mockMessage],
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('sendChatMessage', () => {
        it('sends message and updates store correctly', async () => {
            const mockPost = mockAxios.create().post;
            mockPost.mockResolvedValueOnce({
                data: { response: mockMessage },
            });

            const result = await sendChatMessage('Hello');

            expect(mockPost).toHaveBeenCalledWith('/chat', {
                message: 'Hello',
            });
            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'api/setLoading',
                    payload: { key: 'sendChatMessage', isLoading: true },
                })
            );
            expect(result).toEqual({
                ...mockMessage,
                timestamp: expect.any(Date),
            });
        });

        it('handles errors correctly', async () => {
            const mockPost = mockAxios.create().post;
            mockPost.mockRejectedValueOnce(new Error('Network error'));

            await expect(sendChatMessage('Hello')).rejects.toThrow('Failed to send chat message');
            expect(store.dispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'api/setError',
                    payload: { key: 'sendChatMessage', error: expect.any(String) },
                })
            );
        });
    });

    describe('getConversation', () => {
        it('fetches conversation with caching', async () => {
            const mockGet = mockAxios.create().get;
            mockGet.mockResolvedValueOnce({
                data: mockConversation,
            });

            const result = await getConversation();
            expect(result).toEqual({
                ...mockConversation,
                startTime: expect.any(Date),
                lastActivity: expect.any(Date),
                messages: [
                    {
                        ...mockMessage,
                        timestamp: expect.any(Date),
                    },
                ],
            });

            // Should use cached result
            const cachedResult = await getConversation();
            expect(mockGet).toHaveBeenCalledTimes(1);
            expect(cachedResult).toEqual(result);
        });

        it('handles 404 gracefully', async () => {
            const mockGet = mockAxios.create().get;
            mockGet.mockRejectedValueOnce({
                response: { status: 404 },
            });

            const result = await getConversation();
            expect(result).toBeNull();
        });
    });

    describe('Request Interceptors', () => {
        it('adds auth token to requests', () => {
            const token = 'test-token';
            vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(token);

            const requestInterceptor = mockAxios.create().interceptors.request.use.mock.calls[0][0];
            const headers = new Map() as unknown as AxiosHeaders;
            const config: InternalAxiosRequestConfig = {
                headers,
                method: 'GET',
                url: '/',
            };

            const result = requestInterceptor(config);
            expect(result.headers?.Authorization).toBe(`Bearer ${token}`);
        });
    });
});