/**
 * WebSocket hook — manages the WebSocket connection and provides
 * real-time data to components via React state.
 */
import { useEffect, useRef, useState } from 'react';
import VppWebSocketClient from '../services/websocketClient';
import { AUTH_TOKEN_KEY } from '../services/apiClient';
import { DEMO_BUILDINGS } from '../data/demoBuildings';
import type {
  BuildingTwin,
  Decision,
  FullCycleResult,
  ReliabilityStatus,
  WebSocketMessage,
} from '../types';

const STATIC_DEMO_MODE = import.meta.env.PROD && !import.meta.env.VITE_WS_URL;
const WS_BASE_URL = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000').replace(/\/$/, '');
const WS_URL = `${WS_BASE_URL}/ws`;

export interface VppState {
  buildings: BuildingTwin[];
  latestDecisions: Decision[];
  latestCycle: FullCycleResult | null;
  reliability: ReliabilityStatus | null;
  connected: boolean;
  cycleCount: number;
  error: string | null;
  /** Live grid frequency (Hz) from adapter health telemetry */
  gridFrequencyHz: number | null;
}

const INITIAL_STATE: VppState = {
  buildings: STATIC_DEMO_MODE ? DEMO_BUILDINGS : [],
  latestDecisions: [],
  latestCycle: null,
  reliability: null,
  connected: STATIC_DEMO_MODE,
  cycleCount: STATIC_DEMO_MODE ? 1 : 0,
  error: null,
  gridFrequencyHz: null,
};

export function useVppWebSocket() {
  const [state, setState] = useState<VppState>(INITIAL_STATE);

  const wsRef = useRef<VppWebSocketClient | null>(null);

  useEffect(() => {
    if (STATIC_DEMO_MODE) return undefined;

    // The backend rejects unauthenticated /ws connections — skip connecting
    // entirely on public pages so the landing stays clean until login.
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return undefined;

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

    // Grid frequency rides on the adapter health broadcast
    const onHealth = (msg: WebSocketMessage) => {
      if (msg.type !== 'health') return;
      const freq = msg.adapter?.grid_frequency_hz;
      if (typeof freq === 'number' && Number.isFinite(freq)) {
        setState(prev => ({ ...prev, gridFrequencyHz: freq }));
      }
    };

    // Any valid message confirms we are connected
    const unsubAll = ws.subscribe('*', updateConnected);
    const unsubTwin = ws.subscribe('twin_update', onTwinUpdate);
    const unsubCycle = ws.subscribe('full_cycle', onFullCycle);
    const unsubHealth = ws.subscribe('health', onHealth);
    const unsubError = ws.subscribe('error', onError);

    ws.connect();

    return () => {
      unsubAll();
      unsubTwin();
      unsubCycle();
      unsubHealth();
      unsubError();
      ws.disconnect();
    };
  }, []);

  return state;
}
