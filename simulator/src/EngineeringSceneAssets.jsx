import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const VIT_SITES = {
  north: [-15, 0.25, -225],
  south: [-35, 0.25, 185],
  east: [265, 0.25, -30],
  west: [-275, 0.25, 16],
  energy: [-170, 0.25, 128],
};

const REGIONAL_SITES = {
  north: [5, 0.25, -182],
  south: [-12, 0.25, 178],
  east: [188, 0.25, 24],
  west: [-188, 0.25, 16],
  energy: [-156, 0.25, 126],
};

function ProposedBuilding({ proposal, position, index }) {
  const group = useRef();
  const width = THREE.MathUtils.clamp(Math.sqrt(proposal.footprint) * 0.42, 13, 38);
  const depth = THREE.MathUtils.clamp(proposal.footprint / Math.max(width * 42, 1), 10, 30);
  const height = THREE.MathUtils.clamp(proposal.floors * 3.35, 4.5, 48);
  const panelColumns = Math.max(2, Math.min(7, Math.round(width / 4.5)));

  useFrame(({ clock }) => {
    if (!group.current) return;
    const target = 1 + Math.sin(clock.elapsedTime * 1.4 + index) * 0.008;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 0.05);
  });

  return (
    <group ref={group} position={position} rotation={[0, index % 2 ? 0.08 : -0.05, 0]}>
      <mesh position={[0, 0.16, 0]} receiveShadow>
        <boxGeometry args={[width + 5, 0.3, depth + 5]} />
        <meshStandardMaterial color="#8bb8ae" transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, height / 2 + 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={proposal.template.color}
          roughness={0.6}
          metalness={0.08}
          transparent
          opacity={0.93}
        />
      </mesh>
      {Array.from({ length: Math.min(8, proposal.floors * 2) }, (_, floorIndex) => {
        const row = Math.floor(floorIndex / 2);
        const side = floorIndex % 2 ? 1 : -1;
        return (
          <mesh
            key={`window-row-${floorIndex}`}
            position={[side * (width / 2 + 0.012), 2.2 + row * 3.25, 0]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[Math.max(3, depth * 0.68), 1.15, 0.04]} />
            <meshStandardMaterial color="#bce6ef" emissive="#4c8d9e" emissiveIntensity={0.28} />
          </mesh>
        );
      })}
      <mesh position={[0, height + 0.56, 0]} castShadow>
        <boxGeometry args={[width + 0.8, 0.72, depth + 0.8]} />
        <meshStandardMaterial color="#475b61" roughness={0.82} />
      </mesh>
      {Array.from({ length: panelColumns }, (_, panelIndex) => (
        <mesh
          key={`proposal-panel-${panelIndex}`}
          position={[
            (panelIndex - (panelColumns - 1) / 2) * Math.min(4.2, width / panelColumns),
            height + 1.05,
            0,
          ]}
          rotation={[-0.13, 0, 0]}
        >
          <boxGeometry args={[Math.min(3.5, width / panelColumns - 0.3), 0.12, Math.max(3.2, depth * 0.58)]} />
          <meshStandardMaterial color="#174d69" metalness={0.55} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, depth / 2 + 0.05]}>
        <boxGeometry args={[Math.min(5.5, width * 0.28), 1.2, 0.25]} />
        <meshStandardMaterial color="#f0bf6e" emissive="#8e5b22" emissiveIntensity={0.18} />
      </mesh>
      <Html position={[0, height + 4.5, 0]} center distanceFactor={120}>
        <div className="proposed-building-label">
          <span>PROPOSED</span>
          <b>{proposal.name}</b>
          <small>{proposal.peakDemandMw.toFixed(2)} MW • {proposal.recommendedPanels.toLocaleString("en-IN")} panels</small>
        </div>
      </Html>
    </group>
  );
}

export function ProposedCampusAssets({ proposals = [], variant = "regional" }) {
  const sites = variant === "vit" ? VIT_SITES : REGIONAL_SITES;
  return (
    <group>
      {proposals.map((proposal, index) => {
        const base = sites[proposal.site] || sites.north;
        const row = Math.floor(index / 3);
        const offset = (index % 3) - 1;
        const position = [
          base[0] + offset * 34,
          base[1],
          base[2] + row * 32,
        ];
        return (
          <ProposedBuilding
            key={proposal.id}
            proposal={proposal}
            position={position}
            index={index}
          />
        );
      })}
    </group>
  );
}

