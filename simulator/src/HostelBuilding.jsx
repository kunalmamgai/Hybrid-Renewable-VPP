import { useMemo } from "react";
import { BoxInstances, CylinderInstances } from "./ScenePrimitives";

const FLOORS = 7;
const FLOOR_HEIGHT = 3.22;
const BUILDING_HEIGHT = FLOORS * FLOOR_HEIGHT;

const WIDTH = 64;
const DEPTH = 17;
const PARAPET_HEIGHT = 0.9;
const FRONT = DEPTH / 2;
const REAR = -DEPTH / 2;

const WING_WIDTH = 25.5;
const WING_LEFT_CENTER = -19.25;
const WING_RIGHT_CENTER = 19.25;

const WALL_COLOR = "#F5F5F4";
const GREY_CLADDING = "#C9C9C9";
const BEIGE_ACCENT = "#E8D7B8";
const DARK_GLASS = "#1B2A3A";
const ROOF_COLOR = "#4E5058";
const CANOPY_COLOR = "#D8D4CC";
const PATH_COLOR = "#9A9A90";
const GRASS_COLOR = "#4D6A3F";
const TRUNK_COLOR = "#5A4A3A";
const TREE_COLOR = "#3A5A2A";
const SHRUB_COLOR = "#3A6B30";
const BUILDING_ROTATION_Y = Math.PI;

const WINDOW_W = 1.0;
const WINDOW_H = 1.8;
const WINDOW_OFFSETS = [-8.25, -4.95, -1.65, 1.65, 4.95, 8.25];

function WingWindows({ centerX }) {
  const items = useMemo(() => {
    const result = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = FLOOR_HEIGHT * floor + FLOOR_HEIGHT / 2;
      WINDOW_OFFSETS.forEach((offset) => {
        const x = centerX + offset;
        result.push({ position: [x, y, FRONT + 0.05], scale: [WINDOW_W, WINDOW_H, 0.12] });
        result.push({ position: [x, y, REAR - 0.05], scale: [WINDOW_W, WINDOW_H, 0.12] });
      });
    }
    return result;
  }, [centerX]);

  return (
    <BoxInstances
      items={items}
      color={DARK_GLASS}
      emissive="#1B2A3A"
      emissiveIntensity={0.18}
      metalness={0.55}
      roughness={0.12}
      castShadow
    />
  );
}

function WingWindowFrames({ centerX }) {
  const items = useMemo(() => {
    const result = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = FLOOR_HEIGHT * floor + FLOOR_HEIGHT / 2;
      WINDOW_OFFSETS.forEach((offset) => {
        const x = centerX + offset;
        result.push({ position: [x, y, FRONT + 0.06], scale: [1.28, 2.14, 0.06] });
        result.push({ position: [x, y, REAR - 0.06], scale: [1.28, 2.14, 0.06] });
      });
    }
    return result;
  }, [centerX]);

  return <BoxInstances items={items} color="#FFFFFF" roughness={0.5} castShadow />;
}

function BeigeAccentPanels({ centerX }) {
  const items = useMemo(() => {
    return [-11.5, 11.5].flatMap((offset) => [
      { position: [centerX + offset, BUILDING_HEIGHT / 2, FRONT + 0.12], scale: [0.9, BUILDING_HEIGHT, 0.08] },
      { position: [centerX + offset, BUILDING_HEIGHT / 2, REAR - 0.12], scale: [0.9, BUILDING_HEIGHT, 0.08] },
    ]);
  }, [centerX]);

  return <BoxInstances items={items} color={BEIGE_ACCENT} roughness={0.72} castShadow />;
}

function GreyCladdingPanels() {
  const items = useMemo(() => {
    return [-9.5, 9.5].flatMap((x) => [
      { position: [x, BUILDING_HEIGHT / 2, FRONT + 0.14], scale: [1.6, BUILDING_HEIGHT, 0.1] },
      { position: [x, BUILDING_HEIGHT / 2, REAR - 0.14], scale: [1.6, BUILDING_HEIGHT, 0.1] },
    ]);
  }, []);

  return <BoxInstances items={items} color={GREY_CLADDING} roughness={0.82} castShadow />;
}

