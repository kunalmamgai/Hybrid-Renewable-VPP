import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Html,
  Line,
  OrbitControls,
  Sky,
  Sparkles,
  AdaptiveDpr,
} from "@react-three/drei";
import * as THREE from "three";
import { HazardSceneEffect, ProposedCampusAssets } from "./EngineeringSceneAssets";
import { GirlsHostelBlockTwo } from "./GirlsHostelBlockTwo";
import { HostelBuilding } from "./HostelBuilding";
import { BoysHostelBlockOne } from "./BoysHostelBlockOne";
import { ModernBoysHostel } from "./ModernBoysHostel";
import { RacingGardenTrack } from "./RacingGardenTrack";
import { BoxInstances, CylinderInstances, IcoInstances, SphereInstances } from "./ScenePrimitives";
import { RooftopTurbineArray } from "./VerticalAxisTurbine";

const BUILDINGS = {
  main: {
    name: "Academic Block 1",
    type: "Existing campus",
    description:
      "The main multi-wing academic complex reconstructed from the supplied satellite view and public campus photographs.",
    load: "1.92 MW",
    energy: "Rooftop solar • HVAC • classrooms",
  },
  lab: {
    name: "Lab Complex",
    type: "Existing campus",
    description:
      "Three-storey L-shaped laboratory block with 44m and 32m wings, white structural frame, grey ACP panels, dark strip glazing, corner curtain walls and a recessed corner entrance.",
    load: "0.86 MW",
    energy: "High laboratory load • rooftop solar",
  },
  architecture: {
    name: "Architecture Block",
    type: "Existing campus",
    description:
      "Three-storey single-wing academic block just south of the Lab Complex, parallel to its right (east–west) wing: white structural frame, grey ACP panels, dark strip glazing, corner curtain walls and a recessed entrance on the lab side.",
    load: "0.58 MW",
    energy: "Studio load • drafting labs • rooftop solar",
  },
  underbelly: {
    name: "Underbelly",
    type: "Existing campus café",
    description:
      "The orange container-style student hangout in the open field near the Architecture Block, aligned squarely with the roads and facing the open campus side.",
    load: "0.08 MW",
    energy: "Café kitchen • refrigeration • lighting",
  },
  block2: {
    name: "Academic Block 2",
    type: "Existing / expanding campus",
    description:
      "A large rectangular academic complex arranged as four connected wings around an open landscaped central courtyard, recreated from the supplied façade references.",
    load: "1.34 MW",
    energy: "Teaching load • thermal storage",
  },
  auditorium: {
    name: "Special Block",
    type: "Existing campus amenity",
    description:
      "A ring-shaped special block with a central illuminated fountain courtyard, perimeter retail / residential bays, and a raised roof perimeter matching the photographic reference.",
    load: "0.18 MW",
    energy: "Lighting • retail services • courtyard cooling",
  },
  football: {
    name: "Academic Block 2 Football Ground",
    type: "Existing campus sports ground",
    description:
      "A full-size marked football pitch directly in front of Academic Block 2, with goals, penalty areas, centre circle and corner floodlights.",
    load: "0.10 MW",
    energy: "Floodlighting • irrigation • grounds services",
  },
  boys: {
    name: "Boys Hostel Block-1",
    type: "Existing campus",
    description:
      "A separate eight-storey boys' residence with a long grey façade, deep-blue vertical cores and distinctive yellow-and-white geometric window bands matching the supplied reference.",
    load: "1.13 MW",
    energy: "Residential load • hot water • rooftop solar",
  },
hostels: {
    name: "Boys’ Hostel Blocks 2–5",
    type: "Existing campus",
    description:
      "Four white multi-wing boys’ hostel blocks arranged around a shared internal basketball court, reconstructed from the supplied aerial reference.",
    load: "1.58 MW",
    energy: "Residential load • evening peak",
  },
  boysMess: {
    name: "Boys’ Hostel Mess",
    type: "Existing campus amenity",
    description:
      "A dedicated boys’ dining hall aligned with the new hostel blocks, with glazed dining space, covered seating and rooftop kitchen exhausts.",
    load: "0.44 MW",
    energy: "Cooking • refrigeration • dining ventilation",
  },
  hostel: {
    name: "Girls Hostel Block-1",
    type: "Existing campus",
    description:
      "A modern 7-storey girls' university hostel with a large symmetrical rectangular block, white walls, grey cladding strips, beige accent panels, cascading terraced balcony slabs with dark glass facade, and a central covered entrance porch — expanded footprint with wider wings and deeper rear extension.",
    load: "1.58 MW",
    energy: "Residential load • evening peak • rooftop solar",
  },
  chancellor: {
    name: "Chancellor Residence",
    type: "Premium institutional bungalow",
    description:
      "A large three-storey modern institutional residence with a crisp white façade, symmetrical balcony composition, full-height glass lounge wing, recessed entry canopy, and a formal landscaped forecourt.",
    load: "0.41 MW",
    energy: "Residence • cooling • lighting • security",
  },
  hostel2: {
    name: "Girls Hostel Block-2",
    type: "Existing / expanding campus",
    description:
      "A six-storey residence with one long horizontal spine and two attached perpendicular wings, matching the supplied hand-drawn footprint and the orange-framed façade reference.",
    load: "1.52 MW",
    energy: "Residential load • evening peak • hot water",
  },
  girls: {
    name: "Girls’ Hostel Precinct",
    type: "Existing campus",
    description:
      "A separate six-storey residential precinct with grey façades, orange window frames, central perforated screens, secure entrance, gardens and recreation areas.",
    load: "1.46 MW",
    energy: "Residential load • hot water • rooftop solar",
  },
  modernHostel: {
    name: "Modern Boys Hostel 6",
    type: "New institutional building",
    description:
      "A new modern boys hostel with 8 floors, featuring a long rectangular form (110m x 22m), uniform window grid, signature red architectural feature panels, vertical stair towers, and a covered entrance walkway.",
    load: "1.8 MW",
    energy: "Residential load • water heating • air conditioning",
  },
  racingGarden: {
    name: "Racing Garden & Athletic Track",
    type: "Sports and recreation facility",
    description:
      "A comprehensive athletic and recreational complex between the boys hostel blocks featuring a 200m running track with 8 lanes, basketball courts, tennis courts, landscaped gardens, pathways, seating areas, trees, and street lighting.",
    load: "0.12 MW",
    energy: "Lighting • sports facility power",
  },
  girlsMess: {
    name: "Girls’ Mess",
    type: "Existing campus",
    description:
      "A secure, independent girls’ dining facility beside the residential precinct, with a large dining hall, separate kitchen yard and covered garden seating.",
    load: "0.39 MW",
    energy: "Cooking • refrigeration • hot water",
  },
  gate: {
    name: "VIT Bhopal Main Gate",
    type: "Existing campus landmark",
    description:
      "The main arrival complex recreates the red cylindrical gateway towers, bilingual university signage, ornamental gates, guardhouses, formal landscaping and golden lion roundabout.",
    load: "0.09 MW",
    energy: "Security • gate lighting • visitor services",
  },
  gate2: {
    name: "VIT Bhopal Gate No. 2",
    type: "Existing campus landmark",
    description:
      "The secondary campus entrance beside the Multipurpose Hall, recreated with its red portal frame, bilingual dark-green identity panels, white organic screen, security barrier and landscaped approach.",
    load: "0.04 MW",
    energy: "Security • gate lighting • visitor access",
  },
  hall: {
    name: "Multipurpose Hall",
    type: "Existing campus",
    description:
      "A large indoor events and sports hall with a column-free main volume, spectator and activity spaces, a glazed entrance and an outdoor gathering plaza.",
    load: "0.72 MW",
    energy: "Indoor sports • events • ventilation",
  },
  solar: {
    name: "Solar Generation",
    type: "Proposed energy layer",
    description:
      "A digital-twin proposal combining roof-mounted arrays with an edge-of-campus solar field. Toggle the proposal layer to compare the campus without it.",
    load: "5.8 MWp",
    energy: "Weather-driven photovoltaic output",
  },
  wind: {
    name: "Wind Generation",
    type: "Proposed energy layer",
    description:
      "Three proposed wind turbines positioned beyond the academic precinct. Rotor speed follows live wind at VIT Bhopal.",
    load: "4.2 MW",
    energy: "Wind-speed power curve",
  },
  battery: {
    name: "Campus Battery",
    type: "Proposed energy layer",
    description:
      "Containerized battery storage that absorbs renewable surplus and supports the campus during high demand or a grid interruption.",
    load: "12 MWh",
    energy: "Peak shaving • backup • renewable shifting",
  },
  grid: {
    name: "Grid Interconnection",
    type: "Energy infrastructure",
    description:
      "Campus substation and utility connection. Energy-flow colours show import, export, charging, and discharge.",
    load: "33 kV",
    energy: "Utility import and export",
  },
};

const VIT_ROOFTOP_VAWT_GROUPS = [
  // Academic Block 1 is a collection of separate wings. Keep every array on a real slab.
  { id: "main-west", position: [-37, 25.1, 99], width: 12, depth: 10, count: 2, rows: 1, scale: 0.9 },
  { id: "main-mid-west", position: [-12, 21.85, 98], width: 28, depth: 10, count: 2, rows: 1, scale: 0.92 },
  { id: "main-mid-east", position: [34, 21.85, 98], width: 28, depth: 10, count: 2, rows: 1, scale: 0.92 },
  { id: "main-east", position: [61, 25.1, 99], width: 12, depth: 10, count: 2, rows: 1, scale: 0.9 },
  { id: "main-rear", position: [17, 18.0, 71], width: 68, depth: 9, count: 4, rows: 1, scale: 0.94 },
  { id: "girls-1", position: [-40, 22.95, -115], width: 54, depth: 12, count: 4, scale: 0.94 },
  // The Chancellor Residence steps up through several roof levels.
  { id: "chancellor-core", position: [54, 37.95, -113.6], width: 7, depth: 5, count: 1, scale: 0.72 },
  { id: "chancellor-north", position: [54, 36.65, -134.8], width: 5, depth: 7, count: 1, scale: 0.72 },
  { id: "chancellor-east", position: [35.2, 31.55, -126.6], width: 10, depth: 8, count: 1, scale: 0.75 },
  { id: "chancellor-south-east", position: [29.8, 30.15, -96.2], width: 15, depth: 12, count: 2, rows: 1, scale: 0.76 },
  { id: "chancellor-south-west", position: [78.2, 25.75, -96.2], width: 13, depth: 12, count: 2, rows: 1, scale: 0.76 },
  // Girls Hostel Block 2 is a U-shaped complex with two raised stair towers.
  { id: "girls-2-spine", position: [-180, 21.4, -42], width: 164, depth: 14, count: 6, rows: 1, scale: 0.9 },
  { id: "girls-2-west", position: [-216, 21.4, -85.5], width: 18, depth: 54, count: 4, scale: 0.9 },
  { id: "girls-2-east", position: [-144, 21.4, -85.5], width: 18, depth: 54, count: 4, scale: 0.9 },
  { id: "girls-2-west-tower", position: [-216, 23.6, -43], width: 10, depth: 20, count: 1, scale: 0.78 },
  { id: "girls-2-east-tower", position: [-144, 23.6, -43], width: 10, depth: 20, count: 1, scale: 0.78 },
  { id: "boys-1", position: [-520, 25.95, -88], width: 126, depth: 15, count: 8, scale: 0.98 },
  // Boys Hostel Blocks 2-5 are four distinct U-shaped buildings, not one broad roof.
  { id: "boys-2", position: [-542, 20.15, -299], width: 24, depth: 8, count: 2, rows: 1, scale: 0.88 },
  { id: "boys-3", position: [-498, 20.15, -281], width: 24, depth: 8, count: 2, rows: 1, scale: 0.88 },
  { id: "boys-4", position: [-542, 20.15, -259], width: 24, depth: 8, count: 2, rows: 1, scale: 0.88 },
  { id: "boys-5", position: [-498, 20.15, -241], width: 24, depth: 8, count: 2, rows: 1, scale: 0.88 },
  { id: "modern-hostel", position: [-520, 28.55, -370], width: 92, depth: 15, count: 8, scale: 0.98 },
  { id: "boys-mess", position: [-450, 10.4, -270], width: 42, depth: 18, count: 4, scale: 0.88 },
  // The Lab is L-shaped, so each leg gets its own compact roof array.
  { id: "labs-east-west", position: [123, 13.35, 155], width: 38, depth: 13, count: 4, scale: 0.9 },
  { id: "labs-north-south", position: [136, 13.35, 130], width: 12, depth: 27, count: 4, scale: 0.9 },
  { id: "architecture", position: [129, 13.35, 96], width: 38, depth: 12, count: 4, scale: 0.9 },
  // Academic Block 2 has two centre bars and two taller end towers.
  { id: "academic-2-rear", position: [-130, 28.95, -439], width: 90, depth: 9, count: 4, rows: 1, scale: 0.92 },
  { id: "academic-2-front", position: [-130, 28.95, -393], width: 92, depth: 14, count: 4, rows: 1, scale: 0.92 },
  { id: "academic-2-west", position: [-200, 31.45, -413], width: 22, depth: 52, count: 4, scale: 0.94 },
  { id: "academic-2-east", position: [-60, 31.45, -413], width: 22, depth: 52, count: 4, scale: 0.94 },
  // Special Block is circular; one turbine sits on each selected ring segment.
  { id: "special-north", position: [-340, 25.85, -428], width: 1, depth: 1, count: 1, scale: 0.82 },
  { id: "special-north-east", position: [-310, 25.85, -440], width: 1, depth: 1, count: 1, scale: 0.82 },
  { id: "special-south-east", position: [-310, 25.85, -500], width: 1, depth: 1, count: 1, scale: 0.82 },
  { id: "special-south", position: [-340, 25.85, -512], width: 1, depth: 1, count: 1, scale: 0.82 },
  { id: "special-south-west", position: [-370, 25.85, -500], width: 1, depth: 1, count: 1, scale: 0.82 },
  { id: "special-north-west", position: [-370, 25.85, -440], width: 1, depth: 1, count: 1, scale: 0.82 },
  // The hall has two pitched roof planes, rotated north-south in world space.
  { id: "hall-west-roof", position: [212.7, 14.55, -43], width: 8, depth: 48, count: 3, rows: 3, scale: 0.86 },
  { id: "hall-east-roof", position: [231.3, 14.55, -43], width: 8, depth: 48, count: 3, rows: 3, scale: 0.86 },
  { id: "gate-2", position: [289.8, 4.85, -146.7], width: 3, depth: 3, count: 1, scale: 0.64 },
  { id: "main-gate", position: [87, 7.45, 247], width: 12, depth: 8, count: 2, rows: 1, scale: 0.68 },
];

const CAMERA_PRESETS = {
  overview: { position: [420, 330, 520], target: [-8, 0, -88] },
  main: { position: [98, 57, 206], target: [19, 10, 91] },
  lab: { position: [105, 60, 146], target: [145, 4, 146] },
  architecture: { position: [129, 46, 170], target: [129, 5, 96] },
  underbelly: { position: [60, 13, 46], target: [105, 5.5, 46] },
  block2: { position: [-130, 70, -250], target: [-130, 12, -410] },
  football: { position: [0, 80, -235], target: [-130, 0, -350] },
  specialBlock: { position: [-228, 112, -326], target: [-340, 4, -470] },
  auditorium: { position: [-228, 112, -326], target: [-340, 4, -470] },
  hostels: { position: [-520, 50, -125], target: [-520, 11, -270] },
  modernHostel: { position: [-520, 54, -240], target: [-520, 14, -370] },
  racingGarden: { position: [-520, 32, -60], target: [-520, 2, -180] },
  boysMess: { position: [-450, 38, -205], target: [-450, 6, -270] },
  hostel: { position: [-40, 52, -210], target: [-40, 12, -115] },
  chancellor: { position: [54, 60, -250], target: [54, 13, -118] },
  hostel2: { position: [-180, 58, 95], target: [-180, 14, -45] },
  boys: { position: [-520, 60, -225], target: [-520, 12, -88] },
  girls: { position: [342, 116, -52], target: [238, 7, -155] },
  messes: { position: [342, 126, -94], target: [177, 5, -94] },
  hall: { position: [80, 40, -43], target: [206, 5, -43] },
  gate2: { position: [380, 29, -143], target: [294, 5, -143] },
  gate: { position: [40, 37, 366], target: [40, 8, 248] },
  solar: { position: [-115, 35, 174], target: [-115, 4, 112] },
  wind: { position: [-175, 82, 270], target: [-175, 30, 180] },
  battery: { position: [-126, 31, 168], target: [-175, 5, 112] },
  grid: { position: [-278, 39, 174], target: [-220, 9, 112] },
};

function CameraRig({
  preset,
  revision,
  zoomAction,
  controlsRef,
  transitionRef,
  transitionGuardRef,
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.position));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.target));

  useEffect(() => {
    const next = CAMERA_PRESETS[preset] || CAMERA_PRESETS.overview;
    targetPosition.current.set(...next.position);
    targetLook.current.set(...next.target);
    transitionRef.current = true;
    transitionGuardRef.current = performance.now() + 450;
  }, [preset, revision, transitionGuardRef, transitionRef]);

  useEffect(() => {
    if (!zoomAction?.id || !controlsRef.current) return;
    transitionRef.current = false;
    const target = controlsRef.current.target;
    const offset = camera.position.clone().sub(target);
    const currentDistance = offset.length();
    const factor = zoomAction.direction === "in" ? 0.72 : 1.34;
    const nextDistance = THREE.MathUtils.clamp(currentDistance * factor, 18, 720);
    camera.position.copy(target.clone().add(offset.normalize().multiplyScalar(nextDistance)));
    controlsRef.current.update();
  }, [camera, controlsRef, transitionRef, zoomAction]);

  useFrame((_, delta) => {
    if (!transitionRef.current) return;
    const damping = 1 - Math.exp(-delta * 3.2);
    camera.position.lerp(targetPosition.current, damping);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, damping);
      controlsRef.current.update();
    }
    if (
      camera.position.distanceTo(targetPosition.current) < 0.12 &&
      (!controlsRef.current ||
        controlsRef.current.target.distanceTo(targetLook.current) < 0.08)
    ) {
      camera.position.copy(targetPosition.current);
      if (controlsRef.current) controlsRef.current.target.copy(targetLook.current);
      transitionRef.current = false;
    }
  });
  return null;
}

