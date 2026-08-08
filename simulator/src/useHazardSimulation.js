import { useCallback, useEffect, useRef, useState } from "react";
import { HAZARD_SCENARIOS } from "./engineeringEngine";

const IDLE_HAZARD = { type: null, label: "", phase: "idle", startedAt: null };

export default function useHazardSimulation() {
  const [hazard, setHazard] = useState(IDLE_HAZARD);
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const runHazard = useCallback((type) => {
    const scenario = HAZARD_SCENARIOS[type];
    if (!scenario) return;
    clearTimers();
    const startedAt = Date.now();
    setHazard({ type, label: scenario.label, phase: "warning", startedAt });
    timers.current.push(
      window.setTimeout(
        () => setHazard({ type, label: scenario.label, phase: "fault", startedAt }),
        900,
      ),
      window.setTimeout(
        () => setHazard({ type, label: scenario.label, phase: "tripped", startedAt }),
        scenario.tripDelay,
      ),
    );
  }, [clearTimers]);

  const resetHazard = useCallback(() => {
    clearTimers();
    setHazard((current) =>
      current.phase === "idle" ? IDLE_HAZARD : { ...current, phase: "recovering" },
    );
    timers.current.push(
      window.setTimeout(() => setHazard(IDLE_HAZARD), 1100),
    );
  }, [clearTimers]);

  return { hazard, runHazard, resetHazard };
}
