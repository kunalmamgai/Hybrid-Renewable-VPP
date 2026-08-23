import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Html, Line, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { WeatherAtmosphere } from "./CampusScene";
import { HazardSceneEffect, ProposedCampusAssets } from "./EngineeringSceneAssets";
import { getRegionalProfile } from "./regionalCampusProfiles";
import VerticalAxisTurbine from "./VerticalAxisTurbine";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function InstancedBoxes({
  items,
  color,
  emissive = "#000000",
  emissiveIntensity = 0,
  metalness = 0,
  roughness = 0.72,
  castShadow = true,
}) {
  const ref = useRef();
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    items.forEach((item, index) => {
      object.position.set(...item.position);
      object.rotation.set(...(item.rotation || [0, 0, 0]));
      object.scale.set(...(item.scale || [1, 1, 1]));
      object.updateMatrix();
      ref.current.setMatrixAt(index, object.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]} castShadow={castShadow} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
      />
    </instancedMesh>
  );
}

function stylePalette(style) {
  if (style === "desert") return { wall: "#b6764f", trim: "#e6c28e", roof: "#51463f", glass: "#3a626b" };
  if (style === "jodhpur") return { wall: "#b66c49", trim: "#e2b77c", roof: "#57483f", glass: "#385b64" };
  if (style === "jaipur") return { wall: "#d28a73", trim: "#f0d0ad", roof: "#5c5350", glass: "#42656e" };
  if (style === "medical") return { wall: "#d8d5cb", trim: "#ae4e49", roof: "#56636a", glass: "#4a7582" };
  if (style === "udaipur") return { wall: "#ddd4bd", trim: "#c87664", roof: "#724b43", glass: "#3f6d72" };
  if (style === "kota") return { wall: "#c4c6bd", trim: "#5387a2", roof: "#4d5c64", glass: "#37677e" };
  return { wall: "#c9bda5", trim: "#a66548", roof: "#4f5a60", glass: "#426270" };
}

function findBuilding(campus, predicate) {
  return campus.buildings.find(predicate) || campus.buildings[0];
}

function cameraPresetFor(campus, profile, preset) {
  const landmark = findBuilding(campus, (building) => building[1] === "landmark" || building[0] === campus.landmark);
  const academic = findBuilding(campus, (building) => ["academic", "lab", "library"].includes(building[1]));
  const residential = findBuilding(campus, (building) => ["hostel", "residential"].includes(building[1]));
  const directBuilding = preset?.startsWith("building:")
    ? campus.buildings.find((building) => building[0] === preset.slice("building:".length))
    : null;
  const focus = directBuilding || {
    landmark,
    academic,
    residential,
  }[preset];

  if (preset === "energy") {
    const [x, z] = profile.solar;
    return { position: [x + 108, 74, z + 132], target: [x, 4, z] };
  }
  if (focus) {
    const [, , x, z, width, , floors] = focus;
    if (campus.id === "mnit-jaipur" && focus[0] === "Prabha Bhawan") {
      return {
        position: [x, 72, z + 128],
        target: [x, 10, z + 5],
      };
    }
    const distance = Math.max(92, width * 1.55);
    return {
      position: [x + distance, 46 + floors * 7, z + distance * 1.05],
      target: [x, floors * 2.2, z],
    };
  }
  if (campus.id === "mnit-jaipur") {
    return { position: [270, 210, 350], target: [0, 0, 24] };
  }
  return { position: [275, 215, 355], target: [0, 0, 28] };
}

function SceneCamera({ campus, profile, preset, revision, zoomAction, controlsRef }) {
  const { camera } = useThree();
  const initial = cameraPresetFor(campus, profile, "overview");
  const destination = useRef(new THREE.Vector3(...initial.position));
  const target = useRef(new THREE.Vector3(...initial.target));
  const moving = useRef(true);

  useEffect(() => {
    const next = cameraPresetFor(campus, profile, preset);
    destination.current.set(...next.position);
    target.current.set(...next.target);
    moving.current = true;
  }, [campus, preset, profile, revision]);

  useEffect(() => {
    if (!zoomAction?.id) return;
    const currentTarget = controlsRef.current?.target || target.current;
    const direction = new THREE.Vector3().subVectors(camera.position, currentTarget);
    const factor = zoomAction.direction === "in" ? 0.7 : 1.38;
    destination.current.copy(currentTarget).add(direction.multiplyScalar(factor));
    target.current.copy(currentTarget);
    moving.current = true;
  }, [camera, controlsRef, zoomAction]);

  useFrame((_, delta) => {
    if (!moving.current) return;
    const amount = 1 - Math.exp(-delta * 3.3);
    camera.position.lerp(destination.current, amount);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(target.current, amount);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(destination.current) < 0.18) moving.current = false;
  });
  return null;
}

function HospitalCross({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh><boxGeometry args={[1.1, 5.2, 0.32]} /><meshStandardMaterial color="#d83d43" emissive="#6e1116" emissiveIntensity={0.25} /></mesh>
      <mesh><boxGeometry args={[4.8, 1.15, 0.34]} /><meshStandardMaterial color="#d83d43" emissive="#6e1116" emissiveIntensity={0.25} /></mesh>
    </group>
  );
}

function LandmarkArchitecture({ campus, width, depth, height, palette }) {
  const signature = getRegionalProfile(campus).signature;
  if (signature === "iitj") {
    return (
      <group position={[0, 0, depth / 2 + 1]}>
        <mesh position={[-width * 0.25, height * 0.62, 0]}><boxGeometry args={[width * 0.16, height * 1.2, 5]} /><meshStandardMaterial color={palette.trim} /></mesh>
        <mesh position={[width * 0.25, height * 0.62, 0]}><boxGeometry args={[width * 0.16, height * 1.2, 5]} /><meshStandardMaterial color={palette.trim} /></mesh>
        <mesh position={[0, height * 1.12, 0]}><boxGeometry args={[width * 0.66, 4, 5]} /><meshStandardMaterial color={palette.trim} /></mesh>
      </group>
    );
  }
  if (signature === "mnit") {
    return (
      <group position={[0, 0, depth / 2 + 1]}>
        <mesh position={[0, height * 0.54, 0]}><boxGeometry args={[width * 0.24, height * 0.95, 3.5]} /><meshStandardMaterial color={palette.glass} metalness={0.45} roughness={0.18} /></mesh>
        {[-1, 1].map((side) => <mesh key={side} position={[side * width * 0.19, height * 0.42, 1]}><cylinderGeometry args={[0.8, 0.8, height * 0.78, 12]} /><meshStandardMaterial color="#eee5d2" /></mesh>)}
        <mesh position={[0, height + 4.6, 0]}><cylinderGeometry args={[4.2, 5.2, 7.5, 24]} /><meshStandardMaterial color={palette.trim} /></mesh>
      </group>
    );
  }
  if (signature === "aiims") {
    return (
      <group>
        <mesh position={[0, height + 3.6, 0]}><cylinderGeometry args={[9, 11, 6, 24]} /><meshStandardMaterial color="#d9d9d2" /></mesh>
        <HospitalCross position={[0, height + 6.7, depth / 2 + 0.8]} scale={1.25} />
      </group>
    );
  }
  if (signature === "sms" || signature === "uniraj") {
    return (
      <group position={[0, height + 2.6, 0]}>
        {[-width * 0.28, 0, width * 0.28].map((x, index) => (
          <group key={x} position={[x, index === 1 ? 2 : 0, 0]}>
            <mesh><sphereGeometry args={[index === 1 ? 5.3 : 3.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={palette.trim} /></mesh>
            <mesh position={[0, 3.9, 0]}><sphereGeometry args={[0.55, 10, 8]} /><meshStandardMaterial color="#d6b16d" metalness={0.55} /></mesh>
          </group>
        ))}
      </group>
    );
  }
  if (signature === "mlsu") {
    return (
      <group position={[0, height * 0.52, depth / 2 + 1.2]}>
        {[-1, 0, 1].map((level) => (
          <mesh key={level} position={[level * width * 0.2, level * 2.1, Math.abs(level) * 1.4]}>
            <boxGeometry args={[width * 0.25, height * 0.7, 4.5]} />
            <meshStandardMaterial color={level === 0 ? palette.glass : palette.trim} metalness={level === 0 ? 0.35 : 0} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group position={[0, height + 3.5, 0]}>
      <mesh><cylinderGeometry args={[4.2, 5.8, 7, 20]} /><meshStandardMaterial color={palette.trim} /></mesh>
      <mesh position={[0, 5.1, 0]}><sphereGeometry args={[3.5, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={palette.trim} /></mesh>
    </group>
  );
}

function MnitPrabhaBhawan({ building, selected, onSelect, proposalVisible }) {
  const [name, , x, z, , , , rotation = 0] = building;
  const brick = "#a94f35";
  const brickDark = "#853923";
  const cream = "#ddd3bd";
  const glass = "#345f70";
  const curvedSegments = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        Array.from({ length: 8 }, (_, index) => {
          const progress = index / 7;
          return {
            side,
            index,
            x: side * (10.5 + progress * 27),
            z: 7 + Math.sin(progress * Math.PI * 0.5) * 13,
            rotation: side * (-0.06 + progress * 0.36),
          };
        }),
      ),
    [],
  );
  const rearWindows = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        Array.from({ length: 6 }, (_, column) =>
          Array.from({ length: 3 }, (_, floor) => ({
            position: [side * (22 + column * 4), 3.3 + floor * 4.1, 3.08],
            scale: [2.7, 1.65, 0.22],
          })),
        ).flat(),
      ),
    [],
  );
  const centralWindows = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        Array.from({ length: 5 }, (_, floor) => ({
          position: [side * 10.6, 3.1 + floor * 4.4, 2.2],
          scale: [5.2, 2.4, 0.28],
        })),
      ),
    [],
  );
  const roofSolar = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        position: [-20 + (index % 6) * 8, 17.2, -8 + Math.floor(index / 6) * 6],
        rotation: [-0.2, 0, 0],
        scale: [6.2, 0.18, 3.5],
      })),
    [],
  );
  return (
    <group
      position={[x, 0.2, z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => { event.stopPropagation(); onSelect(name); }}
    >
      <mesh position={[0, 0.16, 5]} receiveShadow>
        <boxGeometry args={[94, 0.32, 66]} />
        <meshStandardMaterial color="#b8b09c" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.2, 15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 42]} />
        <meshStandardMaterial color="#80916b" roughness={1} />
      </mesh>

      <mesh position={[0, 12.6, -8]} castShadow receiveShadow>
        <boxGeometry args={[33, 25.2, 19]} />
        <meshStandardMaterial color={brick} roughness={0.78} />
      </mesh>
      <mesh position={[0, 12.8, 1.65]} castShadow>
        <boxGeometry args={[12.2, 22.3, 0.65]} />
        <meshStandardMaterial color={glass} metalness={0.42} roughness={0.18} />
      </mesh>
      {[-15.2, -7.2, 7.2, 15.2].map((column) => (
        <mesh key={`mnit-pier-${column}`} position={[column, 12.7, 2.05]} castShadow>
          <boxGeometry args={[2.2, 25.4, 1.2]} />
          <meshStandardMaterial color={column === -7.2 || column === 7.2 ? brickDark : brick} roughness={0.78} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, floor) => (
        <mesh key={`mnit-central-floor-${floor}`} position={[0, 2.6 + floor * 4.65, 2.12]}>
          <boxGeometry args={[31, 0.48, 1.05]} />
          <meshStandardMaterial color={cream} roughness={0.72} />
        </mesh>
      ))}
      <InstancedBoxes items={centralWindows} color="#31596a" emissive="#193b49" emissiveIntensity={0.2} metalness={0.42} roughness={0.2} />

      {[-1, 1].map((side) => (
        <group key={`mnit-rear-${side}`}>
          <mesh position={[side * 34, 7.2, -5]} castShadow receiveShadow>
            <boxGeometry args={[35, 14.4, 18]} />
            <meshStandardMaterial color={brick} roughness={0.8} />
          </mesh>
          <mesh position={[side * 34, 13.1, -5]} castShadow>
            <boxGeometry args={[36, 2.7, 19]} />
            <meshStandardMaterial color={cream} roughness={0.74} />
          </mesh>
          <mesh position={[side * 48, 7.2, 5]} castShadow>
            <boxGeometry args={[9, 14.4, 28]} />
            <meshStandardMaterial color={brickDark} roughness={0.8} />
          </mesh>
        </group>
      ))}
      <InstancedBoxes items={rearWindows} color={glass} emissive="#193b49" emissiveIntensity={0.16} metalness={0.38} roughness={0.22} />

      {curvedSegments.map((segment) => (
        <group
          key={`mnit-curve-${segment.side}-${segment.index}`}
          position={[segment.x, 0, segment.z]}
          rotation={[0, segment.rotation, 0]}
        >
          <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[7.2, 10.4, 11]} />
            <meshStandardMaterial color={brick} roughness={0.8} />
          </mesh>
          <mesh position={[0, 11.1, 0]} castShadow>
            <boxGeometry args={[7.35, 3.7, 11.2]} />
            <meshStandardMaterial color={cream} roughness={0.75} />
          </mesh>
          {[3.2, 7.1, 11.1].map((height, floorIndex) => (
            <mesh key={height} position={[0, height, 5.68]}>
              <boxGeometry args={[4.35, floorIndex === 2 ? 1.65 : 1.75, 0.24]} />
              <meshStandardMaterial color={glass} metalness={0.38} roughness={0.22} />
            </mesh>
          ))}
          <mesh position={[0, 13.3, 0]}>
            <boxGeometry args={[7.5, 0.55, 11.4]} />
            <meshStandardMaterial color="#94513c" roughness={0.72} />
          </mesh>
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`mnit-entry-tower-${side}`} position={[side * 7.3, 0, 12]}>
          <mesh position={[0, 7.4, 0]} castShadow>
            <boxGeometry args={[7.2, 14.8, 11]} />
            <meshStandardMaterial color={brickDark} roughness={0.8} />
          </mesh>
          <mesh position={[0, 7.5, 5.62]}>
            <boxGeometry args={[4.4, 10.8, 0.25]} />
            <meshStandardMaterial color={glass} metalness={0.4} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 6.7, 17.4]} castShadow>
        <boxGeometry args={[12.5, 10.6, 0.6]} />
        <meshStandardMaterial color="#273f47" metalness={0.34} roughness={0.25} />
      </mesh>
      <mesh position={[0, 10.5, 21]} castShadow rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[20, 1.1, 11]} />
        <meshStandardMaterial color="#cbc5b8" roughness={0.68} />
      </mesh>
      {[-6.7, 6.7].map((column) => (
        <mesh key={`mnit-canopy-column-${column}`} position={[column, 5.4, 21.8]} castShadow>
          <cylinderGeometry args={[0.72, 0.9, 10.8, 12]} />
          <meshStandardMaterial color="#d4cdbd" roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, step) => (
        <mesh key={`mnit-step-${step}`} position={[0, 0.24 + step * 0.18, 23.2 + step * 1.05]}>
          <boxGeometry args={[16 + step * 1.5, 0.35, 1.2]} />
          <meshStandardMaterial color="#aaa290" roughness={0.9} />
        </mesh>
      ))}

      {proposalVisible && <InstancedBoxes items={roofSolar} color="#164970" metalness={0.7} roughness={0.2} />}
      <VerticalAxisTurbine position={[-27, 27, -8]} scale={0.7} windSpeed={18} accent="#ffb15c" />
      <Html position={[0, 21.8, 2.45]} center transform distanceFactor={12}>
        <div className="regional-building-sign">MALAVIYA NATIONAL INSTITUTE OF TECHNOLOGY JAIPUR</div>
      </Html>
      <Html position={[0, 30, -3]} center distanceFactor={135}>
        <button className={`regional-label ${selected === name ? "is-selected" : ""}`} onClick={() => onSelect(name)}>{name}</button>
      </Html>
      {selected === name && <Sparkles count={34} scale={[82, 18, 54]} position={[0, 11, 5]} color="#ffb15c" />}
    </group>
  );
}