function Selectable({
  id,
  selected,
  onSelect,
  children,
  label,
  position,
  proposal,
  labelDistanceFactor = 155,
}) {
  return (
    <group
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      {children}
      {label && (
        <Html
          position={position}
          center
          distanceFactor={labelDistanceFactor}
          zIndexRange={[12, 6]}
          pointerEvents="auto"
          className="scene-label-wrap"
        >
          <button
            type="button"
            className={`scene-label ${id === "underbelly" ? "scene-label-underbelly" : ""} ${selected ? "is-selected" : ""} ${
              proposal ? "is-proposal" : ""
            }`}
            aria-label={`Focus camera on ${label}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(id);
            }}
          >
            <span className="scene-label-dot" />
            {label}
          </button>
        </Html>
      )}
      {selected && (
        <Sparkles
          count={28}
          scale={[18, 8, 18]}
          position={position}
          size={2}
          speed={0.25}
          color={proposal ? "#58f3b0" : "#71d8ff"}
        />
      )}
    </group>
  );
}

function WindowGrid({
  width,
  depth,
  floors,
  color = "#e2c787",
  yOffset = 0,
}) {
  const windows = useMemo(() => {
    const items = [];
    const frontCount = Math.max(2, Math.floor(width / 5));
    const sideCount = Math.max(2, Math.floor(depth / 5));
    const floorHeight = 3.25;
    for (let floor = 0; floor < floors; floor += 1) {
      const y = 2.15 + floor * floorHeight + yOffset;
      for (let index = 0; index < frontCount; index += 1) {
        const x =
          -width / 2 +
          2.4 +
          (index * (width - 4.8)) / (frontCount - 1 || 1);
        items.push({
          position: [x, y, depth / 2 + 0.07],
          scale: [2.15, 1.45, 0.12],
        });
        items.push({
          position: [x, y, -depth / 2 - 0.07],
          scale: [2.15, 1.45, 0.12],
        });
      }
      for (let index = 0; index < sideCount; index += 1) {
        const z =
          -depth / 2 +
          2.4 +
          (index * (depth - 4.8)) / (sideCount - 1 || 1);
        items.push({
          position: [width / 2 + 0.07, y, z],
          scale: [0.12, 1.45, 2.15],
        });
        items.push({
          position: [-width / 2 - 0.07, y, z],
          scale: [0.12, 1.45, 2.15],
        });
      }
    }
    return items;
  }, [depth, floors, width, yOffset]);

  return (
    <BoxInstances
      items={windows}
      color={color}
      emissive={color}
      emissiveIntensity={0.17}
      roughness={0.3}
      metalness={0.18}
    />
  );
}

function DetailedWing({
  width,
  depth,
  floors = 5,
  wall = "#c7b899",
  roof = "#47515b",
  accents = true,
  rotation = 0,
  position = [0, 0, 0],
}) {
  const height = floors * 3.25 + 1.2;
  const accentPositions = [-0.34, -0.11, 0.14, 0.37];
  const accentColors = ["#ba673c", "#d6c9a6", "#657688", "#9d4b36"];
  const floorBands = useMemo(() => {
    const items = [];
    for (let floor = 1; floor <= floors; floor += 1) {
      const y = floor * 3.25 + 0.25;
      items.push(
        { position: [0, y, depth / 2 + 0.18], scale: [width + 0.35, 0.2, 0.36] },
        { position: [0, y, -depth / 2 - 0.18], scale: [width + 0.35, 0.2, 0.36] },
        { position: [width / 2 + 0.18, y, 0], scale: [0.36, 0.2, depth] },
        { position: [-width / 2 - 0.18, y, 0], scale: [0.36, 0.2, depth] },
      );
    }
    return items;
  }, [depth, floors, width]);
  const parapets = useMemo(
    () => [
      {
        position: [0, height + 0.95, depth / 2],
        scale: [width + 0.5, 1.15, 0.42],
      },
      {
        position: [0, height + 0.95, -depth / 2],
        scale: [width + 0.5, 1.15, 0.42],
      },
      {
        position: [width / 2, height + 0.95, 0],
        scale: [0.42, 1.15, depth],
      },
      {
        position: [-width / 2, height + 0.95, 0],
        scale: [0.42, 1.15, depth],
      },
    ],
    [depth, height, width],
  );

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={wall} roughness={0.78} />
      </mesh>
      <mesh position={[0, height + 0.35, 0]} castShadow>
        <boxGeometry args={[width + 0.8, 0.7, depth + 0.8]} />
        <meshStandardMaterial color={roof} roughness={0.63} metalness={0.12} />
      </mesh>
      <WindowGrid width={width} depth={depth} floors={floors} />
      <BoxInstances items={floorBands} color="#ddd2bd" roughness={0.8} />
      <BoxInstances items={parapets} color={roof} roughness={0.65} />
      {accents &&
        accentPositions.map((fraction, index) => (
          <mesh
            key={`accent-${fraction}`}
            position={[fraction * width, height / 2, depth / 2 + 0.09]}
          >
            <boxGeometry args={[1.15, height - 1, 0.18]} />
            <meshStandardMaterial color={accentColors[index]} roughness={0.72} />
          </mesh>
        ))}
    </group>
  );
}

function RooftopSolar({ width, depth, y, rows = 2, columns = 5 }) {
  const panels = useMemo(() => {
    const items = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        items.push({
          position: [
            -width / 2 +
              2.4 +
              (column * (width - 4.8)) / Math.max(columns - 1, 1),
            y,
            -depth / 2 +
              2.2 +
              (row * (depth - 4.4)) / Math.max(rows - 1, 1),
          ],
          rotation: [-0.18, 0, 0],
          scale: [3.6, 0.12, 2.1],
        });
      }
    }
    return items;
  }, [columns, depth, rows, width, y]);
  return (
    <BoxInstances
      items={panels}
      color="#153f67"
      metalness={0.62}
      roughness={0.24}
      castShadow
    />
  );
}

function AcademicReferenceWing({
  width,
  depth,
  floors,
  position,
  accent = "#a85e45",
  verticalFins = false,
}) {
  const floorHeight = 3.2;
  const height = floors * floorHeight + 1.15;
  const facade = useMemo(() => {
    const windows = [];
    const bands = [];
    const piers = [];
    const sideWindows = [];
    const columns = Math.max(3, Math.floor(width / 4.25));
    const sideColumns = Math.max(2, Math.floor(depth / 5));
    for (let floor = 0; floor < floors; floor += 1) {
      const y = 2.15 + floor * floorHeight;
      bands.push({
        position: [0, y, depth / 2 + 0.13],
        scale: [width - 1.3, 1.92, 0.25],
      });
      bands.push({
        position: [0, y, -depth / 2 - 0.13],
        scale: [width - 1.3, 1.92, 0.25],
      });
      for (let column = 0; column < columns; column += 1) {
        const x = -width / 2 + 2.35 + (column * (width - 4.7)) / Math.max(columns - 1, 1);
        windows.push(
          { position: [x, y, depth / 2 + 0.31], scale: [2.18, 1.34, 0.16] },
          { position: [x, y, -depth / 2 - 0.31], scale: [2.18, 1.34, 0.16] },
        );
      }
      for (let column = 0; column < sideColumns; column += 1) {
        const z = -depth / 2 + 2.4 + (column * (depth - 4.8)) / Math.max(sideColumns - 1, 1);
        sideWindows.push(
          { position: [width / 2 + 0.16, y, z], scale: [0.18, 1.34, 2.1] },
          { position: [-width / 2 - 0.16, y, z], scale: [0.18, 1.34, 2.1] },
        );
      }
    }
    for (let column = 0; column <= columns; column += 1) {
      const x = -width / 2 + 0.9 + (column * (width - 1.8)) / columns;
      piers.push(
        { position: [x, height / 2, depth / 2 + 0.39], scale: [0.42, height, 0.35] },
        { position: [x, height / 2, -depth / 2 - 0.39], scale: [0.42, height, 0.35] },
      );
    }
    return { windows, bands, piers, sideWindows };
  }, [depth, floors, height, width]);

  const floorSlabs = useMemo(
    () =>
      Array.from({ length: floors + 1 }, (_, floor) => ({
        position: [0, 0.75 + floor * floorHeight, depth / 2 + 0.43],
        scale: [width + 0.45, 0.28, 0.42],
      })),
    [depth, floors, width],
  );

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#ded9c8" roughness={0.82} />
      </mesh>
      <BoxInstances items={facade.bands} color={accent} roughness={0.88} castShadow />
      <BoxInstances
        items={[...facade.windows, ...facade.sideWindows]}
        color="#314752"
        emissive="#d6a65f"
        emissiveIntensity={0.14}
        metalness={0.24}
        roughness={0.27}
      />
      <BoxInstances items={facade.piers} color="#ece9dd" roughness={0.72} castShadow />
      <BoxInstances items={floorSlabs} color="#d8d8d2" roughness={0.76} />
      <mesh position={[0, height + 0.34, 0]} castShadow>
        <boxGeometry args={[width + 0.8, 0.68, depth + 0.8]} />
        <meshStandardMaterial color="#efede3" roughness={0.74} />
      </mesh>
      <mesh position={[0, height + 0.88, depth / 2 - 0.15]}>
        <boxGeometry args={[width + 0.2, 0.55, 0.48]} />
        <meshStandardMaterial color="#d7d6cf" roughness={0.8} />
      </mesh>
      {verticalFins && (
        <BoxInstances
          items={[-5.4, -2.7, 0, 2.7, 5.4].map((x) => ({
            position: [x, height / 2 + 0.4, depth / 2 + 0.8],
            scale: [0.5, height + 1.4, 1.18],
          }))}
          color="#f0eee5"
          roughness={0.7}
          castShadow
        />
      )}
    </group>
  );
}

function RooftopVitSign() {
  const letterStrokes = useMemo(
    () => [
      // V
      { position: [-4.65, 2.2, 0], rotation: [0, 0, 0.29], scale: [0.58, 4.55, 0.62] },
      { position: [-3.35, 2.2, 0], rotation: [0, 0, -0.29], scale: [0.58, 4.55, 0.62] },
      // I
      { position: [0, 2.25, 0], scale: [0.62, 4.5, 0.62] },
      { position: [0, 4.37, 0], scale: [2.4, 0.48, 0.62] },
      { position: [0, 0.13, 0], scale: [2.4, 0.48, 0.62] },
      // T
      { position: [4, 2.25, 0], scale: [0.62, 4.5, 0.62] },
      { position: [4, 4.37, 0], scale: [3.25, 0.5, 0.62] },
    ],
    [],
  );
  const bhopalStrokes = useMemo(() => {
    const segmentShapes = {
      top: { position: [0, 0.9, 0], scale: [1.08, 0.24, 0.34] },
      middle: { position: [0, 0, 0], scale: [1.08, 0.24, 0.34] },
      bottom: { position: [0, -0.9, 0], scale: [1.08, 0.24, 0.34] },
      upperLeft: { position: [-0.47, 0.45, 0], scale: [0.24, 0.9, 0.34] },
      lowerLeft: { position: [-0.47, -0.45, 0], scale: [0.24, 0.9, 0.34] },
      upperRight: { position: [0.47, 0.45, 0], scale: [0.24, 0.9, 0.34] },
      lowerRight: { position: [0.47, -0.45, 0], scale: [0.24, 0.9, 0.34] },
    };
    const letters = [
      ["top", "middle", "bottom", "upperLeft", "lowerLeft", "upperRight", "lowerRight"],
      ["upperLeft", "lowerLeft", "upperRight", "lowerRight", "middle"],
      ["top", "bottom", "upperLeft", "lowerLeft", "upperRight", "lowerRight"],
      ["top", "middle", "upperLeft", "lowerLeft", "upperRight"],
      ["top", "middle", "upperLeft", "lowerLeft", "upperRight", "lowerRight"],
      ["bottom", "upperLeft", "lowerLeft"],
    ];
    const spacing = 1.48;
    const startX = -((letters.length - 1) * spacing) / 2;
    return letters.flatMap((segments, letterIndex) =>
      segments.map((segment) => ({
        position: [
          startX + letterIndex * spacing + segmentShapes[segment].position[0],
          segmentShapes[segment].position[1] - 2.15,
          0.08,
        ],
        scale: segmentShapes[segment].scale,
      })),
    );
  }, []);
  const vitOutlineStrokes = useMemo(
    () =>
      letterStrokes.map((stroke) => ({
        ...stroke,
        position: [stroke.position[0], stroke.position[1], -0.12],
        scale: [stroke.scale[0] + 0.2, stroke.scale[1] + 0.2, 0.72],
      })),
    [letterStrokes],
  );
  const bhopalOutlineStrokes = useMemo(
    () =>
      bhopalStrokes.map((stroke) => ({
        ...stroke,
        position: [stroke.position[0], stroke.position[1], -0.04],
        scale: [stroke.scale[0] + 0.12, stroke.scale[1] + 0.12, 0.42],
      })),
    [bhopalStrokes],
  );
  const supports = useMemo(
    () => [
      { position: [-4, -1.35, -0.38], scale: [0.18, 3.9, 0.2] },
      { position: [0, -1.35, -0.38], scale: [0.18, 3.9, 0.2] },
      { position: [4, -1.35, -0.38], scale: [0.18, 3.9, 0.2] },
      { position: [0, -3.25, -0.38], scale: [10.2, 0.18, 0.24] },
    ],
    [],
  );

  return (
    <group position={[-8, 26.1, 20.95]}>
      <BoxInstances
        items={supports}
        color="#aaa291"
        emissive="#8f887a"
        emissiveIntensity={0.03}
        metalness={0.14}
        roughness={0.56}
        castShadow
      />
      <BoxInstances
        items={vitOutlineStrokes}
        color="#4b4d49"
        metalness={0.18}
        roughness={0.54}
        castShadow
      />
      <BoxInstances
        items={letterStrokes}
        color="#d4ccbc"
        emissive="#a79f90"
        emissiveIntensity={0.05}
        metalness={0.16}
        roughness={0.54}
        castShadow
      />
      <BoxInstances
        items={[{ position: [0, -0.88, -0.03], scale: [10.14, 0.44, 0.48] }]}
        color="#4b4d49"
        metalness={0.18}
        roughness={0.54}
        castShadow
      />
      <BoxInstances
        items={[{ position: [0, -0.88, 0.1], scale: [9.8, 0.22, 0.4] }]}
        color="#d4ccbc"
        emissive="#a79f90"
        emissiveIntensity={0.05}
        metalness={0.16}
        roughness={0.54}
        castShadow
      />
      <BoxInstances
        items={bhopalOutlineStrokes}
        color="#4b4d49"
        metalness={0.18}
        roughness={0.54}
        castShadow
      />
      <BoxInstances
        items={bhopalStrokes}
        color="#d4ccbc"
        emissive="#a79f90"
        emissiveIntensity={0.05}
        metalness={0.16}
        roughness={0.54}
        castShadow
      />
    </group>
  );
}

function AcademicBlockOne({ proposalVisible }) {
  const rooftopUnits = useMemo(
    () => [
      { position: [-56, 24.55, -8], scale: [4.6, 1.7, 3.6] },
      { position: [-31, 21.3, -10], scale: [6.4, 1.7, 3.8] },
      { position: [15, 21.3, -10], scale: [6.4, 1.7, 3.8] },
      { position: [42, 24.55, -8], scale: [4.6, 1.7, 3.6] },
    ],
    [],
  );
  const landscape = useMemo(() => {
    const shrubs = [];
    const trees = [];
    const trunks = [];
    for (let x = -60; x <= 48; x += 6) {
      shrubs.push({ position: [x, 0.85, 33], scale: [1.35, 0.85, 1.05] });
    }
    [-43, -27, 19, 35, 47].forEach((x, index) => {
      const z = index % 2 ? 38 : 36;
      trunks.push({ position: [x, 1.65, z], scale: [0.32, 3.3, 0.32] });
      if (x !== 19) {
        trees.push({ position: [x, 4.35, z], scale: [2.25, 2.45, 2.25] });
      }
    });
    return { shrubs, trees, trunks };
  }, []);
  const entranceMullions = useMemo(
    () =>
      [-5.1, -2.55, 0, 2.55, 5.1].map((x) => ({
        position: [x, 10.4, 10.74],
        scale: [0.34, 19.2, 0.38],
      })),
    [],
  );
  const entranceTransoms = useMemo(
    () =>
      [3.2, 6.5, 9.8, 13.1, 16.4, 19.7].map((y) => ({
        position: [0, y, 10.78],
        scale: [11.4, 0.28, 0.4],
      })),
    [],
  );

  return (
    <group position={[19, 0.25, 91]} rotation={[0, -0.025, 0]}>
      <AcademicReferenceWing
        width={17}
        depth={20}
        floors={7}
        position={[-56, 0, 8]}
        accent="#6c7d89"
        verticalFins
      />
      <AcademicReferenceWing
        width={35}
        depth={19}
        floors={6}
        position={[-31, 0, 7]}
        accent="#a85e45"
      />
      <AcademicReferenceWing width={35} depth={19} floors={6} position={[15, 0, 7]} />
      <AcademicReferenceWing
        width={17}
        depth={20}
        floors={7}
        position={[42, 0, 8]}
        accent="#6c7d89"
        verticalFins
      />

      <AcademicReferenceWing
        width={82}
        depth={14}
        floors={5}
        position={[-2, 0, -20]}
        accent="#a85e45"
      />
      <AcademicReferenceWing
        width={15}
        depth={36}
        floors={5}
        position={[-46, 0, -8]}
        accent="#a85e45"
      />
      <AcademicReferenceWing
        width={15}
        depth={34}
        floors={6}
        position={[41, 0, -7]}
        accent="#a85e45"
      />

      <RooftopVitSign />

      <group position={[-8, 0, 10]}>
        <mesh position={[0, 10.4, 10.25]} castShadow>
          <boxGeometry args={[13, 20.8, 1.2]} />
          <meshStandardMaterial
            color="#315868"
            emissive="#173b49"
            emissiveIntensity={0.2}
            metalness={0.38}
            roughness={0.26}
          />
        </mesh>
        <BoxInstances
          items={[...entranceMullions, ...entranceTransoms]}
          color="#e8e8e1"
          metalness={0.15}
          roughness={0.5}
          castShadow
        />
        <BoxInstances
          items={[
            { position: [-7.2, 10.8, 10.78], scale: [1.15, 22.5, 1.35] },
            { position: [7.2, 10.8, 10.78], scale: [1.15, 22.5, 1.35] },
            { position: [0, 21.55, 10.78], scale: [15.6, 1.05, 1.35] },
          ]}
          color="#f1efe5"
          roughness={0.69}
          castShadow
        />
        <mesh position={[0, 4.15, 17.1]} castShadow>
          <boxGeometry args={[21, 0.72, 12.5]} />
          <meshStandardMaterial color="#eceae0" roughness={0.68} />
        </mesh>
        <BoxInstances
          items={[-8.7, 0, 8.7].map((x) => ({
            position: [x, 2.1, 18.2],
            scale: [0.9, 4.2, 0.9],
          }))}
          color="#dedbd0"
          roughness={0.75}
          castShadow
        />
        <mesh position={[0, 1.3, 11]}>
          <boxGeometry args={[7.2, 2.6, 0.5]} />
          <meshStandardMaterial color="#1b3139" metalness={0.35} roughness={0.2} />
        </mesh>
        <Html position={[0, 18.3, 11.45]} center transform distanceFactor={11}>
          <div className="building-sign">VIT BHOPAL</div>
        </Html>
      </group>

      <group position={[-31, 0, 8]}>
        <BoxInstances
          items={[
            { position: [0, 18.2, 9.55], scale: [13.5, 1.1, 0.7] },
            { position: [-5.8, 19.35, 9.55], scale: [1.5, 3.2, 0.75] },
            { position: [5.8, 19.35, 9.55], scale: [1.5, 3.2, 0.75] },
            { position: [0, 21.05, 9.55], scale: [14, 0.7, 0.8] },
          ]}
          color="#efece1"
          roughness={0.72}
          castShadow
        />
      </group>

      <mesh position={[-7, 0.08, 34]} receiveShadow>
        <boxGeometry args={[126, 0.16, 17]} />
        <meshStandardMaterial color="#47754a" roughness={1} />
      </mesh>
      <mesh position={[-8, 0.24, 30]} receiveShadow>
        <boxGeometry args={[8, 0.22, 19]} />
        <meshStandardMaterial color="#d7d1c2" roughness={0.95} />
      </mesh>
      <mesh position={[-7, 0.2, 42.5]} receiveShadow>
        <boxGeometry args={[130, 0.3, 3.5]} />
        <meshStandardMaterial color="#777b78" roughness={0.93} />
      </mesh>
      <BoxInstances items={rooftopUnits} color="#757b7d" metalness={0.35} roughness={0.52} castShadow />
      <BoxInstances
        items={landscape.shrubs}
        color="#476f43"
        roughness={1}
        castShadow
      />
      <CylinderInstances items={landscape.trunks} color="#665342" radialSegments={8} castShadow />
      <IcoInstances items={landscape.trees} color="#315f38" castShadow />

      {proposalVisible && (
        <group>
          <RooftopSolar width={68} depth={9.5} y={17.6} rows={2} columns={10} />
          <group position={[28, 0, -2]}>
            <RooftopSolar width={20} depth={8} y={23.1} rows={2} columns={3} />
          </group>
        </group>
      )}
    </group>
  );
}

function LabStreetLight({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 6.4, 8]} />
        <meshStandardMaterial color="#3a3f42" roughness={0.6} />
      </mesh>
      <mesh position={[0, 6.55, 0.35]} castShadow>
        <boxGeometry args={[0.6, 0.24, 1.4]} />
        <meshStandardMaterial color="#3a3f42" roughness={0.6} />
      </mesh>
      <mesh position={[0, 6.42, 0.35]}>
        <boxGeometry args={[0.45, 0.12, 1.2]} />
        <meshStandardMaterial color="#ffd98a" emissive="#ffd98a" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

function LabPalm({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.3, 5.2, 8]} />
        <meshStandardMaterial color="#8a6f52" roughness={0.9} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((leaf) => (
        <group key={leaf} rotation={[0, (leaf / 6) * Math.PI * 2, 0]} position={[0, 5.15, 0]}>
          <mesh position={[0, 0, 1.5]} rotation={[0.85, 0, 0]} castShadow>
            <boxGeometry args={[0.14, 0.1, 3.2]} />
            <meshStandardMaterial color="#3d7a3f" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function LabComplex({ proposalVisible }) {
  const white = "#f1f1ec";
  const grey = "#a9adb2";
  const glass = "#1e3242";
  const floorY = [2, 6, 10];

  const facadePosts = useMemo(() => {
    const items = [];
    for (const x of [-44, -38, -32, -26, -20, -18]) {
      items.push({ position: [x, 6.5, 0], scale: [0.55, 13, 0.55] });
    }
    for (let x = -44; x <= 0; x += 6) {
      items.push({ position: [x, 6.5, 18], scale: [0.55, 13, 0.55] });
    }
    for (const z of [6, 12]) {
      items.push({ position: [-44, 6.5, z], scale: [0.55, 13, 0.55] });
      items.push({ position: [0, 6.5, z], scale: [0.55, 13, 0.55] });
    }
    items.push({ position: [0, 6.5, 0], scale: [0.55, 13, 0.55] });
    for (let z = -26; z <= -6; z += 6) {
      items.push({ position: [0, 6.5, z], scale: [0.55, 13, 0.55] });
    }
    for (const z of [-26, -20, -16, -4]) {
      items.push({ position: [-18, 6.5, z], scale: [0.55, 13, 0.55] });
    }
    for (const x of [-18, -12, -6, 0]) {
      items.push({ position: [x, 6.5, -32], scale: [0.55, 13, 0.55] });
    }
    return items;
  }, []);

  const stripMullions = useMemo(() => {
    const items = [];
    for (const y of floorY) {
      for (let x = -43; x <= -19; x += 3) {
        items.push({ position: [x, y, -0.13], scale: [0.07, 3.3, 0.07] });
      }
      for (let x = -43; x <= -1; x += 3) {
        items.push({ position: [x, y, 18.13], scale: [0.07, 3.3, 0.07] });
      }
      for (let z = -30; z <= -1; z += 3) {
        items.push({ position: [0.13, y, z], scale: [0.07, 3.3, 0.07] });
        if (z < -14 || z > -6) {
          items.push({ position: [-18.13, y, z], scale: [0.07, 3.3, 0.07] });
        }
      }
    }
    for (let z = 1.5; z <= 16.5; z += 3) {
      items.push({ position: [0.18, 6, z], scale: [0.07, 12.1, 0.07] });
    }
    for (let x = -16.5; x <= -1.5; x += 3) {
      items.push({ position: [x, 6, -32.18], scale: [0.07, 12.1, 0.07] });
    }
    return items;
  }, []);

  const stripWindows = useMemo(
    () =>
      floorY.flatMap((y) => [
        { position: [-31, y, -0.07], scale: [26, 3.1, 0.16] },
        { position: [-22, y, 18.07], scale: [44, 3.1, 0.16] },
        { position: [0.07, y, -16], scale: [0.16, 3.1, 32] },
        { position: [-18.07, y, -23], scale: [0.16, 3.1, 18] },
        { position: [-18.07, y, -3], scale: [0.16, 3.1, 6] },
        ...(y === 10 ? [{ position: [-18.07, 10, -10], scale: [0.16, 3.1, 8] }] : []),
      ]),
    [],
  );

  const ribs = useMemo(
    () =>
      [0.3, 4.3, 8.3, 12.3].flatMap((y) => [
        { position: [-22, y, 9], scale: [44.7, 0.55, 18.7] },
        { position: [-9, y, -16], scale: [18.7, 0.55, 32.7] },
      ]),
    [],
  );

  const roofUnits = useMemo(
    () => [
      ...[-36, -28, -20, -12].map((x) => ({ position: [x, 13.5, 9], scale: [3, 1.4, 2.5] })),
      ...[-24, -16, -8].map((z) => ({ position: [-9, 13.5, z], scale: [2.5, 1.4, 3] })),
    ],
    [],
  );

  const shrubs = useMemo(
    () =>
      [-32, -22, -12, 2].map((x) => ({
        position: [x, 0.85, -55],
        scale: [1.5, 1.35, 1.5],
      })),
    [],
  );

  const curbSegments = useMemo(
    () =>
      Array.from({ length: 23 }, (_, index) => ({
        position: [-54 + index * 4, 0.14, -66.5],
        scale: [4, 0.28, 0.55],
      })),
    [],
  );
  const blackCurbs = curbSegments.filter((_, index) => index % 2 === 0);
  const yellowCurbs = curbSegments.filter((_, index) => index % 2 === 1);

  const lightPositions = [
    [-54, -70],
    [-20, -70],
    [16, -70],
    [-54, 24],
    [16, 24],
    [-56, -24],
  ];

  const palmPositions = [
    [-45, -0.6],
    [-39, -0.6],
    [-33, -0.6],
    [-27, -0.6],
    [-21, -0.6],
    [-15, -0.6],
    [0.6, -4],
    [0.6, -10],
    [0.6, -16],
    [0.6, -22],
    [0.6, -28],
  ];

  const steps = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((index) => ({
        position: [-19.5 - index * 1.5, 0.08 + index * 0.16, -10],
        scale: [1.5, 0.16, 8],
      })),
    [],
  );

  return (
    <group position={[145, 0.25, 146]} rotation={[0, 0, 0]}>
      <mesh position={[-22, 6, 9]} castShadow receiveShadow>
        <boxGeometry args={[44, 12, 18]} />
        <meshStandardMaterial color={grey} roughness={0.62} />
      </mesh>
      <mesh position={[-9, 6, -16]} castShadow receiveShadow>
        <boxGeometry args={[18, 12, 32]} />
        <meshStandardMaterial color={grey} roughness={0.62} />
      </mesh>

      <mesh position={[-22, 12.6, 9]} castShadow>
        <boxGeometry args={[45, 1, 19]} />
        <meshStandardMaterial color={white} roughness={0.7} />
      </mesh>
      <mesh position={[-9, 12.6, -16]} castShadow>
        <boxGeometry args={[19, 1, 33]} />
        <meshStandardMaterial color={white} roughness={0.7} />
      </mesh>

      <BoxInstances items={ribs} color={white} roughness={0.72} castShadow />

      <mesh position={[-44.07, 6, 9]} castShadow>
        <boxGeometry args={[0.22, 12, 18]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[0.07, 6, 9]} castShadow>
        <boxGeometry args={[0.22, 12, 18]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[-9, 6, -32.07]} castShadow>
        <boxGeometry args={[18, 12, 0.22]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>

      <BoxInstances items={stripWindows} color={glass} metalness={0.85} roughness={0.12} />
      <BoxInstances items={facadePosts} color={white} roughness={0.68} castShadow />
      <BoxInstances items={stripMullions} color="#c9ced2" metalness={0.5} roughness={0.3} />

      <mesh position={[-18.07, 4, -10]}>
        <boxGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <BoxInstances
        items={[
          { position: [-18.07, 4, -14], scale: [0.35, 8, 0.35] },
          { position: [-18.07, 4, -6], scale: [0.35, 8, 0.35] },
        ]}
        color={grey}
        roughness={0.62}
      />
      <mesh position={[-18.07, 8.2, -10]} castShadow>
        <boxGeometry args={[0.4, 0.5, 8.6]} />
        <meshStandardMaterial color={white} roughness={0.72} />
      </mesh>
      <mesh position={[-18.07, 0.075, -10]} receiveShadow>
        <boxGeometry args={[0.4, 0.15, 8]} />
        <meshStandardMaterial color="#c9c6ba" roughness={0.95} />
      </mesh>
      <BoxInstances items={steps} color="#d9d7cd" roughness={0.85} receiveShadow castShadow />

      <mesh position={[-31, 0.06, -18]} receiveShadow>
        <boxGeometry args={[30, 0.12, 28]} />
        <meshStandardMaterial color="#b8b6ae" roughness={0.95} />
      </mesh>

      <mesh position={[-24, 0.15, -43]} receiveShadow>
        <boxGeometry args={[46, 0.3, 10]} />
        <meshStandardMaterial color="#4a7a45" roughness={1} />
      </mesh>
      <mesh position={[-31, 0.12, -1.5]} receiveShadow>
        <boxGeometry args={[26, 0.24, 3]} />
        <meshStandardMaterial color="#4a7a45" roughness={1} />
      </mesh>
      <mesh position={[-21.5, 0.12, -44]} receiveShadow>
        <boxGeometry args={[4, 0.24, 6]} />
        <meshStandardMaterial color="#4a7a45" roughness={1} />
      </mesh>

      <IcoInstances items={shrubs} color="#3f753f" castShadow />

      <mesh position={[-14, 0.02, -70]} receiveShadow>
        <boxGeometry args={[90, 0.05, 6]} />
        <meshStandardMaterial color="#33363a" roughness={0.95} />
      </mesh>
      <mesh position={[-14, 0.02, 24]} receiveShadow>
        <boxGeometry args={[90, 0.05, 6]} />
        <meshStandardMaterial color="#33363a" roughness={0.95} />
      </mesh>
      <mesh position={[-56, -0.18, -23]} receiveShadow>
        <boxGeometry args={[6, 0.05, 94]} />
        <meshStandardMaterial color="#33363a" roughness={0.95} />
      </mesh>
      <mesh position={[28, 0.02, -23]} receiveShadow>
        <boxGeometry args={[6, 0.05, 94]} />
        <meshStandardMaterial color="#33363a" roughness={0.95} />
      </mesh>

      <BoxInstances items={blackCurbs} color="#22262a" roughness={0.8} />
      <BoxInstances items={yellowCurbs} color="#e3b23c" roughness={0.8} />

      {palmPositions.map(([x, z]) => (
        <LabPalm key={`palm-${x}-${z}`} position={[x, 0, z]} />
      ))}

      {lightPositions.map(([x, z]) => (
        <LabStreetLight key={`light-${x}-${z}`} position={[x, 0, z]} />
      ))}

      <mesh position={[-29, 0.55, -12]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.1, 10]} />
        <meshStandardMaterial color="#2b5f9e" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[-29, 1.12, -12]}>
        <cylinderGeometry args={[0.56, 0.56, 0.1, 10]} />
        <meshStandardMaterial color="#1d4476" roughness={0.5} />
      </mesh>

      {proposalVisible && <BoxInstances items={roofUnits} color="#b9bdc2" roughness={0.55} castShadow />}
    </group>
  );
}

function UnderbellyCafe() {
  const position = [105, 0.26, 46];

  const containerSeams = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        position: [-6.35 + index * 1.42, 7.65, 4.64],
        scale: [0.055, 4.45, 0.08],
      })),
    [],
  );

  const canopyColumns = useMemo(
    () =>
      [-18, -12.4, -6.8].flatMap((x) => [
        { position: [x, 4.8, 9.25], scale: [0.32, 9.6, 0.32] },
        { position: [x, 4.8, 4.25], scale: [0.32, 9.6, 0.32] },
      ]),
    [],
  );

  const canopyRails = useMemo(
    () => [
      { position: [-12.4, 9.5, 9.25], scale: [11.6, 0.32, 0.32] },
      { position: [-12.4, 0.35, 9.25], scale: [11.6, 0.3, 0.3] },
      { position: [-12.4, 4.8, 9.25], scale: [11.6, 0.22, 0.22] },
      { position: [-18, 9.5, 6.75], scale: [0.32, 0.32, 5.3] },
      { position: [-6.8, 9.5, 6.75], scale: [0.32, 0.32, 5.3] },
    ],
    [],
  );

  const canopyRoofRibs = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => ({
        position: [-18.1 + index * 0.95, 9.78, 6.75],
        scale: [0.08, 0.13, 5.6],
      })),
    [],
  );

  const shopFrames = useMemo(
    () => [
      { position: [-5.75, 2.65, 4.64], scale: [0.28, 5.3, 0.32] },
      { position: [-0.9, 2.65, 4.64], scale: [0.28, 5.3, 0.32] },
      { position: [4.05, 2.65, 4.64], scale: [0.28, 5.3, 0.32] },
      { position: [9, 2.65, 4.64], scale: [0.28, 5.3, 0.32] },
      { position: [1.65, 5.25, 4.64], scale: [15.1, 0.3, 0.32] },
    ],
    [],
  );

  const annexBrickCourses = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        position: [15.85, 0.8 + index * 0.72, 4.43],
        scale: [6.9, 0.06, 0.08],
      })),
    [],
  );

  const menuRows = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        position: [-8.25, 7.45 - index * 0.65, 9.42],
        scale: [2.7 - (index % 3) * 0.35, 0.075, 0.06],
      })),
    [],
  );

  return (
    <group position={position} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[-0.5, 0.06, 4.2]} receiveShadow>
        <boxGeometry args={[43, 0.12, 22]} />
        <meshStandardMaterial color="#aaa49a" roughness={0.96} />
      </mesh>
      <mesh position={[-0.5, 0.14, 10.55]} receiveShadow>
        <boxGeometry args={[42, 0.18, 3.1]} />
        <meshStandardMaterial color="#75736c" roughness={0.94} />
      </mesh>

      <mesh position={[1.4, 5.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[20.4, 10.1, 9]} />
        <meshStandardMaterial color="#e46337" emissive="#681d10" emissiveIntensity={0.07} roughness={0.8} />
      </mesh>
      <mesh position={[5.2, 11.3, -0.2]} castShadow>
        <boxGeometry args={[13.2, 3.2, 8.6]} />
        <meshStandardMaterial color="#aab4b5" metalness={0.12} roughness={0.72} />
      </mesh>
      <mesh position={[-2.4, 11.45, -0.15]} castShadow>
        <boxGeometry args={[4.5, 4.1, 8.8]} />
        <meshStandardMaterial color="#d65331" roughness={0.8} />
      </mesh>
      <BoxInstances items={containerSeams} color="#c5482c" roughness={0.9} />

      <mesh position={[1.65, 2.65, 4.56]}>
        <boxGeometry args={[14.8, 5.1, 0.18]} />
        <meshStandardMaterial
          color="#111c20"
          emissive="#4e2a1e"
          emissiveIntensity={0.17}
          metalness={0.32}
          roughness={0.23}
        />
      </mesh>
      <BoxInstances items={shopFrames} color="#b74429" roughness={0.76} castShadow />

      <Line points={[[-3.95, 0.35, 4.86], [-1.35, 5.05, 4.86]]} color="#df5b35" lineWidth={5} />
      <Line points={[[0.25, 0.35, 4.86], [-1.35, 5.05, 4.86]]} color="#df5b35" lineWidth={5} />
      <Line points={[[3.05, 0.35, 4.86], [5.15, 5.05, 4.86]]} color="#df5b35" lineWidth={5} />
      <Line points={[[7.25, 0.35, 4.86], [5.15, 5.05, 4.86]]} color="#df5b35" lineWidth={5} />

      <BoxInstances items={canopyColumns} color="#667173" metalness={0.72} roughness={0.35} castShadow />
      <BoxInstances items={canopyRails} color="#566164" metalness={0.7} roughness={0.38} />
      <mesh position={[-12.4, 9.7, 6.75]} castShadow>
        <boxGeometry args={[12.1, 0.22, 5.8]} />
        <meshStandardMaterial color="#424a4b" metalness={0.48} roughness={0.48} />
      </mesh>
      <BoxInstances items={canopyRoofRibs} color="#252d2e" metalness={0.66} roughness={0.4} />

      {[
        [-18, -12.4],
        [-12.4, -6.8],
      ].flatMap(([left, right], bay) => [
        <Line key={`front-up-${bay}`} points={[[left, 0.4, 9.42], [right, 9.35, 9.42]]} color="#c8cecd" lineWidth={3.5} />,
        <Line key={`front-down-${bay}`} points={[[right, 0.4, 9.42], [left, 9.35, 9.42]]} color="#c8cecd" lineWidth={3.5} />,
      ])}
      <Line points={[[-6.62, 0.4, 4.3], [-6.62, 9.35, 9.2]]} color="#c8cecd" lineWidth={3.2} />
      <Line points={[[-6.62, 9.35, 4.3], [-6.62, 0.4, 9.2]]} color="#c8cecd" lineWidth={3.2} />
      <Line points={[[-17.82, 0.4, 4.3], [-17.82, 9.35, 9.2]]} color="#c8cecd" lineWidth={3.2} />
      <Line points={[[-17.82, 9.35, 4.3], [-17.82, 0.4, 9.2]]} color="#c8cecd" lineWidth={3.2} />

      <mesh position={[-8.25, 4.8, 9.34]}>
        <boxGeometry args={[3.35, 8.65, 0.16]} />
        <meshStandardMaterial color="#11191b" metalness={0.34} roughness={0.3} />
      </mesh>
      <BoxInstances items={menuRows} color="#eee4cf" roughness={0.62} />
      <Html position={[-8.25, 8.35, 9.48]} center transform distanceFactor={8}>
        <div className="underbelly-menu-title">UNDERBELLY</div>
      </Html>

      <Html position={[-1.5, 7.85, 4.78]} center transform distanceFactor={12}>
        <div className="underbelly-photo-wordmark">
          <span>UNDERBELLY</span>
          <strong>12</strong>
          <small>THE HANGOUT HUB</small>
        </div>
      </Html>
      <mesh position={[2.25, 7.7, 4.71]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.18, 36]} />
        <meshStandardMaterial color="#172022" roughness={0.45} />
      </mesh>
      {[5.5, 8.45].map((x) => (
        <group key={`underbelly-arch-${x}`} position={[x, 7.55, 4.72]}>
          <mesh>
            <torusGeometry args={[0.78, 0.13, 10, 28]} />
            <meshStandardMaterial color="#20292a" metalness={0.35} roughness={0.46} />
          </mesh>
        </group>
      ))}

      <BoxInstances
        items={[-5.8, -2.9, 0, 2.9, 5.8, 8.7].map((x) => ({
          position: [x, 13.85, 4.52],
          scale: [0.11, 1.85, 0.11],
        }))}
        color="#252c2d"
        metalness={0.65}
      />
      <mesh position={[1.45, 14.72, 4.52]}>
        <boxGeometry args={[14.8, 0.12, 0.12]} />
        <meshStandardMaterial color="#252c2d" metalness={0.65} roughness={0.38} />
      </mesh>
      {[-4.35, -1.45, 1.45, 4.35, 7.25].map((x) => (
        <mesh key={`underbelly-ring-${x}`} position={[x, 13.85, 4.54]}>
          <torusGeometry args={[0.78, 0.09, 9, 24]} />
          <meshStandardMaterial color="#252c2d" metalness={0.65} roughness={0.38} />
        </mesh>
      ))}

      <mesh position={[15.85, 2.65, 0.9]} castShadow receiveShadow>
        <boxGeometry args={[6.9, 5.3, 7.2]} />
        <meshStandardMaterial color="#793026" roughness={0.9} />
      </mesh>
      <BoxInstances items={annexBrickCourses} color="#a24a38" roughness={0.92} />
      <mesh position={[15.8, 2.75, 4.54]}>
        <boxGeometry args={[3.25, 2.15, 0.18]} />
        <meshStandardMaterial color="#23353a" metalness={0.35} roughness={0.24} />
      </mesh>
      <mesh position={[15.85, 4.45, 4.68]} castShadow>
        <boxGeometry args={[4.8, 0.95, 0.28]} />
        <meshStandardMaterial color="#efe8d9" roughness={0.7} />
      </mesh>
      <Html position={[15.85, 4.45, 4.84]} center transform distanceFactor={8}>
        <div className="underbelly-side-sign">
          <strong>underbelly</strong>
          <span>VIT BHOPAL</span>
        </div>
      </Html>

      <mesh position={[11.2, 0.72, 11.55]} castShadow>
        <boxGeometry args={[5.4, 0.3, 1.4]} />
        <meshStandardMaterial color="#8f3f2f" roughness={0.82} />
      </mesh>
      <BoxInstances
        items={[
          { position: [9.3, 0.36, 11.55], scale: [0.32, 0.72, 1.05] },
          { position: [13.1, 0.36, 11.55], scale: [0.32, 0.72, 1.05] },
        ]}
        color="#5c3128"
        roughness={0.86}
      />
      {[-4.8, 4.8, 16.8].map((x) => (
        <group key={`underbelly-bollard-${x}`} position={[x, 0, 10.45]}>
          <mesh position={[0, 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.18, 1.2, 10]} />
            <meshStandardMaterial color="#444a49" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#f3b15c" emissive="#f3b15c" emissiveIntensity={0.75} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 4.2, 7]} color="#ff9957" intensity={7} distance={26} decay={2} />
    </group>
  );
}

function ArchitectureBlock({ proposalVisible }) {
  const white = "#f1f1ec";
  const grey = "#a9adb2";
  const glass = "#1e3242";
  const floorY = [2, 6, 10];

  const facadePosts = useMemo(() => {
    const items = [];
    for (let z = -21; z <= 21; z += 6) {
      items.push({ position: [-9, 6.5, z], scale: [0.55, 13, 0.55] });
      items.push({ position: [9, 6.5, z], scale: [0.55, 13, 0.55] });
    }
    for (const x of [-6, 0, 6]) {
      items.push({ position: [x, 6.5, -22], scale: [0.55, 13, 0.55] });
      items.push({ position: [x, 6.5, 22], scale: [0.55, 13, 0.55] });
    }
    return items;
  }, []);

  const stripMullions = useMemo(() => {
    const items = [];
    for (const y of floorY) {
      for (let z = -19.5; z <= 19.5; z += 3) {
        if (Math.abs(z) < 3) continue;
        items.push({ position: [-9.13, y, z], scale: [0.07, 3.3, 0.07] });
        items.push({ position: [9.13, y, z], scale: [0.07, 3.3, 0.07] });
      }
    }
    for (let x = -7.5; x <= 7.5; x += 3) {
      items.push({ position: [x, 6, -22.18], scale: [0.07, 12.1, 0.07] });
      items.push({ position: [x, 6, 22.18], scale: [0.07, 12.1, 0.07] });
    }
    return items;
  }, []);

  const stripWindows = useMemo(
    () =>
      floorY.flatMap((y) => [
        { position: [-9.07, y, -12.5], scale: [0.16, 3.1, 19] },
        { position: [-9.07, y, 12.5], scale: [0.16, 3.1, 19] },
        { position: [9.07, y, 0], scale: [0.16, 3.1, 44] },
        { position: [0, y, -22.07], scale: [18, 3.1, 0.16] },
        { position: [0, y, 22.07], scale: [18, 3.1, 0.16] },
      ]),
    [],
  );

  const ribs = useMemo(
    () =>
      [0.3, 4.3, 8.3, 12.3].map((y) => ({
        position: [0, y, 0],
        scale: [18.7, 0.55, 44.7],
      })),
    [],
  );

  const roofUnits = useMemo(
    () =>
      [-14, -7, 0, 7, 14].map((z) => ({
        position: [0, 13.5, z],
        scale: [2.5, 1.4, 3],
      })),
    [],
  );

  const entranceSteps = useMemo(
    () =>
      [0, 1, 2].map((index) => ({
        position: [-10.6 - index * 1.3, 0.08 + index * 0.16, 0],
        scale: [1.3, 0.16, 6.6],
      })),
    [],
  );

  return (
    <group position={[129, 0.25, 96]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 6, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 12, 44]} />
        <meshStandardMaterial color={grey} roughness={0.62} />
      </mesh>
      <mesh position={[0, 12.6, 0]} castShadow>
        <boxGeometry args={[19, 1, 45]} />
        <meshStandardMaterial color={white} roughness={0.7} />
      </mesh>
      <BoxInstances items={ribs} color={white} roughness={0.72} castShadow />
      <mesh position={[0, 6, -22.07]} castShadow>
        <boxGeometry args={[18, 12, 0.22]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[0, 6, 22.07]} castShadow>
        <boxGeometry args={[18, 12, 0.22]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <BoxInstances items={stripWindows} color={glass} metalness={0.85} roughness={0.12} />
      <BoxInstances items={facadePosts} color={white} roughness={0.68} castShadow />
      <BoxInstances items={stripMullions} color="#c9ced2" metalness={0.5} roughness={0.3} />

      <mesh position={[-9.07, 2, 0]} castShadow>
        <boxGeometry args={[0.25, 4, 6]} />
        <meshStandardMaterial color={glass} metalness={0.85} roughness={0.12} />
      </mesh>
      <mesh position={[-9.07, 4.25, 0]}>
        <boxGeometry args={[0.4, 0.5, 6.6]} />
        <meshStandardMaterial color={white} roughness={0.7} />
      </mesh>
      <BoxInstances
        items={[-3.05, 3.05].map((z) => ({
          position: [-9.07, 2, z],
          scale: [0.4, 4, 0.4],
        }))}
        color={white}
        roughness={0.68}
        castShadow
      />
      <mesh position={[-9.07, 0.1, 0]}>
        <boxGeometry args={[0.6, 0.2, 6.6]} />
        <meshStandardMaterial color="#33363a" roughness={0.95} />
      </mesh>
      <BoxInstances items={entranceSteps} color="#33363a" roughness={0.95} castShadow />

      <mesh position={[-7, 0.06, 0]} receiveShadow>
        <boxGeometry args={[14, 0.12, 12]} />
        <meshStandardMaterial color="#8d9296" roughness={0.9} />
      </mesh>

      {proposalVisible && <BoxInstances items={roofUnits} color="#b9bdc2" roughness={0.55} castShadow />}
    </group>
  );
}

function BlockTwoVolume({
  width,
  depth = 18,
  floors = 5,
  position,
  screenSide = null,
  fins = false,
  pilotis = false,
  roofPavilion = false,
  rotation = 0,
}) {
  const floorHeight = 3.15;
  const height = floors * floorHeight + 1.25;
  const screenWidth = screenSide ? Math.min(10.5, width * 0.3) : 0;
  const screenCenter = screenSide === "left"
    ? -width / 2 + screenWidth / 2 + 1.1
    : width / 2 - screenWidth / 2 - 1.1;
  const architecture = useMemo(() => {
    const windows = [];
    const sideWindows = [];
    const floorLines = [];
    const screenGrid = [];
    const columns = Math.max(3, Math.floor(width / 3.15));
    const sideColumns = Math.max(2, Math.floor(depth / 4.6));
    for (let floor = 0; floor < floors; floor += 1) {
      if (pilotis && floor === 0) continue;
      const y = 2.1 + floor * floorHeight;
      for (let column = 0; column < columns; column += 1) {
        const x = -width / 2 + 1.75 + (column * (width - 3.5)) / Math.max(columns - 1, 1);
        if (screenSide && Math.abs(x - screenCenter) < screenWidth / 2 + 0.6) continue;
        windows.push(
          { position: [x, y, depth / 2 + 0.18], scale: [1.18, 1.22, 0.18] },
          { position: [x, y, -depth / 2 - 0.18], scale: [1.18, 1.22, 0.18] },
        );
      }
      for (let column = 0; column < sideColumns; column += 1) {
        const z = -depth / 2 + 2.1 + (column * (depth - 4.2)) / Math.max(sideColumns - 1, 1);
        sideWindows.push(
          { position: [width / 2 + 0.17, y, z], scale: [0.18, 1.22, 1.15] },
          { position: [-width / 2 - 0.17, y, z], scale: [0.18, 1.22, 1.15] },
        );
      }
      floorLines.push({
        position: [0, 0.6 + floor * floorHeight, depth / 2 + 0.22],
        scale: [width + 0.2, 0.16, 0.3],
      });
    }
    if (screenSide) {
      for (let row = 1; row < floors * 3; row += 1) {
        screenGrid.push({
          position: [screenCenter, 0.7 + (row * (height - 1.4)) / (floors * 3), depth / 2 + 0.48],
          scale: [screenWidth, 0.09, 0.14],
        });
      }
      for (let column = 1; column < 5; column += 1) {
        screenGrid.push({
          position: [screenCenter - screenWidth / 2 + (column * screenWidth) / 5, height / 2, depth / 2 + 0.49],
          scale: [0.09, height - 1.4, 0.14],
        });
      }
    }
    return { windows, sideWindows, floorLines, screenGrid };
  }, [depth, floors, height, pilotis, screenCenter, screenSide, screenWidth, width]);

  const finItems = useMemo(() => {
    if (!fins) return [];
    const bayCenter = screenSide === "left" ? width * 0.18 : -width * 0.18;
    return [-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2].map((offset) => ({
      position: [bayCenter + offset, height / 2, depth / 2 + 0.72],
      scale: [0.28, height - 0.8, 1.15],
    }));
  }, [depth, fins, height, screenSide, width]);

  const pilotisColumns = useMemo(() => {
    if (!pilotis) return [];
    return [-width * 0.34, -width * 0.12, width * 0.12, width * 0.34].flatMap((x) => [
      { position: [x, 2.35, depth / 2 - 1.1], scale: [0.72, 4.7, 0.72] },
      { position: [x, 2.35, -depth / 2 + 1.1], scale: [0.72, 4.7, 0.72] },
    ]);
  }, [depth, pilotis, width]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {pilotis ? (
        <>
          <mesh position={[0, (height + 5) / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height - 5, depth]} />
            <meshStandardMaterial color="#d7cfb9" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.4, -depth / 2 + 0.65]} castShadow>
            <boxGeometry args={[width - 2.4, 4.5, 1.1]} />
            <meshStandardMaterial color="#33434a" metalness={0.25} roughness={0.28} />
          </mesh>
          <BoxInstances items={pilotisColumns} color="#d8d2c2" roughness={0.78} castShadow />
        </>
      ) : (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#d7cfb9" roughness={0.85} />
        </mesh>
      )}
      <BoxInstances
        items={[...architecture.windows, ...architecture.sideWindows]}
        color="#344a52"
        emissive="#caa467"
        emissiveIntensity={0.1}
        metalness={0.22}
        roughness={0.28}
      />
      <BoxInstances items={architecture.floorLines} color="#e5dfcf" roughness={0.8} />
      {screenSide && (
        <>
          <mesh position={[screenCenter, height / 2, depth / 2 + 0.35]} castShadow>
            <boxGeometry args={[screenWidth, height - 1.35, 0.48]} />
            <meshStandardMaterial color="#a85440" roughness={0.9} />
          </mesh>
          <BoxInstances items={architecture.screenGrid} color="#c98268" roughness={0.82} />
        </>
      )}
      <BoxInstances items={finItems} color="#e7e2d4" roughness={0.72} castShadow />
      <mesh position={[0, height + 0.32, 0]} castShadow>
        <boxGeometry args={[width + 0.7, 0.65, depth + 0.7]} />
        <meshStandardMaterial color="#ddd7c7" roughness={0.8} />
      </mesh>
      {roofPavilion && (
        <mesh position={[0, height + 1.55, -1]} castShadow>
          <boxGeometry args={[width * 0.55, 2.4, depth * 0.52]} />
          <meshStandardMaterial color="#3e4648" roughness={0.56} metalness={0.15} />
        </mesh>
      )}
    </group>
  );
}

function AcademicBlockTwo({ proposalVisible }) {
  const facade = useMemo(() => {
    const frontWindows = [];
    const featureWindows = [];
    const featureFrames = [];
    const upperWindows = [];
    const endWindows = [];
    const sideWindows = [];
    const frontFins = [];
    const frontBands = [];
    const sideScreenGrid = [];

    const middleColumns = 27;
    const middleWidth = 110;
    const middleStep = middleWidth / middleColumns;
    for (let column = 0; column < middleColumns; column += 1) {
      const x = -middleWidth / 2 + middleStep * (column + 0.5);
      [4.2, 7.8, 11.4, 15, 18.6].forEach((y) => {
        frontWindows.push({ position: [x, y, 27.25], scale: [2.25, 1.55, 0.28] });
      });
    }

    for (let column = 0; column <= middleColumns; column += 1) {
      const x = -middleWidth / 2 + middleStep * column;
      frontFins.push({ position: [x, 11.25, 27.72], scale: [0.34, 18.5, 1.18] });
    }
    [2.25, 5.95, 9.55, 13.15, 16.75, 20.45].forEach((y) => {
      frontBands.push({ position: [0, y, 27.68], scale: [111, 0.32, 1.08] });
    });

    [-34, 34].forEach((centerX) => {
      [-8, -4, 0, 4, 8].forEach((offset) => {
        [4.15, 7.85, 11.55, 15.25, 18.95, 22.65, 26.35].forEach((y) => {
          featureWindows.push({
            position: [centerX + offset, y, 28.42],
            scale: [2.15, 1.58, 0.26],
          });
        });
      });
      [-12, -10, -6, -2, 2, 6, 10, 12].forEach((offset) => {
        featureFrames.push({
          position: [centerX + offset, 14.2, 28.62],
          scale: [0.34, 27.6, 1.08],
        });
      });
      [2.25, 6, 9.7, 13.4, 17.1, 20.8, 24.5, 28.05].forEach((y) => {
        featureFrames.push({
          position: [centerX, y, 28.6],
          scale: [24.2, 0.34, 1.08],
        });
      });
    });

    for (let column = 0; column < 21; column += 1) {
      const x = -49.5 + column * 4.95;
      [23.05, 26.35].forEach((y) => {
        upperWindows.push({ position: [x, y, 27.35], scale: [1.42, 1.5, 0.25] });
      });
    }

    [-1, 1].forEach((side) => {
      const centerX = side * 70;
      for (let column = 0; column < 6; column += 1) {
        const x = centerX - 11.2 + column * 4.48;
        [15.1, 18.8, 22.5, 26.2].forEach((y) => {
          endWindows.push({ position: [x, y, 30.25], scale: [1.62, 1.58, 0.28] });
        });
      }
      [-30, -24, -18, 18, 24].forEach((z) => {
        [5.1, 8.8, 12.5, 16.2, 19.9, 23.6, 27.3].forEach((y) => {
          sideWindows.push({
            position: [side * 85.18, y, z],
            scale: [0.26, 1.5, 1.7],
          });
        });
      });
      [-7.2, -3.6, 0, 3.6, 7.2].forEach((z) => {
        sideScreenGrid.push({
          position: [side * 85.46, 15.2, z],
          scale: [0.15, 23.4, 0.22],
        });
      });
      [4.5, 8.1, 11.7, 15.3, 18.9, 22.5, 26.1].forEach((y) => {
        sideScreenGrid.push({
          position: [side * 85.47, y, 0],
          scale: [0.15, 0.2, 18.2],
        });
      });
    });

    return {
      endWindows,
      featureFrames,
      featureWindows,
      frontBands,
      frontFins,
      frontWindows,
      sideScreenGrid,
      sideWindows,
      upperWindows,
    };
  }, []);

  const landscape = useMemo(() => {
    const shrubs = [];
    const trees = [];
    const trunks = [];
    for (let x = -82; x <= 82; x += 7.5) {
      shrubs.push({ position: [x, 0.82, 38], scale: [1.2, 0.75, 0.95] });
    }
    [-76, -55, -31, 31, 55, 76].forEach((x, index) => {
      const z = index % 2 ? 44 : 46;
      trunks.push({ position: [x, 1.55, z], scale: [0.28, 3.1, 0.28] });
      trees.push({ position: [x, 4.15, z], scale: [2.05, 2.35, 2.05] });
    });
    return { shrubs, trees, trunks };
  }, []);

  const portalColumns = useMemo(
    () => [
      { position: [-81.5, 6.4, 30.75], scale: [2.1, 12.8, 2.1] },
      { position: [-58.5, 6.4, 30.75], scale: [2.1, 12.8, 2.1] },
      { position: [58.5, 6.4, 30.75], scale: [2.1, 12.8, 2.1] },
      { position: [81.5, 6.4, 30.75], scale: [2.1, 12.8, 2.1] },
    ],
    [],
  );

  const courtyard = useMemo(() => {
    const windows = [];
    const trees = [];
    const trunks = [];
    const benches = [];

    for (let column = 0; column < 24; column += 1) {
      const x = -50.5 + column * (101 / 23);
      [4.25, 7.9, 11.55, 15.2, 18.85, 22.5, 26.15].forEach((y) => {
        windows.push(
          { position: [x, y, 6.72], scale: [2.2, 1.48, 0.24] },
          { position: [x, y, -21.72], scale: [2.2, 1.48, 0.24] },
        );
      });
    }

    [-1, 1].forEach((side) => {
      [-18, -12.5, -7, -1.5, 4].forEach((z) => {
        [4.25, 7.9, 11.55, 15.2, 18.85, 22.5, 26.15].forEach((y) => {
          windows.push({
            position: [side * 54.72, y, z],
            scale: [0.24, 1.48, 2.1],
          });
        });
      });
    });

    [-38, -19, 19, 38].forEach((x, index) => {
      const z = index % 2 ? -13 : -3;
      trunks.push({ position: [x, 1.45, z], scale: [0.24, 2.9, 0.24] });
      trees.push({ position: [x, 3.85, z], scale: [1.7, 2, 1.7] });
    });

    [-31, -10, 10, 31].forEach((x, index) => {
      benches.push({
        position: [x, 0.65, index % 2 ? -16.8 : 1.2],
        scale: [5.2, 0.42, 1.2],
      });
    });

    return { benches, trees, trunks, windows };
  }, []);

  return (
    <group position={[-130, 0.25, -410]} rotation={[0, 0.01, 0]}>
      <mesh position={[0, 0.08, 4]} receiveShadow>
        <boxGeometry args={[190, 0.16, 82]} />
        <meshStandardMaterial color="#b7ad98" roughness={0.98} />
      </mesh>
      <mesh position={[0, 14, -29]} castShadow receiveShadow>
        <boxGeometry args={[112, 28, 14]} />
        <meshStandardMaterial color="#cfc1a6" roughness={0.86} />
      </mesh>
      <mesh position={[0, 9.8, 17]} castShadow receiveShadow>
        <boxGeometry args={[118, 19.6, 20]} />
        <meshStandardMaterial color="#e0ddd2" roughness={0.82} />
      </mesh>
      <mesh position={[0, 23.2, 17]} castShadow receiveShadow>
        <boxGeometry args={[103, 9.6, 20]} />
        <meshStandardMaterial color="#cbbb9f" roughness={0.86} />
      </mesh>
      {[-70, 70].map((x) => (
        <group key={`block-two-end-tower-${x}`} position={[x, 0, -3]}>
          <mesh position={[0, 15.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[30, 30.5, 66]} />
            <meshStandardMaterial color="#d5c7aa" roughness={0.85} />
          </mesh>
          <mesh position={[0, 30.8, 0]} castShadow>
            <boxGeometry args={[31.2, 0.65, 67.2]} />
            <meshStandardMaterial color="#e0d7c3" roughness={0.82} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 28.35, -29]} castShadow>
        <boxGeometry args={[113, 0.7, 15]} />
        <meshStandardMaterial color="#dfd4bd" roughness={0.82} />
      </mesh>
      <mesh position={[0, 28.35, 17]} castShadow>
        <boxGeometry args={[119, 0.7, 21]} />
        <meshStandardMaterial color="#dfd4bd" roughness={0.82} />
      </mesh>

      <BoxInstances
        items={[...facade.frontWindows, ...facade.upperWindows, ...facade.endWindows, ...facade.sideWindows]}
        color="#273b42"
        emissive="#b78b54"
        emissiveIntensity={0.06}
        metalness={0.25}
        roughness={0.26}
      />
      <BoxInstances items={facade.frontFins} color="#e8e4d9" roughness={0.72} castShadow />
      <BoxInstances items={facade.frontBands} color="#d9d6cd" roughness={0.75} castShadow />
      {[-34, 34].map((x) => (
        <mesh key={`block-two-feature-backing-${x}`} position={[x, 14.2, 27.92]} castShadow>
          <boxGeometry args={[24.4, 27.6, 0.75]} />
          <meshStandardMaterial color="#dad9d2" roughness={0.78} />
        </mesh>
      ))}
      <BoxInstances
        items={facade.featureWindows}
        color="#273b42"
        emissive="#b78b54"
        emissiveIntensity={0.06}
        metalness={0.25}
        roughness={0.26}
      />
      <BoxInstances items={facade.featureFrames} color="#eeeae0" roughness={0.7} castShadow />

      {[-1, 1].map((side) => (
        <mesh key={`block-two-red-screen-${side}`} position={[side * 85.3, 15.2, 0]} castShadow>
          <boxGeometry args={[0.48, 23.8, 18.5]} />
          <meshStandardMaterial color="#a95440" roughness={0.9} />
        </mesh>
      ))}
      <BoxInstances items={facade.sideScreenGrid} color="#c77c64" roughness={0.84} />

      {[-70, 70].map((x) => (
        <mesh key={`block-two-portal-${x}`} position={[x, 6.2, 30.4]}>
          <boxGeometry args={[20.5, 12.4, 0.62]} />
          <meshStandardMaterial color="#3b3832" roughness={0.94} />
        </mesh>
      ))}
      <BoxInstances items={portalColumns} color="#d9cbb0" roughness={0.8} castShadow />
      {[-70, 70].map((x) => (
        <mesh key={`block-two-portal-lintel-${x}`} position={[x, 13.05, 30.75]} castShadow>
          <boxGeometry args={[25.2, 1.35, 2.1]} />
          <meshStandardMaterial color="#d9cbb0" roughness={0.8} />
        </mesh>
      ))}
      <Html position={[70, 7.1, 30.85]} center transform distanceFactor={44}>
        <div className="block-two-vit-mark">VIT</div>
      </Html>

      {[-1, 1].map((side) => (
        <group key={`block-two-steps-${side}`} position={[side * 70, 0, 31]}>
          {[0, 1, 2, 3].map((step) => (
            <mesh key={`block-two-step-${side}-${step}`} position={[0, 0.12 + step * 0.12, step * 0.9]} castShadow>
              <boxGeometry args={[27, 0.24, 2.2]} />
              <meshStandardMaterial color="#7e776b" roughness={0.96} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 0.11, -7.5]} receiveShadow>
        <boxGeometry args={[108, 0.18, 27]} />
        <meshStandardMaterial color="#4d7d49" roughness={1} />
      </mesh>
      <BoxInstances
        items={[
          { position: [0, 0.22, -7.5], scale: [4.2, 0.22, 27] },
          { position: [0, 0.23, 4.4], scale: [108, 0.22, 2.5] },
          { position: [0, 0.23, -19.4], scale: [108, 0.22, 2.5] },
          { position: [-52.5, 0.23, -7.5], scale: [2.5, 0.22, 26] },
          { position: [52.5, 0.23, -7.5], scale: [2.5, 0.22, 26] },
        ]}
        color="#c9bea8"
        roughness={0.96}
      />
      <BoxInstances
        items={courtyard.windows}
        color="#2c4147"
        emissive="#ad8653"
        emissiveIntensity={0.06}
        metalness={0.24}
        roughness={0.28}
      />
      <CylinderInstances items={courtyard.trunks} color="#66503d" radialSegments={8} castShadow />
      <IcoInstances items={courtyard.trees} color="#376b40" castShadow />
      <BoxInstances items={courtyard.benches} color="#805d3c" roughness={0.86} castShadow />

      <mesh position={[0, 0.12, 43]} receiveShadow>
        <boxGeometry args={[190, 0.22, 28]} />
        <meshStandardMaterial color="#4f824e" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 32.8]} receiveShadow>
        <boxGeometry args={[178, 0.24, 6.4]} />
        <meshStandardMaterial color="#c9bda7" roughness={0.96} />
      </mesh>
      <BoxInstances items={landscape.shrubs} color="#487346" roughness={1} castShadow />
      <CylinderInstances items={landscape.trunks} color="#66503d" radialSegments={8} castShadow />
      <IcoInstances items={landscape.trees} color="#35673d" castShadow />

      {proposalVisible && (
        <group position={[0, 0, -29]}>
          <RooftopSolar width={86} depth={9} y={29.1} rows={2} columns={12} />
        </group>
      )}
    </group>
  );
}

function HostelWing({
  width = 54,
  depth = 12,
  floors = 4,
  position,
  rotation = 0,
  color = "#d2c4a2",
  proposalVisible,
}) {
  const height = floors * 3 + 1;
  const roofTanks = useMemo(
    () => [
      { position: [-width * 0.18, height + 1.55, 0], scale: [1.1, 2.3, 1.1] },
      { position: [width * 0.18, height + 1.55, 0], scale: [1.1, 2.3, 1.1] },
    ],
    [height, width],
  );
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <DetailedWing
        width={width}
        depth={depth}
        floors={floors}
        wall={color}
        accents={false}
      />
      <mesh position={[0, height - 0.2, depth / 2 + 0.1]}>
        <boxGeometry args={[width - 3, 0.35, 0.45]} />
        <meshStandardMaterial color="#914f37" />
      </mesh>
      <mesh position={[0, 3.9, depth / 2 + 0.55]} castShadow>
        <boxGeometry args={[5.4, 7.8, 1.1]} />
        <meshStandardMaterial
          color="#244554"
          metalness={0.34}
          roughness={0.25}
        />
      </mesh>
      <CylinderInstances
        items={roofTanks}
        color="#c7ceca"
        radialSegments={16}
        roughness={0.42}
      />
      {proposalVisible && (
        <RooftopSolar
          width={width - 5}
          depth={depth - 3}
          y={height + 0.8}
          rows={2}
          columns={Math.max(4, Math.floor(width / 7))}
        />
      )}
    </group>
  );
}

function BoysHostel({ proposalVisible }) {
  return (
    <group position={[114, 0.25, -125]} rotation={[0, -0.03, 0]}>
      <HostelWing width={63} position={[0, 0, -18]} proposalVisible={proposalVisible} />
      <HostelWing
        width={45}
        position={[-26, 0, 4]}
        rotation={Math.PI / 2}
        proposalVisible={proposalVisible}
      />
      <HostelWing
        width={45}
        position={[26, 0, 4]}
        rotation={Math.PI / 2}
        proposalVisible={proposalVisible}
      />
      <mesh position={[0, 0.2, 3]} receiveShadow>
        <boxGeometry args={[39, 0.3, 33]} />
        <meshStandardMaterial color="#9e9b8e" />
      </mesh>
      <Tree position={[-8, 0, 2]} scale={0.75} />
      <Tree position={[9, 0, 7]} scale={0.75} />
    </group>
  );
}

function HostelPrecinct({ proposalVisible }) {
  const courtLines = [
    [[-10, 0.34, -16], [10, 0.34, -16], [10, 0.34, 16], [-10, 0.34, 16], [-10, 0.34, -16]],
    [[0, 0.34, -16], [0, 0.34, 16]],
    [[-10, 0.34, -4.8], [-6.5, 0.34, -4.8], [-6.5, 0.34, 4.8], [-10, 0.34, 4.8]],
    [[10, 0.34, -4.8], [6.5, 0.34, -4.8], [6.5, 0.34, 4.8], [10, 0.34, 4.8]],
  ];
  const hoops = [
    { position: [-9.25, 2.2, 0], scale: [0.16, 4.1, 0.16] },
    { position: [9.25, 2.2, 0], scale: [0.16, 4.1, 0.16] },
  ];

  const lawnTennisCourt = useMemo(
    () => [
      {
        position: [0, 0.08, 50],
        scale: [26, 0.12, 14],
      },
    ],
    [],
  );

  const lawnTennisLines = useMemo(
    () => [
      [[-12.8, 0.34, 42], [12.8, 0.34, 42]],
      [[-12.8, 0.34, 58], [12.8, 0.34, 58]],
      [[-13, 0.34, 50], [13, 0.34, 50]],
      [[-12.8, 0.34, 50], [-12.8, 0.34, 42]],
      [[12.8, 0.34, 50], [12.8, 0.34, 42]],
      [[-12.8, 0.34, 50], [-12.8, 0.34, 58]],
      [[12.8, 0.34, 50], [12.8, 0.34, 58]],
    ],
    [],
  );

  const lawnTennisNet = useMemo(
    () => [
      {
        position: [0, 1.05, 50],
        scale: [26.5, 1.2, 0.18],
      },
    ],
    [],
  );

  const lawnTennisPosts = useMemo(
    () => [
      { position: [-13, 1.2, 50], scale: [0.2, 2.4, 0.2] },
      { position: [13, 1.2, 50], scale: [0.2, 2.4, 0.2] },
    ],
    [],
  );

  return (
    <group position={[-520, 0.25, -270]} rotation={[0, -0.025, 0]}>
      <ReferenceHostelBlock position={[-22, 0, -20]} rotation={0} proposalVisible={proposalVisible} />
      <ReferenceHostelBlock position={[22, 0, -20]} rotation={Math.PI} proposalVisible={proposalVisible} />
      <ReferenceHostelBlock position={[-22, 0, 20]} rotation={0} proposalVisible={proposalVisible} />
      <ReferenceHostelBlock position={[22, 0, 20]} rotation={Math.PI} proposalVisible={proposalVisible} />
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <boxGeometry args={[22, 0.25, 36]} />
        <meshStandardMaterial color="#b65b3b" roughness={0.92} />
      </mesh>
      <BoxInstances items={lawnTennisCourt} color="#4d8e3d" roughness={0.92} />
      {lawnTennisLines.map((points, index) => (
        <Line key={`lawn-tennis-line-${index}`} points={points} color="#f4f2e6" lineWidth={0.8} />
      ))}
      <BoxInstances items={lawnTennisNet} color="#e2e2d8" roughness={0.76} />
      <CylinderInstances items={lawnTennisPosts} color="#333333" radialSegments={10} roughness={0.4} />
      {courtLines.map((points, index) => (
        <Line key={`hostel-court-line-${index}`} points={points} color="#f6ead0" lineWidth={0.85} />
      ))}
      <CylinderInstances items={hoops} color="#f5f2e8" radialSegments={10} roughness={0.4} />
      <BoxInstances
        items={[
          { position: [-8.75, 3.8, 0], scale: [0.15, 1.25, 2.1] },
          { position: [8.75, 3.8, 0], scale: [0.15, 1.25, 2.1] },
          { position: [-8.45, 3.25, 0], scale: [0.9, 0.08, 0.12] },
          { position: [8.45, 3.25, 0], scale: [0.9, 0.08, 0.12] },
        ]}
        color="#f5f2e8"
        metalness={0.35}
      />
    </group>
  );
}

function ReferenceHostelBlock({ position, rotation, proposalVisible }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <HostelWing width={30} depth={10} floors={6} position={[0, 0, -9]} color="#e6e4da" proposalVisible={proposalVisible} />
      <HostelWing width={25} depth={10} floors={6} position={[-10, 0, 5]} rotation={Math.PI / 2} color="#e6e4da" proposalVisible={proposalVisible} />
      <HostelWing width={25} depth={10} floors={6} position={[10, 0, 5]} rotation={Math.PI / 2} color="#e6e4da" proposalVisible={proposalVisible} />
      <mesh position={[0, 0.14, 3]} receiveShadow>
        <boxGeometry args={[13, 0.24, 13]} />
        <meshStandardMaterial color="#d4d1c7" roughness={0.92} />
      </mesh>
      <Tree position={[0, 0, 3]} scale={0.55} />
    </group>
  );
}

function PalmGrove({ items }) {
  const { trunks, leaves } = useMemo(() => {
    const trunkItems = [];
    const leafItems = [];
    items.forEach(([x, z, scale], palmIndex) => {
      const height = 6.8 * scale;
      trunkItems.push({
        position: [x, height / 2, z],
        scale: [0.28 * scale, height, 0.28 * scale],
      });
      for (let leaf = 0; leaf < 7; leaf += 1) {
        const angle = (leaf / 7) * Math.PI * 2 + palmIndex * 0.31;
        leafItems.push({
          position: [
            x + Math.sin(angle) * 1.55 * scale,
            height + 0.25 - (leaf % 2) * 0.25,
            z + Math.cos(angle) * 1.55 * scale,
          ],
          rotation: [0.16 + (leaf % 2) * 0.08, angle, 0],
          scale: [0.45 * scale, 0.12, 4.2 * scale],
        });
      }
    });
    return { trunks: trunkItems, leaves: leafItems };
  }, [items]);
  return (
    <group>
      <CylinderInstances
        items={trunks}
        color="#8b6845"
        radialSegments={9}
        roughness={0.95}
        castShadow
      />
      <BoxInstances items={leaves} color="#2e7846" roughness={0.9} castShadow />
    </group>
  );
}

function GirlsHostel({ proposalVisible }) {
  const orangeFrames = useMemo(() => {
    const items = [];
    [-35, -23, -12, 0, 12, 23, 35].forEach((x) => {
      items.push({
        position: [x, 10.2, -17.82],
        scale: [1.3, 19.2, 0.35],
      });
    });
    [-22, -11, 0, 11, 22].forEach((x) => {
      items.push({
        position: [x, 7.2, 28.18],
        scale: [1.2, 13, 0.35],
      });
    });
    [-25, -13, 0, 13, 25].forEach((z) => {
      items.push(
        {
          position: [-50, 10.2, z],
          scale: [0.35, 19.2, 1.15],
        },
        {
          position: [50, 10.2, z],
          scale: [0.35, 19.2, 1.15],
        },
      );
    });
    return items;
  }, []);
  const screenBlocks = useMemo(() => {
    const items = [];
    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        if ((row + column) % 3 !== 0) {
          items.push({
            position: [-7.2 + column * 2.4, 3.2 + row * 2.05, -23.35],
            scale: [1.65, 1.2, 0.34],
          });
        }
      }
    }
    return items;
  }, []);
  const courtyardTrees = useMemo(
    () => [
      [-16, 3, 0.78],
      [16, 3, 0.78],
      [-16, 16, 0.72],
      [16, 16, 0.72],
      [0, 25, 0.7],
    ],
    [],
  );
  const boundary = useMemo(
    () => [
      { position: [0, 1.05, -48], scale: [100, 2.1, 0.55] },
      { position: [-48, 1.05, 0], scale: [0.55, 2.1, 100] },
      { position: [48, 1.05, 0], scale: [0.55, 2.1, 100] },
      { position: [-28, 1.05, 48], scale: [30, 2.1, 0.55] },
      { position: [28, 1.05, 48], scale: [30, 2.1, 0.55] },
    ],
    [],
  );
  return (
    <group position={[238, 0.25, -155]} rotation={[0, -0.025, 0]}>
      <DetailedWing
        width={100}
        depth={24}
        floors={6}
        wall="#c9c9c3"
        accents={false}
        position={[0, 0, -30]}
      />
      <DetailedWing
        width={24}
        depth={85}
        floors={6}
        wall="#d0d0ca"
        accents={false}
        position={[-40, 0, 4]}
      />
      <DetailedWing
        width={24}
        depth={85}
        floors={6}
        wall="#d0d0ca"
        accents={false}
        position={[40, 0, 4]}
      />
      <DetailedWing
        width={62}
        depth={20}
        floors={4}
        wall="#bebfbb"
        accents={false}
        position={[0, 0, 38]}
      />
      <BoxInstances items={orangeFrames} color="#d36c32" roughness={0.7} />
      <BoxInstances
        items={screenBlocks}
        color="#9b5a38"
        metalness={0.18}
        roughness={0.65}
      />
      <mesh position={[0, 5.8, 36]} castShadow>
        <boxGeometry args={[11, 11.6, 3.8]} />
        <meshStandardMaterial
          color="#294b58"
          metalness={0.34}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 3.6, 43]} castShadow>
        <boxGeometry args={[26, 0.65, 10]} />
        <meshStandardMaterial color="#eee9de" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.14, 7]} receiveShadow>
        <boxGeometry args={[65, 0.25, 52]} />
        <meshStandardMaterial color="#b9af96" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.21, 12]} receiveShadow>
        <circleGeometry args={[12, 40]} />
        <meshStandardMaterial color="#447647" roughness={1} />
      </mesh>
      <PalmGrove items={courtyardTrees} />
      <BoxInstances items={boundary} color="#d1c8b3" roughness={0.9} />
      <group position={[0, 0, 52]}>
        <mesh position={[-10, 2.1, 0]} castShadow>
          <boxGeometry args={[11, 4.2, 8]} />
          <meshStandardMaterial color="#d9d3c4" roughness={0.78} />
        </mesh>
        <mesh position={[-10, 1.8, 4.2]}>
          <planeGeometry args={[5.2, 3.2]} />
          <meshStandardMaterial color="#264753" metalness={0.3} />
        </mesh>
        <BoxInstances
          items={[
            { position: [-3, 2.1, 0], scale: [0.28, 4.2, 9] },
            { position: [3, 2.1, 0], scale: [0.28, 4.2, 9] },
            { position: [0, 4.1, 0], scale: [6, 0.28, 9] },
          ]}
          color="#637176"
          metalness={0.55}
        />
      </group>
      <Html position={[0, 16.8, 48]} center transform distanceFactor={13}>
        <div className="building-sign">GIRLS' HOSTEL</div>
      </Html>
      {proposalVisible && (
        <>
          <RooftopSolar width={85} depth={16} y={21.6} rows={2} columns={12} />
          <group position={[-40, 0, 4]} rotation={[0, Math.PI / 2, 0]}>
            <RooftopSolar width={60} depth={14} y={21.6} rows={2} columns={8} />
          </group>
        </>
      )}
    </group>
  );
}

function OutdoorSportsComplex() {
  const floodPosts = useMemo(
    () =>
      [
        [-54, -31],
        [-54, 31],
        [22, -31],
        [22, 31],
        [55, -28],
        [55, 28],
      ].map(([x, z]) => ({
        position: [x, 8, z],
        scale: [0.18, 16, 0.18],
      })),
    [],
  );
  const floodHeads = useMemo(
    () =>
      floodPosts.map((post) => ({
        position: [post.position[0], 16.1, post.position[2]],
        rotation: [-0.25, 0, 0],
        scale: [3.2, 0.42, 0.7],
      })),
    [floodPosts],
  );
  const standSteps = useMemo(() => {
    const items = [];
    for (let row = 0; row < 5; row += 1) {
      items.push({
        position: [-16, 0.45 + row * 0.48, 43 + row * 1.1],
        scale: [61, 0.75 + row * 0.25, 2.1],
      });
    }
    return items;
  }, []);
  const courtLights = useMemo(
    () => [
      { position: [40, 0.28, -24], scale: [31, 0.18, 0.13] },
      { position: [40, 0.28, 0], scale: [31, 0.18, 0.13] },
      { position: [40, 0.28, 24], scale: [31, 0.18, 0.13] },
      { position: [25, 0.28, -12], scale: [0.13, 0.18, 22] },
      { position: [40, 0.28, -12], scale: [0.13, 0.18, 22] },
      { position: [55, 0.28, -12], scale: [0.13, 0.18, 22] },
      { position: [25, 0.28, 12], scale: [0.13, 0.18, 22] },
      { position: [40, 0.28, 12], scale: [0.13, 0.18, 22] },
      { position: [55, 0.28, 12], scale: [0.13, 0.18, 22] },
    ],
    [],
  );
  return (
    <group position={[-235, 0.2, -73]} rotation={[0, -0.035, 0]}>
      <group position={[-17, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} scale={[1.48, 1, 1]}>
          <ringGeometry args={[32, 39, 72]} />
          <meshStandardMaterial color="#a65d45" roughness={0.94} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]} scale={[1.48, 1, 1]}>
          <circleGeometry args={[31.6, 72]} />
          <meshStandardMaterial color="#3f7f45" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.16, 0]}>
          <planeGeometry args={[73, 42]} />
          <meshStandardMaterial color="#43884a" roughness={1} />
        </mesh>
        <Line
          points={[
            [-36.5, 0.29, -21],
            [36.5, 0.29, -21],
            [36.5, 0.29, 21],
            [-36.5, 0.29, 21],
            [-36.5, 0.29, -21],
          ]}
          color="#f0ead6"
          lineWidth={1.25}
        />
        <Line points={[[0, 0.29, -21], [0, 0.29, 21]]} color="#f0ead6" lineWidth={1} />
        <Line
          points={[
            [-5.8, 0.3, 0],
            [5.8, 0.3, 0],
          ]}
          color="#ead8b5"
          lineWidth={6}
        />
        <Line
          points={Array.from({ length: 65 }, (_, index) => {
            const angle = (index / 64) * Math.PI * 2;
            return [Math.cos(angle) * 50.2, 0.29, Math.sin(angle) * 33.7];
          })}
          color="#f7e6d2"
          lineWidth={0.8}
        />
        <BoxInstances
          items={[
            { position: [-37.4, 1.8, 0], scale: [0.18, 3.6, 8] },
            { position: [37.4, 1.8, 0], scale: [0.18, 3.6, 8] },
            { position: [-36.7, 3.55, 0], scale: [1.6, 0.18, 8] },
            { position: [36.7, 3.55, 0], scale: [1.6, 0.18, 8] },
          ]}
          color="#ecece6"
          metalness={0.35}
        />
      </group>
      <group position={[54, 0, 0]}>
        <mesh position={[0, 0.11, -13]} receiveShadow>
          <boxGeometry args={[31, 0.2, 22]} />
          <meshStandardMaterial color="#3f6e9d" roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.11, 13]} receiveShadow>
          <boxGeometry args={[31, 0.2, 22]} />
          <meshStandardMaterial color="#567c52" roughness={0.78} />
        </mesh>
        <BoxInstances items={courtLights} color="#f5efe0" />
        <Line points={[[-14, 0.31, -13], [14, 0.31, -13]]} color="#f5efe0" lineWidth={0.85} />
        <Line points={[[0, 0.31, -23], [0, 0.31, -3]]} color="#f5efe0" lineWidth={0.85} />
        <Line points={[[-14, 0.31, 13], [14, 0.31, 13]]} color="#f5efe0" lineWidth={0.85} />
        <Line points={[[0, 0.31, 3], [0, 0.31, 23]]} color="#f5efe0" lineWidth={0.85} />
      </group>
      <BoxInstances items={standSteps} color="#b8b5aa" roughness={0.82} castShadow />
      <CylinderInstances
        items={floodPosts}
        color="#afb8bb"
        radialSegments={10}
        roughness={0.4}
      />
      <BoxInstances
        items={floodHeads}
        color="#f4e7c2"
        emissive="#fff0c3"
        emissiveIntensity={0.45}
      />
      <mesh position={[61, 3.5, 38]} castShadow>
        <boxGeometry args={[25, 7, 9]} />
        <meshStandardMaterial color="#d4cec1" roughness={0.8} />
      </mesh>
      <Html position={[-17, 8, 45]} center transform distanceFactor={14}>
        <div className="building-sign">VIT SPORTS COMPLEX</div>
      </Html>
    </group>
  );
}

function WingedTigerStatue({ position = [0, 0, 0] }) {
  const tailCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.08, 1.7, -1.75),
        new THREE.Vector3(0.1, 1.9, -2.55),
        new THREE.Vector3(0.06, 2.8, -2.9),
        new THREE.Vector3(0.04, 3.35, -2.3),
      ]),
    [],
  );
  const wingFeathers = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => {
        const angle = -0.18 - index * 0.07;
        const length = 3 + index * 0.075;
        return {
          angle,
          length,
          position: [
            -0.68,
            2.18 + (Math.cos(angle) * length) / 2,
            -0.42 + (Math.sin(angle) * length) / 2,
          ],
        };
      }),
    [],
  );
  const maneTufts = useMemo(
    () =>
      [
        { position: [-0.16, 2.82, 1.48], rotation: [0.08, 0.12, 0.08], scale: [0.82, 0.68, 0.72] },
        { position: [-0.18, 2.5, 1.12], rotation: [-0.08, 0.06, -0.12], scale: [0.92, 0.96, 0.78] },
        { position: [-0.2, 2.04, 1.2], rotation: [0.14, -0.06, 0.1], scale: [0.9, 0.92, 0.76] },
        { position: [-0.17, 1.75, 1.67], rotation: [-0.12, 0.08, -0.06], scale: [0.76, 0.8, 0.62] },
        { position: [-0.15, 2.12, 2.03], rotation: [0.08, -0.1, 0.14], scale: [0.7, 0.78, 0.54] },
        { position: [-0.14, 2.68, 2.04], rotation: [-0.1, 0.06, -0.08], scale: [0.68, 0.64, 0.52] },
      ],
    [],
  );
  const bronze = "#c58b19";
  const darkBronze = "#87540e";
  const gold = "#efb92b";

  return (
    <group position={position}>
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 0.76, 5.4]} />
        <meshStandardMaterial color="#efede5" roughness={0.72} />
      </mesh>
      <mesh position={[0, 1.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 2.55, 3.9]} />
        <meshStandardMaterial color="#f7f5ed" roughness={0.68} />
      </mesh>
      <mesh position={[0, 3.12, 0]} castShadow>
        <boxGeometry args={[6.5, 0.45, 4.8]} />
        <meshStandardMaterial color="#e8e5dc" roughness={0.7} />
      </mesh>
      <group position={[0, 3.55, 0]} rotation={[0, Math.PI / 2, 0]} scale={1.45}>
        <mesh position={[0, 1.68, -0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1.02, 1, 0.86]} castShadow>
          <capsuleGeometry args={[0.86, 2.75, 12, 22]} />
          <meshPhysicalMaterial color={bronze} metalness={0.68} roughness={0.27} clearcoat={0.32} />
        </mesh>
        <mesh position={[0, 1.67, -1.22]} scale={[1.02, 1.04, 1.08]} castShadow>
          <sphereGeometry args={[0.83, 22, 16]} />
          <meshPhysicalMaterial color={bronze} metalness={0.68} roughness={0.27} clearcoat={0.32} />
        </mesh>
        <mesh position={[0, 1.82, 0.92]} scale={[1.06, 1.18, 0.9]} castShadow>
          <sphereGeometry args={[0.82, 22, 16]} />
          <meshPhysicalMaterial color={bronze} metalness={0.68} roughness={0.27} clearcoat={0.32} />
        </mesh>
        {[
          [-0.54, -1.02],
          [0.54, -1.02],
          [0.52, 0.82],
        ].map(([x, z], index) => (
          <group key={`grounded-tiger-leg-${index}`} position={[x, 0.73, z]}>
            <mesh position={[0, 0.62, -0.06]} scale={[1.22, 1.35, 1]} castShadow>
              <sphereGeometry args={[0.36, 14, 10]} />
              <meshPhysicalMaterial color={bronze} metalness={0.66} roughness={0.28} clearcoat={0.28} />
            </mesh>
            <mesh castShadow>
              <cylinderGeometry args={[0.19, 0.25, 1.52, 14]} />
              <meshPhysicalMaterial color={bronze} metalness={0.66} roughness={0.28} clearcoat={0.28} />
            </mesh>
            <mesh position={[0, -0.79, 0.18]} scale={[1.2, 0.52, 1.5]} castShadow>
              <sphereGeometry args={[0.31, 16, 11]} />
              <meshPhysicalMaterial color={gold} metalness={0.7} roughness={0.24} clearcoat={0.35} />
            </mesh>
          </group>
        ))}
        <group position={[-0.5, 1.35, 1.82]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.22, 1.48, 8, 14]} />
            <meshPhysicalMaterial color={bronze} metalness={0.66} roughness={0.28} clearcoat={0.28} />
          </mesh>
          <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.25, 0.55, 1.55]} castShadow>
            <sphereGeometry args={[0.31, 16, 11]} />
            <meshPhysicalMaterial color={gold} metalness={0.7} roughness={0.24} clearcoat={0.35} />
          </mesh>
        </group>
        <mesh position={[0, 2.12, 1.13]} scale={[1, 1.18, 0.82]} castShadow>
          <sphereGeometry args={[0.86, 22, 16]} />
          <meshPhysicalMaterial color={darkBronze} metalness={0.62} roughness={0.31} clearcoat={0.25} />
        </mesh>
        {maneTufts.map((tuft, index) => (
          <mesh
            key={`lion-mane-tuft-${index}`}
            position={tuft.position}
            rotation={tuft.rotation}
            scale={tuft.scale}
            castShadow
          >
            <icosahedronGeometry args={[0.72, 2]} />
            <meshPhysicalMaterial color={darkBronze} metalness={0.62} roughness={0.31} clearcoat={0.25} />
          </mesh>
        ))}
        <mesh position={[-0.02, 2.53, 1.9]} scale={[0.79, 0.72, 0.82]} castShadow>
          <sphereGeometry args={[0.78, 24, 18]} />
          <meshPhysicalMaterial color={bronze} metalness={0.67} roughness={0.27} clearcoat={0.32} />
        </mesh>
        <mesh position={[-0.02, 2.27, 2.58]} scale={[0.7, 0.44, 0.92]} castShadow>
          <sphereGeometry args={[0.64, 22, 15]} />
          <meshPhysicalMaterial color={gold} metalness={0.68} roughness={0.25} clearcoat={0.34} />
        </mesh>
        <mesh position={[-0.02, 2.02, 2.54]} scale={[0.65, 0.28, 0.78]} castShadow>
          <sphereGeometry args={[0.58, 20, 14]} />
          <meshPhysicalMaterial color={bronze} metalness={0.66} roughness={0.28} clearcoat={0.3} />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <mesh key={`tiger-ear-${x}`} position={[x, 3.09, 1.72]} rotation={[0.12, 0, x * -0.48]} castShadow>
            <coneGeometry args={[0.29, 0.68, 14]} />
            <meshPhysicalMaterial color={darkBronze} metalness={0.63} roughness={0.3} clearcoat={0.28} />
          </mesh>
        ))}
        <mesh position={[-0.65, 2.68, 2.34]}>
          <sphereGeometry args={[0.095, 14, 10]} />
          <meshStandardMaterial color="#100b06" roughness={0.28} />
        </mesh>
        <mesh position={[-0.66, 2.7, 2.39]} scale={[0.45, 0.45, 0.2]}>
          <sphereGeometry args={[0.11, 12, 9]} />
          <meshStandardMaterial color="#f3c342" emissive="#d79018" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[-0.02, 2.34, 3.14]} scale={[0.72, 0.58, 0.48]}>
          <sphereGeometry args={[0.18, 16, 11]} />
          <meshStandardMaterial color="#2c1a08" metalness={0.35} roughness={0.34} />
        </mesh>
        <mesh castShadow>
          <tubeGeometry args={[tailCurve, 24, 0.12, 9, false]} />
          <meshPhysicalMaterial color={bronze} metalness={0.66} roughness={0.28} clearcoat={0.28} />
        </mesh>
        <mesh position={[0.04, 3.38, -2.26]} scale={[0.6, 0.9, 0.6]} castShadow>
          <dodecahedronGeometry args={[0.31, 1]} />
          <meshPhysicalMaterial color={darkBronze} metalness={0.62} roughness={0.31} clearcoat={0.25} />
        </mesh>
        <mesh position={[-0.58, 2.55, -0.48]} scale={[0.32, 1.08, 1.45]} rotation={[0.48, 0, 0]} castShadow>
          <sphereGeometry args={[0.82, 14, 10]} />
          <meshStandardMaterial color={darkBronze} metalness={0.45} roughness={0.38} />
        </mesh>
        {wingFeathers.map((feather, index) => (
          <group key={`fan-wing-feather-${index}`}>
            <mesh position={feather.position} rotation={[feather.angle, 0, 0]} castShadow>
              <cylinderGeometry args={[0.075, 0.13, feather.length, 8]} />
              <meshStandardMaterial color={gold} metalness={0.55} roughness={0.26} />
            </mesh>
            <mesh
              position={[
                -0.68,
                2.18 + Math.cos(feather.angle) * feather.length,
                -0.42 + Math.sin(feather.angle) * feather.length,
              ]}
              rotation={[feather.angle, 0, 0]}
              scale={[0.34, 0.72, 0.16]}
              castShadow
            >
              <sphereGeometry args={[0.42, 10, 7]} />
              <meshStandardMaterial color={gold} metalness={0.55} roughness={0.26} />
            </mesh>
          </group>
        ))}
        <pointLight position={[-3, 5.5, 4]} color="#ffd36a" intensity={13} distance={22} decay={2} />
      </group>
    </group>
  );
}

function MultipurposeHall({ proposalVisible }) {
  const entranceColumns = useMemo(
    () =>
      [-20, -10, 0, 10, 20].map((x) => ({
        position: [x, 3.3, 22.2],
        scale: [0.65, 6.6, 0.65],
      })),
    [],
  );
  const sideWindows = useMemo(() => {
    const items = [];
    [-25, -15, -5, 5, 15, 25].forEach((x) => {
      items.push({
        position: [x, 6.7, -20.2],
        scale: [5.6, 4.5, 0.22],
      });
    });
    return items;
  }, []);
  return (
    <group position={[222, 0.2, -43]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 6.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[68, 13.2, 40]} />
        <meshStandardMaterial color="#c8c5bc" roughness={0.74} />
      </mesh>
      <mesh position={[0, 13.9, -9.3]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[70, 0.8, 21]} />
        <meshStandardMaterial color="#54656c" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 13.9, 9.3]} rotation={[-0.18, 0, 0]} castShadow>
        <boxGeometry args={[70, 0.8, 21]} />
        <meshStandardMaterial color="#54656c" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 6.2, 20.2]}>
        <boxGeometry args={[55, 10.8, 0.38]} />
        <meshStandardMaterial
          color="#255064"
          metalness={0.42}
          roughness={0.22}
        />
      </mesh>
      <BoxInstances items={sideWindows} color="#7398a5" metalness={0.3} roughness={0.3} />
      <mesh position={[0, 4.15, 25.5]} castShadow>
        <boxGeometry args={[55, 0.65, 11]} />
        <meshStandardMaterial color="#e4dfd2" roughness={0.72} />
      </mesh>
      <BoxInstances
        items={entranceColumns}
        color="#e7e1d4"
        roughness={0.75}
        castShadow
      />
      <mesh position={[0, 0.08, 36]} receiveShadow>
        <boxGeometry args={[78, 0.16, 30]} />
        <meshStandardMaterial color="#d5d0c2" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.18, 36]} receiveShadow>
        <boxGeometry args={[72, 0.2, 25]} />
        <meshStandardMaterial color="#397646" roughness={1} />
      </mesh>
      <mesh position={[0, 0.32, 34]} receiveShadow>
        <boxGeometry args={[5.4, 0.18, 21]} />
        <meshStandardMaterial color="#d8cfb9" roughness={0.96} />
      </mesh>
      <BoxInstances
        items={[
          { position: [-34.2, 0.7, 36], scale: [1.4, 1.1, 25] },
          { position: [34.2, 0.7, 36], scale: [1.4, 1.1, 25] },
          { position: [-20.5, 0.7, 47.8], scale: [25, 1.1, 1.4] },
          { position: [20.5, 0.7, 47.8], scale: [25, 1.1, 1.4] },
        ]}
        color="#225b31"
        roughness={1}
        castShadow
      />
      <Tree position={[-27, 0.3, 42]} scale={0.72} />
      <Tree position={[27, 0.3, 42]} scale={0.72} />
      <Tree position={[-28.5, 0.3, 29]} scale={0.58} />
      <Tree position={[28.5, 0.3, 29]} scale={0.58} />
      <BoxInstances
        items={[
          { position: [-17, 0.72, 39.5], scale: [5.5, 0.32, 1.05] },
          { position: [17, 0.72, 39.5], scale: [5.5, 0.32, 1.05] },
          { position: [-18.8, 0.38, 39.5], scale: [0.35, 0.85, 1.25] },
          { position: [-15.2, 0.38, 39.5], scale: [0.35, 0.85, 1.25] },
          { position: [15.2, 0.38, 39.5], scale: [0.35, 0.85, 1.25] },
          { position: [18.8, 0.38, 39.5], scale: [0.35, 0.85, 1.25] },
        ]}
        color="#765438"
        roughness={0.9}
        castShadow
      />
      <WingedTigerStatue position={[0, 0.32, 39]} />
      <Html position={[0, 10.4, 20.55]} center transform distanceFactor={14}>
        <div className="building-sign">MULTIPURPOSE HALL</div>
      </Html>
      {proposalVisible && (
        <group>
          <RooftopSolar width={56} depth={14} y={15.2} rows={3} columns={8} />
        </group>
      )}
    </group>
  );
}

function HostelMess({ variant, position, rotation = 0, proposalVisible }) {
  const isGirls = variant === "girls";
  const title = isGirls ? "GIRLS’ MESS" : "BOYS’ MESS";
  const width = isGirls ? 42 : 47;
  const diningWindows = useMemo(() => {
    const items = [];
    for (let column = 0; column < 8; column += 1) {
      const x = -width / 2 + 4.2 + column * ((width - 8.4) / 7);
      items.push({
        position: [x, 3.1, 11.14],
        scale: [3.25, 4.5, 0.22],
      });
    }
    for (let column = 0; column < 6; column += 1) {
      const x = -width / 2 + 4.6 + column * ((width - 9.2) / 5);
      items.push({
        position: [x, 8, 11.16],
        scale: [3.8, 2.5, 0.22],
      });
    }
    return items;
  }, [width]);
  const mullions = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => ({
        position: [-width / 2 + 1.7 + index * ((width - 3.4) / 8), 3.15, 11.32],
        scale: [0.22, 5.2, 0.3],
      })),
    [width],
  );
  const exhausts = useMemo(
    () =>
      [-9, 0, 9].map((x, index) => ({
        position: [x, 13.2 + index * 0.2, -4.8],
        scale: [0.8, 4.5 + index * 0.4, 0.8],
      })),
    [],
  );
  const canopyPosts = useMemo(
    () =>
      [-14, -7, 0, 7, 14].map((x) => ({
        position: [x, 1.65, 19.2],
        scale: [0.28, 3.3, 0.28],
      })),
    [],
  );
  const tables = useMemo(() => {
    const items = [];
    [-10, 0, 10].forEach((x) => {
      items.push(
        { position: [x, 0.95, 19.4], scale: [4.4, 0.22, 1.8] },
        { position: [x, 0.5, 17.9], scale: [4.4, 0.5, 0.45] },
        { position: [x, 0.5, 20.9], scale: [4.4, 0.5, 0.45] },
      );
    });
    return items;
  }, []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 5.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 10.5, 22]} />
        <meshStandardMaterial color={isGirls ? "#ddd9d1" : "#d7d1c4"} roughness={0.72} />
      </mesh>
      <mesh position={[0, 10.85, 0]} castShadow>
        <boxGeometry args={[width + 1.1, 0.7, 23.1]} />
        <meshStandardMaterial color="#4b5d61" metalness={0.34} roughness={0.48} />
      </mesh>
      <mesh position={[0, 5.25, 11.05]}>
        <boxGeometry args={[width - 2.2, 9.2, 0.24]} />
        <meshStandardMaterial color="#305c69" metalness={0.38} roughness={0.23} />
      </mesh>
      <BoxInstances
        items={diningWindows}
        color="#78a7b3"
        emissive="#325866"
        emissiveIntensity={0.18}
        metalness={0.36}
        roughness={0.22}
      />
      <BoxInstances items={mullions} color="#e7e2d7" roughness={0.65} />
      <mesh position={[0, 7.7, -11.1]}>
        <boxGeometry args={[width - 3, 4.4, 0.25]} />
        <meshStandardMaterial color="#a96547" roughness={0.82} />
      </mesh>
      <BoxInstances
        items={[
          { position: [0, 10.05, 11.25], scale: [width + 0.8, 0.65, 0.55] },
          { position: [-width / 2 + 1.2, 5.3, 11.25], scale: [0.65, 10.2, 0.55] },
          { position: [width / 2 - 1.2, 5.3, 11.25], scale: [0.65, 10.2, 0.55] },
        ]}
        color={isGirls ? "#b85e42" : "#b56c43"}
        roughness={0.74}
      />
      <CylinderInstances
        items={exhausts}
        color="#a9b1b0"
        radialSegments={14}
        roughness={0.38}
      />
      <CylinderInstances
        items={exhausts.map((item) => ({
          position: [item.position[0], item.position[1] + item.scale[1] / 2 + 0.3, item.position[2]],
          scale: [1.35, 0.35, 1.35],
        }))}
        color="#6d7778"
        radialSegments={14}
        roughness={0.4}
      />
      <mesh position={[0, 3.55, 17.8]} castShadow>
        <boxGeometry args={[36, 0.55, 13.5]} />
        <meshStandardMaterial color="#f0e9d9" roughness={0.72} />
      </mesh>
      <BoxInstances items={canopyPosts} color="#738486" metalness={0.38} roughness={0.45} />
      <BoxInstances items={tables} color="#8b6646" roughness={0.86} />
      <mesh position={[0, 0.12, 18]} receiveShadow>
        <boxGeometry args={[48, 0.22, 19]} />
        <meshStandardMaterial color="#b5aa91" roughness={0.97} />
      </mesh>
      <Tree position={[-21, 0, 18]} scale={0.65} />
      <Tree position={[21, 0, 18]} scale={0.65} />
      <Html position={[0, 8.1, 11.48]} center transform distanceFactor={12}>
        <div className="building-sign">{title}</div>
      </Html>
      {proposalVisible && (
        <RooftopSolar width={width - 8} depth={14} y={11.8} rows={2} columns={6} />
      )}
    </group>
  );
}

function AcademicBlockFootballGround() {
  const stripes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        position: [-54.1 + index * 9.83, 0.15, 0],
        scale: [9.84, 0.08, 72],
        color: index % 2 === 0 ? "#3f8148" : "#4a8b50",
      })),
    [],
  );

  const markings = useMemo(
    () => [
      { position: [0, 0.24, -36], scale: [118, 0.07, 0.34] },
      { position: [0, 0.24, 36], scale: [118, 0.07, 0.34] },
      { position: [-59, 0.24, 0], scale: [0.34, 0.07, 72] },
      { position: [59, 0.24, 0], scale: [0.34, 0.07, 72] },
      { position: [0, 0.24, 0], scale: [0.34, 0.07, 72] },
      { position: [-42, 0.24, 0], scale: [0.34, 0.07, 44] },
      { position: [-50.5, 0.24, -22], scale: [17, 0.07, 0.34] },
      { position: [-50.5, 0.24, 22], scale: [17, 0.07, 0.34] },
      { position: [42, 0.24, 0], scale: [0.34, 0.07, 44] },
      { position: [50.5, 0.24, -22], scale: [17, 0.07, 0.34] },
      { position: [50.5, 0.24, 22], scale: [17, 0.07, 0.34] },
      { position: [-53.5, 0.24, 0], scale: [0.34, 0.07, 18] },
      { position: [-56.25, 0.24, -9], scale: [5.5, 0.07, 0.34] },
      { position: [-56.25, 0.24, 9], scale: [5.5, 0.07, 0.34] },
      { position: [53.5, 0.24, 0], scale: [0.34, 0.07, 18] },
      { position: [56.25, 0.24, -9], scale: [5.5, 0.07, 0.34] },
      { position: [56.25, 0.24, 9], scale: [5.5, 0.07, 0.34] },
    ],
    [],
  );

  const centreCircle = useMemo(
    () =>
      Array.from({ length: 49 }, (_, index) => {
        const angle = (index / 48) * Math.PI * 2;
        return [Math.cos(angle) * 9.5, 0.3, Math.sin(angle) * 9.5];
      }),
    [],
  );

  const goalFrames = useMemo(
    () =>
      [-1, 1].flatMap((side) => [
        { position: [side * 60.1, 1.4, -4.1], scale: [0.26, 2.8, 0.26] },
        { position: [side * 60.1, 1.4, 4.1], scale: [0.26, 2.8, 0.26] },
        { position: [side * 60.1, 2.77, 0], scale: [0.26, 0.26, 8.45] },
        { position: [side * 62.8, 0.78, -4.1], scale: [0.22, 1.56, 0.22] },
        { position: [side * 62.8, 0.78, 4.1], scale: [0.22, 1.56, 0.22] },
        {
          position: [side * 61.45, 0.25, -4.1],
          rotation: [0, 0, side * -0.5],
          scale: [3.1, 0.2, 0.2],
        },
        {
          position: [side * 61.45, 0.25, 4.1],
          rotation: [0, 0, side * -0.5],
          scale: [3.1, 0.2, 0.2],
        },
      ]),
    [],
  );

  const floodlightPoles = useMemo(
    () =>
      [
        [-64, -41],
        [-64, 41],
        [64, -41],
        [64, 41],
      ].map(([x, z]) => ({ position: [x, 6, z], scale: [0.24, 12, 0.24] })),
    [],
  );

  return (
    <group position={[-130, 0.2, -350]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[180, 0.1, 110]} />
        <meshStandardMaterial color="#315f39" roughness={1} />
      </mesh>
      {stripes.map((stripe, index) => (
        <mesh key={`football-stripe-${index}`} position={stripe.position} receiveShadow>
          <boxGeometry args={stripe.scale} />
          <meshStandardMaterial color={stripe.color} roughness={1} />
        </mesh>
      ))}
      <BoxInstances items={markings} color="#f1efdc" roughness={0.9} />
      <Line points={centreCircle} color="#f1efdc" lineWidth={1.15} />
      <mesh position={[0, 0.31, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 16]} />
        <meshStandardMaterial color="#f1efdc" roughness={0.9} />
      </mesh>
      {[-76, 76].map((x) => (
        <mesh key={`football-penalty-spot-${x}`} position={[x, 0.31, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.08, 14]} />
          <meshStandardMaterial color="#f1efdc" roughness={0.9} />
        </mesh>
      ))}
      <BoxInstances items={goalFrames} color="#f5f4e8" roughness={0.68} castShadow />
      <CylinderInstances items={floodlightPoles} color="#424b4c" radialSegments={10} castShadow />
      {[
        [-84, -55],
        [-84, 55],
        [84, -55],
        [84, 55],
      ].map(([x, z]) => (
        <group key={`football-floodlight-${x}-${z}`} position={[x, 12.15, z]}>
          <mesh rotation={[0, x < 0 ? -0.18 : 0.18, 0]} castShadow>
            <boxGeometry args={[3.5, 0.75, 0.75]} />
            <meshStandardMaterial color="#dae1d9" emissive="#fff0bd" emissiveIntensity={0.26} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SpecialBlockFountain() {
  const movingWaterRef = useRef();
  const waterArcs = useMemo(
    () =>
      Array.from({ length: 10 }, (_, jet) => {
        const angle = (jet / 10) * Math.PI * 2;
        return Array.from({ length: 15 }, (_, point) => {
          const progress = point / 14;
          const radius = 2.4 + progress * 7.2;
          return [
            Math.cos(angle) * radius,
            5.1 + Math.sin(progress * Math.PI) * 4.8 - progress * 3.35,
            Math.sin(angle) * radius,
          ];
        });
      }),
    [],
  );

  useFrame(({ clock }) => {
    if (!movingWaterRef.current) return;
    const elapsed = clock.elapsedTime;
    movingWaterRef.current.rotation.y = elapsed * 0.055;
    movingWaterRef.current.position.y = Math.sin(elapsed * 1.8) * 0.08;
  });

  return (
    <group position={[0, 0.14, 0]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[12.4, 13.2, 0.96, 64]} />
        <meshStandardMaterial color="#d7c8ae" roughness={0.74} />
      </mesh>
      <mesh position={[0, 1.02, 0]} receiveShadow>
        <cylinderGeometry args={[10.95, 10.95, 0.18, 64]} />
        <meshStandardMaterial
          color="#63bad0"
          emissive="#1d91b0"
          emissiveIntensity={0.22}
          metalness={0.08}
          roughness={0.18}
          transparent
          opacity={0.82}
        />
      </mesh>
      <mesh position={[0, 1.38, 0]} castShadow>
        <torusGeometry args={[11.75, 0.58, 14, 64]} />
        <meshStandardMaterial color="#f0e4ce" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[4.6, 5.4, 1.35, 48]} />
        <meshStandardMaterial color="#c7b18e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.42, 0]}>
        <cylinderGeometry args={[4.05, 4.05, 0.16, 48]} />
        <meshStandardMaterial
          color="#7fd2e2"
          emissive="#2ca8c4"
          emissiveIntensity={0.28}
          roughness={0.16}
          transparent
          opacity={0.86}
        />
      </mesh>
      <mesh position={[0, 4.15, 0]} castShadow>
        <cylinderGeometry args={[0.64, 0.9, 3.5, 24]} />
        <meshStandardMaterial color="#e8dbc3" roughness={0.63} />
      </mesh>
      <mesh position={[0, 5.8, 0]} castShadow>
        <sphereGeometry args={[1.05, 24, 16]} />
        <meshStandardMaterial color="#f0e3cc" roughness={0.55} />
      </mesh>
      <group ref={movingWaterRef}>
        {waterArcs.map((points, index) => (
          <Line
            key={`special-fountain-arc-${index}`}
            points={points}
            color="#c9f4ff"
            lineWidth={1.45}
            transparent
            opacity={0.78}
          />
        ))}
        <Line
          points={[[0, 5.9, 0], [0, 7.8, 0], [0, 9.5, 0]]}
          color="#e5fbff"
          lineWidth={2.1}
          transparent
          opacity={0.9}
        />
      </group>
      <pointLight position={[0, 3.2, 0]} color="#79dcff" intensity={24} distance={24} decay={2} />
    </group>
  );
}

function SpecialBlock() {
  const segmentCount = 32;
  const outerRadius = 42;
  const innerRadius = 24;
  const ringSegments = useMemo(
    () =>
      Array.from({ length: segmentCount }, (_, index) => {
        const angle = (index / segmentCount) * Math.PI * 2;
        const x = Math.sin(angle) * outerRadius;
        const z = Math.cos(angle) * outerRadius;
        const arcLength = (Math.PI * 2 * outerRadius) / segmentCount;
        return {
          angle,
          x,
          z,
          arcLength,
        };
      }),
    [],
  );

  const columnSegments = useMemo(
    () =>
      ringSegments.map(({ angle, x, z }) => ({
        position: [x, 10.8, z],
        rotation: [0, angle, 0],
        scale: [1.6, 21.6, 4.2],
      })),
    [ringSegments],
  );

  const redPanels = useMemo(
    () =>
      ringSegments.flatMap(({ angle, x, z, arcLength }) =>
        [6.6, 12.6, 18.6].map((y) => ({
          position: [x, y, z],
          rotation: [0, angle, 0],
          scale: [arcLength * 1.6, 4.6, 3.8],
        })),
      ),
    [ringSegments],
  );

  const bandSegments = useMemo(
    () =>
      ringSegments.flatMap(({ angle, x, z, arcLength }) => [
        { position: [x, 3.1, z], rotation: [0, angle, 0], scale: [arcLength * 1.6, 0.8, 4.6] },
        { position: [x, 9.1, z], rotation: [0, angle, 0], scale: [arcLength * 1.6, 0.6, 4.6] },
        { position: [x, 15.1, z], rotation: [0, angle, 0], scale: [arcLength * 1.6, 0.6, 4.6] },
        { position: [x, 21.1, z], rotation: [0, angle, 0], scale: [arcLength * 1.6, 0.9, 4.6] },
      ]),
    [ringSegments],
  );

  const topBandSegments = useMemo(
    () =>
      ringSegments.flatMap(({ angle, x, z, arcLength }) => [
        {
          position: [x, 23.8, z],
          rotation: [0, angle, 0],
          scale: [arcLength * 1.55, 0.9, 4.6],
        },
        {
          position: [x, 25.2, z],
          rotation: [0, angle, 0],
          scale: [arcLength * 1.55, 0.6, 4.6],
        },
      ]),
    [ringSegments],
  );

  return (
    <group position={[-340, 0.22, -470]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[innerRadius, outerRadius + 4, 64]} />
        <meshStandardMaterial color="#ece6db" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <circleGeometry args={[innerRadius - 1, 64]} />
        <meshStandardMaterial color="#d8cfbb" roughness={0.92} />
      </mesh>
      <SpecialBlockFountain />
      <BoxInstances items={columnSegments} color="#f7f5f0" roughness={0.94} />
      <BoxInstances items={redPanels} color="#9f1721" roughness={0.86} />
      <BoxInstances items={bandSegments} color="#f6f2ec" roughness={0.96} />
      <BoxInstances items={topBandSegments} color="#f6f2ec" roughness={0.96} />
      <Html position={[0, 26.6, 0]} center transform distanceFactor={30}>
        <div className="building-sign">SPECIAL BLOCK</div>
      </Html>
    </group>
  );
}

function LionStatue() {
  const tailCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.15, 3.65, -2.55),
        new THREE.Vector3(1.18, 2.65, -3.42),
        new THREE.Vector3(1.2, 1.48, -3.22),
        new THREE.Vector3(1.2, 1.15, -2.02),
        new THREE.Vector3(1.18, 2.08, -1.32),
        new THREE.Vector3(1.16, 3.34, -1.76),
        new THREE.Vector3(1.14, 4.62, -2.74),
      ]),
    [],
  );
  const wingFeathers = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        angle: -0.22 - index * 0.075,
        length: 5.8 - index * 0.13,
        rootY: 4.74 - index * 0.035,
        rootZ: 0.22 - index * 0.07,
        width: 0.34 - index * 0.009,
      })),
    [],
  );
  const maneTufts = useMemo(
    () =>
      Array.from({ length: 15 }, (_, index) => {
        const angle = (index / 15) * Math.PI * 2;
        return {
          x: Math.cos(angle) * 1.52,
          y: 5.42 + Math.sin(angle) * 1.62,
          z: 2.18 - Math.abs(Math.cos(angle)) * 0.18,
          scale: 0.58 + (index % 3) * 0.08,
        };
      }),
    [],
  );
  const legs = [
    [-0.92, -1.9, -0.08, false],
    [0.92, -1.9, 0.08, false],
    [-0.92, 1.45, 0.05, true],
    [0.92, 1.45, -0.05, false],
  ];
  const gold = "#c08a2c";
  const goldLight = "#d4a13c";
  const goldDark = "#8e5e1f";
  return (
    <group position={[0, 3.72, 0]} scale={1.08} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 3.72, -0.62]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[1.48, 3.5, 12, 24]} />
        <meshStandardMaterial color={gold} metalness={0.72} roughness={0.25} />
      </mesh>
      <mesh position={[0, 3.72, 1.18]} scale={[1.48, 1.52, 1.28]} castShadow>
        <sphereGeometry args={[1.25, 24, 18]} />
        <meshStandardMaterial color={goldLight} metalness={0.7} roughness={0.26} />
      </mesh>
      <mesh position={[0, 4.55, 1.55]} scale={[1.18, 1.35, 1.02]} castShadow>
        <sphereGeometry args={[1.18, 22, 16]} />
        <meshStandardMaterial color={gold} metalness={0.72} roughness={0.26} />
      </mesh>

      {legs.map(([x, z, lean, raised], index) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          {(index < 2 || raised) && (
            <mesh position={[0, 2.7, 0]} scale={[1.08, 1.2, 1.2]} castShadow>
              <sphereGeometry args={[0.72, 18, 13]} />
              <meshStandardMaterial color={goldDark} metalness={0.7} roughness={0.28} />
            </mesh>
          )}
          {raised ? (
            <>
              <mesh position={[0, 2.82, 1.05]} rotation={[Math.PI / 2 - 0.18, 0, 0]} castShadow>
                <capsuleGeometry args={[0.38, 1.65, 8, 14]} />
                <meshStandardMaterial color={gold} metalness={0.72} roughness={0.25} />
              </mesh>
              <mesh position={[0, 2.98, 2.75]} rotation={[Math.PI / 2 + 0.08, 0, 0]} castShadow>
                <capsuleGeometry args={[0.31, 1.35, 8, 14]} />
                <meshStandardMaterial color={goldLight} metalness={0.72} roughness={0.24} />
              </mesh>
              <mesh position={[0, 3.0, 3.7]} scale={[1.04, 0.62, 1.45]} castShadow>
                <sphereGeometry args={[0.48, 18, 12]} />
                <meshStandardMaterial color={goldLight} metalness={0.7} roughness={0.26} />
              </mesh>
              {[-0.23, 0, 0.23].map((clawX) => (
                <mesh key={clawX} position={[clawX, 2.98, 4.27]} rotation={[Math.PI / 2, 0, 0]}>
                  <coneGeometry args={[0.09, 0.34, 8]} />
                  <meshStandardMaterial color="#e1b957" metalness={0.75} roughness={0.2} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, 2.1, 0]} rotation={[lean, 0, 0]} castShadow>
                <capsuleGeometry args={[0.36, 1.38, 8, 14]} />
                <meshStandardMaterial color={gold} metalness={0.72} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.85, z > 0 ? 0.12 : -0.08]} rotation={[-lean * 0.5, 0, 0]} castShadow>
                <capsuleGeometry args={[0.29, 1.08, 8, 14]} />
                <meshStandardMaterial color={goldLight} metalness={0.72} roughness={0.24} />
              </mesh>
              <mesh position={[0, 0.19, z > 0 ? 0.34 : -0.17]} scale={[1.05, 0.58, 1.36]} castShadow>
                <sphereGeometry args={[0.48, 18, 12]} />
                <meshStandardMaterial color={goldLight} metalness={0.7} roughness={0.26} />
              </mesh>
              {[-0.23, 0, 0.23].map((clawX) => (
                <mesh
                  key={clawX}
                  position={[clawX, 0.16, z > 0 ? 0.83 : 0.3]}
                  rotation={[Math.PI / 2, 0, 0]}
                  scale={[0.75, 0.75, 1]}
                >
                  <coneGeometry args={[0.09, 0.34, 8]} />
                  <meshStandardMaterial color="#e1b957" metalness={0.75} roughness={0.2} />
                </mesh>
              ))}
            </>
          )}
        </group>
      ))}

      {[-1, 1].map((side) => (
        <group key={`wing-${side}`} position={[side * 0.72, 0, 0]}>
          <mesh position={[0, 5.35, -0.28]} scale={[0.42, 1.25, 1.38]} castShadow>
            <icosahedronGeometry args={[1.22, 2]} />
            <meshStandardMaterial
              color={side < 0 ? "#b77d25" : "#94601d"}
              metalness={0.7}
              roughness={0.3}
              flatShading
            />
          </mesh>
          {wingFeathers.map((feather, featherIndex) => (
            <group
              key={`wing-feather-${side}-${featherIndex}`}
              position={[0, feather.rootY, feather.rootZ]}
              rotation={[feather.angle, 0, side * 0.025]}
            >
              <mesh position={[0, feather.length / 2, 0]} scale={[1, 1, 0.62]} castShadow>
                <capsuleGeometry args={[feather.width, feather.length - feather.width * 2, 8, 12]} />
                <meshStandardMaterial
                  color={side < 0
                    ? featherIndex % 2 ? "#c18a2c" : "#d09a38"
                    : featherIndex % 2 ? "#8c591c" : "#9d681f"}
                  metalness={0.72}
                  roughness={0.27}
                />
              </mesh>
              <Line
                points={[[0, 0.35, 0.23], [0, feather.length - 0.35, 0.23]]}
                color={side < 0 ? "#86551a" : "#694114"}
                lineWidth={0.75}
              />
            </group>
          ))}
          {Array.from({ length: 7 }, (_, row) => (
            <mesh
              key={`wing-scale-${side}-${row}`}
              position={[0, 4.55 + row * 0.28, 0.5 - row * 0.16]}
              rotation={[-0.45 - row * 0.055, 0, 0]}
              scale={[1, 1, 0.55]}
            >
              <capsuleGeometry args={[0.28, 1.15 + row * 0.15, 7, 11]} />
              <meshStandardMaterial color={side < 0 ? "#a96f20" : "#7d4c17"} metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 5.38, 2.18]} scale={[1.08, 1.18, 0.92]} castShadow>
        <icosahedronGeometry args={[1.78, 2]} />
        <meshStandardMaterial color={goldDark} metalness={0.68} roughness={0.32} flatShading />
      </mesh>
      {maneTufts.map((tuft, index) => (
        <mesh
          key={`mane-${index}`}
          position={[tuft.x, tuft.y, tuft.z]}
          scale={[tuft.scale, tuft.scale * 1.08, tuft.scale * 0.62]}
          castShadow
        >
          <icosahedronGeometry args={[0.72, 1]} />
          <meshStandardMaterial color={index % 2 ? "#9e6820" : "#a97424"} metalness={0.68} roughness={0.34} flatShading />
        </mesh>
      ))}

      <mesh position={[0, 5.55, 3.12]} scale={[1.03, 0.94, 0.92]} castShadow>
        <sphereGeometry args={[1.18, 24, 18]} />
        <meshStandardMaterial color={goldLight} metalness={0.7} roughness={0.24} />
      </mesh>
      {[-0.92, 0.92].map((x, index) => (
        <group key={`ear-${x}`}>
          <mesh position={[x, 6.3, 2.92]} rotation={[0.2, 0, x > 0 ? -0.32 : 0.32]} castShadow>
            <coneGeometry args={[0.48, 0.92, 14]} />
            <meshStandardMaterial color={goldDark} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[x * 0.98, 6.25, 3.02]} rotation={[0.2, 0, x > 0 ? -0.32 : 0.32]}>
            <coneGeometry args={[0.23, 0.48, 12]} />
            <meshStandardMaterial color={index ? "#6d4318" : "#744719"} metalness={0.6} roughness={0.38} />
          </mesh>
        </group>
      ))}

      {[-0.46, 0.46].map((x) => (
        <group key={`eye-${x}`}>
          <mesh position={[x, 5.82, 4.05]} scale={[1.15, 0.72, 0.55]}>
            <sphereGeometry args={[0.18, 12, 9]} />
            <meshStandardMaterial color="#17120d" metalness={0.25} roughness={0.18} />
          </mesh>
          <mesh position={[x * 1.08, 6.03, 3.86]} rotation={[0.12, 0, x > 0 ? -0.26 : 0.26]}>
            <capsuleGeometry args={[0.11, 0.55, 5, 9]} />
            <meshStandardMaterial color={goldDark} metalness={0.7} roughness={0.28} />
          </mesh>
        </group>
      ))}

      {[-0.43, 0.43].map((x) => (
        <mesh key={`muzzle-${x}`} position={[x, 5.23, 4.05]} scale={[1, 0.82, 1.18]} castShadow>
          <sphereGeometry args={[0.68, 18, 13]} />
          <meshStandardMaterial color="#c99437" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 5.45, 4.72]} scale={[1.18, 0.7, 0.9]} castShadow>
        <sphereGeometry args={[0.46, 16, 11]} />
        <meshStandardMaterial color="#3f2912" metalness={0.45} roughness={0.38} />
      </mesh>
      <mesh position={[0, 4.86, 4.33]} scale={[1.12, 0.75, 0.72]}>
        <sphereGeometry args={[0.68, 16, 12]} />
        <meshStandardMaterial color="#352011" metalness={0.25} roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.57, 4.16]} scale={[1.1, 0.5, 1]} castShadow>
        <sphereGeometry args={[0.72, 18, 12]} />
        <meshStandardMaterial color={goldLight} metalness={0.7} roughness={0.26} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={`fang-${x}`} position={[x, 5.0, 4.66]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.11, 0.45, 9]} />
          <meshStandardMaterial color="#f0d99c" metalness={0.34} roughness={0.28} />
        </mesh>
      ))}

      {[-1, 1].flatMap((side) =>
        [-0.15, 0.12, 0.38].map((height, index) => (
          <Line
            key={`whisker-${side}-${index}`}
            points={[
              [side * 0.48, 5.18 + height, 4.56],
              [side * (1.18 + index * 0.16), 5.1 + height * 1.2, 4.82],
            ]}
            color="#6d471b"
            lineWidth={0.8}
          />
        )),
      )}
      <mesh castShadow>
        <tubeGeometry args={[tailCurve, 32, 0.24, 9, false]} />
        <meshStandardMaterial color={goldDark} metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh position={[1.14, 4.68, -2.77]} scale={[0.78, 1.05, 0.78]} castShadow>
        <icosahedronGeometry args={[0.58, 1]} />
        <meshStandardMaterial color="#82531c" metalness={0.68} roughness={0.34} flatShading />
      </mesh>
    </group>
  );
}

function GateTwo() {
  const latticeBars = useMemo(
    () => [
      { position: [-2.5, 5.8, 2.18], rotation: [0, 0, 0.42], scale: [0.48, 8.2, 0.34] },
      { position: [-0.8, 5.5, 2.19], rotation: [0, 0, -0.55], scale: [0.42, 8.5, 0.34] },
      { position: [0.8, 5.7, 2.2], rotation: [0, 0, 0.68], scale: [0.42, 8.4, 0.34] },
      { position: [2.4, 5.5, 2.21], rotation: [0, 0, -0.38], scale: [0.46, 8.3, 0.34] },
      { position: [0, 3.7, 2.23], rotation: [0, 0, Math.PI / 2], scale: [0.38, 6.8, 0.34] },
      { position: [0, 6.4, 2.24], rotation: [0, 0, Math.PI / 2], scale: [0.38, 6.7, 0.34] },
      { position: [0, 8.35, 2.25], rotation: [0, 0, Math.PI / 2], scale: [0.34, 6.2, 0.34] },
    ],
    [],
  );
  const curbBlocks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        position: [-25.8 + index * 4, 0.42, 11.2],
        scale: [4, 0.62, 1.15],
        color: index % 2 === 0 ? "#e3ad26" : "#24292a",
      })),
    [],
  );
  const screenNodes = useMemo(
    () => [
      [-2.1, 3.25, 0.8, 1.2],
      [-0.4, 3.7, 0.95, 1.45],
      [1.8, 3.3, 0.82, 1.18],
      [-1.8, 5.5, 0.9, 1.35],
      [0.45, 5.3, 1.05, 1.5],
      [2.1, 5.7, 0.75, 1.1],
      [-1.6, 7.5, 0.78, 1.18],
      [0.5, 7.6, 0.88, 1.3],
      [2, 8, 0.66, 1],
    ],
    [],
  );

  return (
    <group position={[294, 0.24, -143]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[2, 0.06, 7]} receiveShadow>
        <boxGeometry args={[68, 0.18, 22]} />
        <meshStandardMaterial color="#b8aa8f" roughness={0.98} />
      </mesh>
      <mesh position={[0, 11.25, 0]} castShadow>
        <boxGeometry args={[55, 1.8, 4.2]} />
        <meshStandardMaterial color="#bd4638" roughness={0.76} />
      </mesh>
      <BoxInstances
        items={[
          { position: [-26.1, 5.8, 0], scale: [2.8, 11.6, 4.2] },
          { position: [26.1, 5.8, 0], scale: [2.8, 11.6, 4.2] },
          { position: [-17.2, 1.05, 0], scale: [15.2, 1.55, 4.1] },
          { position: [17.6, 1.05, 0], scale: [16.5, 1.55, 4.1] },
        ]}
        color="#b94738"
        roughness={0.78}
        castShadow
      />
      <BoxInstances
        items={[
          { position: [-17.1, 5.75, -0.05], scale: [16.2, 9.1, 3.25] },
          { position: [17.4, 5.75, -0.05], scale: [17.1, 9.1, 3.25] },
          { position: [-6.7, 5.7, 0], scale: [1.45, 9.2, 4] },
          { position: [6.8, 5.7, 0], scale: [1.45, 9.2, 4] },
        ]}
        color="#e8e4d8"
        roughness={0.72}
        castShadow
      />
      <mesh position={[-17.1, 5.9, 1.7]}>
        <boxGeometry args={[14.9, 7.75, 0.28]} />
        <meshStandardMaterial color="#28583a" emissive="#173824" emissiveIntensity={0.34} roughness={0.83} />
      </mesh>
      <mesh position={[17.4, 5.9, 1.7]}>
        <boxGeometry args={[15.8, 7.75, 0.28]} />
        <meshStandardMaterial color="#28583a" emissive="#173824" emissiveIntensity={0.34} roughness={0.83} />
      </mesh>
      <mesh position={[0, 5.75, 1.98]}>
        <boxGeometry args={[6.3, 9, 0.22]} />
        <meshStandardMaterial color="#4b5050" roughness={0.52} />
      </mesh>
      <BoxInstances items={latticeBars} color="#f2efe5" roughness={0.7} castShadow />
      {screenNodes.map(([x, y, sx, sy], index) => (
        <mesh key={`gate-two-screen-node-${index}`} position={[x, y, 2.38]} scale={[sx, sy, 0.22]} castShadow>
          <sphereGeometry args={[0.62, 14, 10]} />
          <meshStandardMaterial color="#f5f2e8" roughness={0.68} />
        </mesh>
      ))}
      <group position={[3.7, 0, -4.2]}>
        <mesh position={[0, 2.2, 0]} castShadow>
          <boxGeometry args={[4.2, 4.4, 4.5]} />
          <meshStandardMaterial color="#e5e1d6" roughness={0.75} />
        </mesh>
        <mesh position={[0, 2.65, 2.3]}>
          <boxGeometry args={[3.2, 2.25, 0.2]} />
          <meshStandardMaterial color="#2f5150" metalness={0.25} roughness={0.28} />
        </mesh>
        <mesh position={[0, 4.6, 0]}>
          <boxGeometry args={[4.8, 0.5, 5]} />
          <meshStandardMaterial color="#b94738" roughness={0.76} />
        </mesh>
      </group>
      <group position={[3.8, 1.35, 5.1]}>
        <mesh position={[3.1, 0, 0]} rotation={[0, 0, -0.04]} castShadow>
          <boxGeometry args={[8.4, 0.24, 0.3]} />
          <meshStandardMaterial color="#f2f0e7" metalness={0.38} roughness={0.38} />
        </mesh>
        {[-0.5, 1.1, 2.7, 4.3, 5.9, 7.5].map((x) => (
          <mesh key={`gate-two-barrier-mark-${x}`} position={[x, 0.01, 0.17]} rotation={[0, 0, -0.04]}>
            <boxGeometry args={[0.72, 0.29, 0.08]} />
            <meshStandardMaterial color="#c74336" roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[-1.15, -0.45, 0]} castShadow>
          <boxGeometry args={[0.65, 2.2, 0.65]} />
          <meshStandardMaterial color="#535a59" metalness={0.35} roughness={0.45} />
        </mesh>
      </group>
      {curbBlocks.map((block, index) => (
        <mesh key={`gate-two-curb-${index}`} position={block.position}>
          <boxGeometry args={block.scale} />
          <meshStandardMaterial color={block.color} roughness={0.82} />
        </mesh>
      ))}
      {[-23, -19, -15, 14, 18, 22].map((x, index) => (
        <mesh key={`gate-two-shrub-${index}`} position={[x, 0.85, 7.6]} scale={[1.4, 0.8, 1.15]} castShadow>
          <dodecahedronGeometry args={[0.85, 1]} />
          <meshStandardMaterial color={index % 2 ? "#47783e" : "#355f35"} roughness={1} />
        </mesh>
      ))}
      {[-33, -39, -45, -51].map((x, index) => (
        <group key={`gate-two-brick-post-${x}`} position={[x, 0, 0.6]}>
          <mesh position={[0, 4.1, 0]} castShadow>
            <boxGeometry args={[2.1, 8.2, 2.1]} />
            <meshStandardMaterial color="#8f4936" roughness={0.9} />
          </mesh>
          <mesh position={[0, 8.45, 0]}>
            <boxGeometry args={[2.55, 0.5, 2.55]} />
            <meshStandardMaterial color="#6f382b" roughness={0.84} />
          </mesh>
        </group>
      ))}
      <BoxInstances
        items={[
          { position: [-36, 3.3, 0.6], scale: [4.2, 2.7, 1.2] },
          { position: [-42, 3.3, 0.6], scale: [4.2, 2.7, 1.2] },
          { position: [-48, 3.3, 0.6], scale: [4.2, 2.7, 1.2] },
        ]}
        color="#9e513d"
        roughness={0.9}
        castShadow
      />
      {[-19, 18].map((x) => (
        <group key={`gate-two-lamp-${x}`} position={[x, 12.55, 0]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.15, 0.19, 0.9, 10]} />
            <meshStandardMaterial color="#454d4c" metalness={0.45} roughness={0.42} />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.32, 0.26, 0.34, 10]} />
            <meshStandardMaterial color="#e8d9a2" emissive="#ffc965" emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}
      <Html position={[-17.1, 5.9, 1.92]} center transform distanceFactor={52}>
        <div className="gate-two-sign gate-two-sign--hindi">
          <strong>वीआईटी</strong>
          <span>भोपाल</span>
        </div>
      </Html>
      <Html position={[17.4, 5.9, 1.92]} center transform distanceFactor={52}>
        <div className="gate-two-sign gate-two-sign--brand">
          <img src={`${import.meta.env.BASE_URL}references/vit-emblem-source.png`} alt="VIT emblem" />
          <strong>VIT<br />BHOPAL</strong>
        </div>
      </Html>
    </group>
  );
}

function CampusBoundary() {
  const { posts, caps, walls } = useMemo(() => {
    const postItems = [];
    const capItems = [];
    const wallItems = [];
    const seenPosts = new Set();

    const addPost = (x, z) => {
      const key = `${x.toFixed(2)}:${z.toFixed(2)}`;
      if (seenPosts.has(key)) return;
      seenPosts.add(key);
      postItems.push({ position: [x, 4.1, z], scale: [2.1, 8.2, 2.1] });
      capItems.push({ position: [x, 8.45, z], scale: [2.55, 0.5, 2.55] });
    };

    const addHorizontal = (startX, endX, z) => {
      const length = Math.abs(endX - startX);
      const segments = Math.max(1, Math.ceil(length / 18));
      const step = (endX - startX) / segments;
      for (let index = 0; index <= segments; index += 1) {
        addPost(startX + step * index, z);
      }
      for (let index = 0; index < segments; index += 1) {
        wallItems.push({
          position: [startX + step * (index + 0.5), 3.3, z],
          scale: [Math.max(2, Math.abs(step) - 2.1), 2.7, 1.2],
        });
      }
    };

    const addVertical = (startZ, endZ, x) => {
      const length = Math.abs(endZ - startZ);
      const segments = Math.max(1, Math.ceil(length / 18));
      const step = (endZ - startZ) / segments;
      for (let index = 0; index <= segments; index += 1) {
        addPost(x, startZ + step * index);
      }
      for (let index = 0; index < segments; index += 1) {
        wallItems.push({
          position: [x, 3.3, startZ + step * (index + 0.5)],
          scale: [1.2, 2.7, Math.max(2, Math.abs(step) - 2.1)],
        });
      }
    };

    // The perimeter encloses the modeled campus while retaining clear openings
    // at the existing main gate (north) and Gate No. 2 (east).
    // Reverting the eastward extension and expanding from the west side instead.
    addHorizontal(-700, -22, 280);
    addHorizontal(104, 294, 280);
    addHorizontal(-700, 294, -560);
    addVertical(-560, 280, -700);
    addVertical(-560, -181, 294);
    addVertical(-90, 280, 294);

    return { posts: postItems, caps: capItems, walls: wallItems };
  }, []);

  return (
    <group>
      <BoxInstances items={walls} color="#9e513d" roughness={0.9} castShadow />
      <BoxInstances items={posts} color="#8f4936" roughness={0.9} castShadow />
      <BoxInstances items={caps} color="#6f382b" roughness={0.84} castShadow />
    </group>
  );
}

function MainGate() {
  const towers = useMemo(
    () => [
      { position: [-34, 12, 0], scale: [5.8, 24, 5.8] },
      { position: [-13, 13, 0], scale: [4.8, 26, 4.8] },
      { position: [13, 13, 0], scale: [4.8, 26, 4.8] },
      { position: [34, 12, 0], scale: [5.8, 24, 5.8] },
    ],
    [],
  );
  const towerBands = useMemo(() => {
    const items = [];
    [-34, -13, 13, 34].forEach((x, towerIndex) => {
      const radius = towerIndex === 0 || towerIndex === 3 ? 6.05 : 5.05;
      const height = towerIndex === 0 || towerIndex === 3 ? 24 : 26;
      for (let y = 1.7; y < height; y += 2.25) {
        items.push({ position: [x, y, 0], scale: [radius, 0.13, radius] });
      }
    });
    return items;
  }, []);
  const gateBars = useMemo(() => {
    const items = [];
    const spans = [
      [-28, -18],
      [-8, 8],
      [18, 28],
    ];
    spans.forEach(([start, end]) => {
      for (let x = start; x <= end; x += 2) {
        const height = 6.6 + Math.cos((x / 9) * Math.PI) * 1.2;
        items.push({
          position: [x, height / 2 + 0.4, 2.7],
          scale: [0.2, height, 0.2],
        });
      }
      items.push({
        position: [(start + end) / 2, 1.25, 2.7],
        scale: [end - start + 0.5, 0.24, 0.28],
      });
      items.push({
        position: [(start + end) / 2, 6.15, 2.7],
        scale: [end - start + 0.5, 0.24, 0.28],
      });
    });
    return items;
  }, []);
  const bollards = useMemo(
    () =>
      [-8, -4, 0, 4, 8].map((x) => ({
        position: [x, 0.9, 14],
        scale: [0.32, 1.8, 0.32],
      })),
    [],
  );
  return (
    <group position={[40, 0.22, 246]}>
      <mesh position={[0, 0.05, 12]} receiveShadow>
        <boxGeometry args={[113, 0.2, 45]} />
        <meshStandardMaterial color="#aa9d84" roughness={0.97} />
      </mesh>
      <CylinderInstances
        items={towers}
        color="#8f402e"
        radialSegments={28}
        roughness={0.86}
        castShadow
      />
      <CylinderInstances
        items={towerBands}
        color="#b15c44"
        radialSegments={28}
        roughness={0.82}
      />
      <CylinderInstances
        items={towers.map((tower) => ({
          position: [tower.position[0], tower.scale[1] + 0.45, 0],
          scale: [tower.scale[0] + 0.45, 0.7, tower.scale[2] + 0.45],
        }))}
        color="#82402f"
        radialSegments={28}
        roughness={0.75}
      />
      <BoxInstances
        items={[
          { position: [0, 20.6, 0], scale: [22, 4.5, 4.2] },
          { position: [-23.5, 18.5, 0], scale: [13, 3.3, 3.8] },
          { position: [23.5, 18.5, 0], scale: [13, 3.3, 3.8] },
        ]}
        color="#914331"
        roughness={0.84}
        castShadow
      />
      <mesh position={[0, 20.7, 2.2]}>
        <boxGeometry args={[24.5, 3.45, 0.28]} />
        <meshStandardMaterial color="#6f3024" roughness={0.72} />
      </mesh>
      <BoxInstances items={gateBars} color="#3a4446" metalness={0.72} roughness={0.34} />
      <group position={[-47, 0, 1]}>
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[18, 6.4, 13]} />
          <meshStandardMaterial color="#c7c7bf" roughness={0.74} />
        </mesh>
        <mesh position={[0, 4.1, 6.6]}>
          <boxGeometry args={[15, 3.9, 0.25]} />
          <meshStandardMaterial color="#34515a" metalness={0.35} roughness={0.25} />
        </mesh>
        <mesh position={[0, 6.75, 0]}>
          <boxGeometry args={[20, 0.7, 15]} />
          <meshStandardMaterial color="#59666a" metalness={0.28} roughness={0.48} />
        </mesh>
      </group>
      <group position={[47, 0, 1]}>
        <mesh position={[0, 3.2, 0]} castShadow>
          <boxGeometry args={[18, 6.4, 13]} />
          <meshStandardMaterial color="#c7c7bf" roughness={0.74} />
        </mesh>
        <mesh position={[0, 4.1, 6.6]}>
          <boxGeometry args={[15, 3.9, 0.25]} />
          <meshStandardMaterial color="#34515a" metalness={0.35} roughness={0.25} />
        </mesh>
        <mesh position={[0, 6.75, 0]}>
          <boxGeometry args={[20, 0.7, 15]} />
          <meshStandardMaterial color="#59666a" metalness={0.28} roughness={0.48} />
        </mesh>
      </group>
      <BoxInstances items={bollards} color="#4f8e71" metalness={0.4} roughness={0.45} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 34]}>
        <ringGeometry args={[14, 19, 56]} />
        <meshStandardMaterial color="#bba98b" roughness={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 34]}>
        <circleGeometry args={[13.8, 56]} />
        <meshStandardMaterial color="#427648" roughness={1} />
      </mesh>
      <group position={[0, 0, 34]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[7.2, 8.4, 2.8, 32]} />
          <meshStandardMaterial color="#9c8a6e" roughness={0.82} />
        </mesh>
        <mesh position={[0, 3.15, 0]} castShadow>
          <boxGeometry args={[11, 1.2, 6.8]} />
          <meshStandardMaterial color="#b29a70" roughness={0.77} />
        </mesh>
        <LionStatue />
        <Html position={[0, 3.75, 3.45]} center transform distanceFactor={8}>
          <div className="lion-plaque">VIT BHOPAL</div>
        </Html>
      </group>
      <PalmGrove
        items={[
          [-53, 18, 0.62],
          [53, 18, 0.62],
          [-30, 34, 0.58],
          [30, 34, 0.58],
        ]}
      />
      <Html position={[0, 20.8, 2.42]} center distanceFactor={95}>
        <div className="gate-sign">
          <span className="gate-sign-emblem">
            <img src={`${import.meta.env.BASE_URL}references/vit-emblem-source.png`} alt="VIT emblem" />
          </span>
          <div className="gate-sign-copy">
            <strong>VIT BHOPAL UNIVERSITY</strong>
            <span>वीआईटी भोपाल विश्वविद्यालय</span>
          </div>
        </div>
      </Html>
      <Html position={[-47, 7.5, 6.8]} center transform distanceFactor={10}>
        <div className="guard-sign">SECURITY</div>
      </Html>
    </group>
  );
}

function SolarPanel({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[-1.2, 0.65, 0]} rotation={[-0.32, 0, 0]} castShadow>
        <boxGeometry args={[2.25, 0.1, 3.4]} />
        <meshStandardMaterial color="#123f70" metalness={0.72} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 0.65, 0]} rotation={[-0.32, 0, 0]} castShadow>
        <boxGeometry args={[2.25, 0.1, 3.4]} />
        <meshStandardMaterial color="#164a80" metalness={0.72} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.7, 0.15]} />
        <meshStandardMaterial color="#9ba9ad" metalness={0.6} />
      </mesh>
    </group>
  );
}

function SolarFarm() {
  const { panels, posts } = useMemo(() => {
    const panelItems = [];
    const postItems = [];
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 13; column += 1) {
        const x = -29 + column * 4.9;
        const z = -16 + row * 5;
        panelItems.push({
          position: [x, 0.78, z],
          rotation: [-0.32, 0.03, 0],
          scale: [4.45, 0.11, 3.35],
        });
        postItems.push({
          position: [x, 0.27, z],
          scale: [0.13, 0.7, 0.13],
        });
      }
    }
    return { panels: panelItems, posts: postItems };
  }, []);
  return (
    <group position={[-115, 0.35, 112]}>
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[70, 0.2, 43]} />
        <meshStandardMaterial color="#555d42" roughness={1} />
      </mesh>
      <BoxInstances
        items={panels}
        color="#123f70"
        metalness={0.72}
        roughness={0.2}
        castShadow
      />
      <BoxInstances
        items={posts}
        color="#9ba9ad"
        metalness={0.62}
        roughness={0.38}
      />
    </group>
  );
}

function WindTurbine({ position, speed }) {
  const rotorRef = useRef();
  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z -= delta * Math.max(0.2, speed / 8);
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 18, 0]} castShadow>
        <cylinderGeometry args={[0.45, 1.1, 36, 16]} />
        <meshStandardMaterial color="#dce5e7" metalness={0.55} roughness={0.32} />
      </mesh>
      <group position={[0, 36, 0]} rotation={[0, 0, 0]} ref={rotorRef}>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 2.4, 20]} />
          <meshStandardMaterial color="#eff4f5" metalness={0.45} />
        </mesh>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle) => (
          <group rotation={[0, 0, angle]} key={angle}>
            <mesh position={[0, 7.8, 0]} rotation={[0, 0, -0.08]} castShadow>
              <boxGeometry args={[0.8, 14.8, 0.28]} />
              <meshStandardMaterial color="#eef3f3" roughness={0.38} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 36, 0.25]}>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshStandardMaterial color="#e7efef" metalness={0.55} />
      </mesh>
      <mesh position={[0, 40, 0]}>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshStandardMaterial color="#ff4a59" emissive="#ff2039" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function BatteryStorage() {
  return (
    <group position={[-175, 0.25, 112]}>
      {[-12, -4, 4, 12].map((x, index) => (
        <group key={x} position={[x, 0, index % 2 ? 5 : -5]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <boxGeometry args={[6.5, 4.4, 13]} />
            <meshStandardMaterial color="#d8ddd7" metalness={0.38} roughness={0.4} />
          </mesh>
          {[1, 2, 3].map((vent) => (
            <mesh key={vent} position={[3.27, 1.2 + vent * 0.75, 0]}>
              <boxGeometry args={[0.08, 0.35, 5]} />
              <meshStandardMaterial color="#384649" />
            </mesh>
          ))}
          <mesh position={[0, 3.8, 6.52]}>
            <planeGeometry args={[4.2, 0.48]} />
            <meshStandardMaterial
              color="#45dfa0"
              emissive="#45dfa0"
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[38, 0.15, 24]} />
        <meshStandardMaterial color="#464b4a" />
      </mesh>
    </group>
  );
}

function Substation() {
  const transformerPositions = [
    [-9, -6],
    [0, -6],
    [9, -6],
    [-4.5, 6],
    [4.5, 6],
  ];
  return (
    <group position={[-220, 0.25, 112]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[37, 0.24, 28]} />
        <meshStandardMaterial color="#555859" />
      </mesh>
      {transformerPositions.map(([x, z]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 2.1, 0]} castShadow>
            <boxGeometry args={[5, 4.2, 4.5]} />
            <meshStandardMaterial color="#87939a" metalness={0.66} roughness={0.34} />
          </mesh>
          {[-1.5, 0, 1.5].map((ix) => (
            <mesh key={ix} position={[ix, 5.4, 0]}>
              <cylinderGeometry args={[0.16, 0.22, 2.6, 10]} />
              <meshStandardMaterial color="#8c6e51" roughness={0.55} />
            </mesh>
          ))}
        </group>
      ))}
      {[-15, 15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[0.35, 8, 0.35]} />
            <meshStandardMaterial color="#b5c0c3" metalness={0.7} />
          </mesh>
          <mesh position={[0, 7.2, 0]}>
            <boxGeometry args={[0.35, 0.35, 24]} />
            <meshStandardMaterial color="#b5c0c3" metalness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Pylon({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Line
        points={[
          [-6, 0, 0],
          [-2.2, 18, 0],
          [0, 29, 0],
          [2.2, 18, 0],
          [6, 0, 0],
        ]}
        color="#8e969c"
        lineWidth={1.5}
      />
      {[8, 15, 21].map((y, index) => (
        <group key={y}>
          <Line points={[[-4.2 + index * 0.7, y, 0], [4.2 - index * 0.7, y, 0]]} color="#8e969c" lineWidth={1.2} />
          <Line points={[[-3, y, 0], [0, y + 5, 0], [3, y, 0]]} color="#747c82" lineWidth={1} />
        </group>
      ))}
    </group>
  );
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.36, 3.4, 8]} />
        <meshStandardMaterial color="#654b34" />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <icosahedronGeometry args={[2.25, 1]} />
        <meshStandardMaterial color="#2f623c" roughness={1} />
      </mesh>
      <mesh position={[1.15, 3.8, 0.25]} castShadow>
        <icosahedronGeometry args={[1.45, 1]} />
        <meshStandardMaterial color="#3e7747" roughness={1} />
      </mesh>
    </group>
  );
}

function Forest({ items }) {
  const { trunks, crowns, highlights } = useMemo(() => {
    const trunkItems = [];
    const crownItems = [];
    const highlightItems = [];
    items.forEach(([x, y, z, scale], index) => {
      trunkItems.push({
        position: [x, y + 1.7 * scale, z],
        scale: [0.27 * scale, 3.4 * scale, 0.27 * scale],
      });
      crownItems.push({
        position: [x, y + 4.15 * scale, z],
        scale: [2.2 * scale, 2.35 * scale, 2.2 * scale],
        rotation: [0, index * 0.83, 0],
      });
      highlightItems.push({
        position: [x + 1.05 * scale, y + 3.9 * scale, z + 0.25 * scale],
        scale: [1.35 * scale, 1.45 * scale, 1.35 * scale],
        rotation: [0, index * 0.47, 0],
      });
    });
    return {
      trunks: trunkItems,
      crowns: crownItems,
      highlights: highlightItems,
    };
  }, [items]);
  return (
    <group>
      <CylinderInstances items={trunks} color="#654b34" castShadow radialSegments={7} />
      <IcoInstances items={crowns} color="#2f623c" castShadow />
      <IcoInstances items={highlights} color="#477d49" castShadow />
    </group>
  );
}

function useTerrainTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    context.fillStyle = "#716847";
    context.fillRect(0, 0, 512, 512);

    const fieldPalette = [
      "#657349",
      "#4f6c42",
      "#81714a",
      "#6f7e50",
      "#887450",
      "#476740",
    ];
    const fieldRects = [
      [12, 14, 118, 104],
      [139, 8, 96, 118],
      [246, 16, 132, 96],
      [389, 6, 111, 120],
      [8, 132, 95, 141],
      [115, 138, 128, 102],
      [255, 126, 110, 142],
      [378, 141, 122, 116],
      [6, 286, 130, 102],
      [148, 258, 98, 136],
      [258, 282, 132, 104],
      [402, 272, 104, 133],
      [12, 403, 112, 96],
      [136, 408, 142, 90],
      [292, 398, 93, 103],
      [397, 415, 106, 84],
    ];
    fieldRects.forEach(([x, y, width, height], index) => {
      context.fillStyle = fieldPalette[index % fieldPalette.length];
      context.fillRect(x, y, width, height);
      context.globalAlpha = 0.14;
      context.strokeStyle = index % 2 ? "#d1c08b" : "#243d29";
      context.lineWidth = 1;
      const spacing = 5 + (index % 4) * 2;
      for (let offset = 2; offset < width; offset += spacing) {
        context.beginPath();
        context.moveTo(x + offset, y);
        context.lineTo(x + offset, y + height);
        context.stroke();
      }
      context.globalAlpha = 1;
    });

    let seed = 91;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let index = 0; index < 8200; index += 1) {
      const shade = random() > 0.52 ? 255 : 0;
      context.fillStyle = `rgba(${shade},${shade},${shade},${0.012 + random() * 0.026})`;
      const size = random() * 1.5 + 0.4;
      context.fillRect(random() * 512, random() * 512, size, size);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1.35, 1.05);
    map.anisotropy = 4;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ParkingLot({
  position,
  size = [32, 17],
  rotation = 0,
  columns = 8,
}) {
  const { markings, cars, cabins } = useMemo(() => {
    const markingItems = [];
    const carItems = [];
    const cabinItems = [];
    const slotWidth = (size[0] - 3) / columns;
    for (let index = 0; index <= columns; index += 1) {
      const x = -size[0] / 2 + 1.5 + index * slotWidth;
      markingItems.push({
        position: [x, 0.18, -size[1] * 0.27],
        scale: [0.09, 0.04, size[1] * 0.38],
      });
      if (index < columns && (index + columns) % 3 !== 0) {
        const carX = x + slotWidth / 2;
        const carZ = -size[1] * 0.27;
        carItems.push({
          position: [carX, 0.62, carZ],
          scale: [slotWidth * 0.55, 0.7, 3.25],
        });
        cabinItems.push({
          position: [carX, 1.13, carZ - 0.15],
          scale: [slotWidth * 0.45, 0.48, 1.7],
        });
      }
    }
    markingItems.push({
      position: [0, 0.18, 0],
      scale: [size[0] - 2, 0.04, 0.1],
    });
    return { markings: markingItems, cars: carItems, cabins: cabinItems };
  }, [columns, size]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[size[0], 0.1, size[1]]} />
        <meshStandardMaterial color="#51585a" roughness={0.92} />
      </mesh>
      <BoxInstances items={markings} color="#d6d2b9" roughness={0.8} />
      <BoxInstances items={cars} color="#667a83" metalness={0.4} roughness={0.35} castShadow />
      <BoxInstances items={cabins} color="#263f4a" metalness={0.55} roughness={0.22} />
    </group>
  );
}

function CampusLandscape() {
  const terrainTexture = useTerrainTexture();
  const fields = [
    [-330, -220, 118, 86, "#607448"],
    [-205, -225, 112, 78, "#8a7048"],
    [-80, -228, 118, 82, "#506b3f"],
    [55, -225, 126, 88, "#7d784e"],
    [200, -225, 132, 86, "#477044"],
    [335, -210, 104, 105, "#87734b"],
    [-350, -90, 92, 112, "#4b7143"],
    [350, -82, 94, 126, "#6e824c"],
    [-345, 68, 102, 124, "#7f7349"],
    [350, 75, 98, 124, "#426d42"],
    [-325, 220, 132, 84, "#4d7143"],
    [-180, 225, 122, 82, "#86734a"],
    [-45, 228, 128, 84, "#607b49"],
    [105, 224, 136, 86, "#7d764b"],
    [255, 222, 138, 86, "#477144"],
    [-160, -130, 98, 64, "#526e3c"],
    [-55, -139, 92, 43, "#786d45"],
    [45, -150, 95, 35, "#6f8447"],
    [165, -125, 68, 68, "#396b42"],
    [175, -45, 56, 74, "#788650"],
    [170, 45, 67, 72, "#927750"],
    [153, 125, 96, 58, "#456c3e"],
    [55, 143, 84, 47, "#6f8250"],
    [-48, 142, 83, 40, "#7f7145"],
    [-170, 125, 78, 54, "#3f7046"],
    [-300, -347, 128, 92, "#597244"],
    [-164, -350, 126, 88, "#88734b"],
    [-29, -348, 128, 92, "#4d7041"],
    [108, -350, 130, 88, "#7d784d"],
    [244, -347, 128, 92, "#507246"],
    [18, -405, 190, 132, "#5b7d44"],
    [-220, -150, 220, 160, "#6c8448"],
  ];

  const trees = useMemo(
    () =>
      [
        [-285, -190, 2.1],
        [-220, -210, 1.9],
        [-270, -100, 2.0],
        [-130, -170, 2.3],
        [55, -130, 1.8],
        [175, -225, 2.0],
        [300, -75, 1.9],
        [325, 40, 2.0],
        [-315, 55, 2.1],
        [-205, 145, 1.7],
        [-150, -40, 2.0],
      ].map(([x, z, scale]) => [x, 0, z, scale]),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -75]} receiveShadow>
        <planeGeometry args={[1000, 900, 1, 1]} />
        <meshStandardMaterial map={terrainTexture} color="#ffffff" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-520, -0.5, -75]} receiveShadow>
        <planeGeometry args={[600, 900, 1, 1]} />
        <meshStandardMaterial map={terrainTexture} color="#ffffff" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -560]} receiveShadow>
        <planeGeometry args={[1000, 240, 1, 1]} />
        <meshStandardMaterial map={terrainTexture} color="#ffffff" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-520, -0.5, -560]} receiveShadow>
        <planeGeometry args={[600, 240, 1, 1]} />
        <meshStandardMaterial map={terrainTexture} color="#ffffff" roughness={1} />
      </mesh>
      {fields.map(([x, z, width, depth, color], index) => (
        <mesh
          key={`field-${index}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.38 + index * 0.002, z]}
          receiveShadow
        >
          <planeGeometry args={[width, depth]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
      <Forest items={trees} />
      <CampusBoundary />
    </group>
  );
}

const CAMPUS_ROADS = [
  // Main gate, Academic Block 1 and the Lab/Architecture frontage.
  [[40, 304], [23, 294], [16.5, 270], [16.5, 246], [20, 225], [40, 210], [40, 140]],
  [[40, 304], [57, 294], [63.5, 270], [63.5, 246], [60, 225], [40, 210]],
  [[-66, 140], [92, 140]],
  [[40, 140], [40, 176], [92, 176], [92, 140]],
  [[40, 140], [40, 72], [79, 72], [79, 10], [188, 10], [188, -86]],
  [[40, 116], [92, 116], [92, 72]],

  // Multipurpose Hall, Girls' Hostel precinct and Gate No. 2.
  [[188, -86], [260, -86], [260, -143], [294, -143]],
  [[188, -86], [178, -86], [178, -215], [300, -215], [300, -143], [294, -143]],
  [[-405, -170], [178, -170]],

  // Girls' Hostel Block 2 frontage and the west-campus service spine.
  [[-405, 10], [79, 10]],
  [[-405, 10], [-405, -470]],

  // Boys' hostel front approaches. Each spur stops before the building footprint.
  [[-405, -125], [-425, -125]],
  [[-405, -330], [-470, -330]],
  [[-405, -335], [-520, -335]],

  // Academic Block 2, its football-ground frontage and the Special Block.
  [[-25, -170], [-25, -470]],
  [[-25, -300], [-130, -300]],
  [[-405, -420], [-340, -420]],
];

const CAMPUS_WALKWAYS = [
  [[-20, 302], [-20, 270], [-20, 230], [10, 215], [34, 205], [34, 146], [-62, 146]],
  [[46, 146], [46, 170], [88, 170]],
  [[34, 122], [96, 122]],
  [[34, 16], [-300, 16]],
  [[-399, 10], [-399, -465]],
  [[-399, -119], [-427, -119]],
  [[-399, -324], [-470, -324]],
  [[-399, -329], [-520, -329]],
  [[-399, -414], [-340, -414]],
  [[-19, -164], [172, -164]],
  [[-19, -164], [-19, -464]],
  [[-19, -294], [-130, -294]],
  [[182, 8], [182, -80], [172, -80], [172, -209], [294, -209]],
  [[194, -80], [254, -80], [254, -137], [292, -137]],
];

function makePolylineCurve(path, closed = false) {
  const points = path.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const routePoints = closed ? [...points, points[0].clone()] : points;
  const curve = new THREE.CurvePath();
  for (let index = 0; index < routePoints.length - 1; index += 1) {
    curve.add(new THREE.LineCurve3(routePoints[index], routePoints[index + 1]));
  }
  return curve;
}

function RoadNetwork() {
  const { asphalt, shoulders, walkways } = useMemo(() => {
    const asphaltItems = [];
    const shoulderItems = [];
    const walkwayItems = [];
    CAMPUS_ROADS.forEach((points) => {
      const width = 7.6;
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const dx = end[0] - start[0];
        const dz = end[1] - start[1];
        const length = Math.hypot(dx, dz);
        const rotation = -Math.atan2(dz, dx);
        const position = [(start[0] + end[0]) / 2, 0.05, (start[1] + end[1]) / 2];
        shoulderItems.push({
          position: [position[0], 0.015, position[2]],
          rotation: [0, rotation, 0],
          scale: [length + 1.6, 0.16, width + 2.4],
        });
        asphaltItems.push({
          position,
          rotation: [0, rotation, 0],
          scale: [length + 0.5, 0.2, width],
        });
      }
    });
    CAMPUS_WALKWAYS.forEach((points) => {
      for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index];
        const end = points[index + 1];
        const dx = end[0] - start[0];
        const dz = end[1] - start[1];
        const length = Math.hypot(dx, dz);
        walkwayItems.push({
          position: [(start[0] + end[0]) / 2, 0.16, (start[1] + end[1]) / 2],
          rotation: [0, -Math.atan2(dz, dx), 0],
          scale: [length + 0.45, 0.12, 3.2],
        });
      }
    });
    return { asphalt: asphaltItems, shoulders: shoulderItems, walkways: walkwayItems };
  }, []);
  return (
    <group>
      <BoxInstances items={shoulders} color="#b3aa90" roughness={1} receiveShadow />
      <BoxInstances items={asphalt} color="#565c5d" roughness={0.94} receiveShadow />
      <BoxInstances items={walkways} color="#c9c5ba" roughness={0.96} receiveShadow />
      {CAMPUS_ROADS.map((points, index) => (
        <Line
          key={`road-marking-${index}`}
          points={points.map(([x, z]) => [x, 0.22, z])}
          color="#d7cfad"
          lineWidth={0.7}
          dashed
          dashSize={4}
          gapSize={5}
        />
      ))}
    </group>
  );
}

