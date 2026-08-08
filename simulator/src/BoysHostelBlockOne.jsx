import { useMemo } from "react";
import {
  BoxInstances,
  CylinderInstances,
  IcoInstances,
} from "./ScenePrimitives";

const FLOORS = 8;
const COLUMNS = 28;
const FLOOR_HEIGHT = 3.15;
const HEIGHT = FLOORS * FLOOR_HEIGHT;

const WALL = "#a8acaa";
const LIGHT_WALL = "#c4c6c2";
const BLUE = "#173f91";
const DEEP_BLUE = "#102e72";
const YELLOW = "#d2c22e";
const WHITE = "#e6e7df";
const GLASS = "#18252d";
const ROOF = "#777b79";

const yellowCells = new Set([
  "5:5", "6:5", "7:5", "7:4", "7:3", "6:3", "5:3",
  "9:6", "10:6", "10:5", "10:4", "11:4",
  "13:2", "13:3", "14:3", "15:3", "15:4", "15:5",
  "18:6", "19:6", "19:5", "20:5", "20:4",
  "22:2", "22:3", "23:3", "23:4", "24:4",
  "26:5", "26:4", "25:4", "25:3", "26:3",
]);

const whiteCells = new Set([
  "4:1", "4:2", "4:3", "5:1", "6:1", "7:1", "7:2",
  "8:4", "8:3", "9:3", "9:2", "10:2", "10:1",
  "12:5", "12:4", "12:3", "13:5", "14:5", "14:4",
  "16:1", "16:2", "16:3", "17:3", "18:3", "18:2",
  "20:1", "20:2", "21:2", "21:3", "21:4",
  "24:6", "24:5", "25:6", "26:6",
]);

function panelColor(column, floor) {
  const key = `${column}:${floor}`;
  if (yellowCells.has(key)) return "yellow";
  if (whiteCells.has(key)) return "white";
  if (
    [2, 3, 11, 12, 17, 18, 19, 25].includes(column) ||
    (column >= 5 && column <= 9 && floor >= 4) ||
    (column >= 14 && column <= 16 && floor <= 2) ||
    (column >= 21 && column <= 24 && floor >= 5)
  ) {
    return "blue";
  }
  return "grey";
}

function createFacade(z, normal, detailedPattern) {
  const panels = { blue: [], yellow: [], white: [], grey: [] };
  const windows = [];
  const mullions = [];
  const xStep = 5.25;
  const startX = -((COLUMNS - 1) * xStep) / 2;

  for (let floor = 0; floor < FLOORS; floor += 1) {
    const y = 2 + floor * FLOOR_HEIGHT;
    for (let column = 0; column < COLUMNS; column += 1) {
      const x = startX + column * xStep;
      const color = detailedPattern
        ? panelColor(column, floor)
        : [2, 3, 11, 12, 17, 18, 25].includes(column)
          ? "blue"
          : "grey";
      panels[color].push({
        position: [x, y, z],
        scale: [4.8, 2.82, 0.2],
      });
      windows.push({
        position: [x, y, z + normal * 0.2],
        scale: [1.46, 1.58, 0.18],
      });
    }
  }

  for (let floor = 0; floor <= FLOORS; floor += 1) {
    mullions.push({
      position: [0, 0.45 + floor * FLOOR_HEIGHT, z + normal * 0.36],
      scale: [150, 0.18, 0.62],
    });
  }
  for (let column = 0; column <= COLUMNS; column += 1) {
    const x = startX - xStep / 2 + column * xStep;
    mullions.push({
      position: [x, HEIGHT / 2, z + normal * 0.35],
      scale: [0.18, HEIGHT, 0.6],
    });
  }

  return { panels, windows, mullions };
}