function FaultPulse({ phase }) {
  const pulse = useRef();
  const flash = useRef();
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (pulse.current) {
      const scale = 0.8 + ((time * 2.4) % 1) * 2.4;
      pulse.current.scale.setScalar(scale);
      pulse.current.material.opacity = Math.max(0, 0.68 - (scale - 0.8) * 0.23);
    }
    if (flash.current) {
      const active = phase === "fault";
      flash.current.intensity = active ? 18 + Math.sin(time * 28) * 12 : 3.5;
    }
  });
  return (
    <>
      <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]}>
        <ringGeometry args={[3.1, 3.65, 28]} />
        <meshBasicMaterial color="#ff5f45" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <pointLight
        ref={flash}
        color="#ff6a32"
        intensity={8}
        distance={52}
        decay={2}
        position={[0, 7, 0]}
        userData={{ preserveDuringBlackout: true }}
      />
    </>
  );
}

function SmokeColumn() {
  const smoke = useRef();
  useFrame(({ clock }) => {
    if (!smoke.current) return;
    smoke.current.children.forEach((child, index) => {
      child.position.y = 5 + ((clock.elapsedTime * (1.8 + index * 0.08) + index * 3.4) % 25);
      child.position.x = Math.sin(clock.elapsedTime * 0.7 + index) * (1.2 + index * 0.2);
      child.scale.setScalar(1 + child.position.y / 20);
    });
  });
  return (
    <group ref={smoke}>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={`smoke-${index}`} position={[0, 4 + index * 3, 0]}>
          <sphereGeometry args={[1.8 + index * 0.32, 9, 7]} />
          <meshStandardMaterial color={index < 3 ? "#34373a" : "#5c6063"} transparent opacity={0.32} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ElectricalArcs() {
  const arcs = useRef();
  useFrame(({ clock }) => {
    if (!arcs.current) return;
    arcs.current.rotation.y = clock.elapsedTime * 3.6;
    arcs.current.scale.setScalar(0.9 + Math.sin(clock.elapsedTime * 18) * 0.18);
  });
  return (
    <group ref={arcs} position={[0, 6, 0]}>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={`arc-${index}`} rotation={[0, (Math.PI / 2) * index, Math.PI / 3]}>
          <torusGeometry args={[4 + index * 0.35, 0.11, 5, 20, Math.PI * 0.72]} />
          <meshBasicMaterial color="#b8efff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function HazardSceneEffect({ hazard, variant = "regional", profile }) {
  const position = useMemo(() => {
    const regionalBattery = profile?.battery
      ? [profile.battery[0], 0.4, profile.battery[1]]
      : [-125, 0.4, 86];
    const regionalSolar = profile?.solar
      ? [profile.solar[0], 0.4, profile.solar[1]]
      : [-180, 0.4, 100];
    const regionalWind = profile?.turbines?.[0]
      ? [profile.turbines[0][0], 0.4, profile.turbines[0][1]]
      : [175, 0.4, 86];
    const locations = variant === "vit"
      ? {
          overload: [-220, 0.4, 112],
          transformerFire: [-220, 0.4, 112],
          batteryThermal: [-175, 0.4, 112],
          solarDcFire: [-115, 0.4, 112],
          windOverspeed: [-175, 0.4, 180],
          lightningStrike: [-220, 0.4, 75],
        }
      : {
          overload: [0, 0.4, 0],
          transformerFire: [0, 0.4, 0],
          batteryThermal: regionalBattery,
          solarDcFire: regionalSolar,
          windOverspeed: regionalWind,
          lightningStrike: [25, 0.4, -15],
        };
    return locations[hazard?.type] || locations.overload;
  }, [hazard?.type, profile, variant]);

  if (!hazard || hazard.phase === "idle") return null;
  const active = hazard.phase === "fault" || hazard.phase === "tripped";
  return (
    <group position={position}>
      <FaultPulse phase={hazard.phase} />
      {active && (
        <>
          <ElectricalArcs />
          <SmokeColumn />
          <mesh position={[0, 2.2, 0]}>
            <coneGeometry args={[3.2, 6.5, 9]} />
            <meshBasicMaterial color="#ff7b2c" transparent opacity={0.72} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[4.2, 14, 10]} />
            <meshBasicMaterial color="#ffbe52" transparent opacity={hazard.phase === "fault" ? 0.72 : 0.28} />
          </mesh>
        </>
      )}
      <Html position={[0, 34, 0]} center distanceFactor={120}>
        <div className={`hazard-scene-label phase-${hazard.phase}`}>
          <span>{hazard.phase === "warning" ? "WARNING" : hazard.phase === "tripped" ? "ISOLATED" : "FAULT"}</span>
          <b>{hazard.label}</b>
          <small>{hazard.phase === "tripped" ? "Protection breaker open • energy flow stopped" : "Protection sequence active"}</small>
        </div>
      </Html>
    </group>
  );
}