function AnimatedVehicle({
  path,
  speed,
  offset,
  lane = 0,
  type = "car",
  color = "#d84f42",
}) {
  const vehicleRef = useRef();
  const curve = useMemo(() => makePolylineCurve(path), [path]);
  useFrame(({ clock }) => {
    if (!vehicleRef.current) return;
    const phase = (clock.elapsedTime * speed + offset) % 2;
    const forward = phase <= 1;
    const progress = forward ? phase : 2 - phase;
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress).multiplyScalar(forward ? 1 : -1);
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    vehicleRef.current.position.copy(point.add(normal.multiplyScalar(lane)));
    vehicleRef.current.position.y = 0.25;
    vehicleRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
  });

  const isBus = type === "bus";
  const length = isBus ? 8.8 : 4.5;
  const width = isBus ? 2.8 : 2.25;
  const wheelZ = isBus ? 3.1 : 1.45;
  return (
    <group ref={vehicleRef}>
      <mesh position={[0, isBus ? 1.75 : 1.05, 0]} castShadow>
        <boxGeometry args={[width, isBus ? 3.2 : 1.35, length]} />
        <meshStandardMaterial color={color} metalness={0.22} roughness={0.42} />
      </mesh>
      <mesh position={[0, isBus ? 3.15 : 1.85, isBus ? 0 : -0.1]} castShadow>
        <boxGeometry args={[width * 0.9, isBus ? 0.55 : 0.75, length * (isBus ? 0.86 : 0.58)]} />
        <meshStandardMaterial color={isBus ? "#e8dfc8" : "#253c48"} metalness={0.34} roughness={0.28} />
      </mesh>
      {isBus && (
        <>
          <BoxInstances
            items={[-2.8, -0.9, 1, 2.9].flatMap((z) => [
              { position: [width / 2 + 0.04, 2.25, z], scale: [0.12, 1.25, 1.35] },
              { position: [-width / 2 - 0.04, 2.25, z], scale: [0.12, 1.25, 1.35] },
            ])}
            color="#395d69"
            emissive="#1d353e"
            emissiveIntensity={0.12}
            metalness={0.42}
            roughness={0.24}
          />
          <Html position={[0, 2.2, 4.47]} center transform distanceFactor={5}>
            <div className="bus-destination">VIT CAMPUS BUS</div>
          </Html>
        </>
      )}
      {[-1, 1].flatMap((side) =>
        [-wheelZ, wheelZ].map((z) => (
          <mesh
            key={`${side}-${z}`}
            position={[side * (width / 2 + 0.08), 0.62, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.48, 0.48, 0.32, 12]} />
            <meshStandardMaterial color="#202426" roughness={0.72} />
          </mesh>
        )),
      )}
      <BoxInstances
        items={[
          { position: [-0.7, 1.05, length / 2 + 0.08], scale: [0.45, 0.35, 0.15] },
          { position: [0.7, 1.05, length / 2 + 0.08], scale: [0.45, 0.35, 0.15] },
        ]}
        color="#fff2bc"
        emissive="#fff2bc"
        emissiveIntensity={0.75}
      />
    </group>
  );
}

