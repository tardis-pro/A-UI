import { store } from '../state/store';
import { setWsConnection, addChatMessage } from '../state/slices/apiSlice';
import apiReducer from '../state/slices/apiSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../state/store';
import { addNotification } from '../state/slices/notificationSlice';
export class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: number = 1000;
    private messageHandlers: Map<string, (data: any) => void> = new Map();

    constructor(private baseUrl: string = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws') { }

    connect() {
        try {
            this.ws = new WebSocket(this.baseUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleConnectionError();
        }
    }

    private setupEventHandlers() {
        if (!this.ws) return;

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            store.dispatch(setWsConnection(true));
            this.reconnectAttempts = 0;

            // Register message handler for chat messages
            this.registerMessageHandler("chat_message", (data) => {
                console.log("Received chat message:", data);
                store.dispatch(addChatMessage(data));
            });

            // Register generic notification handler
            this.registerMessageHandler("notification", (data) => {
                console.log("Received notification:", data);
                // Dispatch notification to Redux store
                store.dispatch(addNotification(data));
            });

            // Register message handler for code completion events
            this.registerMessageHandler("code_completion", (data) => {
                console.log("Received code completion event:", data);
                store.dispatch(addNotification(data));
            });
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            store.dispatch(setWsConnection(false));
            this.handleConnectionError();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            store.dispatch(setWsConnection(false));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type && this.messageHandlers.has(data.type)) {
                    this.messageHandlers.get(data.type)?.(data.payload);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }

    private handleConnectionError() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
            console.log(`Attempting to reconnect in ${timeout}ms...`);
            setTimeout(() => this.connect(), timeout);
        } else {
            console.error('Max reconnection attempts reached');
        }
    }

    registerMessageHandler(type: string, handler: (data: any) => void) {
        this.messageHandlers.set(type, handler);
    }

    unregisterMessageHandler(type: string) {
        this.messageHandlers.delete(type);
    }

    send(type: string, payload: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Create singleton instance
export const wsService = new WebSocketService();
// Export websocket hooks for React components
export const useWebSocket = () => {
    const isConnected = useSelector((state: RootState) => state.api.wsConnected);


    return {
        isConnected,
        connect: () => wsService.connect(),
        disconnect: () => wsService.disconnect(),
        send: (type: string, payload: any) => wsService.send(type, payload),
        registerHandler: (type: string, handler: (data: any) => void) => {
            wsService.registerMessageHandler(type, handler);
        },
        unregisterHandler: (type: string) => wsService.unregisterMessageHandler(type),
    };
};