function MainVolume() {
  const body = useMemo(
    () => [{ position: [0, BUILDING_HEIGHT / 2, 0], scale: [WIDTH, BUILDING_HEIGHT, DEPTH] }],
    [],
  );
  const endWalls = useMemo(
    () => [
      { position: [-WIDTH / 2, BUILDING_HEIGHT / 2, 0], scale: [0.3, BUILDING_HEIGHT, DEPTH + 2.5] },
      { position: [WIDTH / 2, BUILDING_HEIGHT / 2, 0], scale: [0.3, BUILDING_HEIGHT, DEPTH + 2.5] },
    ],
    [],
  );
  return (
    <group>
      <BoxInstances items={body} color={WALL_COLOR} roughness={0.75} castShadow receiveShadow />
      <BoxInstances items={endWalls} color={WALL_COLOR} roughness={0.75} castShadow receiveShadow />
    </group>
  );
}

function SlabLines() {
  const items = useMemo(() => {
    const result = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = FLOOR_HEIGHT * floor;
      result.push({ position: [0, y, FRONT + 0.04], scale: [WIDTH, 0.06, 0.1] });
      result.push({ position: [0, y, REAR - 0.04], scale: [WIDTH, 0.06, 0.1] });
    }
    return result;
  }, []);

  return <BoxInstances items={items} color="#E4E2DC" roughness={0.7} />;
}

function StructuralColumns() {
  const items = useMemo(() => {
    const xs = [-31.6, -6.9, 6.9, 31.6];
    const result = [];
    xs.forEach((x) => {
      result.push({ position: [x, BUILDING_HEIGHT / 2, FRONT], scale: [0.4, BUILDING_HEIGHT, 0.4] });
      result.push({ position: [x, BUILDING_HEIGHT / 2, REAR], scale: [0.4, BUILDING_HEIGHT, 0.4] });
    });
    result.push({ position: [-WIDTH / 2, BUILDING_HEIGHT / 2, 0], scale: [0.4, BUILDING_HEIGHT, 0.4] });
    result.push({ position: [WIDTH / 2, BUILDING_HEIGHT / 2, 0], scale: [0.4, BUILDING_HEIGHT, 0.4] });
    return result;
  }, []);

  return <BoxInstances items={items} color="#E3E3E3" roughness={0.85} castShadow />;
}

function RoofAssembly() {
  const rectangles = useMemo(() => {
    const result = [];
    result.push({ position: [0, BUILDING_HEIGHT + 0.12, 0], scale: [WIDTH, 0.24, DEPTH] });
    return result;
  }, []);

  const parapet = useMemo(() => {
    const h = BUILDING_HEIGHT + PARAPET_HEIGHT;
    const result = [];
    const halfW = WIDTH / 2 + 0.12;
    const halfD = DEPTH / 2 + 0.12;
    result.push({ position: [0, h - 0.45, halfD], scale: [WIDTH + 0.3, 0.9, 0.24] });
    result.push({ position: [0, h - 0.45, -halfD], scale: [WIDTH + 0.3, 0.9, 0.24] });
    result.push({ position: [halfW, h - 0.45, 0], scale: [0.24, 0.9, DEPTH + 0.6] });
    result.push({ position: [-halfW, h - 0.45, 0], scale: [0.24, 0.9, DEPTH + 0.6] });
    return result;
  }, []);

  const drip = useMemo(
    () => [
      { position: [0, BUILDING_HEIGHT + 0.0, FRONT + 0.2], scale: [WIDTH + 0.2, 0.16, 0.18] },
      { position: [0, BUILDING_HEIGHT + 0.0, REAR - 0.2], scale: [WIDTH + 0.2, 0.16, 0.18] },
    ],
    [],
  );

  return (
    <group>
      <BoxInstances items={rectangles} color={ROOF_COLOR} roughness={0.6} />
      <BoxInstances items={parapet} color={ROOF_COLOR} roughness={0.6} />
      <BoxInstances items={drip} color="#B9B9BC" roughness={0.7} />
    </group>
  );
}

