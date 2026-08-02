/**
 * WebSocket client for real-time VPP updates.
 * Connects to the backend's /ws endpoint and dispatches
 * messages to registered callbacks.
 */
import type {
  WebSocketMessage,
  BuildingTwin,
  Decision,
  FullCycleResult,
  ReliabilityStatus,
} from '../types';

export type MessageHandler = (msg: WebSocketMessage) => void;

class VppWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // ms

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.dispatch({ type: 'health', adapter: { status: 'connected' } } as WebSocketMessage);
    };

    this.ws.onmessage = (event) => {
      const msg: WebSocketMessage = JSON.parse(event.data);
      this.dispatch(msg);
    };

    this.ws.onerror = (error) => {
      this.dispatch({ type: 'error', message: String(error) } as WebSocketMessage);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
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
