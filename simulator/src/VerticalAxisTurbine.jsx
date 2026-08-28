import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Bow-bladed Darrieus vertical-axis turbine based on the supplied references.
 * The tall white aerofoils meet at the top and bottom hubs and bow away from
 * the dark central shaft, making the silhouette readable from campus view.
 */
export default function VerticalAxisTurbine({
  position = [0, 0, 0],
  scale = 1,
  windSpeed = 18,
  accent = "#55e6ba",
}) {
  const rotorRef = useRef();
  const bladeCurves = useMemo(() => (
    [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) => {
      const direction = new THREE.Vector3(Math.cos(phase), 0, Math.sin(phase));
      return new THREE.CatmullRomCurve3([
        direction.clone().multiplyScalar(0.42).setY(0.45),
        direction.clone().multiplyScalar(2.55).setY(2.25),
        direction.clone().multiplyScalar(3.25).setY(4.75),
        direction.clone().multiplyScalar(2.55).setY(7.25),
        direction.clone().multiplyScalar(0.42).setY(9.05),
      ], false, "centripetal");
    })
  ), []);
  const rotorSpeed = clamp(0.38 + windSpeed * 0.038, 0.5, 1.5);

  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * rotorSpeed;
  });

  return (
    <group position={position} scale={scale} userData={{ renewableAsset: "rooftop-vawt" }}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 1.8]} />
        <meshStandardMaterial color="#687477" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.36, 2.6, 12]} />
        <meshStandardMaterial color="#202c32" metalness={0.86} roughness={0.18} />
      </mesh>
      <group ref={rotorRef} position={[0, 2.55, 0]}>
        <mesh position={[0, 4.75, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 9.7, 12]} />
          <meshStandardMaterial color="#18262d" metalness={0.88} roughness={0.16} />
        </mesh>
        {[0.35, 9.15].map((height) => (
          <group key={height} position={[0, height, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.62, 0.62, 0.28, 18]} />
              <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.16} metalness={0.72} roughness={0.2} />
            </mesh>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((phase) => (
              <mesh
                key={phase}
                position={[Math.cos(phase) * 0.67, 0, Math.sin(phase) * 0.67]}
                rotation={[0, -phase, Math.PI / 2]}
                castShadow
              >
                <cylinderGeometry args={[0.1, 0.1, 1.35, 8]} />
                <meshStandardMaterial color="#dce5e3" metalness={0.68} roughness={0.24} />
              </mesh>
            ))}
          </group>
        ))}
        {bladeCurves.map((curve, index) => (
          <mesh key={index} castShadow>
            <tubeGeometry args={[curve, 40, 0.24, 7, false]} />
            <meshStandardMaterial color="#f4f7f4" metalness={0.52} roughness={0.24} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 12.05, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#ffc75b" emissive="#ffad28" emissiveIntensity={0.72} />
      </mesh>
    </group>
  );
}

export function RooftopTurbineArray({
  position = [0, 0, 0],
  rotation = 0,
  width = 54,
  depth = 26,
  roofHeight = 0,
  count,
  rows: requestedRows,
  scale = 1,
  windSpeed = 18,
  accent = "#55e6ba",
}) {
  const requestedTotal = count || (width >= 66 ? 6 : 4);
  const total = Math.min(3, Math.max(1, requestedTotal));
  const rows = Math.min(total, Math.max(1, requestedRows || (total === 1 ? 1 : 2)));
  const columns = Math.max(1, Math.ceil(total / rows));
  const xStep = columns === 1 ? 0 : Math.min(18, width * 0.58 / (columns - 1));
  const zStep = rows === 1 ? 0 : Math.min(12, depth * 0.48);

  return (
    <group position={position} rotation={[0, rotation, 0]} userData={{ rooftopVawtCount: total }}>
      {Array.from({ length: total }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = (column - (columns - 1) / 2) * xStep;
        const z = (row - (rows - 1) / 2) * zStep;
        return (
          <VerticalAxisTurbine
            key={`${column}-${row}`}
            position={[x, roofHeight, z]}
            scale={scale}
            windSpeed={windSpeed}
            accent={accent}
          />
        );
      })}
    </group>
  );
}
