/**
 * VPP Data Context — provides a single shared WebSocket connection and its
 * live state to all dashboard consumers. Previously each consumer called
 * useVppWebSocket() directly, opening a duplicate connection per component.
 */
import { createContext, useContext, type ReactNode } from 'react';
import { useVppWebSocket, type VppState } from '../hooks/useVppWebSocket';

export interface VppDataContextValue {
  buildings: VppState['buildings'];
  latestDecisions: VppState['latestDecisions'];
  latestCycle: VppState['latestCycle'];
  reliability: VppState['reliability'];
  connected: VppState['connected'];
  cycleCount: VppState['cycleCount'];
  error: VppState['error'];
}

const VppDataContext = createContext<VppDataContextValue | undefined>(undefined);

export function VppDataProvider({ children }: { children: ReactNode }) {
  const state = useVppWebSocket();
  return <VppDataContext.Provider value={state}>{children}</VppDataContext.Provider>;
}

export function useVppData(): VppDataContextValue {
  const ctx = useContext(VppDataContext);
  if (!ctx) {
    throw new Error('useVppData must be used within a VppDataProvider');
  }
  return ctx;
}