function RoadTraffic() {
  const routes = useMemo(
    () => ({
      gateToAcademic: [
        [40, 300],
        [23, 292],
        [16.5, 270],
        [16.5, 246],
        [20, 225],
        [40, 210],
        [40, 140],
        [-62, 140],
      ],
      gateToLab: [
        [40, 300],
        [57, 292],
        [63.5, 270],
        [63.5, 246],
        [60, 225],
        [40, 210],
        [40, 176],
        [92, 176],
      ],
      eastCampus: [
        [40, 140],
        [40, 72],
        [79, 72],
        [79, 10],
        [188, 10],
        [188, -86],
        [260, -86],
        [260, -143],
        [294, -143],
      ],
      westCampus: [
        [40, 140],
        [40, 72],
        [79, 72],
        [79, 10],
        [-405, 10],
        [-405, -420],
        [-340, -420],
      ],
      southAcademic: [
        [178, -86],
        [178, -170],
        [-25, -170],
        [-25, -300],
        [-130, -300],
      ],
      boysHostels: [
        [-300, 10],
        [-405, 10],
        [-405, -335],
        [-520, -335],
      ],
    }),
    [],
  );
  const vehicles = useMemo(
    () => [
      ["gateToAcademic", 0.018, 0.05, -1.55, "car", "#d85145"],
      ["gateToLab", 0.015, 0.72, 1.55, "car", "#3b78a2"],
      ["eastCampus", 0.012, 0.22, -1.45, "bus", "#4b93a8"],
      ["westCampus", 0.0085, 0.86, 1.45, "bus", "#d49a2f"],
      ["southAcademic", 0.011, 0.42, -1.4, "car", "#ece7dc"],
      ["boysHostels", 0.009, 1.24, 1.4, "car", "#6f8f63"],
    ],
    [],
  );
  return (
    <group>
      {vehicles.map(([route, speed, offset, lane, type, color], index) => (
        <AnimatedVehicle
          key={`vehicle-${index}`}
          path={routes[route]}
          speed={speed}
          offset={offset}
          lane={lane}
          type={type}
          color={color}
        />
      ))}
    </group>
  );
}