function EntrancePavilion() {
  const PAV_W = 11.0;
  const SLAB_T = 0.42;
  const GLASS_Z = FRONT + 0.3;
  const SLAB_YS = [6.44, 9.66, 12.88, 16.1, 19.32, 22.2];
  const SLAB_D = [5.2, 4.1, 3.1, 2.3, 1.6, 1.0];
  const COL_XS = [-4.4, -1.5, 1.5, 4.4];
  const CONCRETE = "#C7C1B5";
  const CONCRETE_EDGE = "#9C9587";
  const COLUMN_WHITE = "#F4F1E9";
  const GLASS_DARK = "#0E1C28";

  const data = useMemo(() => {
    const slabs = [];
    const slabEdges = [];
    const glass = [];
    const mullions = [];
    const columns = [];
    const lobby = [];
    const stairs = [];
    const rooms = [];

    rooms.push({
      position: [0, (BUILDING_HEIGHT - SLAB_YS[0]) / 2 + SLAB_YS[0], FRONT - 1.5],
      scale: [PAV_W, BUILDING_HEIGHT - SLAB_YS[0], 3.0],
    });

    SLAB_YS.forEach((yTop, i) => {
      const depth = SLAB_D[i];
      slabs.push({
        position: [0, yTop - SLAB_T / 2, FRONT + depth / 2],
        scale: [PAV_W, SLAB_T, depth],
      });
      slabEdges.push({
        position: [0, yTop - SLAB_T / 2, FRONT + depth],
        scale: [PAV_W, SLAB_T + 0.2, 0.16],
      });
    });

    for (let i = 0; i < SLAB_YS.length - 1; i += 1) {
      const bottom = i === 0 ? 0 : SLAB_YS[i - 1];
      const top = SLAB_YS[i];
      const gh = top - bottom - 0.3;
      const gy = bottom + (gh + 0.3) / 2 - 0.15;
      glass.push({ position: [0, gy, GLASS_Z], scale: [PAV_W - 0.6, gh, 0.1] });
      for (const mx of [-4.6, -2.3, 0, 2.3, 4.6]) {
        mullions.push({ position: [mx, gy, GLASS_Z - 0.02], scale: [0.14, gh, 0.14] });
      }
    }

    for (const x of COL_XS) {
      columns.push({
        position: [x, SLAB_YS[0] / 2, FRONT + SLAB_D[0]],
        scale: [0.55, SLAB_YS[0], 0.55],
      });
    }

    const canopyDepth = SLAB_D[0];
    lobby.push(
      { position: [0, 3.2, FRONT + 0.15], scale: [7.8, 5.9, 0.12] },
      { position: [0, 1.9, FRONT + 0.22], scale: [4.8, 2.9, 0.12] },
      { position: [0, 6.3, FRONT - 0.05], scale: [8.4, 0.4, 0.4] },
    );

    for (let i = 0; i < 4; i += 1) {
      stairs.push({
        position: [0, 0.12 + i * 0.15, FRONT + canopyDepth + 0.5 + i * 0.55],
        scale: [9.2 - i * 0.2, 0.15, 0.55],
      });
    }

    return { slabs, slabEdges, glass, mullions, columns, lobby, stairs };
  }, []);

  return (
    <group>
      <BoxInstances items={data.slabs} color={CONCRETE} roughness={0.9} castShadow receiveShadow />
      <BoxInstances items={data.slabEdges} color={CONCRETE_EDGE} roughness={0.85} castShadow receiveShadow />
      <BoxInstances items={data.columns} color={COLUMN_WHITE} roughness={0.55} castShadow receiveShadow />
      <BoxInstances items={data.glass} color={GLASS_DARK} emissive="#12202C" emissiveIntensity={0.24} metalness={0.85} roughness={0.1} />
      <BoxInstances items={data.mullions} color="#0A141E" emissive="#0A141E" emissiveIntensity={0.4} metalness={0.6} roughness={0.2} />
      <BoxInstances items={data.lobby} color={GLASS_DARK} emissive="#14222E" emissiveIntensity={0.3} metalness={0.75} roughness={0.14} />
      <BoxInstances items={data.stairs} color="#C9C0AA" roughness={0.88} castShadow />
    </group>
  );
}