function MnitWindowGrid({ width, depth, floors, columns, color = "#315d6c", zOffset = 0 }) {
  const windows = useMemo(
    () =>
      Array.from({ length: floors * columns }, (_, index) => {
        const floor = Math.floor(index / columns);
        const column = index % columns;
        return {
          position: [
            -width / 2 + width / (columns + 1) * (column + 1),
            3.1 + floor * 4.15,
            depth / 2 + 0.16 + zOffset,
          ],
          scale: [Math.min(3.7, width / (columns + 2)), 1.65, 0.24],
        };
      }),
    [columns, depth, floors, width, zOffset],
  );
  return <InstancedBoxes items={windows} color={color} emissive="#173843" emissiveIntensity={0.18} metalness={0.38} roughness={0.22} />;
}

function MnitDistinctBuilding({ building, selected, onSelect, proposalVisible }) {
  const [name, , x, z, width, depth, floors, rotation = 0] = building;
  const height = floors * 4.2 + 1;
  const brick = "#b05a3d";
  const brickDark = "#813a28";
  const cream = "#e0d2b5";
  const pale = "#d9d6ca";
  const glass = "#315f70";
  const supportsRoofSolar = ["VLTC", "Research Laboratories", "Aurobindo Boys Hostel", "Vinodini Girls Hostel"].includes(name);
  const labelHeight = name === "Student Activity Centre" ? 27 : name === "Central Library" ? 27 : height + 8.2;
  const rooftopSolar = useMemo(
    () =>
      Array.from({ length: Math.max(6, Math.floor(width / 7)) }, (_, index) => ({
        position: [-width * 0.36 + (index % 5) * width * 0.18, height + 1.2, -depth * 0.2 + Math.floor(index / 5) * 6],
        rotation: [-0.2, 0, 0],
        scale: [5.4, 0.18, 3],
      })),
    [depth, height, width],
  );

  let architecture;

  if (name === "VLTC") {
    architecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * width * 0.29, 0, 0]} rotation={[0, side * -0.09, 0]}>
            <mesh position={[0, height * 0.42, 0]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.42, height * 0.84, depth]} />
              <meshStandardMaterial color={brick} roughness={0.8} />
            </mesh>
            <MnitWindowGrid width={width * 0.4} depth={depth} floors={floors - 1} columns={5} />
            {Array.from({ length: floors }, (_, floor) => (
              <mesh key={floor} position={[0, 2.5 + floor * 4.15, depth / 2 + 0.42]}>
                <boxGeometry args={[width * 0.43, 0.38, 0.85]} />
                <meshStandardMaterial color={cream} roughness={0.76} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, height * 0.53, depth * 0.08]} castShadow>
          <boxGeometry args={[width * 0.22, height * 1.05, depth * 0.82]} />
          <meshStandardMaterial color={glass} metalness={0.42} roughness={0.2} />
        </mesh>
        {[-width * 0.09, width * 0.09].map((column) => (
          <mesh key={column} position={[column, height * 0.52, depth / 2 + 0.7]} castShadow>
            <boxGeometry args={[1.5, height, 1.4]} />
            <meshStandardMaterial color={cream} roughness={0.75} />
          </mesh>
        ))}
        <mesh position={[0, 4.1, depth / 2 + 5.4]} rotation={[-0.08, 0, 0]} castShadow>
          <boxGeometry args={[22, 0.9, 11]} />
          <meshStandardMaterial color={pale} roughness={0.66} />
        </mesh>
        <Html position={[0, height * 0.72, depth / 2 + 0.9]} center transform distanceFactor={10}>
          <div className="mnit-facade-title">VLTC</div>
        </Html>
      </>
    );
  } else if (name === "Central Library") {
    architecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * width * 0.3, 0, 0]}>
            <mesh position={[0, height * 0.43, 0]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.42, height * 0.86, depth]} />
              <meshStandardMaterial color={cream} roughness={0.8} />
            </mesh>
            <MnitWindowGrid width={width * 0.4} depth={depth} floors={floors} columns={4} color={glass} />
          </group>
        ))}
        <mesh position={[0, height * 0.48, depth * 0.08]} castShadow>
          <cylinderGeometry args={[8.6, 9.4, height * 0.96, 28]} />
          <meshStandardMaterial color={glass} metalness={0.46} roughness={0.17} />
        </mesh>
        {Array.from({ length: 8 }, (_, index) => {
          const angle = index / 8 * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.sin(angle) * 9.1, height * 0.48, Math.cos(angle) * 9.1 + depth * 0.08]} rotation={[0, angle, 0]}>
              <boxGeometry args={[0.55, height * 0.92, 0.75]} />
              <meshStandardMaterial color="#d8c7a8" roughness={0.75} />
            </mesh>
          );
        })}
        <mesh position={[0, height + 1.3, depth * 0.08]}>
          <sphereGeometry args={[7.8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6e95a0" metalness={0.34} roughness={0.28} />
        </mesh>
        <mesh position={[0, 2.5, depth / 2 + 3.3]} castShadow>
          <boxGeometry args={[15, 4.8, 6]} />
          <meshStandardMaterial color={brickDark} roughness={0.82} />
        </mesh>
      </>
    );
  } else if (name === "Architecture Department") {
    architecture = (
      <>
        <mesh position={[-width * 0.12, height * 0.48, -depth * 0.16]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.76, height * 0.96, depth * 0.68]} />
          <meshStandardMaterial color={brick} roughness={0.82} />
        </mesh>
        <mesh position={[width * 0.31, height * 0.36, depth * 0.18]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.3, height * 0.72, depth * 0.66]} />
          <meshStandardMaterial color={cream} roughness={0.8} />
        </mesh>
        <MnitWindowGrid width={width * 0.72} depth={depth * 0.68} floors={floors} columns={6} />
        {Array.from({ length: 5 }, (_, index) => (
          <mesh key={index} position={[-width * 0.3 + index * width * 0.15, height + 1.5, -depth * 0.16]} rotation={[0, 0, -0.22]} castShadow>
            <boxGeometry args={[width * 0.13, 0.55, depth * 0.62]} />
            <meshStandardMaterial color={index % 2 ? "#a8b8b5" : "#d6c8ad"} metalness={0.18} roughness={0.58} />
          </mesh>
        ))}
        {[-width * 0.39, width * 0.2].map((column) => (
          <mesh key={column} position={[column, height * 0.48, depth * 0.2]} castShadow>
            <boxGeometry args={[1.2, height * 0.94, 1.2]} />
            <meshStandardMaterial color={pale} roughness={0.75} />
          </mesh>
        ))}
      </>
    );
  } else if (name === "Research Laboratories") {
    architecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * width * 0.27, 0, 0]}>
            <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.42, height * 0.9, depth]} />
              <meshStandardMaterial color={side === -1 ? pale : brick} roughness={0.78} />
            </mesh>
            <MnitWindowGrid width={width * 0.4} depth={depth} floors={floors} columns={4} color={glass} />
          </group>
        ))}
        <mesh position={[0, height * 0.52, 0]} castShadow>
          <boxGeometry args={[width * 0.16, height * 1.04, depth * 0.88]} />
          <meshStandardMaterial color={glass} metalness={0.48} roughness={0.16} />
        </mesh>
        <mesh position={[0, height * 0.62, depth / 2 + 1.3]} castShadow>
          <boxGeometry args={[width * 0.5, 3.5, 2.4]} />
          <meshStandardMaterial color={cream} roughness={0.72} />
        </mesh>
        {[-width * 0.3, -width * 0.1, width * 0.12, width * 0.31].map((px, index) => (
          <group key={px} position={[px, height + 2, 0]}>
            <mesh>
              <cylinderGeometry args={[1.2, 1.5, 4, 12]} />
              <meshStandardMaterial color="#778483" metalness={0.45} roughness={0.4} />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[1.55, 1.2, 0.5, 12]} />
              <meshStandardMaterial color={index % 2 ? "#a84f3b" : "#94a4a1"} />
            </mesh>
          </group>
        ))}
      </>
    );
  } else if (name === "Aurobindo Boys Hostel") {
    architecture = (
      <>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * width * 0.25, height * 0.48, 0]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.48, height * 0.96, depth]} />
            <meshStandardMaterial color={brick} roughness={0.84} />
          </mesh>
        ))}
        <mesh position={[0, height * 0.55, depth * 0.06]} castShadow>
          <boxGeometry args={[width * 0.14, height * 1.1, depth * 1.03]} />
          <meshStandardMaterial color={brickDark} roughness={0.82} />
        </mesh>
        <MnitWindowGrid width={width * 0.88} depth={depth} floors={floors} columns={10} />
        {Array.from({ length: floors }, (_, floor) => (
          <mesh key={floor} position={[0, 2.55 + floor * 4.16, depth / 2 + 0.75]}>
            <boxGeometry args={[width * 0.92, 0.34, 1.45]} />
            <meshStandardMaterial color={cream} roughness={0.76} />
          </mesh>
        ))}
        <mesh position={[0, 3.2, depth / 2 + 2]} castShadow>
          <boxGeometry args={[9, 6.2, 4]} />
          <meshStandardMaterial color="#263f48" metalness={0.35} roughness={0.25} />
        </mesh>
      </>
    );
  } else if (name === "Vinodini Girls Hostel") {
    architecture = (
      <>
        <mesh position={[0, height * 0.48, -depth * 0.23]} castShadow receiveShadow>
          <boxGeometry args={[width, height * 0.96, depth * 0.54]} />
          <meshStandardMaterial color="#c4765b" roughness={0.82} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * width * 0.39, height * 0.44, depth * 0.17]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.22, height * 0.88, depth * 0.72]} />
            <meshStandardMaterial color={side === -1 ? cream : "#c4765b"} roughness={0.82} />
          </mesh>
        ))}
        <MnitWindowGrid width={width * 0.94} depth={depth * 0.54} floors={floors} columns={9} color={glass} zOffset={-depth * 0.23} />
        <mesh position={[0, 3.7, depth * 0.18]} castShadow>
          <boxGeometry args={[12, 7.2, depth * 0.3]} />
          <meshStandardMaterial color={cream} roughness={0.76} />
        </mesh>
        <mesh position={[0, 3.5, depth * 0.34 + 0.2]}>
          <circleGeometry args={[3, 28, 0, Math.PI]} />
          <meshStandardMaterial color="#293f46" metalness={0.2} roughness={0.34} />
        </mesh>
        <mesh position={[0, 1.7, depth * 0.34 + 0.21]}>
          <boxGeometry args={[6, 3.5, 0.18]} />
          <meshStandardMaterial color="#293f46" metalness={0.2} roughness={0.34} />
        </mesh>
      </>
    );
  } else {
    architecture = (
      <>
        <mesh position={[0, 4.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[16, 18, 8.4, 32]} />
          <meshStandardMaterial color={brick} roughness={0.8} />
        </mesh>
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[12.8, 12.8, 8.5, 32]} />
          <meshStandardMaterial color={glass} metalness={0.42} roughness={0.2} />
        </mesh>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = index / 12 * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.sin(angle) * 16.8, 5, Math.cos(angle) * 16.8]} rotation={[0, angle, 0]} castShadow>
              <boxGeometry args={[1, 8.5, 1.5]} />
              <meshStandardMaterial color={cream} roughness={0.74} />
            </mesh>
          );
        })}
        <mesh position={[0, 10.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[14.5, 1.1, 10, 42]} />
          <meshStandardMaterial color={pale} metalness={0.18} roughness={0.58} />
        </mesh>
        <mesh position={[0, 11.1, 0]}>
          <sphereGeometry args={[9.2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#b9694d" metalness={0.12} roughness={0.68} />
        </mesh>
        <mesh position={[0, 2.7, depth / 2 + 3.2]} castShadow>
          <boxGeometry args={[13, 5.2, 6.4]} />
          <meshStandardMaterial color={cream} roughness={0.75} />
        </mesh>
      </>
    );
  }

  return (
    <group
      position={[x, 0.2, z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => { event.stopPropagation(); onSelect(name); }}
    >
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <boxGeometry args={[width + 7, 0.64, depth + 7]} />
        <meshStandardMaterial color="#c5bba5" roughness={0.94} />
      </mesh>
      {architecture}
      {proposalVisible && supportsRoofSolar && <InstancedBoxes items={rooftopSolar} color="#164970" metalness={0.7} roughness={0.2} />}
      <VerticalAxisTurbine
        position={[width * 0.32, height + 1.35, -depth * 0.24]}
        scale={clamp(Math.min(width, depth) / 50, 0.48, 0.74)}
        windSpeed={18}
        accent="#ffb15c"
      />
      <Html position={[0, labelHeight, 0]} center distanceFactor={135}>
        <button className={`regional-label ${selected === name ? "is-selected" : ""}`} onClick={() => onSelect(name)}>{name}</button>
      </Html>
      {selected === name && <Sparkles count={30} scale={[width * 0.82, 17, depth * 1.08]} position={[0, height * 0.58, 0]} color="#ffb15c" />}
    </group>
  );
}

function RegionalArchitectureDetails({ campus, kind, width, depth, height, floors }) {
  const signature = getRegionalProfile(campus).signature;
  const front = depth / 2 + 0.56;

  if (signature === "mbm") {
    return (
      <group>
        {Array.from({ length: 6 }, (_, index) => {
          const px = -width * 0.36 + index * width * 0.145;
          return (
            <group key={index} position={[px, 3.3, front]}>
              <mesh position={[0, -0.7, 0]}><boxGeometry args={[width * 0.09, 4.8, 0.3]} /><meshStandardMaterial color="#563228" /></mesh>
              <mesh position={[0, 1.7, 0.02]}><circleGeometry args={[width * 0.045, 18, 0, Math.PI]} /><meshStandardMaterial color="#563228" /></mesh>
            </group>
          );
        })}
        <mesh position={[0, height - 1.2, front + 0.1]}><boxGeometry args={[width * 0.92, 1.1, 0.7]} /><meshStandardMaterial color="#e2b77c" /></mesh>
        {[-width * 0.42, width * 0.42].map((px) => (
          <mesh key={px} position={[px, height + 2.2, 0]}><cylinderGeometry args={[2.5, 3.1, 4.4, 8]} /><meshStandardMaterial color="#c18458" /></mesh>
        ))}
      </group>
    );
  }

  if (signature === "rtu") {
    return (
      <group>
        {Array.from({ length: 8 }, (_, index) => (
          <mesh key={index} position={[-width * 0.4 + index * width * 0.114, height * 0.52, front]} castShadow>
            <boxGeometry args={[0.85, height * 0.9, 1.4]} />
            <meshStandardMaterial color={index % 2 ? "#5b8ca4" : "#cfd3cd"} metalness={0.18} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, height * 0.68, front + 1.1]} castShadow><boxGeometry args={[width * 0.68, 1.1, 3]} /><meshStandardMaterial color="#446f85" /></mesh>
        {(kind === "lab" || kind === "academic") && [-width * 0.25, 0, width * 0.25].map((px) => (
          <mesh key={px} position={[px, height + 1.4, 0]} rotation={[0, 0, -0.14]}><boxGeometry args={[width * 0.2, 0.55, depth * 0.8]} /><meshStandardMaterial color="#8ba3aa" metalness={0.22} /></mesh>
        ))}
      </group>
    );
  }

  if (signature === "aiims") {
    return (
      <group>
        <mesh position={[0, height * 0.52, front]}><boxGeometry args={[width * 0.22, height * 0.92, 1.3]} /><meshStandardMaterial color="#477986" metalness={0.45} roughness={0.18} /></mesh>
        {Array.from({ length: floors }, (_, floor) => (
          <mesh key={floor} position={[0, 2.5 + floor * 4.2, front + 0.45]}><boxGeometry args={[width * 0.94, 0.48, 1.1]} /><meshStandardMaterial color="#eef0ec" /></mesh>
        ))}
        <mesh position={[-width * 0.36, height * 0.54, front + 0.2]}><boxGeometry args={[2.2, height * 0.86, 0.8]} /><meshStandardMaterial color="#b9484e" /></mesh>
        {(kind === "hospital" || kind === "medical") && <HospitalCross position={[width * 0.34, height * 0.72, front + 0.5]} scale={0.7} />}
      </group>
    );
  }

  if (signature === "sms") {
    return (
      <group>
        {Array.from({ length: 5 }, (_, index) => {
          const px = -width * 0.34 + index * width * 0.17;
          return (
            <group key={index} position={[px, 4.2, front]}>
              <mesh position={[0, -0.8, 0]}><boxGeometry args={[width * 0.1, 6.1, 0.35]} /><meshStandardMaterial color="#5b3832" /></mesh>
              <mesh position={[0, 2.25, 0.02]}><circleGeometry args={[width * 0.05, 20, 0, Math.PI]} /><meshStandardMaterial color="#5b3832" /></mesh>
            </group>
          );
        })}
        <mesh position={[0, height - 1, front + 0.12]}><boxGeometry args={[width * 0.9, 1.2, 0.8]} /><meshStandardMaterial color="#efceaa" /></mesh>
        {[-width * 0.38, width * 0.38].map((px) => (
          <group key={px} position={[px, height + 1.8, 0]}>
            <mesh><cylinderGeometry args={[2.8, 3.4, 3.5, 12]} /><meshStandardMaterial color="#c47a66" /></mesh>
            <mesh position={[0, 2.2, 0]}><sphereGeometry args={[2.4, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e5c499" /></mesh>
          </group>
        ))}
      </group>
    );
  }

  if (signature === "snmc") {
    return (
      <group>
        {Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[-width * 0.4 + index * width * 0.133, height * 0.5, front]} castShadow>
            <boxGeometry args={[1.1, height * 0.86, 1.3]} />
            <meshStandardMaterial color={index % 2 ? "#d6af77" : "#9d5b42"} roughness={0.76} />
          </mesh>
        ))}
        {Array.from({ length: floors }, (_, floor) => (
          <mesh key={floor} position={[0, 2.7 + floor * 4.15, front + 0.55]}><boxGeometry args={[width * 0.88, 0.46, 1.2]} /><meshStandardMaterial color="#e2bd82" /></mesh>
        ))}
        {(kind === "hospital" || kind === "medical") && <HospitalCross position={[0, height * 0.72, front + 0.7]} scale={0.72} />}
      </group>
    );
  }

  if (signature === "uniraj") {
    return (
      <group>
        {Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[-width * 0.42 + index * width * 0.14, height * 0.42, front]} castShadow>
            <cylinderGeometry args={[0.7, 0.85, height * 0.74, 12]} />
            <meshStandardMaterial color="#edd1ad" roughness={0.76} />
          </mesh>
        ))}
        <mesh position={[0, height * 0.78, front + 0.4]}><boxGeometry args={[width * 0.9, 1.2, 1.2]} /><meshStandardMaterial color="#b96f61" /></mesh>
        {[-width * 0.36, 0, width * 0.36].map((px, index) => (
          <group key={px} position={[px, height + (index === 1 ? 2.4 : 1.4), 0]}>
            <mesh><cylinderGeometry args={[2.3, 2.8, 3.3, 12]} /><meshStandardMaterial color="#c47a67" /></mesh>
            <mesh position={[0, 2, 0]}><sphereGeometry args={[2.1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e9c79c" /></mesh>
          </group>
        ))}
      </group>
    );
  }

  if (signature === "jnvu") {
    return (
      <group>
        <mesh position={[0, height * 0.52, front + 0.5]}><boxGeometry args={[width * 0.72, height * 0.84, 1]} /><meshStandardMaterial color="#a46048" roughness={0.84} /></mesh>
        {Array.from({ length: 6 }, (_, column) =>
          Array.from({ length: Math.max(2, floors) }, (_, floor) => (
            <mesh key={`${column}-${floor}`} position={[-width * 0.29 + column * width * 0.116, 3.2 + floor * 4, front + 1.08]}>
              <boxGeometry args={[width * 0.075, 2.2, 0.35]} />
              <meshStandardMaterial color={(column + floor) % 2 ? "#e0b67c" : "#6f4437"} roughness={0.8} />
            </mesh>
          )),
        )}
        {[-width * 0.42, width * 0.42].map((px, index) => (
          <mesh key={px} position={[px, height + 1.1 + index, 0]}><boxGeometry args={[width * 0.12, 2.2 + index * 2, depth * 0.9]} /><meshStandardMaterial color="#9e5a43" /></mesh>
        ))}
      </group>
    );
  }

  if (signature === "mlsu") {
    return (
      <group>
        {Array.from({ length: floors }, (_, floor) => (
          <mesh key={floor} position={[0, 2.7 + floor * 4.15, front + 0.95 + floor * 0.3]} castShadow>
            <boxGeometry args={[width * (0.94 - floor * 0.04), 0.55, 2.1]} />
            <meshStandardMaterial color={floor % 2 ? "#b96e5c" : "#e2d8bd"} roughness={0.76} />
          </mesh>
        ))}
        {[-width * 0.34, width * 0.34].map((px) => (
          <mesh key={px} position={[px, height * 0.52, front]} rotation={[0, 0, px < 0 ? -0.08 : 0.08]}>
            <boxGeometry args={[2.1, height * 0.9, 1.2]} />
            <meshStandardMaterial color="#d9cfb5" />
          </mesh>
        ))}
        <mesh position={[0, height + 1.2, 0]} rotation={[0, 0, -0.07]}><boxGeometry args={[width * 0.82, 1.1, depth * 0.9]} /><meshStandardMaterial color="#9c5d50" /></mesh>
      </group>
    );
  }

  return (
    <group>
      {Array.from({ length: floors }, (_, floor) => (
        <mesh key={floor} position={[0, 2.6 + floor * 4.2, front + 1.25]} castShadow>
          <boxGeometry args={[width * 0.96, 0.6, 2.8]} />
          <meshStandardMaterial color="#d1a46f" roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-width * 0.4 + index * width * 0.1, height * 0.5, front + 0.65]} castShadow>
          <boxGeometry args={[0.75, height * 0.84, 1.6]} />
          <meshStandardMaterial color={index % 2 ? "#8d563f" : "#d4a875"} roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0, height + 2.2, 0]} rotation={[0.1, 0, 0]}><boxGeometry args={[width * 0.78, 0.55, depth * 0.82]} /><meshStandardMaterial color="#295968" metalness={0.45} roughness={0.2} /></mesh>
    </group>
  );
}