function WalkingStudent({ path, speed, offset, side = 0, shirt, trousers, skin = "#c78d68" }) {
  const personRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const curve = useMemo(() => makePolylineCurve(path), [path]);
  useFrame(({ clock }) => {
    if (!personRef.current) return;
    const phase = (clock.elapsedTime * speed + offset) % 2;
    const forward = phase <= 1;
    const progress = forward ? phase : 2 - phase;
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress).multiplyScalar(forward ? 1 : -1);
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    const stride = Math.sin(clock.elapsedTime * 7.2 + offset * 9) * 0.55;
    personRef.current.position.copy(point.add(normal.multiplyScalar(side)));
    personRef.current.position.y = 0.18 + Math.abs(stride) * 0.08;
    personRef.current.rotation.y = Math.atan2(tangent.x, tangent.z);
    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.75;
    if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.75;
  });
  return (
    <group ref={personRef} scale={0.72}>
      <mesh position={[0, 3.7, 0]}>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshBasicMaterial color={skin} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.65, 0]} castShadow>
        <capsuleGeometry args={[0.48, 1.2, 5, 8]} />
        <meshBasicMaterial color={shirt} toneMapped={false} />
      </mesh>
      <group ref={leftLegRef} position={[-0.25, 1.72, 0]}>
        <mesh position={[0, -0.78, 0]}>
          <boxGeometry args={[0.34, 1.65, 0.38]} />
          <meshBasicMaterial color={trousers} toneMapped={false} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.25, 1.72, 0]}>
        <mesh position={[0, -0.78, 0]}>
          <boxGeometry args={[0.34, 1.65, 0.38]} />
          <meshBasicMaterial color={trousers} toneMapped={false} />
        </mesh>
      </group>
      <group ref={leftArmRef} position={[-0.6, 3.1, 0]}>
        <mesh position={[0, -0.65, 0]}>
          <capsuleGeometry args={[0.16, 0.95, 4, 6]} />
          <meshBasicMaterial color={shirt} toneMapped={false} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.6, 3.1, 0]}>
        <mesh position={[0, -0.65, 0]}>
          <capsuleGeometry args={[0.16, 0.95, 4, 6]} />
          <meshBasicMaterial color={shirt} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, 4.1, -0.08]}>
        <sphereGeometry args={[0.43, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#6b4b3b" toneMapped={false} />
      </mesh>
    </group>
  );
}

