/**
 * WebSocket hook — manages the WebSocket connection and provides
 * real-time data to components via React state.
 */
import { useEffect, useRef, useState } from 'react';
import VppWebSocketClient, { type MessageHandler } from '../services/websocketClient';
import type {
  BuildingTwin,
  Decision,
  FullCycleResult,
  ReliabilityStatus,
  WebSocketMessage,
} from '../types';

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000') + '/ws';

interface VppState {
  buildings: BuildingTwin[];
  latestDecisions: Decision[];
  latestCycle: FullCycleResult | null;
  reliability: ReliabilityStatus | null;
  connected: boolean;
  cycleCount: number;
  error: string | null;
}

export function useVppWebSocket() {
  const [state, setState] = useState<VppState>({
    buildings: [],
    latestDecisions: [],
    latestCycle: null,
    reliability: null,
    connected: false,
    cycleCount: 0,
    error: null,
  });

  const wsRef = useRef<VppWebSocketClient | null>(null);

  useEffect(() => {
    const ws = new VppWebSocketClient(WS_URL);
    wsRef.current = ws;

    const unsubAll = ws.subscribe('*', (msg: WebSocketMessage) => {
      // Any valid message means we are connected
      if (msg.type !== 'error') {
        setState(prev => ({ ...prev, connected: true, error: null }));
      }

      if (msg.type === 'twin_update') {
        const buildings: BuildingTwin[] = Object.values(msg.buildings || {}) as BuildingTwin[];
        setState(prev => ({
          ...prev,
          buildings,
          cycleCount: msg.cycle_number || prev.cycleCount,
        }));
      } else if (msg.type === 'full_cycle') {
        const result = msg.result as FullCycleResult;
        setState(prev => ({
          ...prev,
          latestCycle: result,
          latestDecisions: result?.decisions || prev.latestDecisions,
          reliability: result?.reliability || prev.reliability,
          cycleCount: msg.cycle_number || prev.cycleCount,
        }));
      } else if (msg.type === 'error') {
        setState(prev => ({ ...prev, connected: false, error: msg.message || 'WebSocket error' }));
      }
    });

    ws.connect();

    const unsubDecision = ws.subscribe('decision', (msg: WebSocketMessage) => {
      const decision = msg.data as Decision;
      if (decision) {
        setState(prev => ({
          ...prev,
          latestDecisions: [decision, ...prev.latestDecisions.slice(0, 9)],
        }));
      }
    });

    return () => {
      unsubAll();
      unsubDecision();
      ws.disconnect();
    };
  }, []);

  return state;
}