function CampusBuilding({ building, campus, selected, onSelect, proposalVisible }) {
  const [name, kind, x, z, width, depth, floors, rotation = 0] = building;
  const palette = stylePalette(campus.style);
  const isClinical = kind === "hospital" || kind === "medical";
  const isLandmark = kind === "landmark" || name === campus.landmark;
  const height = floors * 4.2 + 1;
  const wall = isClinical ? "#d8d7d1" : palette.wall;

  const windows = useMemo(() => {
    const items = [];
    const columns = Math.max(4, Math.floor(width / 7));
    for (let floor = 0; floor < floors; floor += 1) {
      for (let column = 0; column < columns; column += 1) {
        const px = -width / 2 + 3.5 + column * ((width - 7) / Math.max(columns - 1, 1));
        const py = 3.2 + floor * 4.2;
        items.push(
          { position: [px, py, depth / 2 + 0.12], scale: [3.8, 1.75, 0.2] },
          { position: [px, py, -depth / 2 - 0.12], scale: [3.8, 1.75, 0.2] },
        );
      }
    }
    return items;
  }, [depth, floors, width]);

  const rooftopSolar = useMemo(() => {
    const items = [];
    const columns = Math.max(3, Math.floor(width / 10));
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        items.push({
          position: [-width / 2 + 5.5 + column * ((width - 11) / Math.max(columns - 1, 1)), height + 1.25, -depth * 0.22 + row * depth * 0.44],
          rotation: [-0.18, 0, 0],
          scale: [6.4, 0.18, 3.3],
        });
      }
    }
    return items;
  }, [depth, height, width]);

  if (campus.id === "mnit-jaipur" && name === "Prabha Bhawan") {
    return (
      <MnitPrabhaBhawan
        building={building}
        selected={selected}
        onSelect={onSelect}
        proposalVisible={proposalVisible}
      />
    );
  }

  if (campus.id === "mnit-jaipur") {
    return (
      <MnitDistinctBuilding
        building={building}
        selected={selected}
        onSelect={onSelect}
        proposalVisible={proposalVisible}
      />
    );
  }

  if (kind === "sports") {
    return (
      <group position={[x, 0.12, z]} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); onSelect(name); }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} scale={[1.38, 1, 1]}>
          <ringGeometry args={[depth * 0.33, depth * 0.48, 64]} />
          <meshStandardMaterial color="#aa6146" roughness={0.96} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
          <planeGeometry args={[width * 0.76, depth * 0.61]} />
          <meshStandardMaterial color="#3f844a" roughness={1} />
        </mesh>
        <Line points={[[-width * 0.28, 0.3, 0], [width * 0.28, 0.3, 0]]} color="#f0ead7" lineWidth={1} />
        <Html position={[0, 7, 0]} center distanceFactor={125}>
          <button className="regional-label" onClick={() => onSelect(name)}>{name}</button>
        </Html>
      </group>
    );
  }

  return (
    <group
      position={[x, 0.2, z]}
      rotation={[0, rotation, 0]}
      onClick={(event) => { event.stopPropagation(); onSelect(name); }}
    >
      <mesh position={[0, 0.35, 0]} receiveShadow><boxGeometry args={[width + 6, 0.7, depth + 6]} /><meshStandardMaterial color="#c9c2ae" roughness={0.92} /></mesh>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wall} roughness={0.76} />
      </mesh>

      {kind === "hostel" || kind === "residential" ? (
        <>
          <mesh position={[-width * 0.32, height * 0.5, depth * 0.52]}><boxGeometry args={[width * 0.28, height * 0.9, 2.4]} /><meshStandardMaterial color={palette.trim} /></mesh>
          <mesh position={[width * 0.32, height * 0.5, depth * 0.52]}><boxGeometry args={[width * 0.28, height * 0.9, 2.4]} /><meshStandardMaterial color={palette.trim} /></mesh>
          {Array.from({ length: floors }, (_, index) => (
            <mesh key={index} position={[0, 2.4 + index * 4.2, depth / 2 + 1.2]}>
              <boxGeometry args={[width * 0.92, 0.34, 2.3]} /><meshStandardMaterial color="#d7d0b8" />
            </mesh>
          ))}
        </>
      ) : (
        <mesh position={[0, height * 0.52, depth / 2 + 0.42]}>
          <boxGeometry args={[width * (isClinical ? 0.21 : 0.16), height * 0.92, 0.7]} />
          <meshStandardMaterial color={isClinical ? "#aa4a45" : palette.trim} />
        </mesh>
      )}

      <mesh position={[0, height + 0.58, 0]} castShadow>
        <boxGeometry args={[width + 1.4, 0.92, depth + 1.4]} />
        <meshStandardMaterial color={palette.roof} metalness={0.22} roughness={0.56} />
      </mesh>
      <InstancedBoxes items={windows} color={palette.glass} emissive="#1d3945" emissiveIntensity={0.16} metalness={0.38} roughness={0.24} />

      {kind === "library" && (
        <mesh position={[0, height * 0.51, depth / 2 + 1.2]}>
          <boxGeometry args={[width * 0.34, height * 0.86, 2.1]} />
          <meshStandardMaterial color="#467887" metalness={0.5} roughness={0.16} transparent opacity={0.9} />
        </mesh>
      )}
      {kind === "lab" && (
        <group position={[0, height + 2.2, 0]}>
          {[-width * 0.28, 0, width * 0.28].map((px) => (
            <mesh key={px} position={[px, 0, 0]}><boxGeometry args={[7, 3.4, 5]} /><meshStandardMaterial color="#7c8988" metalness={0.38} /></mesh>
          ))}
        </group>
      )}
      {kind === "amenity" && (
        <mesh position={[0, height + 2.5, 0]}>
          <sphereGeometry args={[Math.min(width, depth) * 0.2, 22, 11, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={palette.trim} metalness={0.18} />
        </mesh>
      )}
      <RegionalArchitectureDetails
        campus={campus}
        kind={kind}
        width={width}
        depth={depth}
        height={height}
        floors={floors}
      />
      {isClinical && <HospitalCross position={[width * 0.34, height * 0.62, depth / 2 + 0.85]} scale={0.82} />}
      {isLandmark && <LandmarkArchitecture campus={campus} width={width} depth={depth} height={height} palette={palette} />}
      {proposalVisible && <InstancedBoxes items={rooftopSolar} color="#154972" metalness={0.7} roughness={0.2} />}
      <VerticalAxisTurbine
        position={[width * 0.36, height + 1.12, -depth * 0.26]}
        scale={clamp(Math.min(width, depth) / 50, 0.48, 0.78)}
        windSpeed={18}
        accent={campus.accent}
      />

      <mesh position={[0, 2.1, depth / 2 + 1.9]}><boxGeometry args={[width * 0.28, 4.2, 3.8]} /><meshStandardMaterial color={palette.trim} /></mesh>
      <Html position={[0, isLandmark ? height * 0.72 : height + 6.4, isLandmark ? depth / 2 + 2.4 : 0]} center distanceFactor={isLandmark ? 13 : 135} transform={isLandmark}>
        {isLandmark
          ? <div className="regional-building-sign">{campus.shortName}</div>
          : <button className={`regional-label ${selected === name ? "is-selected" : ""}`} onClick={() => onSelect(name)}>{name}</button>}
      </Html>
      {isLandmark && (
        <Html position={[0, height + 8, 0]} center distanceFactor={135}>
          <button className={`regional-label ${selected === name ? "is-selected" : ""}`} onClick={() => onSelect(name)}>{name}</button>
        </Html>
      )}
      {selected === name && <Sparkles count={28} scale={[width * 0.74, 14, depth]} position={[0, height * 0.72, 0]} color={campus.accent} />}
    </group>
  );
}

