import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Compact helical Darrieus turbine designed for turbulent rooftop wind. */
export default function VerticalAxisTurbine({
  position,
  scale = 1,
  windSpeed = 18,
  accent = "#66e0d1",
}) {
  const rotorRef = useRef();
  const bladeCurves = useMemo(() => (
    [0, Math.PI].map((phase) => new THREE.CatmullRomCurve3(
      Array.from({ length: 25 }, (_, index) => {
        const progress = index / 24;
        const angle = phase + progress * Math.PI * 2;
        return new THREE.Vector3(
          Math.cos(angle) * 1.36,
          0.25 + progress * 5.9,
          Math.sin(angle) * 1.36,
        );
      }),
      true,
      "centripetal",
    ))
  ), []);
  const rotorSpeed = THREE.MathUtils.clamp(0.32 + windSpeed * 0.035, 0.45, 1.35);

  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * rotorSpeed;
  });

  return (
    <group position={position} scale={scale} userData={{ renewableAsset: "vertical-axis-turbine" }}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.9, 0.56, 12]} />
        <meshStandardMaterial color="#5b686b" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.22, 2.45, 12]} />
        <meshStandardMaterial color="#c7d2d2" metalness={0.78} roughness={0.24} />
      </mesh>
      <group ref={rotorRef} position={[0, 2.7, 0]}>
        <mesh position={[0, 3.1, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 6.2, 12]} />
          <meshStandardMaterial color="#27383d" metalness={0.82} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.22, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} metalness={0.62} roughness={0.24} />
        </mesh>
        <mesh position={[0, 6.05, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.48, 0.22, 16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.18} metalness={0.62} roughness={0.24} />
        </mesh>
        {bladeCurves.map((curve, index) => (
          <mesh key={index} castShadow>
            <tubeGeometry args={[curve, 64, 0.105, 8, true]} />
            <meshStandardMaterial color="#eef4f1" metalness={0.72} roughness={0.2} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 8.9, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color="#ffcf5d" emissive="#ffb328" emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}