export function BoysHostelBlockOne() {
  const building = useMemo(() => {
    const front = createFacade(11.15, 1, true);
    const rear = createFacade(-11.15, -1, false);
    const sidePanels = [];
    const sideWindows = [];
    [-7.8, -2.6, 2.6, 7.8].forEach((z) => {
      for (let floor = 0; floor < FLOORS; floor += 1) {
        const y = 2 + floor * FLOOR_HEIGHT;
        [-75.15, 75.15].forEach((x) => {
          sidePanels.push({
            position: [x, y, z],
            rotation: [0, Math.PI / 2, 0],
            scale: [4.7, 2.82, 0.2],
          });
          sideWindows.push({
            position: [x + Math.sign(x) * 0.2, y, z],
            rotation: [0, Math.PI / 2, 0],
            scale: [1.42, 1.58, 0.18],
          });
        });
      }
    });

    const verticalCores = [
      { position: [-65, HEIGHT / 2 + 1.2, 0], scale: [8, HEIGHT + 2.4, 24.5] },
      { position: [-18, HEIGHT / 2 + 0.8, 0], scale: [9, HEIGHT + 1.6, 23.5] },
      { position: [17, HEIGHT / 2 + 1.4, 0], scale: [12, HEIGHT + 2.8, 24.5] },
      { position: [63, HEIGHT / 2 + 0.9, 0], scale: [8, HEIGHT + 1.8, 23.8] },
    ];
    const coreFrames = [];
    const coreGlass = [];
    [-65, -18, 17, 63].forEach((x, coreIndex) => {
      for (let floor = 0; floor < FLOORS; floor += 1) {
        const y = 2 + floor * FLOOR_HEIGHT;
        coreFrames.push({
          position: [x, y, 12.38],
          scale: [coreIndex === 2 ? 7.2 : 4, 2.35, 0.2],
        });
        coreGlass.push({
          position: [x, y, 12.58],
          scale: [coreIndex === 2 ? 5.25 : 2.45, 1.58, 0.18],
        });
      }
    });

    const roofCaps = [
      { position: [0, HEIGHT + 0.2, 0], scale: [150.8, 0.42, 22.8] },
      { position: [-65, HEIGHT + 2.62, 0], scale: [8.8, 0.42, 25.2] },
      { position: [-18, HEIGHT + 1.82, 0], scale: [9.8, 0.42, 24.2] },
      { position: [17, HEIGHT + 3.02, 0], scale: [12.8, 0.42, 25.2] },
      { position: [63, HEIGHT + 2.02, 0], scale: [8.8, 0.42, 24.5] },
    ];
    const rooftop = [
      { position: [-63, HEIGHT + 4.3, -1], scale: [5.5, 3.2, 5.8] },
      { position: [-20, HEIGHT + 3.5, -1], scale: [5.4, 3.1, 5.6] },
      { position: [18, HEIGHT + 4.8, -1], scale: [6.2, 3.5, 6.2] },
      { position: [62, HEIGHT + 3.8, -1], scale: [5.2, 3.1, 5.5] },
    ];

    return {
      front,
      rear,
      sidePanels,
      sideWindows,
      verticalCores,
      coreFrames,
      coreGlass,
      roofCaps,
      rooftop,
    };
  }, []);

  const landscape = useMemo(() => {
    const hedge = [];
    const trunks = [];
    const trees = [];
    const curb = [];
    for (let x = -72; x <= 72; x += 5.5) {
      hedge.push({ position: [x, 0.7, 16.1], scale: [2.5, 0.72, 0.85] });
    }
    [-68, -48, -26, -4, 22, 45, 68].forEach((x, index) => {
      trunks.push({ position: [x, 1.25, 18.5], scale: [0.22, 2.5, 0.22] });
      trees.push({ position: [x, 3, 18.5], scale: [1.5 + (index % 2) * 0.2, 1.75, 1.5] });
    });
    for (let x = -80; x <= 80; x += 3.2) {
      curb.push({ position: [x, 0.24, 24.5], scale: [3, 0.46, 0.7] });
    }
    return { hedge, trunks, trees, curb };
  }, []);

  const pickleballCourt = useMemo(
    () => [
      {
        position: [0, 0.08, 38],
        scale: [22, 0.08, 14],
      },
    ],
    [],
  );

  const pickleballLines = useMemo(
    () => {
      const length = 22;
      const width = 14;
      const halfLength = length / 2;
      const halfWidth = width / 2;
      return [
        { position: [0, 0.14, 30.9], scale: [length + 0.8, 0.04, 0.18] },
        { position: [0, 0.14, 45.1], scale: [length + 0.8, 0.04, 0.18] },
        { position: [-halfLength + 0.1, 0.14, 38], scale: [0.18, 0.04, width + 0.8] },
        { position: [halfLength - 0.1, 0.14, 38], scale: [0.18, 0.04, width + 0.8] },
        { position: [0, 0.14, 38], scale: [length + 0.8, 0.04, 0.18] },
      ];
    },
    [],
  );

  const pickleballNet = useMemo(
    () => [
      {
        position: [0, 1.1, 38],
        scale: [22.2, 1.4, 0.18],
      },
    ],
    [],
  );

  const pickleballPosts = useMemo(
    () => [
      { position: [-11, 1.3, 38], scale: [0.2, 2.6, 0.2] },
      { position: [11, 1.3, 38], scale: [0.2, 2.6, 0.2] },
    ],
    [],
  );

  return (
    <group position={[-520, 0.25, -88]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[176, 0.18, 62]} />
        <meshStandardMaterial color="#496d42" roughness={1} />
      </mesh>
      <mesh position={[0, 0.04, 22]} receiveShadow>
        <boxGeometry args={[166, 0.18, 7]} />
        <meshStandardMaterial color="#a8a89f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.02, 29]} receiveShadow>
        <boxGeometry args={[176, 0.16, 7]} />
        <meshStandardMaterial color="#505657" roughness={0.96} />
      </mesh>

      <mesh position={[0, HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[150, HEIGHT, 22]} />
        <meshStandardMaterial color={WALL} roughness={0.84} />
      </mesh>
      <BoxInstances items={building.front.panels.grey} color={WALL} roughness={0.84} />
      <BoxInstances items={building.front.panels.blue} color={BLUE} roughness={0.72} />
      <BoxInstances items={building.front.panels.yellow} color={YELLOW} roughness={0.75} />
      <BoxInstances items={building.front.panels.white} color={WHITE} roughness={0.8} />
      <BoxInstances items={building.front.windows} color={GLASS} emissive="#12202b" emissiveIntensity={0.24} metalness={0.5} roughness={0.2} />
      <BoxInstances items={building.front.mullions} color={LIGHT_WALL} roughness={0.82} castShadow />

      <BoxInstances items={building.rear.panels.grey} color={WALL} roughness={0.84} />
      <BoxInstances items={building.rear.panels.blue} color={DEEP_BLUE} roughness={0.72} />
      <BoxInstances items={building.rear.windows} color={GLASS} emissive="#12202b" emissiveIntensity={0.2} metalness={0.48} roughness={0.22} />
      <BoxInstances items={building.rear.mullions} color={LIGHT_WALL} roughness={0.82} />
      <BoxInstances items={building.sidePanels} color="#999e9d" roughness={0.84} />
      <BoxInstances items={building.sideWindows} color={GLASS} metalness={0.48} roughness={0.22} />

      <BoxInstances items={building.verticalCores} color={DEEP_BLUE} roughness={0.72} castShadow receiveShadow />
      <BoxInstances items={building.coreFrames} color={LIGHT_WALL} roughness={0.78} />
      <BoxInstances items={building.coreGlass} color={GLASS} emissive="#142943" emissiveIntensity={0.28} metalness={0.58} roughness={0.17} />
      <BoxInstances items={building.roofCaps} color={ROOF} roughness={0.72} />
      <BoxInstances items={building.rooftop} color="#969a98" roughness={0.84} castShadow />

      <BoxInstances items={landscape.hedge} color="#315f32" roughness={1} castShadow />
      <CylinderInstances items={landscape.trunks} color="#62503b" radialSegments={8} roughness={0.94} castShadow />
      <IcoInstances items={landscape.trees} color="#356b38" castShadow />
      <BoxInstances items={pickleballCourt} color="#4b9447" roughness={0.9} />
      <BoxInstances items={pickleballLines} color="#f6f0e6" roughness={0.92} />
      <BoxInstances items={pickleballNet} color="#d9d9d9" roughness={0.72} metalness={0.14} />
      <CylinderInstances items={pickleballPosts} color="#2d2d2d" radialSegments={10} roughness={0.4} />
      <BoxInstances items={landscape.curb.filter((_, index) => index % 2 === 0)} color="#d7c932" roughness={0.9} />
      <BoxInstances items={landscape.curb.filter((_, index) => index % 2 === 1)} color="#2d3436" roughness={0.9} />
    </group>
  );
}