function TreeInstances({ campus, profile }) {
  const trees = useMemo(() => {
    const result = [];
    const distanceToRoadSegment = (px, pz, start, end) => {
      const [ax, az] = start;
      const [bx, bz] = end;
      const dx = bx - ax;
      const dz = bz - az;
      const lengthSquared = dx * dx + dz * dz || 1;
      const progress = clamp(((px - ax) * dx + (pz - az) * dz) / lengthSquared, 0, 1);
      return Math.hypot(px - (ax + progress * dx), pz - (az + progress * dz));
    };
    let index = 0;
    while (result.length < profile.treeCount && index < profile.treeCount * 8) {
      const x = -270 + ((index * 83 + campus.id.length * 19) % 540);
      const z = -210 + ((index * 61 + campus.id.length * 13) % 420);
      const overlapsBuilding = campus.buildings.some((building) => {
        const [, , bx, bz, width, depth] = building;
        return Math.abs(x - bx) < width / 2 + 8 && Math.abs(z - bz) < depth / 2 + 8;
      });
      const overlapsRoad = campus.id !== "mnit-jaipur" && profile.roadSet.some((path) =>
        path.slice(0, -1).some((point, pathIndex) =>
          distanceToRoadSegment(x, z, point, path[pathIndex + 1]) < profile.roadWidth / 2 + 5,
        ),
      );
      if (!overlapsBuilding && !overlapsRoad && (Math.abs(x) > 22 || Math.abs(z) > 30)) {
        result.push({ x, z, scale: 0.72 + (index % 6) * 0.08 });
      }
      index += 1;
    }
    return result;
  }, [campus, profile.roadSet, profile.roadWidth, profile.treeCount]);
  const trunks = useRef();
  const crowns = useRef();

  useLayoutEffect(() => {
    const object = new THREE.Object3D();
    trees.forEach((tree, index) => {
      object.position.set(tree.x, 2.7 * tree.scale, tree.z);
      object.scale.set(tree.scale, tree.scale, tree.scale);
      object.rotation.set(0, 0, 0);
      object.updateMatrix();
      trunks.current?.setMatrixAt(index, object.matrix);
      object.position.set(tree.x, 6.25 * tree.scale, tree.z);
      object.scale.set(tree.scale, tree.scale, tree.scale);
      object.updateMatrix();
      crowns.current?.setMatrixAt(index, object.matrix);
    });
    if (trunks.current) trunks.current.instanceMatrix.needsUpdate = true;
    if (crowns.current) crowns.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunks} args={[null, null, trees.length]} castShadow>
        <cylinderGeometry args={[0.35, 0.48, 5.4, 7]} />
        <meshStandardMaterial color="#745238" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[null, null, trees.length]} castShadow>
        <icosahedronGeometry args={[2.7, 1]} />
        <meshStandardMaterial color={profile.tree} roughness={1} />
      </instancedMesh>
    </group>
  );
}

