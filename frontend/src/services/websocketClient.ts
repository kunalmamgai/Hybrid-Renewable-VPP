/**
 * WebSocket client for real-time VPP updates.
 * Connects to the backend's /ws endpoint and dispatches
 * messages to registered callbacks.
 */
import type { WebSocketMessage } from '../types';
import { AUTH_TOKEN_KEY } from './apiClient';

export type MessageHandler = (msg: WebSocketMessage) => void;

class VppWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms
  private reconnectTimer: number | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    // The backend requires a valid JWT on /ws (?token=<JWT>).
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    const url = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const msg: WebSocketMessage = JSON.parse(event.data);
      this.dispatch(msg);
    };

    this.ws.onerror = (error) => {
      this.dispatch({ type: 'error', message: String(error) } as WebSocketMessage);
    };

    this.ws.onclose = (event) => {
      // 4401 = authentication rejected; retrying with the same token is futile
      if (event.code === 4401) {
        this.dispatch({ type: 'error', message: 'WebSocket authentication failed' } as WebSocketMessage);
        return;
      }
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;
        this.reconnectTimer = window.setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, delay);
      }
    };
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      // Prevent an intentional close from scheduling a reconnect
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        this.handlers.set(type, handlers.filter(h => h !== handler));
      }
    };
  }

  private dispatch(msg: WebSocketMessage): void {
    const handlers = this.handlers.get(msg.type);
    if (handlers) {
      handlers.forEach(h => h(msg));
    }
    // Also dispatch to 'all' handler
    const allHandlers = this.handlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(h => h(msg));
    }
  }
}

export default VppWebSocketClient;