function StudentCrowds() {
  const routes = useMemo(() => CAMPUS_WALKWAYS, []);
  const students = useMemo(
    () => [
      [0, 0.028, 0.05, 0.65, "#4f85b4", "#6c7884", "#d59a73"],
      [0, 0.024, 0.55, -0.65, "#c96d59", "#586a78", "#b97955"],
      [1, 0.026, 1.1, 0.7, "#e3b953", "#7b6f65", "#e5b58e"],
      [2, 0.03, 0.22, 0.6, "#58a17f", "#63788a", "#9f674b"],
      [3, 0.026, 1.05, -0.7, "#996caf", "#7d8490", "#c98964"],
      [4, 0.03, 0.12, 0.65, "#d98250", "#5d7180", "#e0aa82"],
      [5, 0.025, 0.72, -0.65, "#5793b5", "#73808b", "#ac7254"],
      [6, 0.028, 1.4, 0.7, "#dfc9a2", "#81766d", "#f0c6a2"],
      [7, 0.028, 0.3, 0.6, "#ad6271", "#667784", "#c68560"],
      [8, 0.024, 1.2, -0.6, "#5688a5", "#8a7b6e", "#8e5b43"],
      [9, 0.032, 0.16, 0.7, "#dda34d", "#66798a", "#d99d75"],
      [10, 0.027, 0.88, -0.7, "#70a568", "#7a858f", "#b87856"],
      [11, 0.031, 0.35, 0.6, "#507dac", "#756e68", "#edbc96"],
      [12, 0.026, 1.25, -0.6, "#c96857", "#607684", "#a96e51"],
      [13, 0.025, 0.2, 0.7, "#9679b6", "#858b92", "#cf916c"],
      [13, 0.028, 1.15, -0.7, "#d7ae55", "#6e7e89", "#e7b38c"],
    ],
    [],
  );
  return (
    <group>
      {students.map(([route, speed, offset, side, shirt, trousers, skin], index) => (
        <WalkingStudent
          key={`student-${index}`}
          path={routes[route]}
          speed={speed}
          offset={offset}
          side={side}
          shirt={shirt}
          trousers={trousers}
          skin={skin}
        />
      ))}
    </group>
  );
}