function MnitCampusGate({ campus, position }) {
  const brick = "#a55338";
  const brickDark = "#823b29";
  const sandstone = "#d7c9ad";
  const portal = "#342b28";
  const [x, z, rotation] = position;
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.16, -2]} receiveShadow>
        <boxGeometry args={[112, 0.32, 30]} />
        <meshStandardMaterial color="#beb6a3" roughness={0.96} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`mnit-gate-tower-${side}`} position={[side * 11.5, 0, 0]}>
          <mesh position={[0, 12.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.2, 24.4, 6.4]} />
            <meshStandardMaterial color={brick} roughness={0.86} />
          </mesh>
          <mesh position={[0, 24.65, 0]} castShadow>
            <boxGeometry args={[6.6, 0.5, 6.8]} />
            <meshStandardMaterial color={brickDark} roughness={0.82} />
          </mesh>
          {side === 1 && (
            <group position={[0, 18.1, 3.23]}>
              <mesh>
                <boxGeometry args={[1.5, 3.1, 0.18]} />
                <meshStandardMaterial color={portal} roughness={0.95} />
              </mesh>
              <mesh position={[0, 1.55, 0.02]}>
                <circleGeometry args={[0.75, 22, 0, Math.PI]} />
                <meshStandardMaterial color={portal} roughness={0.95} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      <mesh position={[0, 13.1, 0]} castShadow>
        <boxGeometry args={[18, 3.6, 4.8]} />
        <meshStandardMaterial color={sandstone} roughness={0.76} />
      </mesh>
      <mesh position={[0, 15.15, 0]} castShadow>
        <boxGeometry args={[19.2, 0.55, 5.4]} />
        <meshStandardMaterial color="#c8b99d" roughness={0.8} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`mnit-gate-wing-${side}`} position={[side * 27, 0, 0]}>
          <mesh position={[0, 4, 0]} castShadow receiveShadow>
            <boxGeometry args={[22, 8, 8]} />
            <meshStandardMaterial color={brick} roughness={0.88} />
          </mesh>
          <mesh position={[0, 8.4, 0]} castShadow>
            <boxGeometry args={[24, 0.8, 9.5]} />
            <meshStandardMaterial color={sandstone} roughness={0.78} />
          </mesh>
          <group position={[side * -4.4, 3.2, 4.08]}>
            <mesh position={[0, -0.55, 0]}>
              <boxGeometry args={[4.6, 5.1, 0.2]} />
              <meshStandardMaterial color={portal} roughness={0.96} />
            </mesh>
            <mesh position={[0, 2, 0.02]}>
              <circleGeometry args={[2.3, 28, 0, Math.PI]} />
              <meshStandardMaterial color={portal} roughness={0.96} />
            </mesh>
          </group>
          {[-7.5, 7.5].map((column) => (
            <mesh key={column} position={[column, 4.1, 4.18]}>
              <boxGeometry args={[1.2, 7.1, 0.32]} />
              <meshStandardMaterial color={brickDark} roughness={0.86} />
            </mesh>
          ))}
        </group>
      ))}

      {[-47, 47].map((side) => (
        <group key={`mnit-gate-wall-${side}`} position={[side, 0, -0.4]}>
          <mesh position={[0, 2.4, 0]} castShadow>
            <boxGeometry args={[18, 4.8, 4.4]} />
            <meshStandardMaterial color={brickDark} roughness={0.9} />
          </mesh>
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[19, 0.45, 4.8]} />
            <meshStandardMaterial color={sandstone} roughness={0.82} />
          </mesh>
        </group>
      ))}

      <Html position={[-11.5, 18.5, 3.32]} center transform distanceFactor={7}>
        <div className="mnit-gate-monogram">MNIT</div>
      </Html>
      <Html position={[0, 13.15, 2.46]} center transform distanceFactor={7}>
        <div className="mnit-gate-name">MALAVIYA NATIONAL INSTITUTE OF TECHNOLOGY JAIPUR</div>
      </Html>
      <Html position={[0, 31, 0]} center distanceFactor={145}>
        <div className="regional-label">{campus.shortName} • Main Gate</div>
      </Html>
    </group>
  );
}

function CampusGate({ campus, profile }) {
  if (campus.id === "mnit-jaipur") {
    return <MnitCampusGate campus={campus} position={profile.gate} />;
  }
  const [x, z, rotation] = profile.gate;
  const signature = profile.signature;
  let gateArchitecture;

  if (signature === "aiims") {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 14, 0, 0]}>
            <mesh position={[0, 9, 0]} castShadow><boxGeometry args={[6, 18, 6]} /><meshStandardMaterial color="#e5e5df" roughness={0.72} /></mesh>
            <mesh position={[0, 13.2, 3.15]}><boxGeometry args={[1.2, 6.2, 0.25]} /><meshStandardMaterial color="#c94147" /></mesh>
            <mesh position={[0, 13.2, 3.18]}><boxGeometry args={[5.2, 1.2, 0.28]} /><meshStandardMaterial color="#c94147" /></mesh>
          </group>
        ))}
        <mesh position={[0, 13.5, 0]} castShadow><boxGeometry args={[23, 4.2, 4]} /><meshStandardMaterial color="#4c8190" metalness={0.22} roughness={0.35} /></mesh>
        {[-31, 31].map((side) => <mesh key={side} position={[side, 3.2, 0]}><boxGeometry args={[20, 6.4, 8]} /><meshStandardMaterial color="#d8d7d0" /></mesh>)}
      </>
    );
  } else if (signature === "sms" || signature === "uniraj") {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 13, 0, 0]}>
            <mesh position={[0, 9, 0]} castShadow><boxGeometry args={[7, 18, 7]} /><meshStandardMaterial color="#c56f5c" roughness={0.82} /></mesh>
            <mesh position={[0, 18.5, 0]}><sphereGeometry args={[3.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e6c59c" /></mesh>
            <mesh position={[0, 21.2, 0]}><sphereGeometry args={[0.48, 10, 8]} /><meshStandardMaterial color="#b68b4f" metalness={0.45} /></mesh>
          </group>
        ))}
        <mesh position={[0, 13.2, 0]} castShadow><boxGeometry args={[21, 4.2, 4.5]} /><meshStandardMaterial color="#e2c19c" roughness={0.78} /></mesh>
        {[-30, 30].map((side) => (
          <group key={side} position={[side, 0, 0]}>
            <mesh position={[0, 4, 0]}><boxGeometry args={[22, 8, 8]} /><meshStandardMaterial color="#bd6757" /></mesh>
            <mesh position={[0, 3.2, 4.12]}><circleGeometry args={[2.5, 24]} /><meshStandardMaterial color="#3d302c" /></mesh>
          </group>
        ))}
      </>
    );
  } else if (signature === "rtu") {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 14, 0, 0]}>
            <mesh position={[0, 10, 0]} rotation={[0, 0, side * -0.08]} castShadow>
              <boxGeometry args={[5.2, 20, 5.2]} /><meshStandardMaterial color="#477f9b" metalness={0.28} roughness={0.34} />
            </mesh>
            <mesh position={[0, 20.2, 0]}><boxGeometry args={[6.2, 0.7, 6.2]} /><meshStandardMaterial color="#d3d6cf" /></mesh>
          </group>
        ))}
        <mesh position={[0, 14.2, 0]} rotation={[0, 0, -0.035]} castShadow><boxGeometry args={[23, 3.4, 4]} /><meshStandardMaterial color="#dce0dc" metalness={0.18} /></mesh>
        {[-31, 31].map((side) => <mesh key={side} position={[side, 3.5, 0]}><boxGeometry args={[20, 7, 7]} /><meshStandardMaterial color="#758d95" /></mesh>)}
      </>
    );
  } else if (signature === "mlsu") {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 14, 0, 0]}>
            <mesh position={[0, 8.5, 0]} castShadow><boxGeometry args={[6.5, 17, 6.5]} /><meshStandardMaterial color="#e2dccb" roughness={0.8} /></mesh>
            <mesh position={[0, 17.4, 0]} rotation={[0, 0, side * 0.12]}><boxGeometry args={[8, 1.1, 8]} /><meshStandardMaterial color="#a8604e" /></mesh>
          </group>
        ))}
        <mesh position={[0, 12.8, 0]} castShadow><boxGeometry args={[22, 4, 4.4]} /><meshStandardMaterial color="#b76955" /></mesh>
        {[-31, 31].map((side) => <mesh key={side} position={[side, 3, 0]}><boxGeometry args={[20, 6, 8]} /><meshStandardMaterial color="#ded8c7" /></mesh>)}
      </>
    );
  } else if (signature === "iitj") {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 16, 0, 0]}>
            <mesh position={[0, 7.5, 0]} castShadow><boxGeometry args={[9, 15, 7]} /><meshStandardMaterial color="#a76545" roughness={0.84} /></mesh>
            {Array.from({ length: 5 }, (_, index) => (
              <mesh key={index} position={[-2.8 + index * 1.4, 8, 3.62]}><boxGeometry args={[0.42, 10, 0.22]} /><meshStandardMaterial color="#d4ae77" /></mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 13.7, 0]} castShadow><boxGeometry args={[25, 3.8, 5]} /><meshStandardMaterial color="#c98b5c" /></mesh>
        <mesh position={[0, 17, -0.5]} rotation={[0.08, 0, 0]} castShadow><boxGeometry args={[46, 0.8, 11]} /><meshStandardMaterial color="#274f5b" metalness={0.45} roughness={0.22} /></mesh>
        {[-34, 34].map((side) => <mesh key={side} position={[side, 2.8, 0]}><boxGeometry args={[22, 5.6, 8]} /><meshStandardMaterial color="#9d6447" /></mesh>)}
      </>
    );
  } else {
    gateArchitecture = (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 13, 0, 0]}>
            <mesh position={[0, 9, 0]} castShadow><boxGeometry args={[7, 18, 7]} /><meshStandardMaterial color="#a75d42" roughness={0.86} /></mesh>
            <mesh position={[0, 18.6, 0]}><cylinderGeometry args={[4, 4, 1.5, 8]} /><meshStandardMaterial color="#d2a66d" /></mesh>
            {Array.from({ length: 4 }, (_, index) => (
              <mesh key={index} position={[-2.6 + index * 1.75, 19.8, 0]}><boxGeometry args={[0.75, 1.2, 7.5]} /><meshStandardMaterial color="#8e4734" /></mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, 13.3, 0]} castShadow><boxGeometry args={[21, 4, 4.5]} /><meshStandardMaterial color="#d0a36e" /></mesh>
        {[-31, 31].map((side) => <mesh key={side} position={[side, 3.2, 0]}><boxGeometry args={[21, 6.4, 8]} /><meshStandardMaterial color="#99533d" /></mesh>)}
      </>
    );
  }

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.16, -2]} receiveShadow><boxGeometry args={[112, 0.32, 27]} /><meshStandardMaterial color="#beb6a3" roughness={0.96} /></mesh>
      {gateArchitecture}
      <Html position={[0, 13.4, 2.5]} center transform distanceFactor={8}>
        <div className="regional-gate-name">{campus.shortName}</div>
      </Html>
      <Html position={[0, 29, 0]} center distanceFactor={145}>
        <div className="regional-label">{campus.shortName} • Main Gate</div>
      </Html>
    </group>
  );
}

