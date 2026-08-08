import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function BoxInstances({
  items,
  color,
  emissive = "#000000",
  emissiveIntensity = 0,
  roughness = 0.65,
  metalness = 0,
  castShadow = false,
  receiveShadow = false,
}) {
  const meshRef = useRef();
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Object3D();
    items.forEach((item, index) => {
      matrix.position.set(...item.position);
      matrix.rotation.set(...(item.rotation || [0, 0, 0]));
      matrix.scale.set(...(item.scale || [1, 1, 1]));
      matrix.updateMatrix();
      meshRef.current.setMatrixAt(index, matrix.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={roughness}
        metalness={metalness}
      />
    </instancedMesh>
  );
}

function CylinderInstances({
  items,
  color,
  radialSegments = 7,
  roughness = 0.9,
  castShadow = false,
}) {
  const meshRef = useRef();
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Object3D();
    items.forEach((item, index) => {
      matrix.position.set(...item.position);
      matrix.rotation.set(...(item.rotation || [0, 0, 0]));
      matrix.scale.set(...(item.scale || [1, 1, 1]));
      matrix.updateMatrix();
      meshRef.current.setMatrixAt(index, matrix.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={meshRef} args={[null, null, items.length]} castShadow={castShadow}>
      <cylinderGeometry args={[1, 1, 1, radialSegments]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </instancedMesh>
  );
}

function IcoInstances({ items, color, castShadow = false }) {
  const meshRef = useRef();
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Object3D();
    items.forEach((item, index) => {
      matrix.position.set(...item.position);
      matrix.rotation.set(...(item.rotation || [0, 0, 0]));
      matrix.scale.set(...(item.scale || [1, 1, 1]));
      matrix.updateMatrix();
      meshRef.current.setMatrixAt(index, matrix.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={meshRef} args={[null, null, items.length]} castShadow={castShadow}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={1} />
    </instancedMesh>
  );
}

function SphereInstances({
  items,
  color,
  opacity = 1,
  emissive = "#000000",
  emissiveIntensity = 0,
}) {
  const meshRef = useRef();
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const matrix = new THREE.Object3D();
    items.forEach((item, index) => {
      matrix.position.set(...item.position);
      matrix.rotation.set(...(item.rotation || [0, 0, 0]));
      matrix.scale.set(...(item.scale || [1, 1, 1]));
      matrix.updateMatrix();
      meshRef.current.setMatrixAt(index, matrix.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={meshRef} args={[null, null, items.length]} frustumCulled>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        transparent={opacity < 1}
        opacity={opacity}
        roughness={1}
        depthWrite={opacity >= 1}
      />
    </instancedMesh>
  );
}

export { BoxInstances, CylinderInstances, IcoInstances, SphereInstances };