function DenseStudentCrowd({ count = 240 }) {
  const headRef = useRef();
  const torsoRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const routes = useMemo(
    () => CAMPUS_WALKWAYS.map((points) => ({ points })),
    [],
  );
  const curves = useMemo(
    () => routes.map((route) => makePolylineCurve(route.points, Boolean(route.closed))),
    [routes],
  );
  const students = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        route: index % curves.length,
        speed: 0.011 + (index % 7) * 0.0022,
        offset: ((index * 37) % count) / count * 2,
        side: ((index % 5) - 2) * 0.42 + (index % 2 ? 0.22 : -0.22),
        scale: 0.61 + (index % 5) * 0.025,
        shirt: [
          "#568ab4",
          "#c86a57",
          "#e0b54f",
          "#5da17d",
          "#966aad",
          "#d98350",
          "#5593b6",
          "#dec7a0",
        ][index % 8],
        trousers: ["#667887", "#7c7f83", "#6f746f", "#807268", "#5f7482"][index % 5],
        skin: ["#f0c5a1", "#dea47e", "#c88963", "#ad7254", "#8f5d45"][index % 5],
      })),
    [count, curves.length],
  );
  const rootObject = useMemo(() => new THREE.Object3D(), []);
  const partObject = useMemo(() => new THREE.Object3D(), []);
  const combinedMatrix = useMemo(() => new THREE.Matrix4(), []);
  const point = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    if (
      !headRef.current ||
      !torsoRef.current ||
      !leftLegRef.current ||
      !rightLegRef.current ||
      !leftArmRef.current ||
      !rightArmRef.current
    ) {
      return;
    }
    students.forEach((student, index) => {
      const skin = new THREE.Color(student.skin);
      const shirt = new THREE.Color(student.shirt);
      const trousers = new THREE.Color(student.trousers);
      headRef.current.setColorAt(index, skin);
      torsoRef.current.setColorAt(index, shirt);
      leftArmRef.current.setColorAt(index, shirt);
      rightArmRef.current.setColorAt(index, shirt);
      leftLegRef.current.setColorAt(index, trousers);
      rightLegRef.current.setColorAt(index, trousers);
    });
    [
      headRef,
      torsoRef,
      leftLegRef,
      rightLegRef,
      leftArmRef,
      rightArmRef,
    ].forEach((ref) => {
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    });
  }, [students]);

  useFrame(({ clock }) => {
    if (
      !headRef.current ||
      !torsoRef.current ||
      !leftLegRef.current ||
      !rightLegRef.current ||
      !leftArmRef.current ||
      !rightArmRef.current
    ) {
      return;
    }
    const setPart = (mesh, index, position, scale, rotationX = 0) => {
      partObject.position.set(...position);
      partObject.rotation.set(rotationX, 0, 0);
      partObject.scale.set(...scale);
      partObject.updateMatrix();
      combinedMatrix.multiplyMatrices(rootObject.matrix, partObject.matrix);
      mesh.setMatrixAt(index, combinedMatrix);
    };
    students.forEach((student, index) => {
      const curve = curves[student.route];
      const phase = (clock.elapsedTime * student.speed + student.offset) % 2;
      const forward = phase <= 1;
      const progress = forward ? phase : 2 - phase;
      curve.getPointAt(progress, point);
      curve.getTangentAt(progress, tangent).multiplyScalar(forward ? 1 : -1);
      normal.set(tangent.z, 0, -tangent.x).normalize();
      point.addScaledVector(normal, student.side);
      const stride = Math.sin(clock.elapsedTime * 6.5 + index * 0.73) * 0.58;
      rootObject.position.set(point.x, 0.18 + Math.abs(stride) * 0.05, point.z);
      rootObject.rotation.set(0, Math.atan2(tangent.x, tangent.z), 0);
      rootObject.scale.setScalar(student.scale);
      rootObject.updateMatrix();
      setPart(headRef.current, index, [0, 3.62, 0], [0.43, 0.43, 0.43]);
      setPart(torsoRef.current, index, [0, 2.55, 0], [0.82, 1.45, 0.64]);
      setPart(leftLegRef.current, index, [-0.23, 1.18, 0], [0.26, 1.45, 0.34], stride);
      setPart(rightLegRef.current, index, [0.23, 1.18, 0], [0.26, 1.45, 0.34], -stride);
      setPart(leftArmRef.current, index, [-0.58, 2.65, 0], [0.18, 1.2, 0.2], -stride * 0.72);
      setPart(rightArmRef.current, index, [0.58, 2.65, 0], [0.18, 1.2, 0.2], stride * 0.72);
    });
    [
      headRef,
      torsoRef,
      leftLegRef,
      rightLegRef,
      leftArmRef,
      rightArmRef,
    ].forEach((ref) => {
      ref.current.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group>
      <instancedMesh ref={headRef} args={[null, null, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color="#cf916c" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={torsoRef} args={[null, null, count]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#5793b6" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={leftLegRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#748591" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rightLegRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#748591" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={leftArmRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#5793b6" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rightArmRef} args={[null, null, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#5793b6" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function FlyingBird({ center, radius, altitude, speed, offset, color }) {
  const birdRef = useRef();
  const leftWingRef = useRef();
  const rightWingRef = useRef();
  useFrame(({ clock }) => {
    if (!birdRef.current) return;
    const angle = clock.elapsedTime * speed + offset;
    birdRef.current.position.set(
      center[0] + Math.cos(angle) * radius,
      altitude + Math.sin(angle * 1.7) * 4,
      center[1] + Math.sin(angle) * radius * 0.62,
    );
    birdRef.current.rotation.y = -angle;
    const flap = 0.18 + Math.sin(clock.elapsedTime * 8 + offset * 3) * 0.48;
    if (leftWingRef.current) leftWingRef.current.rotation.z = flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -flap;
  });
  return (
    <group ref={birdRef} scale={0.85}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.28, 1.2, 4, 7]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <group ref={leftWingRef} position={[-0.3, 0, 0]}>
        <mesh position={[-1.25, 0, 0]} rotation={[0, 0.15, -0.18]}>
          <boxGeometry args={[2.5, 0.08, 0.72]} />
          <meshStandardMaterial color={color} roughness={0.82} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.3, 0, 0]}>
        <mesh position={[1.25, 0, 0]} rotation={[0, -0.15, 0.18]}>
          <boxGeometry args={[2.5, 0.08, 0.72]} />
          <meshStandardMaterial color={color} roughness={0.82} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function FlyingBirds() {
  const birds = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        center: [
          -150 + (index % 5) * 78,
          -75 + ((index * 53) % 170),
        ],
        radius: 24 + (index % 4) * 8,
        altitude: 74 + (index % 5) * 10,
        speed: 0.12 + (index % 4) * 0.018,
        offset: index * 0.72,
        color: index % 3 === 0 ? "#303a40" : "#46545a",
      })),
    [],
  );
  return (
    <group>
      {birds.map((bird, index) => (
        <FlyingBird key={`bird-${index}`} {...bird} />
      ))}
    </group>
  );
}

function Aircraft({ altitude, z, speed, offset, direction = 1, color }) {
  const aircraftRef = useRef();
  useFrame(({ clock }) => {
    if (!aircraftRef.current) return;
    const distance = ((clock.elapsedTime * speed + offset) % 960) - 480;
    aircraftRef.current.position.set(distance * direction, altitude, z);
    aircraftRef.current.rotation.y = direction > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={aircraftRef} scale={1.15}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[1.25, 15, 7, 12]} />
        <meshStandardMaterial color={color} metalness={0.32} roughness={0.36} />
      </mesh>
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[5.5, 0.42, 21]} />
        <meshStandardMaterial color="#e4e7e5" metalness={0.3} roughness={0.38} />
      </mesh>
      <mesh position={[-7.3, 2.1, 0]}>
        <boxGeometry args={[4.2, 4.5, 0.45]} />
        <meshStandardMaterial color={color} metalness={0.28} roughness={0.4} />
      </mesh>
      <mesh position={[-6.5, 0.5, 0]}>
        <boxGeometry args={[3.2, 0.28, 8]} />
        <meshStandardMaterial color="#d7dcdb" metalness={0.25} roughness={0.42} />
      </mesh>
      <BoxInstances
        items={Array.from({ length: 8 }, (_, index) => ({
          position: [-3 + index * 1.2, 0.35, 1.23],
          scale: [0.42, 0.28, 0.12],
        }))}
        color="#284b63"
        emissive="#82c8e6"
        emissiveIntensity={0.35}
      />
      <Line points={[[-9, 0, -2.5], [-42, 0, -2.5]]} color="#f1f4f3" lineWidth={1.1} transparent opacity={0.38} />
      <Line points={[[-9, 0, 2.5], [-42, 0, 2.5]]} color="#f1f4f3" lineWidth={1.1} transparent opacity={0.38} />
    </group>
  );
}

function SkyTraffic() {
  return (
    <group>
      <FlyingBirds />
      <Aircraft altitude={166} z={-145} speed={8.5} offset={90} direction={1} color="#f0f2ef" />
      <Aircraft altitude={218} z={105} speed={6.4} offset={520} direction={-1} color="#d8e2e5" />
    </group>
  );
}

function EnergyFlow({ points, color, speed = 0.16, active = true }) {
  const markerRef = useRef();
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  );
  const progress = useRef(Math.random());

  useFrame((_, delta) => {
    if (!markerRef.current || !active) return;
    progress.current = (progress.current + delta * speed) % 1;
    markerRef.current.position.copy(curve.getPointAt(progress.current));
  });

  if (!active) return null;
  return (
    <group>
      <Line points={curve.getPoints(48)} color={color} lineWidth={2} transparent opacity={0.62} />
      <mesh ref={markerRef}>
        <sphereGeometry args={[1.15, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

const CAMPUS_POWER_TRUNKS = [
  {
    id: "central-feeder",
    points: [[-220, 1.35, 112], [-220, 1.35, 10], [40, 1.35, 10], [40, 1.35, 140], [40, 1.35, 246]],
  },
  {
    id: "west-feeder",
    points: [[-220, 1.35, 10], [-405, 1.35, 10], [-405, 1.35, -420]],
  },
  {
    id: "east-south-feeder",
    points: [[40, 1.35, 10], [188, 1.35, 10], [188, 1.35, -86], [178, 1.35, -170], [-25, 1.35, -170], [-25, 1.35, -420], [-405, 1.35, -420]],
  },
];

const CAMPUS_POWER_SPURS = [
  { id: "main", points: [[40, 1.28, 140], [19, 1.28, 108]] },
  { id: "lab", points: [[40, 1.28, 140], [92, 1.28, 140], [101, 1.28, 146]] },
  { id: "architecture", points: [[92, 1.28, 140], [92, 1.28, 105], [129, 1.28, 105]] },
  { id: "underbelly", points: [[40, 1.28, 72], [79, 1.28, 72], [99, 1.28, 46]] },
  { id: "girls-two", points: [[-220, 1.28, 10], [-180, 1.28, -31]] },
  { id: "girls-one", points: [[-25, 1.28, -170], [-40, 1.28, -123]] },
  { id: "chancellor", points: [[40, 1.28, 10], [40, 1.28, -80], [54, 1.28, -87]] },
  { id: "boys-one", points: [[-405, 1.28, -125], [-520, 1.28, -99]] },
  { id: "boys-precinct", points: [[-405, 1.28, -270], [-520, 1.28, -248]] },
  { id: "boys-mess", points: [[-405, 1.28, -270], [-450, 1.28, -259]] },
  { id: "modern-hostel", points: [[-405, 1.28, -370], [-520, 1.28, -359]] },
  { id: "block-two", points: [[-25, 1.28, -420], [-130, 1.28, -383]] },
  { id: "special-block", points: [[-405, 1.28, -420], [-340, 1.28, -428]] },
  { id: "hall", points: [[188, 1.28, -43], [201, 1.28, -43]] },
  { id: "gate-two", points: [[188, 1.28, -86], [260, 1.28, -86], [260, 1.28, -143], [294, 1.28, -143]] },
];

function EnergyNetwork({ energy, proposalVisible, flowVisible, hazard }) {
  const failureActive = hazard?.phase === "fault" || hazard?.phase === "tripped";
  const networkActive = flowVisible && !failureActive;
  const storageColor = energy.batteryFlow >= 0 ? "#ffb34d" : "#ff7d7d";
  const gridColor = energy.grid >= 0 ? "#eb74d2" : "#55e9e1";
  return (
    <group>
      {proposalVisible && (
        <>
          <EnergyFlow
            points={[[-115, 1.2, 112], [-145, 1.2, 112], [-175, 1.2, 112]]}
            color="#55e9e1"
            speed={0.2 + energy.solar / 35}
            active={networkActive && energy.solar > 0.05}
          />
          <EnergyFlow
            points={[[-175, 1.2, 180], [-175, 1.2, 146], [-175, 1.2, 112]]}
            color="#62f598"
            speed={0.18 + energy.wind / 28}
            active={networkActive && energy.wind > 0.05}
          />
          <EnergyFlow
            points={[[-175, 1.2, 112], [-198, 1.2, 112], [-220, 1.2, 112]]}
            color={storageColor}
            speed={0.22}
            active={networkActive}
          />
        </>
      )}
      <EnergyFlow
        points={[[-245, 1.5, 112], [-232, 1.5, 112], [-220, 1.5, 112]]}
        color={gridColor}
        speed={0.24}
        active={networkActive}
      />
      {CAMPUS_POWER_TRUNKS.map((branch, index) => (
        <EnergyFlow
          key={branch.id}
          points={branch.points}
          color={index === 0 ? "#79e7ff" : "#5bcff5"}
          speed={0.17 + index * 0.012}
          active={networkActive}
        />
      ))}
      {networkActive && CAMPUS_POWER_SPURS.map((branch) => (
        <Line
          key={branch.id}
          points={branch.points}
          color="#74cde8"
          lineWidth={1.05}
          transparent
          opacity={0.38}
        />
      ))}
    </group>
  );
}

function CloudLayer({ cover, storm }) {
  const cloudLayerRef = useRef();
  const clouds = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        x: -330 + ((index * 109) % 660),
        y: 275 + ((index * 17) % 58),
        z: -220 + ((index * 73) % 440),
        scale: 0.7 + ((index * 19) % 10) / 12,
      })),
    [],
  );
  const cloudCount = Math.ceil((cover / 100) * clouds.length);
  const cloudPuffs = useMemo(() => {
    const items = [];
    clouds.slice(0, cloudCount).forEach((cloud) => {
      [
        [-4.2, 0, 0, 5.5],
        [0, 1.5, 0, 6.4],
        [4.4, 0.15, 0.2, 5.7],
        [0.8, -0.2, 3.3, 4.9],
      ].forEach(([x, y, z, size]) => {
        items.push({
          position: [
            cloud.x + x * cloud.scale * 1.4,
            cloud.y + y * cloud.scale,
            cloud.z + z * cloud.scale,
          ],
          scale: [
            size * cloud.scale * 2.05,
            size * cloud.scale * 0.66,
            size * cloud.scale * 1.15,
          ],
        });
      });
    });
    return items;
  }, [cloudCount, clouds]);
  useFrame(({ clock }) => {
    if (!cloudLayerRef.current) return;
    cloudLayerRef.current.position.x = Math.sin(clock.elapsedTime * 0.018) * 46;
    cloudLayerRef.current.position.z = Math.cos(clock.elapsedTime * 0.012) * 18;
  });
  return (
    <group ref={cloudLayerRef}>
      <SphereInstances
        items={cloudPuffs}
        color={storm ? "#39424d" : "#d4dce1"}
        opacity={0.38 + cover / 450}
      />
    </group>
  );
}

function Rain({ intensity, storm }) {
  const rainRef = useRef();
  const dropCount = Math.min(1800, Math.floor(320 + intensity * 105));
  const positions = useMemo(() => {
    const array = new Float32Array(dropCount * 3);
    for (let index = 0; index < dropCount; index += 1) {
      array[index * 3] = (Math.random() - 0.5) * 390;
      array[index * 3 + 1] = Math.random() * 100;
      array[index * 3 + 2] = (Math.random() - 0.5) * 290;
    }
    return array;
  }, [dropCount]);

  useFrame((_, delta) => {
    if (!rainRef.current) return;
    const attribute = rainRef.current.geometry.attributes.position;
    for (let index = 0; index < attribute.count; index += 1) {
      attribute.array[index * 3 + 1] -= delta * (storm ? 72 : 48);
      attribute.array[index * 3] += delta * (storm ? 7 : 2.5);
      if (attribute.array[index * 3 + 1] < 0) attribute.array[index * 3 + 1] = 100;
    }
    attribute.needsUpdate = true;
  });

  if (intensity <= 0.05) return null;
  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#9edcff" size={0.45} transparent opacity={0.72} />
    </points>
  );
}

function LightningEffect({ active }) {
  const lightningRef = useRef();
  const flashLightRef = useRef();
  const impactLightRef = useRef();
  const shapeGroupRefs = useRef([]);
  const nextStrike = useRef(0.8);
  const strikeStart = useRef(-10);
  const strikeIndex = useRef(0);
  const boltShapes = useMemo(
    () => [
      {
        main: [[0, 248, 0], [-8, 213, 3], [5, 179, -4], [-11, 141, 2], [4, 105, -5], [-7, 68, 3], [0, 29, 0], [0, 2, 0]],
        branches: [
          [[5, 179, -4], [25, 158, -8], [37, 136, -12], [53, 119, -14]],
          [[-11, 141, 2], [-33, 121, 9], [-42, 96, 13]],
          [[4, 105, -5], [22, 90, -11], [31, 72, -16]],
        ],
      },
      {
        main: [[0, 248, 0], [10, 220, -4], [-3, 187, 5], [13, 151, -5], [1, 119, 4], [14, 82, -3], [5, 48, 2], [0, 2, 0]],
        branches: [
          [[-3, 187, 5], [-25, 166, 10], [-39, 142, 13]],
          [[13, 151, -5], [34, 132, -9], [49, 105, -13]],
          [[14, 82, -3], [35, 69, -8], [44, 49, -12]],
        ],
      },
      {
        main: [[0, 248, 0], [-5, 224, 5], [11, 191, -2], [-7, 162, 7], [8, 128, -4], [-12, 93, 4], [4, 57, -2], [0, 2, 0]],
        branches: [
          [[11, 191, -2], [30, 176, -8], [47, 153, -11]],
          [[-7, 162, 7], [-27, 145, 13], [-45, 118, 17]],
          [[-12, 93, 4], [-32, 76, 9], [-39, 56, 12]],
        ],
      },
    ],
    [],
  );

  useFrame(({ clock }) => {
    if (!lightningRef.current || !flashLightRef.current || !impactLightRef.current) return;
    const elapsed = clock.elapsedTime;
    if (!active) {
      lightningRef.current.visible = false;
      flashLightRef.current.intensity = 0;
      impactLightRef.current.intensity = 0;
      nextStrike.current = elapsed + 0.8;
      return;
    }
    if (elapsed >= nextStrike.current) {
      strikeStart.current = elapsed;
      strikeIndex.current = (strikeIndex.current + 1) % boltShapes.length;
      shapeGroupRefs.current.forEach((group, index) => {
        if (group) group.visible = index === strikeIndex.current;
      });
      lightningRef.current.position.set(
        -175 + Math.random() * 350,
        0,
        -150 + Math.random() * 285,
      );
      lightningRef.current.rotation.y = -0.35 + Math.random() * 0.7;
      nextStrike.current = elapsed + 2.2 + Math.random() * 4.8;
    }
    const age = elapsed - strikeStart.current;
    let strength = 0;
    if (age >= 0 && age < 0.075) strength = 1;
    else if (age < 0.13) strength = 0.12;
    else if (age < 0.21) strength = 0.72;
    else if (age < 0.29) strength = 0.18;
    else if (age < 0.36) strength = 0.48;
    lightningRef.current.visible = strength > 0.2;
    flashLightRef.current.intensity = strength * 4400;
    impactLightRef.current.intensity = strength * 1250;
  });

  return (
    <group ref={lightningRef} visible={false}>
      <pointLight
        ref={flashLightRef}
        position={[0, 138, 0]}
        color="#dceaff"
        intensity={0}
        distance={720}
        decay={1.45}
      />
      <pointLight
        ref={impactLightRef}
        position={[0, 4, 0]}
        color="#c8e5ff"
        intensity={0}
        distance={180}
        decay={1.7}
      />
      {boltShapes.map((shape, index) => (
        <group
          key={`bolt-shape-${index}`}
          ref={(node) => {
            shapeGroupRefs.current[index] = node;
          }}
          visible={index === 0}
        >
          <Line
            points={shape.main}
            color="#d8e8ff"
            lineWidth={7}
            transparent
            opacity={0.22}
          />
          <Line points={shape.main} color="#ffffff" lineWidth={2.8} />
          {shape.branches.map((branch, branchIndex) => (
            <group key={`branch-${branchIndex}`}>
              <Line
                points={branch}
                color="#c6ddff"
                lineWidth={4}
                transparent
                opacity={0.2}
              />
              <Line points={branch} color="#eef6ff" lineWidth={1.35} />
            </group>
          ))}
        </group>
      ))}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[3.2, 12, 8]} />
        <meshBasicMaterial color="#e9f5ff" transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function WeatherAtmosphere({ weather }) {
  const isNight = !weather.isDay;
  const storm = weather.weatherCode >= 80 || weather.precipitation > 8;
  const thunderstorm = weather.weatherCode >= 95;
  const sunStrength = Math.max(0.08, (weather.radiation || 0) / 700);
  return (
    <>
      <color attach="background" args={[isNight ? "#020915" : storm ? "#4a5662" : "#83b9df"]} />
      <fog
        attach="fog"
        args={[
          isNight ? "#07101c" : storm ? "#65717b" : "#9bc3d7",
          isNight ? 390 : storm ? 330 : 480,
          isNight ? 980 : storm ? 820 : 1250,
        ]}
      />
      {!isNight && (
        <Sky
          distance={450000}
          sunPosition={[95, 82, -80]}
          inclination={0.49}
          azimuth={0.25}
          turbidity={storm ? 14 : 7}
          rayleigh={storm ? 0.8 : 2.2}
        />
      )}
      <ambientLight intensity={isNight ? 0.36 : 0.62 - weather.cloudCover / 280} color={isNight ? "#8fa8d8" : "#d7e5e7"} />
      <hemisphereLight
        args={[isNight ? "#163460" : "#c8e7fa", "#5b543d", isNight ? 0.28 : 0.8]}
      />
      <directionalLight
        position={[110, 135, -85]}
        intensity={isNight ? 0.12 : Math.max(0.35, sunStrength * (1 - weather.cloudCover / 150))}
        color={isNight ? "#87a8da" : "#fff0cb"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-390}
        shadow-camera-right={390}
        shadow-camera-top={320}
        shadow-camera-bottom={-320}
        shadow-camera-far={820}
      />
      <CloudLayer cover={weather.cloudCover} storm={storm} />
      <Rain intensity={weather.precipitation || weather.rain || 0} storm={storm} />
      <LightningEffect active={thunderstorm} />
      {storm && (
        <pointLight position={[45, 92, -65]} intensity={1.4} color="#d8e7ff" distance={190} />
      )}
    </>
  );
}

function DrainageWater() {
  const flowRef = useRef();

  useFrame(({ clock }) => {
    if (!flowRef.current) return;
    flowRef.current.children.forEach((ripple, index) => {
      ripple.position.x = -89 + ((clock.elapsedTime * 4.2 + index * 9.1) % 178);
    });
  });

  const ripples = useMemo(
    () =>
      Array.from({ length: 20 }, (_, index) => ({
        z: -4.25 + ((index * 1.63) % 8.5),
        width: 1.7 + (index % 4) * 0.65,
        rotation: -0.16 + (index % 3) * 0.16,
      })),
    [],
  );

  return (
    <group>
      <mesh position={[0, 0.34, 0]} receiveShadow>
        <boxGeometry args={[184, 0.12, 11.5]} />
        <meshStandardMaterial
          color="#557e73"
          emissive="#173d39"
          emissiveIntensity={0.18}
          roughness={0.24}
          metalness={0.08}
          transparent
          opacity={0.9}
        />
      </mesh>
      <group ref={flowRef}>
        {ripples.map((ripple, index) => (
          <mesh
            key={`drainage-ripple-${index}`}
            position={[-89 + index * 9.1, 0.43, ripple.z]}
            rotation={[0, ripple.rotation, 0]}
          >
            <boxGeometry args={[ripple.width, 0.025, 0.14]} />
            <meshBasicMaterial
              color="#d1eee7"
              transparent
              opacity={0.56}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ChancellorDrainage() {
  const stoneBankA = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        position: [-94 + index * 4, 0.74 + (index % 3) * 0.05, -8.4],
        rotation: [0.1, (index % 2 ? 0.04 : -0.05), 0],
        scale: [3.7, 0.82, 5.4],
      })),
    [],
  );
  const stoneBankB = useMemo(
    () =>
      Array.from({ length: 48 }, (_, index) => ({
        position: [-94 + index * 4, 0.74 + ((index + 1) % 3) * 0.05, 8.4],
        rotation: [-0.1, (index % 2 ? -0.05 : 0.04), 0],
        scale: [3.7, 0.82, 5.4],
      })),
    [],
  );
  const bridgePosts = useMemo(
    () =>
      [-4.4, 4.4].flatMap((x) =>
        [-10.6, -5.3, 0, 5.3, 10.6].map((z) => ({
          position: [x, 2.25, z],
          scale: [0.15, 2.15, 0.15],
        })),
      ),
    [],
  );
  const bridgeRails = useMemo(
    () =>
      [-4.4, 4.4].flatMap((x) =>
        [1.45, 2.75].map((y) => ({
          position: [x, y, 0],
          rotation: [Math.PI / 2, 0, 0],
          scale: [0.15, 11.25, 0.15],
        })),
      ),
    [],
  );
  const shrubs = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        return {
          position: [-88 + index * 6.05, 1.22, side * (12.5 + (index % 3) * 0.7)],
          scale: [1.25 + (index % 3) * 0.16, 1.1, 1.25 + (index % 2) * 0.2],
        };
      }),
    [],
  );

  return (
    <group position={[62, 0.08, -75]}>
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[196, 0.24, 25]} />
        <meshStandardMaterial color="#524f42" roughness={1} />
      </mesh>
      <mesh position={[0, 0.23, 0]} receiveShadow>
        <boxGeometry args={[190, 0.2, 15.4]} />
        <meshStandardMaterial color="#373c35" roughness={0.98} />
      </mesh>
      <DrainageWater />
      <BoxInstances items={stoneBankA} color="#77746a" roughness={1} receiveShadow />
      <BoxInstances items={stoneBankB} color="#68675f" roughness={1} receiveShadow />
      <BoxInstances
        items={[
          { position: [0, 0.92, 0], scale: [10.2, 0.68, 25] },
          { position: [-57, 0.48, -51.5], scale: [9.4, 0.32, 78] },
          { position: [-28.5, 0.48, -15], scale: [57, 0.32, 9.4] },
          { position: [0, 0.48, 18], rotation: [0.04, 0, 0], scale: [10.2, 0.3, 12] },
          { position: [0, 1.22, -10], scale: [11, 1.85, 1.8] },
          { position: [0, 1.22, 10], scale: [11, 1.85, 1.8] },
        ]}
        color="#8c8980"
        roughness={0.92}
        castShadow
        receiveShadow
      />
      <CylinderInstances
        items={bridgePosts}
        color="#ad4a3e"
        radialSegments={10}
        roughness={0.58}
        castShadow
      />
      <CylinderInstances
        items={bridgeRails}
        color="#ad4a3e"
        radialSegments={10}
        roughness={0.58}
        castShadow
      />
      <IcoInstances items={shrubs} color="#2f5c32" castShadow />
    </group>
  );
}