function CampusSignature({ campus, profile }) {
  const [px, pz, width, depth] = profile.plaza;
  const signature = profile.signature;
  return (
    <group>
      <mesh position={[px, 0.08, pz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width * 2.2, depth * 2.2]} />
        <meshStandardMaterial color={profile.verge} roughness={1} />
      </mesh>

      {signature === "mnit" && (
        <group position={[px, 0, pz]}>
          <mesh position={[0, 0.26, 0]}><cylinderGeometry args={[10.5, 12, 0.52, 40]} /><meshStandardMaterial color="#4f8247" /></mesh>
          <mesh position={[0, 0.68, 0]}><cylinderGeometry args={[3.8, 4.6, 1.35, 28]} /><meshStandardMaterial color="#d4cab3" roughness={0.82} /></mesh>
          <mesh position={[0, 2.35, 0]}><boxGeometry args={[3.2, 2.25, 3.2]} /><meshStandardMaterial color="#c2b69d" roughness={0.8} /></mesh>
          <mesh position={[0, 4.45, 0]}><cylinderGeometry args={[0.62, 0.92, 2.3, 16]} /><meshStandardMaterial color="#a78555" metalness={0.28} /></mesh>
          <mesh position={[0, 5.65, 0]} scale={[0.72, 0.9, 0.72]}><sphereGeometry args={[0.82, 18, 13]} /><meshStandardMaterial color="#a78555" metalness={0.28} /></mesh>
          {Array.from({ length: 22 }, (_, index) => {
            const angle = index / 22 * Math.PI * 2;
            const radius = index % 2 ? 7.8 : 9.3;
            return (
              <mesh key={`mnit-flower-${index}`} position={[Math.cos(angle) * radius, 0.72, Math.sin(angle) * radius]} scale={[1.2, 0.65, 1.2]}>
                <sphereGeometry args={[0.58, 9, 7]} />
                <meshStandardMaterial color={["#f0c84d", "#e96c55", "#f3e5c4", "#d885a8"][index % 4]} roughness={0.9} />
              </mesh>
            );
          })}
        </group>
      )}
      {signature === "mbm" && (
        <group position={[px, 0, pz]}>
          <mesh position={[0, 10, 0]}><boxGeometry args={[8, 20, 8]} /><meshStandardMaterial color="#a95f43" /></mesh>
          <mesh position={[0, 20.8, 0]}><sphereGeometry args={[4.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#d3a568" /></mesh>
          <mesh position={[0, 13, 4.2]}><circleGeometry args={[2.2, 24]} /><meshStandardMaterial color="#f1e3c4" /></mesh>
        </group>
      )}
      {signature === "rtu" && (
        <group position={[132, 7, -4]} rotation={[0, -0.35, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[1.4, 16, 6, 10]} /><meshStandardMaterial color="#d9e0df" metalness={0.3} /></mesh>
          <mesh><boxGeometry args={[6, 0.45, 22]} /><meshStandardMaterial color="#c7d0d0" /></mesh>
          <mesh position={[-7, 3.2, 0]}><boxGeometry args={[3.5, 6.5, 0.5]} /><meshStandardMaterial color="#4c86a4" /></mesh>
          <mesh position={[0, -6.8, 0]}><cylinderGeometry args={[1.1, 1.6, 13.5, 10]} /><meshStandardMaterial color="#777f7e" /></mesh>
        </group>
      )}
      {(signature === "aiims" || signature === "sms" || signature === "snmc") && (
        <group position={[px, 0.16, pz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[13, 13, 0.35, 36]} /><meshStandardMaterial color="#c8d0cd" /></mesh>
          <mesh position={[0, 0.24, 0]}><boxGeometry args={[2.2, 0.3, 14]} /><meshStandardMaterial color="#d44649" /></mesh>
          <mesh position={[0, 0.26, 0]}><boxGeometry args={[14, 0.3, 2.2]} /><meshStandardMaterial color="#d44649" /></mesh>
          <Line points={[[0, 0.5, 0], [0, 0.5, -32]]} color="#f3de6b" lineWidth={1.3} dashed dashSize={3} gapSize={2} />
        </group>
      )}
      {signature === "uniraj" && (
        <group position={[px, 0, pz]}>
          <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[12, 14, 0.6, 40]} /><meshStandardMaterial color="#d7c8a8" /></mesh>
          <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[8.5, 8.5, 2.1, 40]} /><meshStandardMaterial color="#4e91a5" transparent opacity={0.72} /></mesh>
          <mesh position={[0, 4, 0]}><cylinderGeometry args={[0.55, 0.8, 6, 12]} /><meshStandardMaterial color="#d4b670" /></mesh>
        </group>
      )}
      {signature === "mlsu" && (
        <group position={[-220, 0, 150]}>
          <mesh position={[0, 2, 0]} scale={[1.5, 1, 1]}><sphereGeometry args={[42, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#355f45" roughness={1} /></mesh>
          <mesh position={[35, 0.18, -24]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[64, 34]} /><meshStandardMaterial color="#2d7890" metalness={0.08} roughness={0.3} /></mesh>
        </group>
      )}
      {signature === "iitj" && (
        <group position={[px, 0, pz]}>
          {Array.from({ length: 8 }, (_, index) => (
            <group key={index} position={[-70 + index * 20, 0, (index % 2) * 18]}>
              <mesh position={[-5, 3.3, 0]}><cylinderGeometry args={[0.35, 0.35, 6.6, 8]} /><meshStandardMaterial color="#766658" /></mesh>
              <mesh position={[5, 3.3, 0]}><cylinderGeometry args={[0.35, 0.35, 6.6, 8]} /><meshStandardMaterial color="#766658" /></mesh>
              <mesh position={[0, 6.5, 0]} rotation={[0, 0, -0.08]}><boxGeometry args={[13, 0.5, 8]} /><meshStandardMaterial color="#b27b50" /></mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

function CampusGround({ campus, profile }) {
  const fieldPatches = useMemo(
    () => Array.from({ length: 18 }, (_, index) => ({
      position: [-250 + (index % 6) * 96, -0.22, -205 + Math.floor(index / 6) * 205],
      rotation: [0, (index % 3 - 1) * 0.07, 0],
      scale: [82, 0.12, 56],
    })),
    [],
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[620, 510]} />
        <meshStandardMaterial color={profile.ground} roughness={1} />
      </mesh>
      <InstancedBoxes items={fieldPatches} color={profile.verge} roughness={1} castShadow={false} />
      {profile.roadSet.map((path, index) => {
        return (
          <RoadRibbon
            key={`${campus.id}-road-${index}`}
            path={path}
            width={profile.roadWidth}
          />
        );
      })}
      <TreeInstances campus={campus} profile={profile} />
      <CampusGate campus={campus} profile={profile} />
      <CampusSignature campus={campus} profile={profile} />
    </group>
  );
}

function createRoadRibbonGeometry(path, width, height) {
  const curve = new THREE.CatmullRomCurve3(
    path.map(([x, z]) => new THREE.Vector3(x, height, z)),
    false,
    "catmullrom",
    0.22,
  );
  const divisions = Math.max(24, path.length * 12);
  const positions = [];
  const uvs = [];
  const indices = [];
  const centerPoints = [];
  const leftEdge = [];
  const rightEdge = [];

  for (let index = 0; index <= divisions; index += 1) {
    const progress = index / divisions;
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    const left = point.clone().addScaledVector(normal, width / 2);
    const right = point.clone().addScaledVector(normal, -width / 2);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, progress * 12, 1, progress * 12);
    centerPoints.push([point.x, point.y + 0.035, point.z]);
    leftEdge.push([left.x, left.y + 0.04, left.z]);
    rightEdge.push([right.x, right.y + 0.04, right.z]);
    if (index < divisions) {
      const vertex = index * 2;
      indices.push(vertex, vertex + 2, vertex + 1, vertex + 2, vertex + 3, vertex + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, centerPoints, leftEdge, rightEdge };
}

function RoadRibbon({ path, width }) {
  const road = useMemo(() => createRoadRibbonGeometry(path, width, 0.13), [path, width]);
  const sidewalk = useMemo(() => createRoadRibbonGeometry(path, width + 4.6, 0.08), [path, width]);
  useEffect(() => () => {
    road.geometry.dispose();
    sidewalk.geometry.dispose();
  }, [road, sidewalk]);

  return (
    <group>
      <mesh geometry={sidewalk.geometry} receiveShadow>
        <meshStandardMaterial color="#c8bea5" roughness={0.98} />
      </mesh>
      <mesh geometry={road.geometry} receiveShadow>
        <meshStandardMaterial color="#485155" roughness={0.93} />
      </mesh>
      <Line points={road.leftEdge} color="#ede8da" lineWidth={0.22} worldUnits />
      <Line points={road.rightEdge} color="#ede8da" lineWidth={0.22} worldUnits />
      <Line
        points={road.centerPoints}
        color="#e6c86c"
        lineWidth={0.24}
        worldUnits
        dashed
        dashSize={4.8}
        gapSize={4.2}
      />
    </group>
  );
}

function SolarField({ campus, profile }) {
  const count = clamp(Math.round(36 + campus.solarMw * 6), 42, 88);
  const columns = 9;
  const panels = useMemo(
    () => Array.from({ length: count }, (_, index) => ({
      position: [-25 + (index % columns) * 6.2, 1.15, -20 + Math.floor(index / columns) * 6.25],
      rotation: [-0.29, 0, 0],
      scale: [5.4, 0.17, 3.8],
    })),
    [count],
  );
  const [x, z, rotation] = profile.solar;
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[64, 0.22, 54]} /><meshStandardMaterial color="#4c5743" /></mesh>
      <InstancedBoxes items={panels} color="#123f6b" metalness={0.74} roughness={0.18} />
      <Html position={[0, 8, 0]} center distanceFactor={130}><div className="regional-label">Solar field • {campus.solarMw} MWp</div></Html>
    </group>
  );
}

function WindTurbine({ position, scale = 1, windSpeed, windDirection }) {
  const rotor = useRef();
  const yaw = useRef();
  const desiredYaw = THREE.MathUtils.degToRad(180 - windDirection);
  const windMps = windSpeed / 3.6;
  const rotorSpeed = windMps < 2.5 ? 0.08 : clamp(0.28 + windMps * 0.105, 0.32, 2.1);

  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.z -= delta * rotorSpeed;
    if (yaw.current) {
      const difference = Math.atan2(Math.sin(desiredYaw - yaw.current.rotation.y), Math.cos(desiredYaw - yaw.current.rotation.y));
      yaw.current.rotation.y += difference * Math.min(1, delta * 0.75);
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 22, 0]} castShadow>
        <cylinderGeometry args={[0.58, 1.22, 44, 12]} />
        <meshStandardMaterial color="#d7dddd" metalness={0.46} roughness={0.38} />
      </mesh>
      <group ref={yaw} position={[0, 43.3, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]} castShadow>
          <capsuleGeometry args={[0.9, 4.4, 6, 10]} />
          <meshStandardMaterial color="#cbd4d5" metalness={0.42} roughness={0.34} />
        </mesh>
        <group ref={rotor} position={[0, 0, 2.8]}>
          {[0, 1, 2].map((index) => (
            <group key={index} rotation={[0, 0, index * Math.PI * 2 / 3]}>
              <mesh position={[0, 8.4, 0]} rotation={[0, 0, -0.035]} castShadow>
                <boxGeometry args={[1.15, 16.8, 0.32]} />
                <meshStandardMaterial color="#eef1ef" metalness={0.28} roughness={0.4} />
              </mesh>
              <mesh position={[-0.28, 15.9, 0]} rotation={[0, 0, -0.08]}>
                <boxGeometry args={[0.58, 5.2, 0.25]} />
                <meshStandardMaterial color="#f5f7f5" />
              </mesh>
            </group>
          ))}
          <mesh castShadow><sphereGeometry args={[1.55, 16, 10]} /><meshStandardMaterial color="#c9d2d3" metalness={0.42} /></mesh>
        </group>
      </group>
    </group>
  );
}

function AnimatedFlow({ points, color, active }) {
  const marker = useRef();
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))), [points]);
  const progress = useRef(Math.random());
  useFrame((_, delta) => {
    if (!marker.current || !active) return;
    progress.current = (progress.current + delta * 0.2) % 1;
    marker.current.position.copy(curve.getPointAt(progress.current));
  });
  if (!active) return null;
  return (
    <group>
      <Line points={curve.getPoints(40)} color={color} lineWidth={2} transparent opacity={0.68} />
      <mesh ref={marker}><sphereGeometry args={[1.25, 10, 8]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    </group>
  );
}

function CampusEnergy({ campus, profile, energy, weather, visible }) {
  const [solarX, solarZ] = profile.solar;
  const [batteryX, batteryZ] = profile.battery;
  const [gridX, gridZ] = profile.grid;
  return (
    <group>
      <SolarField campus={campus} profile={profile} />
      {profile.turbines.map(([x, z, scale], index) => (
        <WindTurbine
          key={`${campus.id}-turbine-${index}`}
          position={[x, 0, z]}
          scale={scale}
          windSpeed={weather.windSpeed}
          windDirection={weather.windDirection}
        />
      ))}
      <group position={[batteryX, 0, batteryZ]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[34, 6, 19]} /><meshStandardMaterial color="#d8dcd7" /></mesh>
        <InstancedBoxes items={[-11, 0, 11].map((x) => ({ position: [x, 3, 9.65], scale: [6.7, 2.6, 0.2] }))} color="#46c9b1" emissive="#2b8e80" emissiveIntensity={0.35} />
        <Html position={[0, 9, 0]} center distanceFactor={125}><div className="regional-label">Battery • {campus.baseDemand.toFixed(0)} MWh</div></Html>
      </group>
      <group position={[gridX, 0, gridZ]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[31, 6, 24]} /><meshStandardMaterial color="#4f5b60" /></mesh>
        {[-8, 0, 8].map((x) => <mesh key={x} position={[x, 8, 0]}><cylinderGeometry args={[0.45, 0.75, 10, 8]} /><meshStandardMaterial color="#7f898b" metalness={0.52} /></mesh>)}
        <Html position={[0, 13, 0]} center distanceFactor={125}><div className="regional-label">33 kV campus grid</div></Html>
      </group>
      <AnimatedFlow points={[[solarX, 2, solarZ], [-145, 2, 70], [-70, 2, 28], [0, 2, 0]]} color="#54e4de" active={visible && energy.solar > 0.05} />
      <AnimatedFlow points={[[profile.turbines[0][0], 2, profile.turbines[0][1]], [165, 2, 64], [82, 2, 26], [0, 2, 0]]} color="#61ee9a" active={visible && energy.wind > 0.02} />
      <AnimatedFlow points={[[batteryX, 2, batteryZ], [-122, 2, -88], [-58, 2, -40], [0, 2, 0]]} color="#ffb45c" active={visible} />
      <AnimatedFlow points={[[gridX, 2, gridZ], [142, 2, -91], [68, 2, -43], [0, 2, 0]]} color="#ee78d1" active={visible} />
    </group>
  );
}

function routeCurve(path, closed = false) {
  return new THREE.CatmullRomCurve3(
    path.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    closed,
    "catmullrom",
    0.22,
  );
}

function studentRoutes(campus, profile) {
  if (profile.studentPaths?.length) {
    return profile.studentPaths.map((path) => routeCurve(path));
  }
  const gate = profile.gate;
  const landmark = findBuilding(campus, (building) => building[1] === "landmark" || building[0] === campus.landmark);
  const academics = campus.buildings.filter((building) => ["academic", "lab", "library", "medical", "hospital"].includes(building[1]));
  const residences = campus.buildings.filter((building) => ["hostel", "residential"].includes(building[1]));
  const activity = campus.buildings.find((building) => ["sports", "amenity"].includes(building[1])) || academics[0];
  const point = (building) => [building?.[2] || 0, building?.[3] || 0];
  return [
    routeCurve([[gate[0], gate[1] + 8], [0, -118], point(academics[0]), point(landmark), [-18, 66]]),
    routeCurve([point(residences[0]), [60, 56], [8, 24], point(academics[1] || academics[0]), [-12, 66]]),
    routeCurve([point(residences[1] || residences[0]), [98, 62], point(activity), [-74, 48], [0, 14]]),
    routeCurve([[-132, -35], [-76, -70], [0, -86], [82, -62], [130, -28]]),
  ];
}

function StudentCohort({ count, curve, shirt, trousers, offsetSeed = 0 }) {
  const bodies = useRef();
  const heads = useRef();
  const leftLegs = useRef();
  const rightLegs = useRef();
  const backpacks = useRef();
  const bodyObject = useMemo(() => new THREE.Object3D(), []);
  const headObject = useMemo(() => new THREE.Object3D(), []);
  const limbObject = useMemo(() => new THREE.Object3D(), []);
  const bagObject = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    for (let index = 0; index < count; index += 1) {
      const speed = 0.0042 + (index % 7) * 0.00035;
      const phaseProgress = (time * speed + index / count + offsetSeed) % 2;
      const isForward = phaseProgress <= 1;
      const progress = isForward ? phaseProgress : 2 - phaseProgress;
      const point = curve.getPointAt(progress);
      const pathTangent = curve.getTangentAt(progress).normalize();
      const tangent = pathTangent.clone().multiplyScalar(isForward ? 1 : -1);
      const yaw = Math.atan2(tangent.x, tangent.z);
      const lane = ((index % 7) - 3) * 0.48;
      const x = point.x + pathTangent.z * lane;
      const z = point.z - pathTangent.x * lane;
      const phase = time * (2.8 + index % 4 * 0.18) + index * 0.9;
      const bob = Math.abs(Math.sin(phase)) * 0.08;
      const swing = Math.sin(phase) * 0.55;
      const forwardX = Math.sin(yaw);
      const forwardZ = Math.cos(yaw);
      const sideX = Math.cos(yaw);
      const sideZ = -Math.sin(yaw);

      bodyObject.position.set(x, 1.72 + bob, z);
      bodyObject.rotation.set(0, yaw, 0);
      bodyObject.scale.set(0.58, 1, 0.5);
      bodyObject.updateMatrix();
      bodies.current?.setMatrixAt(index, bodyObject.matrix);

      headObject.position.set(x, 3.02 + bob, z);
      headObject.rotation.set(0, yaw, 0);
      headObject.scale.set(0.42, 0.46, 0.42);
      headObject.updateMatrix();
      heads.current?.setMatrixAt(index, headObject.matrix);

      const setLeg = (ref, side, direction) => {
        limbObject.position.set(
          x + sideX * side * 0.17 + forwardX * direction * 0.11,
          0.65,
          z + sideZ * side * 0.17 + forwardZ * direction * 0.11,
        );
        limbObject.rotation.order = "YXZ";
        limbObject.rotation.set(direction * 0.3, yaw, 0);
        limbObject.scale.set(0.18, 1.2, 0.2);
        limbObject.updateMatrix();
        ref.current?.setMatrixAt(index, limbObject.matrix);
      };
      setLeg(leftLegs, -1, swing);
      setLeg(rightLegs, 1, -swing);

      bagObject.position.set(x - forwardX * 0.36, 1.78 + bob, z - forwardZ * 0.36);
      bagObject.rotation.set(0, yaw, 0);
      bagObject.scale.set(0.55, 0.72, 0.26);
      bagObject.updateMatrix();
      backpacks.current?.setMatrixAt(index, bagObject.matrix);
    }
    [bodies, heads, leftLegs, rightLegs, backpacks].forEach((ref) => {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      <instancedMesh ref={bodies} args={[null, null, count]} frustumCulled={false} castShadow>
        <capsuleGeometry args={[0.42, 1.15, 4, 7]} />
        <meshStandardMaterial color={shirt} roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[null, null, count]} frustumCulled={false} castShadow>
        <sphereGeometry args={[0.7, 9, 7]} />
        <meshStandardMaterial color="#a97758" roughness={0.88} />
      </instancedMesh>
      <instancedMesh ref={leftLegs} args={[null, null, count]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trousers} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={rightLegs} args={[null, null, count]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={trousers} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={backpacks} args={[null, null, count]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#283f4b" roughness={0.78} />
      </instancedMesh>
    </group>
  );
}

function CampusCrowd({ campus, profile, occupancy }) {
  const routes = useMemo(() => studentRoutes(campus, profile), [campus, profile]);
  const total = clamp(Math.round(profile.studentCount * clamp(occupancy / 72, 0.48, 1.24)), 68, 218);
  const cohortCount = Math.ceil(total / profile.studentPalette.length);
  return (
    <group>
      {profile.studentPalette.map((shirt, index) => (
        <StudentCohort
          key={`${campus.id}-students-${index}`}
          count={index === profile.studentPalette.length - 1 ? total - cohortCount * index : cohortCount}
          curve={routes[index % routes.length]}
          shirt={shirt}
          trousers={index % 2 ? "#263746" : "#303038"}
          offsetSeed={index * 0.17}
        />
      ))}
    </group>
  );
}

function MovingVehicle({ path, offset, speed, color, type = "car", lane = 0 }) {
  const ref = useRef();
  const curve = useMemo(() => routeCurve(path), [path]);
  const isBus = type === "bus";
  const isAmbulance = type === "ambulance";
  const length = isBus ? 9.2 : isAmbulance ? 6.2 : 4.5;
  const width = isBus ? 2.9 : 2.3;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const phase = (clock.elapsedTime * speed + offset) % 2;
    const isForward = phase <= 1;
    const progress = isForward ? phase : 2 - phase;
    const point = curve.getPointAt(progress);
    const pathTangent = curve.getTangentAt(progress).normalize();
    const tangent = pathTangent.clone().multiplyScalar(isForward ? 1 : -1);
    const normal = new THREE.Vector3(-pathTangent.z, 0, pathTangent.x);
    ref.current.position.copy(point).addScaledVector(normal, lane);
    ref.current.position.y = 0.22;
    ref.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });
  return (
    <group ref={ref}>
      <mesh position={[0, isBus ? 1.8 : 1.05, 0]} castShadow><boxGeometry args={[width, isBus ? 3.2 : 1.35, length]} /><meshStandardMaterial color={color} metalness={0.24} roughness={0.35} /></mesh>
      <mesh position={[0, isBus ? 2.65 : 1.85, -0.15]} castShadow><boxGeometry args={[width * 0.88, isBus ? 1.25 : 0.78, length * (isBus ? 0.83 : 0.58)]} /><meshStandardMaterial color="#274551" metalness={0.38} roughness={0.24} /></mesh>
      {[-1, 1].flatMap((side) => [-1, 1].map((end) => (
        <mesh key={`${side}-${end}`} position={[side * width * 0.5, 0.58, end * length * 0.31]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.34, 10]} /><meshStandardMaterial color="#171b1d" />
        </mesh>
      )))}
      {isBus && <Html position={[0, 2.5, length / 2 + 0.12]} center transform distanceFactor={5}><div className="bus-destination">CAMPUS BUS</div></Html>}
      {isAmbulance && (
        <>
          <mesh position={[0, 1.22, length / 2 + 0.03]}><boxGeometry args={[1.3, 0.25, 0.12]} /><meshStandardMaterial color="#d73f45" /></mesh>
          <mesh position={[0, 2.58, -0.2]}><boxGeometry args={[1.2, 0.22, 0.5]} /><meshStandardMaterial color="#4ab8df" emissive="#226078" emissiveIntensity={0.8} /></mesh>
        </>
      )}
    </group>
  );
}

function ActivityLayer({ campus, profile, occupancy, visible }) {
  if (!visible) return null;
  const trafficRoads = profile.trafficRoads || profile.roadSet;
  const carCount = clamp(Math.round(5 + occupancy / 18), 7, 11);
  return (
    <group>
      {Array.from({ length: carCount }, (_, index) => (
        <MovingVehicle
          key={`${campus.id}-car-${index}`}
          path={trafficRoads[index % trafficRoads.length]}
          offset={index / carCount * 1.8}
          speed={0.014 + (index % 3) * 0.0015}
          lane={index % 2 ? 2.25 : -2.25}
          color={profile.vehiclePalette[index % profile.vehiclePalette.length]}
        />
      ))}
      <MovingVehicle path={trafficRoads[0]} offset={0.18} speed={0.01} lane={-2.2} color="#e3b23f" type="bus" />
      {profile.activity === "medical" && (
        <>
          <MovingVehicle path={trafficRoads[1]} offset={0.43} speed={0.018} lane={2.2} color="#f1f3ef" type="ambulance" />
          <MovingVehicle path={trafficRoads[0]} offset={0.76} speed={0.017} lane={-2.2} color="#f1f3ef" type="ambulance" />
        </>
      )}
      <CampusCrowd campus={campus} profile={profile} occupancy={occupancy} />
    </group>
  );
}

function RegionalBird({ index }) {
  const bird = useRef();
  const leftWing = useRef();
  const rightWing = useRef();
  const radiusX = 82 + (index % 5) * 13;
  const radiusZ = 58 + (index % 4) * 11;
  const altitude = 88 + (index % 6) * 5.5;
  const speed = 0.055 + (index % 5) * 0.006;
  const phase = index * 0.73;

  useFrame(({ clock }) => {
    if (!bird.current) return;
    const time = clock.elapsedTime;
    const angle = time * speed + phase;
    const x = Math.cos(angle) * radiusX - 18;
    const z = Math.sin(angle) * radiusZ + 8;
    const nextAngle = angle + 0.015;
    const nextX = Math.cos(nextAngle) * radiusX - 18;
    const nextZ = Math.sin(nextAngle) * radiusZ + 8;
    bird.current.position.set(x, altitude + Math.sin(time * 0.5 + phase) * 2.2, z);
    bird.current.rotation.y = Math.atan2(nextX - x, nextZ - z);
    const flap = Math.sin(time * (3.5 + index % 3 * 0.28) + phase) * 0.58;
    if (leftWing.current) leftWing.current.rotation.z = 0.18 + flap;
    if (rightWing.current) rightWing.current.rotation.z = -0.18 - flap;
  });

  return (
    <group ref={bird} scale={0.82 + (index % 3) * 0.08}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.32, 1.35, 4, 7]} />
        <meshStandardMaterial color="#344249" roughness={0.82} />
      </mesh>
      <mesh position={[0, 0.05, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.32, 0.9, 7]} />
        <meshStandardMaterial color="#3f4c52" roughness={0.86} />
      </mesh>
      <group ref={leftWing} position={[-0.28, 0.05, 0]}>
        <mesh position={[-1.25, 0, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[2.65, 0.12, 0.8]} />
          <meshStandardMaterial color="#46545a" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightWing} position={[0.28, 0.05, 0]}>
        <mesh position={[1.25, 0, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[2.65, 0.12, 0.8]} />
          <meshStandardMaterial color="#46545a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function RegionalSkyActivity() {
  const plane = useRef();
  useFrame(({ clock }) => {
    if (plane.current) plane.current.position.x = ((clock.elapsedTime * 8.5) % 760) - 380;
  });
  return (
    <group>
      {Array.from({ length: 22 }, (_, index) => <RegionalBird key={index} index={index} />)}
      <group ref={plane} position={[-360, 178, -120]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[1.2, 13, 6, 10]} /><meshStandardMaterial color="#e4e8e6" metalness={0.3} /></mesh>
        <mesh><boxGeometry args={[5, 0.35, 18]} /><meshStandardMaterial color="#d6dcdb" metalness={0.25} /></mesh>
        <mesh position={[-6, 2, 0]}><boxGeometry args={[3, 4, 0.4]} /><meshStandardMaterial color="#d77955" /></mesh>
        <Line points={[[-8, 0, -2], [-38, 0, -2]]} color="#f2f4f3" lineWidth={1} transparent opacity={0.35} />
        <Line points={[[-8, 0, 2], [-38, 0, 2]]} color="#f2f4f3" lineWidth={1} transparent opacity={0.35} />
      </group>
    </group>
  );
}

function RegionalCampusWorld({
  campus,
  profile,
  weather,
  energy,
  occupancy,
  selected,
  onSelect,
  proposalVisible,
  flowVisible,
  activityVisible,
  planningProposals,
  hazard,
}) {
  return (
    <>
      <WeatherAtmosphere weather={weather} />
      <CampusGround campus={campus} profile={profile} />
      {campus.buildings.map((building) => (
        <CampusBuilding
          key={building[0]}
          building={building}
          campus={campus}
          selected={selected}
          onSelect={onSelect}
          proposalVisible={proposalVisible}
        />
      ))}
      {proposalVisible && <CampusEnergy campus={campus} profile={profile} energy={energy} weather={weather} visible={flowVisible} />}
      <ProposedCampusAssets proposals={planningProposals} variant="regional" />
      <HazardSceneEffect hazard={hazard} variant="regional" profile={profile} />
      <ActivityLayer campus={campus} profile={profile} occupancy={occupancy} visible={activityVisible} />
      {activityVisible && <RegionalSkyActivity />}
    </>
  );
}

export default function RegionalCampusScene({
  campus,
  weather,
  energy,
  occupancy,
  selected,
  onSelect,
  cameraPreset,
  cameraRevision,
  zoomAction,
  proposalVisible,
  flowVisible,
  activityVisible,
  planningProposals = [],
  hazard,
}) {
  const controlsRef = useRef();
  const profile = useMemo(() => getRegionalProfile(campus), [campus]);
  const overview = cameraPresetFor(campus, profile, "overview");
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.35]}
      camera={{ position: overview.position, fov: 43, near: 0.1, far: 1300 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.55 }}
      onPointerMissed={() => onSelect(null)}
    >
      <AdaptiveDpr pixelated />
      <SceneCamera
        campus={campus}
        profile={profile}
        preset={cameraPreset}
        revision={cameraRevision}
        zoomAction={zoomAction}
        controlsRef={controlsRef}
      />
      <RegionalCampusWorld
        campus={campus}
        profile={profile}
        weather={weather}
        energy={energy}
        occupancy={occupancy}
        selected={selected}
        onSelect={onSelect}
        proposalVisible={proposalVisible}
        flowVisible={flowVisible}
        activityVisible={activityVisible}
        planningProposals={planningProposals}
        hazard={hazard}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        minDistance={24}
        maxDistance={630}
        maxPolarAngle={Math.PI / 2.05}
        zoomToCursor
        screenSpacePanning
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