function GroundLandscape() {
  const items = useMemo(() => {
    const shrubs = [];
    const trees = [];
    const trunks = [];
    const pathSegments = [];

    for (let x = -28; x <= 28; x += 4) {
      shrubs.push({ position: [x, 0.5, FRONT + 5], scale: [1.2, 0.7, 1.2] });
      shrubs.push({ position: [x, 0.5, REAR - 5], scale: [1.2, 0.7, 1.2] });
    }

    [-22, -12, -2, 8, 18, 28].forEach((x, index) => {
      const z = index % 2 ? FRONT + 7 : FRONT + 6;
      trunks.push({ position: [x, 1.8, z], scale: [0.25, 3.5, 0.25] });
      trees.push({ position: [x, 4.5, z], scale: [2.0, 3.0, 2.0] });
    });

    [-22, -12, -2, 8, 18, 28].forEach((x, index) => {
      const z = index % 2 ? REAR - 7 : REAR - 6;
      trunks.push({ position: [x, 1.8, z], scale: [0.25, 3.5, 0.25] });
      trees.push({ position: [x, 4.5, z], scale: [2.0, 3.0, 2.0] });
    });

    for (let x = -18; x <= 18; x += 2) {
      pathSegments.push({ position: [x, 0.05, FRONT + 1.5], scale: [1.8, 0.1, 3.5] });
      pathSegments.push({ position: [x, 0.05, REAR - 1.5], scale: [1.8, 0.1, 3.5] });
    }

    return { shrubs, trees, trunks, pathSegments };
  }, []);

  return (
    <group>
      <mesh position={[0, 0, FRONT + 6]} receiveShadow>
        <boxGeometry args={[WIDTH + 20, 0.1, 8]} />
        <meshStandardMaterial color={GRASS_COLOR} roughness={1} />
      </mesh>
      <mesh position={[0, 0, REAR - 6]} receiveShadow>
        <boxGeometry args={[WIDTH + 20, 0.1, 8]} />
        <meshStandardMaterial color={GRASS_COLOR} roughness={1} />
      </mesh>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[WIDTH + 24, 0.12, DEPTH + 12]} />
        <meshStandardMaterial color={GRASS_COLOR} roughness={1} />
      </mesh>
      <BoxInstances items={items.pathSegments} color={PATH_COLOR} roughness={0.9} />
      <BoxInstances items={items.shrubs} color={SHRUB_COLOR} roughness={1} castShadow />
      <CylinderInstances items={items.trunks} color={TRUNK_COLOR} radialSegments={6} castShadow />
      <BoxInstances items={items.trees} color={TREE_COLOR} roughness={0.9} castShadow />
      <mesh position={[0, 0.08, FRONT + 1.5]} receiveShadow>
        <boxGeometry args={[WIDTH * 0.4, 0.16, 3.5]} />
        <meshStandardMaterial color={PATH_COLOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, REAR - 1.5]} receiveShadow>
        <boxGeometry args={[WIDTH * 0.4, 0.16, 3.5]} />
        <meshStandardMaterial color={PATH_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
}

export function HostelBuilding() {
  return (
    <group rotation={[0, BUILDING_ROTATION_Y, 0]}>
      <MainVolume />
      <SlabLines />
      <StructuralColumns />
      <WingWindows centerX={WING_LEFT_CENTER} />
      <WingWindows centerX={WING_RIGHT_CENTER} />
      <WingWindowFrames centerX={WING_LEFT_CENTER} />
      <WingWindowFrames centerX={WING_RIGHT_CENTER} />
      <BeigeAccentPanels centerX={WING_LEFT_CENTER} />
      <BeigeAccentPanels centerX={WING_RIGHT_CENTER} />
      <GreyCladdingPanels />
      <EntrancePavilion />
      <RoofAssembly />
      <GroundLandscape />
    </group>
  );
}