function ChancellorResidence() {
  const site = useMemo(
    () => [
      { position: [0, 0.08, 0], scale: [86, 0.16, 62] },
      { position: [0, 0.1, 14], scale: [72, 0.18, 20] },
    ],
    [],
  );
  const podium = useMemo(
    () => [
      { position: [0, 1.8, -1], scale: [48, 3.6, 32] },
      { position: [0, 2.6, 15.2], scale: [30, 1.6, 10] },
    ],
    [],
  );
  const volumeA = useMemo(
    () => [
      { position: [0, 13.6, -2.2], scale: [36, 24.8, 20.4] },
      { position: [0, 26.8, -2.2], scale: [28, 6.8, 16.2] },
      { position: [0, 31.2, -2.2], scale: [22, 2.2, 12.2] },
    ],
    [],
  );
  const volumeB = useMemo(
    () => [
      { position: [0, 16.6, 16.8], scale: [7.2, 30.6, 11.6] },
      { position: [0, 30.2, 16.8], scale: [5.8, 7.4, 9.6] },
      { position: [0, 35.2, 16.8], scale: [4.8, 2.2, 7.8] },
    ],
    [],
  );
  const volumeC = useMemo(
    () => [
      { position: [18.8, 16.8, 8.6], scale: [17.4, 20.8, 13.2] },
      { position: [18.8, 25.6, 8.6], scale: [15.2, 8.8, 11.2] },
      { position: [18.8, 30.2, 8.6], scale: [13.2, 2.2, 9.2] },
    ],
    [],
  );
  const volumeD = useMemo(
    () => [
      { position: [24.2, 13.4, -21.8], scale: [28.8, 24.4, 24.8] },
      { position: [24.2, 24.6, -21.8], scale: [24.4, 6.2, 20.8] },
      { position: [24.2, 28.8, -21.8], scale: [20.4, 2.2, 16.8] },
    ],
    [],
  );
  const volumeE = useMemo(
    () => [
      { position: [-24.2, 10.4, -21.8], scale: [24.8, 19.2, 24.8] },
      { position: [-24.2, 20.6, -21.8], scale: [20.4, 4.8, 20.8] },
      { position: [-24.2, 24.4, -21.8], scale: [16.8, 2.2, 16.8] },
    ],
    [],
  );
  const volumeF = useMemo(
    () => [
      { position: [0, 31.4, -4.4], scale: [12.6, 8.2, 8.8] },
      { position: [0, 36.2, -4.4], scale: [8.8, 2.8, 6.4] },
    ],
    [],
  );
  const balconySlabs = useMemo(
    () => [
      { position: [-10.8, 17.8, 14.6], scale: [13.6, 0.48, 4.8] },
      { position: [10.8, 17.8, 14.6], scale: [13.6, 0.48, 4.8] },
      { position: [24.2, 17.8, -20.8], scale: [14.8, 0.48, 5.2] },
      { position: [24.2, 17.8, -22.8], scale: [14.8, 0.48, 5.2] },
    ],
    [],
  );
  const recessedBalconies = useMemo(
    () => [
      { position: [0, 14.8, 14.2], scale: [24.4, 4.8, 1.8] },
      { position: [24.2, 14.8, -21.8], scale: [20.8, 4.6, 1.8] },
    ],
    [],
  );
  const balconyRailings = useMemo(
    () => [
      { position: [-10.8, 17.2, 16.8], scale: [13.6, 0.16, 0.16] },
      { position: [10.8, 17.2, 16.8], scale: [13.6, 0.16, 0.16] },
      { position: [24.2, 17.2, -18.6], scale: [14.8, 0.16, 0.16] },
      { position: [24.2, 17.2, -24.8], scale: [14.8, 0.16, 0.16] },
    ],
    [],
  );
  const grooveLines = useMemo(
    () => [
      { position: [0, 15.4, 14.2], scale: [24.2, 0.16, 0.7] },
      { position: [0, 20.8, 14.2], scale: [24.2, 0.16, 0.7] },
      { position: [0, 25.8, 14.2], scale: [24.2, 0.16, 0.7] },
      { position: [18.8, 13.8, 8.6], scale: [15.2, 0.16, 0.7] },
      { position: [20.6, 13.8, -18.8], scale: [18.8, 0.16, 0.7] },
      { position: [-20.4, 12.8, -16.4], scale: [14.8, 0.16, 0.7] },
      { position: [0, 15.4, -2.2], scale: [36, 0.16, 0.7] },
      { position: [0, 20.8, -2.2], scale: [36, 0.16, 0.7] },
      { position: [0, 28.2, -2.2], scale: [28, 0.16, 0.7] },
      { position: [0, 15.6, 15.8], scale: [8.4, 0.16, 0.7] },
    ],
    [],
  );
  const fins = useMemo(
    () => [
      { position: [-13.8, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [-8.2, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [-2.6, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [3, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [8.6, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [13.8, 13.4, 13.4], scale: [0.24, 18.6, 0.5] },
      { position: [18.8, 16.2, 5.8], scale: [0.24, 12.4, 0.5] },
      { position: [23.2, 16.2, 5.8], scale: [0.24, 12.4, 0.5] },
    ],
    [],
  );
  const finsSecondary = useMemo(
    () => [
      { position: [0, 13.8, 11.2], scale: [0.24, 18.4, 0.6] },
      { position: [0, 13.8, 8.8], scale: [0.24, 18.4, 0.6] },
      { position: [0, 13.8, 6.2], scale: [0.24, 18.4, 0.6] },
    ],
    [],
  );
  const glazing = useMemo(
    () => [
      { position: [0, 15.2, 14.8], scale: [24.4, 11.8, 0.18] },
      { position: [0, 23.2, 14.8], scale: [24.4, 5.8, 0.18] },
      { position: [18.8, 17.6, 8.6], scale: [14.8, 11.8, 0.18] },
      { position: [18.8, 15.2, 8.6], scale: [0.18, 14.2, 11.2] },
      { position: [24.2, 15.2, -21.8], scale: [20.8, 11.8, 0.18] },
      { position: [24.2, 17.4, -21.8], scale: [0.18, 9.8, 14.8] },
      { position: [-24.2, 15.4, -21.8], scale: [20.8, 11.4, 0.18] },
      { position: [0, 19.2, -20.8], scale: [20.2, 8.2, 0.18] },
      { position: [16.8, 16.8, 10.6], scale: [2.8, 22.8, 6.8] },
    ],
    [],
  );
  const windowBands = useMemo(
    () => [
      { position: [0, 10.8, 14.8], scale: [14.4, 8.8, 0.14] },
      { position: [0, 20.4, 14.8], scale: [14.4, 6.8, 0.14] },
      { position: [18.8, 11.4, 8.6], scale: [8.2, 9.8, 0.14] },
      { position: [18.8, 21.8, 8.6], scale: [8.2, 6.6, 0.14] },
      { position: [24.2, 11.8, -21.8], scale: [10.8, 9.2, 0.14] },
      { position: [24.2, 22.2, -21.8], scale: [10.8, 6.6, 0.14] },
    ],
    [],
  );
  const stairCore = useMemo(
    () => [
      { position: [0, 12.2, 15.8], scale: [7.8, 25.2, 10.8] },
      { position: [0, 28.2, 15.8], scale: [6.4, 2.2, 8.8] },
      { position: [0, 17.8, 15.8], scale: [4.6, 0.24, 8.8] },
    ],
    [],
  );
  const stairWindows = useMemo(
    () => [
      { position: [0, 18.8, 15.8], scale: [4.8, 4.8, 0.18] },
      { position: [0, 24.2, 15.8], scale: [4.8, 4.2, 0.18] },
      { position: [0, 29.8, 15.8], scale: [4.8, 3.1, 0.18] },
    ],
    [],
  );
  const roofSlabs = useMemo(
    () => [
      { position: [0, 30.8, -2.2], scale: [34.8, 0.24, 20.2] },
      { position: [0, 31.8, 15.8], scale: [11.8, 0.24, 11.2] },
      { position: [18.8, 31.8, 8.6], scale: [15.4, 0.24, 12.8] },
      { position: [24.2, 31.8, -21.8], scale: [20.8, 0.24, 18.8] },
      { position: [-24.2, 28.8, -21.8], scale: [18.8, 0.24, 18.8] },
      { position: [0, 37.8, -4.4], scale: [10.2, 0.24, 7.6] },
    ],
    [],
  );
  const roofOverhangs = useMemo(
    () => [
      { position: [-18.4, 31.4, -2.2], scale: [4.2, 0.26, 16.6] },
      { position: [18.4, 31.4, -2.2], scale: [4.2, 0.26, 16.6] },
      { position: [0, 32.4, 15.8], scale: [8.4, 0.26, 8.8] },
      { position: [24.2, 32.4, -21.8], scale: [6.8, 0.26, 10.8] },
    ],
    [],
  );
  const roofService = useMemo(
    () => [
      { position: [0, 36.6, -4.4], scale: [8.2, 4.8, 5.2] },
      { position: [16.8, 36.4, 10.4], scale: [6.8, 3.8, 4.2] },
      { position: [24.2, 35.6, -22.2], scale: [8.6, 3.2, 4.6] },
    ],
    [],
  );
  const parapets = useMemo(
    () => [
      { position: [0, 30.4, -2.2], scale: [46.8, 0.8, 0.4] },
      { position: [0, 31.2, 15.8], scale: [14.8, 0.8, 0.4] },
      { position: [18.8, 31.2, 8.6], scale: [20.4, 0.8, 0.4] },
      { position: [24.2, 31.2, -21.8], scale: [28.8, 0.8, 0.4] },
      { position: [-24.2, 28.4, -21.8], scale: [24.8, 0.8, 0.4] },
    ],
    [],
  );
  const canopy = useMemo(
    () => [
      { position: [0, 6.6, 15.8], scale: [30.2, 0.56, 10.2] },
      { position: [0, 9.6, 15.8], scale: [22.2, 5.8, 0.92] },
      { position: [0, 5.0, 16.8], scale: [34.4, 0.26, 5.2] },
    ],
    [],
  );
  const canopyColumns = useMemo(
    () => [
      { position: [-12.2, 4.6, 15.8], scale: [0.34, 6.8, 0.34] },
      { position: [-4.8, 4.6, 15.8], scale: [0.34, 6.8, 0.34] },
      { position: [4.8, 4.6, 15.8], scale: [0.34, 6.8, 0.34] },
      { position: [12.2, 4.6, 15.8], scale: [0.34, 6.8, 0.34] },
    ],
    [],
  );
  const entryStairs = useMemo(
    () => [
      { position: [0, 1.8, 17.2], scale: [24.4, 0.36, 7.8] },
      { position: [0, 2.8, 20.0], scale: [20.4, 0.36, 4.8] },
      { position: [0, 4.0, 22.6], scale: [16.4, 0.36, 2.4] },
    ],
    [],
  );
  const gate = useMemo(
    () => [
      { position: [0, 2.6, 20.2], scale: [12.4, 5.2, 0.3] },
      { position: [-7.2, 2.6, 20.2], scale: [3.2, 5.2, 0.3] },
      { position: [7.2, 2.6, 20.2], scale: [3.2, 5.2, 0.3] },
      { position: [0, 5.8, 20.2], scale: [20.4, 0.34, 0.34] },
    ],
    [],
  );
  const driveway = useMemo(
    () => [
      { position: [0, 0.12, 20.8], scale: [36, 0.18, 10] },
      { position: [0, 0.12, 24.4], scale: [44, 0.16, 6] },
    ],
    [],
  );
  const boundary = useMemo(
    () => [
      { position: [0, 4.2, 30.4], scale: [74, 8.4, 0.8] },
      { position: [0, 4.2, -30.4], scale: [74, 8.4, 0.8] },
      { position: [37.2, 4.2, 0], scale: [0.8, 8.4, 60] },
      { position: [-37.2, 4.2, 0], scale: [0.8, 8.4, 60] },
    ],
    [],
  );
  const palms = useMemo(
    () => [
      { position: [-30, 4.8, 20], scale: [1.2, 9.6, 1.2] },
      { position: [32, 4.8, 18], scale: [1.2, 9.6, 1.2] },
      { position: [-28, 4.8, -22], scale: [1.2, 9.6, 1.2] },
      { position: [30, 4.8, -24], scale: [1.2, 9.6, 1.2] },
      { position: [0, 5.2, -26], scale: [1.5, 10.4, 1.5] },
      { position: [14, 4.6, 24], scale: [1.1, 9.2, 1.1] },
    ],
    [],
  );
  const foliage = useMemo(
    () => [
      { position: [-24, 8, 14], scale: [6, 6.8, 6] },
      { position: [26, 8, 12], scale: [6.4, 7.2, 6.4] },
      { position: [0, 8.4, -24], scale: [8.4, 8.8, 8.4] },
    ],
    [],
  );
  const trunks = useMemo(
    () => [
      { position: [-30, 3.8, 20], scale: [0.28, 7.6, 0.28] },
      { position: [32, 3.8, 18], scale: [0.28, 7.6, 0.28] },
      { position: [-28, 3.8, -22], scale: [0.28, 7.6, 0.28] },
      { position: [30, 3.8, -24], scale: [0.28, 7.6, 0.28] },
      { position: [0, 4.6, -26], scale: [0.28, 9, 0.28] },
      { position: [14, 3.8, 24], scale: [0.28, 7.4, 0.28] },
    ],
    [],
  );
  const offsetPanels = useMemo(
    () => [
      { position: [0, 15.4, 11.2], scale: [28.2, 12.8, 1.4] },
      { position: [24.2, 14.6, -20.8], scale: [2.6, 11.6, 17.2] },
      { position: [-24.2, 13.6, -20.8], scale: [2.6, 11.2, 17.2] },
    ],
    [],
  );
  const projectingFrames = useMemo(
    () => [
      { position: [0, 15.8, 13.4], scale: [28.2, 0.24, 0.24] },
      { position: [0, 20.8, 13.4], scale: [28.2, 0.24, 0.24] },
      { position: [-12.8, 18.6, -2.2], scale: [0.28, 12.6, 9.2] },
      { position: [12.8, 18.6, -2.2], scale: [0.28, 12.6, 9.2] },
    ],
    [],
  );
  const cornerFrame = useMemo(
    () => [
      { position: [16.8, 16.8, 11.2], scale: [3.4, 23.2, 2.2] },
      { position: [16.8, 27.2, 11.2], scale: [4.4, 0.32, 3.8] },
      { position: [16.8, 15.2, 11.2], scale: [4.4, 0.32, 3.8] },
    ],
    [],
  );
  const cornerGlass = useMemo(
    () => [{ position: [16.8, 16.8, 10.4], scale: [2.8, 20.4, 6.8] }],
    [],
  );

  return (
    <group rotation={[0, Math.PI, 0]}>
      <BoxInstances items={site} color="#6f876f" roughness={0.96} receiveShadow />
      <BoxInstances items={podium} color="#e8e4db" roughness={0.84} castShadow receiveShadow />
      <BoxInstances items={volumeA} color="#f7f4ee" roughness={0.78} castShadow receiveShadow />
      <BoxInstances items={volumeB} color="#f2ece4" roughness={0.8} castShadow />
      <BoxInstances items={volumeC} color="#f6f2eb" roughness={0.78} castShadow />
      <BoxInstances items={volumeD} color="#efe9e0" roughness={0.8} castShadow />
      <BoxInstances items={volumeE} color="#ede7de" roughness={0.82} castShadow />
      <BoxInstances items={volumeF} color="#e8e1d8" roughness={0.8} castShadow />
      <BoxInstances items={balconySlabs} color="#d9d0c1" roughness={0.76} castShadow />
      <BoxInstances items={recessedBalconies} color="#d8d1c3" roughness={0.82} castShadow />
      <BoxInstances items={balconyRailings} color="#dfe9f3" emissive="#7fa9c6" emissiveIntensity={0.08} metalness={0.88} roughness={0.16} />
      <BoxInstances items={grooveLines} color="#8c8d91" roughness={0.74} />
      <BoxInstances items={fins} color="#7c8792" roughness={0.68} castShadow />
      <BoxInstances items={finsSecondary} color="#7a838d" roughness={0.7} castShadow />
      <BoxInstances items={offsetPanels} color="#e7e0d4" roughness={0.82} castShadow />
      <BoxInstances items={projectingFrames} color="#1f2933" roughness={0.74} castShadow />
      <BoxInstances items={cornerGlass} color="#0b1422" emissive="#21344a" emissiveIntensity={0.24} metalness={0.9} roughness={0.12} />
      <BoxInstances items={cornerFrame} color="#1d242d" roughness={0.62} castShadow />
      <BoxInstances items={glazing} color="#0e1724" emissive="#21344a" emissiveIntensity={0.2} metalness={0.86} roughness={0.14} />
      <BoxInstances items={windowBands} color="#0a1119" emissive="#142333" emissiveIntensity={0.16} metalness={0.82} roughness={0.16} />
      <BoxInstances items={stairCore} color="#f9f6f0" roughness={0.76} castShadow />
      <BoxInstances items={stairWindows} color="#0b121b" emissive="#142233" emissiveIntensity={0.16} metalness={0.84} roughness={0.16} />
      <BoxInstances items={roofSlabs} color="#7b848f" roughness={0.72} castShadow />
      <BoxInstances items={roofOverhangs} color="#7a818a" roughness={0.7} castShadow />
      <BoxInstances items={roofService} color="#828c96" roughness={0.72} castShadow />
      <BoxInstances items={parapets} color="#7f878d" roughness={0.7} castShadow />
      <BoxInstances items={canopy} color="#d8d1c4" roughness={0.82} castShadow />
      <BoxInstances items={canopyColumns} color="#2d3136" roughness={0.58} castShadow />
      <BoxInstances items={entryStairs} color="#a49c8e" roughness={0.84} castShadow />
      <BoxInstances items={gate} color="#2d3136" roughness={0.5} castShadow />
      <BoxInstances items={driveway} color="#8d8470" roughness={0.92} receiveShadow />
      <BoxInstances items={boundary} color="#8d8c84" roughness={0.84} receiveShadow />
      <CylinderInstances items={trunks} color="#6f4c33" radialSegments={8} castShadow />
      <SphereInstances items={foliage} color="#4f7442" roughness={0.96} castShadow />
      <BoxInstances items={palms} color="#4d6b3c" roughness={0.96} receiveShadow />
      <mesh position={[0, 0.16, 16.8]} receiveShadow>
        <boxGeometry args={[28, 0.16, 2.8]} />
        <meshStandardMaterial color="#6f675d" roughness={0.9} />
      </mesh>
      <mesh position={[0, 15.8, 14.6]} castShadow>
        <boxGeometry args={[26, 8.6, 0.2]} />
        <meshStandardMaterial color="#ded8cb" roughness={0.76} />
      </mesh>
      <mesh position={[18.8, 16.8, 8.6]} castShadow>
        <boxGeometry args={[10.2, 10.8, 0.18]} />
        <meshStandardMaterial color="#d8d0c3" roughness={0.78} />
      </mesh>
      <mesh position={[24.2, 15.8, -21.8]} castShadow>
        <boxGeometry args={[12.2, 8.8, 0.2]} />
        <meshStandardMaterial color="#dbd2c2" roughness={0.76} />
      </mesh>
      <mesh position={[-24.2, 14.8, -21.8]} castShadow>
        <boxGeometry args={[8.2, 7.4, 0.2]} />
        <meshStandardMaterial color="#d8d2c3" roughness={0.78} />
      </mesh>
      <mesh position={[0, 31.6, -4.4]} castShadow>
        <boxGeometry args={[6.4, 2.4, 3.4]} />
        <meshStandardMaterial color="#8b9299" roughness={0.72} />
      </mesh>
    </group>
  );
}

function NightLights({ enabled }) {
  if (!enabled) return null;
  const lights = [
    [-63, 9, 78],
    [-94, 8, 45],
    [-31, 8, 46],
    [145, 5, 112],
    [15, 8, -58],
    [110, 7, -33],
    [114, 8, -97],
    [238, 9, -155],
    [177, 9, -38],
    [177, 7, -150],
    [150, 10, -235],
    [-235, 12, -73],
    [222, 9, -43],
    [40, 12, 246],
    [40, 8, 280],
    [-63, 4, 49],
    [-175, 4, 112],
    [-220, 4, 112],
    [-175, 8, 180],
    [129, 9, 96],
    [105, 7, 46],
  ];
  return (
    <group>
      {lights.map(([x, y, z], index) => (
        <pointLight
          key={`night-light-${index}`}
          position={[x, y, z]}
          color="#ffc267"
          intensity={18}
          distance={46}
          decay={2}
        />
      ))}
    </group>
  );
}

function CampusRoomLighting({ enabled, hazard }) {
  const roomLights = useMemo(() => {
    const rooms = [];
    const addFacade = ({
      x,
      z,
      length,
      floors,
      columns,
      axis = "x",
      yStart = 2.15,
      floorHeight = 3.25,
    }) => {
      const step = length / columns;
      for (let floor = 0; floor < floors; floor += 1) {
        for (let column = 0; column < columns; column += 1) {
          const offset = -length / 2 + step * (column + 0.5);
          rooms.push({
            position: axis === "x"
              ? [x + offset, yStart + floor * floorHeight, z]
              : [x, yStart + floor * floorHeight, z + offset],
            scale: axis === "x"
              ? [Math.min(2.05, step * 0.55), 1.28, 0.15]
              : [0.15, 1.28, Math.min(2.05, step * 0.55)],
          });
        }
      }
    };

    [
      { x: 19, z: 110.3, length: 112, floors: 6, columns: 24, floorHeight: 3.25 },
      { x: 19, z: 70.5, length: 82, floors: 5, columns: 18, floorHeight: 3.25 },
      { x: 100.7, z: 146, length: 58, floors: 3, columns: 14, axis: "z", yStart: 2, floorHeight: 4 },
      { x: 145.3, z: 146, length: 36, floors: 3, columns: 9, axis: "z", yStart: 2, floorHeight: 4 },
      { x: 129, z: 105.2, length: 44, floors: 3, columns: 14, yStart: 2, floorHeight: 4 },
      { x: 129, z: 86.8, length: 44, floors: 3, columns: 14, yStart: 2, floorHeight: 4 },
      { x: 100.2, z: 46, length: 31, floors: 2, columns: 8, axis: "z", yStart: 2.2, floorHeight: 3.4 },
      { x: -130, z: -382.4, length: 170, floors: 7, columns: 34, yStart: 4.2, floorHeight: 3.7 },
      { x: -130, z: -439.2, length: 108, floors: 7, columns: 23, yStart: 4.2, floorHeight: 3.7 },
      { x: 201.6, z: -43, length: 56, floors: 3, columns: 12, axis: "z", yStart: 2.4, floorHeight: 3.8 },
      { x: 242.4, z: -43, length: 56, floors: 3, columns: 12, axis: "z", yStart: 2.4, floorHeight: 3.8 },
      { x: -40, z: -123.7, length: 62, floors: 7, columns: 14, yStart: 1.62, floorHeight: 3.22 },
      { x: -40, z: -106.3, length: 62, floors: 7, columns: 14, yStart: 1.62, floorHeight: 3.22 },
      { x: 54, z: -133.1, length: 58, floors: 7, columns: 13, yStart: 3.1, floorHeight: 4.3 },
      { x: 54, z: -102.7, length: 48, floors: 6, columns: 11, yStart: 3.1, floorHeight: 4.3 },
      { x: -180, z: -30.8, length: 188, floors: 7, columns: 36, yStart: 2.15, floorHeight: 3.25 },
      { x: -180, z: -125.2, length: 188, floors: 7, columns: 36, yStart: 2.15, floorHeight: 3.25 },
      { x: -520, z: -99.5, length: 148, floors: 8, columns: 28, yStart: 2, floorHeight: 3.15 },
      { x: -520, z: -76.5, length: 148, floors: 8, columns: 28, yStart: 2, floorHeight: 3.15 },
      { x: -520, z: -248, length: 92, floors: 6, columns: 20, yStart: 2.15, floorHeight: 3.25 },
      { x: -520, z: -292, length: 92, floors: 6, columns: 20, yStart: 2.15, floorHeight: 3.25 },
      { x: -520, z: -358.8, length: 108, floors: 8, columns: 30, yStart: 1.8, floorHeight: 3.5 },
      { x: -520, z: -381.2, length: 108, floors: 8, columns: 30, yStart: 1.8, floorHeight: 3.5 },
      { x: -450, z: -258.8, length: 45, floors: 3, columns: 10, yStart: 2.2, floorHeight: 3.2 },
      { x: -450, z: -281.2, length: 45, floors: 3, columns: 10, yStart: 2.2, floorHeight: 3.2 },
    ].forEach(addFacade);

    for (let segment = 0; segment < 32; segment += 1) {
      const angle = (segment / 32) * Math.PI * 2;
      for (let floor = 0; floor < 3; floor += 1) {
        rooms.push({
          position: [
            -340 + Math.sin(angle) * 42.2,
            6.6 + floor * 6,
            -470 + Math.cos(angle) * 42.2,
          ],
          rotation: [0, angle, 0],
          scale: [3.8, 2.6, 0.16],
        });
      }
    }
    return rooms;
  }, []);

  const failed = hazard?.phase === "fault" || hazard?.phase === "tripped";
  if (!enabled || failed) return null;
  const warmRooms = roomLights.filter((_, index) => index % 5 !== 0);
  const coolRooms = roomLights.filter((_, index) => index % 5 === 0);
  return (
    <group>
      <BoxInstances
        items={warmRooms}
        color="#ffd98a"
        emissive="#ffbd57"
        emissiveIntensity={2.8}
        roughness={0.28}
      />
      <BoxInstances
        items={coolRooms}
        color="#d9efff"
        emissive="#8bcfff"
        emissiveIntensity={2.25}
        roughness={0.24}
      />
    </group>
  );
}

function HazardPowerCut({ phase }) {
  const { scene } = useThree();
  const savedState = useRef({ materials: new Map(), lights: new Map() });

  useEffect(() => {
    const saved = savedState.current;
    const restorePower = () => {
      saved.materials.forEach((intensity, material) => {
        material.emissiveIntensity = intensity;
        material.needsUpdate = true;
      });
      saved.lights.forEach((intensity, light) => {
        light.intensity = intensity;
      });
      saved.materials.clear();
      saved.lights.clear();
    };

    restorePower();
    const failed = phase === "fault" || phase === "tripped";
    if (!failed) return undefined;

    scene.traverse((object) => {
      if (object.isPointLight && !object.userData?.preserveDuringBlackout) {
        saved.lights.set(object, object.intensity);
        object.intensity = 0;
      }
      const materials = Array.isArray(object.material)
        ? object.material
        : object.material
          ? [object.material]
          : [];
      materials.forEach((material) => {
        if (!material.isMeshStandardMaterial || !material.emissiveIntensity) return;
        saved.materials.set(material, material.emissiveIntensity);
        material.emissiveIntensity = 0;
        material.needsUpdate = true;
      });
    });

    return restorePower;
  }, [phase, scene]);

  return null;
}

function CampusWorld({
  weather,
  energy,
  selected,
  onSelect,
  proposalVisible,
  flowVisible,
  planningProposals,
  hazard,
}) {
  const windSpeed = weather.windSpeed || 0;
  return (
    <>
      <WeatherAtmosphere weather={weather} />
      <CampusLandscape />
      <RoadNetwork />
      <ChancellorDrainage />
      <RoadTraffic />
      <StudentCrowds />
      <DenseStudentCrowd count={240} />
      <SkyTraffic />
      {VIT_ROOFTOP_VAWT_GROUPS.map((group) => (
        <RooftopTurbineArray
          key={group.id}
          position={group.position}
          width={group.width}
          depth={group.depth}
          count={group.count}
          rows={group.rows}
          scale={group.scale}
          windSpeed={windSpeed}
          accent="#55e6ba"
        />
      ))}
      <Selectable
        id="main"
        selected={selected === "main"}
        onSelect={onSelect}
        label="Academic Block 1"
        position={[26, 25, 89]}
      >
        <AcademicBlockOne proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="hostel"
        selected={selected === "hostel"}
        onSelect={onSelect}
        label="Girls Hostel Block-1"
        position={[-20, 24.5, -105]}
      >
        <group position={[-40, 0, -115]}>
          <HostelBuilding />
        </group>
      </Selectable>
      <Selectable
        id="chancellor"
        selected={selected === "chancellor"}
        onSelect={onSelect}
        label="Chancellor Residence"
        position={[72, 30, -118]}
      >
        <group position={[54, 0.1, -118]}>
          <ChancellorResidence />
        </group>
      </Selectable>
      <Selectable
        id="hostel2"
        selected={selected === "hostel2"}
        onSelect={onSelect}
        label="Girls Hostel Block-2"
        position={[-180, 28, -78]}
      >
        <group position={[-180, 0.25, -78]}>
          <GirlsHostelBlockTwo />
        </group>
      </Selectable>
      <Selectable
        id="boys"
        selected={selected === "boys"}
        onSelect={onSelect}
        label="Boys Hostel Block-1"
        position={[-520, 34, -88]}
      >
        <BoysHostelBlockOne />
      </Selectable>
      <Selectable
        id="hostels"
        selected={selected === "hostels"}
        onSelect={onSelect}
        label="Boys’ Hostel Blocks 2–5"
        position={[-520, 22, -270]}
      >
        <HostelPrecinct proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="modernHostel"
        selected={selected === "modernHostel"}
        onSelect={onSelect}
        label="Modern Boys Hostel 6"
        position={[-520, 25, -370]}
      >
        <group position={[-520, 0.2, -370]}>
          <ModernBoysHostel />
        </group>
      </Selectable>
      <Selectable
        id="racingGarden"
        selected={selected === "racingGarden"}
        onSelect={onSelect}
        label="Racing Garden & Athletic Track"
        position={[-520, 8, -180]}
      >
        <group position={[-520, 0, -180]}>
          <RacingGardenTrack />
        </group>
      </Selectable>
      <Selectable
        id="boysMess"
        selected={selected === "boysMess"}
        onSelect={onSelect}
        label="Boys’ Hostel Mess"
        position={[-450, 10, -270]}
      >
        <HostelMess
          variant="boys"
          position={[-450, 0.25, -270]}
          rotation={0}
          proposalVisible={proposalVisible}
        />
      </Selectable>
      <Selectable
        id="lab"
        selected={selected === "lab"}
        onSelect={onSelect}
        label="Lab Complex"
        position={[145, 16, 146]}
      >
        <LabComplex proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="architecture"
        selected={selected === "architecture"}
        onSelect={onSelect}
        label="Architecture Block"
        position={[129, 15, 96]}
      >
        <ArchitectureBlock proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="underbelly"
        selected={selected === "underbelly"}
        onSelect={onSelect}
        label="Underbelly • Café"
        position={[105, 15, 46]}
      >
        <UnderbellyCafe />
      </Selectable>
      <Selectable
        id="block2"
        selected={selected === "block2"}
        onSelect={onSelect}
        label="Academic Block 2"
        position={[-130, 38, -410]}
      >
        <AcademicBlockTwo proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="football"
        selected={selected === "football"}
        onSelect={onSelect}
        label="Academic Block 2 • Football Ground"
        position={[-130, 7, -350]}
      >
        <AcademicBlockFootballGround />
      </Selectable>
      <Selectable
        id="auditorium"
        selected={selected === "auditorium"}
        onSelect={onSelect}
        label="Special Block"
        position={[-340, 31, -448]}
      >
        <SpecialBlock />
      </Selectable>
      <Selectable
        id="hall"
        selected={selected === "hall"}
        onSelect={onSelect}
        label="Multipurpose Hall"
        position={[222, 23, -43]}
      >
        <MultipurposeHall proposalVisible={proposalVisible} />
      </Selectable>
      <Selectable
        id="gate2"
        selected={selected === "gate2"}
        onSelect={onSelect}
        label="VIT Bhopal • Gate No. 2"
        position={[294, 15, -143]}
      >
        <GateTwo />
      </Selectable>
      <Selectable
        id="gate"
        selected={selected === "gate"}
        onSelect={onSelect}
        label="VIT Bhopal Main Gate"
        position={[82, 31, 246]}
      >
        <MainGate />
      </Selectable>

      {proposalVisible && (
        <>
          <Selectable
            id="solar"
            selected={selected === "solar"}
            onSelect={onSelect}
            label="Solar field"
            position={[-115, 9, 112]}
            proposal
          >
            <SolarFarm />
          </Selectable>
          <Selectable
            id="wind"
            selected={selected === "wind"}
            onSelect={onSelect}
            label="Wind zone"
            position={[-175, 50, 180]}
            proposal
          >
            <group>
              <WindTurbine position={[-235, 0, 180]} speed={windSpeed} />
              <WindTurbine position={[-175, 0, 180]} speed={windSpeed} />
              <WindTurbine position={[-115, 0, 180]} speed={windSpeed} />
            </group>
          </Selectable>
          <Selectable
            id="battery"
            selected={selected === "battery"}
            onSelect={onSelect}
            label="Battery • 12 MWh"
            position={[-175, 10, 112]}
            proposal
          >
            <BatteryStorage />
          </Selectable>
        </>
      )}

      <Selectable
        id="grid"
        selected={selected === "grid"}
        onSelect={onSelect}
        label="33 kV grid"
        position={[-220, 15, 112]}
      >
        <Substation />
        <Pylon position={[-250, 0, 75]} />
        <Pylon position={[-220, 0, 75]} />
        <Pylon position={[-190, 0, 75]} />
        {[-250, -220].map((x) => (
          <group key={`wire-${x}`}>
            <Line
              points={[[x, 21, 72], [x + 30, 21, 72]]}
              color="#7f8589"
              lineWidth={0.65}
            />
            <Line
              points={[[x, 15, 75], [x + 30, 15, 75]]}
              color="#7f8589"
              lineWidth={0.65}
            />
            <Line
              points={[[x, 21, 78], [x + 30, 21, 78]]}
              color="#7f8589"
              lineWidth={0.65}
            />
          </group>
        ))}
      </Selectable>
      <EnergyNetwork
        energy={energy}
        proposalVisible={proposalVisible}
        flowVisible={flowVisible}
        hazard={hazard}
      />
      <ProposedCampusAssets proposals={planningProposals} variant="vit" />
      <HazardSceneEffect hazard={hazard} variant="vit" />
      <HazardPowerCut phase={hazard?.phase} />
      <CampusRoomLighting enabled={!weather.isDay} hazard={hazard} />
      <NightLights
        enabled={
          !weather.isDay && hazard?.phase !== "fault" && hazard?.phase !== "tripped"
        }
      />
    </>
  );
}

export function CampusScene({
  weather,
  energy,
  selected,
  onSelect,
  cameraPreset,
  cameraRevision,
  zoomAction,
  proposalVisible,
  flowVisible,
  planningProposals = [],
  hazard,
}) {
  const controlsRef = useRef();
  const transitionRef = useRef(true);
  const transitionGuardRef = useRef(0);
  return (
    <Canvas
      shadows="basic"
      dpr={[1, 1.35]}
      camera={{ position: CAMERA_PRESETS.overview.position, fov: 43, near: 0.1, far: 1400 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      performance={{ min: 0.55 }}
    >
      <AdaptiveDpr pixelated />
      <CameraRig
        preset={cameraPreset}
        revision={cameraRevision}
        zoomAction={zoomAction}
        controlsRef={controlsRef}
        transitionRef={transitionRef}
        transitionGuardRef={transitionGuardRef}
      />
      <CampusWorld
        weather={weather}
        energy={energy}
        selected={selected}
        onSelect={onSelect}
        proposalVisible={proposalVisible}
        flowVisible={flowVisible}
        planningProposals={planningProposals}
        hazard={hazard}
      />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={18}
        maxDistance={720}
        zoomSpeed={0.9}
        rotateSpeed={0.58}
        panSpeed={0.72}
        zoomToCursor
        screenSpacePanning
        onStart={() => {
          if (performance.now() > transitionGuardRef.current) {
            transitionRef.current = false;
          }
        }}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

export { BUILDINGS, CAMERA_PRESETS };
