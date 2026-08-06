/**
 * WebSocket hook — manages the WebSocket connection and provides
 * real-time data to components via React state.
 */
import { useEffect, useRef, useState } from 'react';
import VppWebSocketClient from '../services/websocketClient';
import type {
  BuildingTwin,
  Decision,
  FullCycleResult,
  ReliabilityStatus,
  WebSocketMessage,
} from '../types';

const WS_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000') + '/ws';

export interface VppState {
  buildings: BuildingTwin[];
  latestDecisions: Decision[];
  latestCycle: FullCycleResult | null;
  reliability: ReliabilityStatus | null;
  connected: boolean;
  cycleCount: number;
  error: string | null;
}

const INITIAL_STATE: VppState = {
  buildings: [],
  latestDecisions: [],
  latestCycle: null,
  reliability: null,
  connected: false,
  cycleCount: 0,
  error: null,
};

export function useVppWebSocket() {
  const [state, setState] = useState<VppState>(INITIAL_STATE);

  const wsRef = useRef<VppWebSocketClient | null>(null);

  useEffect(() => {
    const ws = new VppWebSocketClient(WS_URL);
    wsRef.current = ws;

    const updateConnected = (msg: WebSocketMessage) => {
      if (msg.type !== 'error') {
        setState(prev => (prev.connected && !prev.error ? prev : { ...prev, connected: true, error: null }));
      }
    };

    const onTwinUpdate = (msg: WebSocketMessage) => {
      if (msg.type !== 'twin_update') return;
      const buildings = Object.values(msg.buildings);
      setState(prev => ({
        ...prev,
        buildings,
        cycleCount: msg.cycle_number || prev.cycleCount,
      }));
    };

    const onFullCycle = (msg: WebSocketMessage) => {
      if (msg.type !== 'full_cycle') return;
      const result = msg.result;
      setState(prev => ({
        ...prev,
        latestCycle: result,
        latestDecisions: result?.decisions || prev.latestDecisions,
        reliability: result?.reliability || prev.reliability,
        cycleCount: msg.cycle_number || prev.cycleCount,
      }));
    };

    const onError = (msg: WebSocketMessage) => {
      if (msg.type !== 'error') return;
      setState(prev => ({ ...prev, connected: false, error: msg.message || 'WebSocket error' }));
    };

    // Any valid message confirms we are connected
    const unsubAll = ws.subscribe('*', updateConnected);
    const unsubTwin = ws.subscribe('twin_update', onTwinUpdate);
    const unsubCycle = ws.subscribe('full_cycle', onFullCycle);
    const unsubError = ws.subscribe('error', onError);

    ws.connect();

    return () => {
      unsubAll();
      unsubTwin();
      unsubCycle();
      unsubError();
      ws.disconnect();
    };
  }, []);

  return state;
}