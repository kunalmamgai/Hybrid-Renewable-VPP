import { useMemo } from "react";
import {
  BoxInstances,
  CylinderInstances,
  IcoInstances,
} from "./ScenePrimitives";

const FLOORS = 6;
const FLOOR_HEIGHT = 3.45;
const BODY_HEIGHT = FLOORS * FLOOR_HEIGHT;

const CONCRETE = "#c7c0b7";
const LIGHT_CONCRETE = "#d2cbc1";
const TOWER_CONCRETE = "#aaa49d";
const TERRACOTTA = "#b96746";
const GLASS = "#202b32";
const DARK_CORE = "#615b55";
const ROOF = "#837d77";

function makeFacadeZone(from, to, columns, z, normal = 1) {
  const terracotta = [];
  const windows = [];
  const tops = [];
  const fins = [];
  const spacing = (to - from) / Math.max(columns - 1, 1);

  for (let floor = 0; floor < FLOORS; floor += 1) {
    const y = 2.15 + floor * FLOOR_HEIGHT;
    for (let column = 0; column < columns; column += 1) {
      const x = from + column * spacing;
      terracotta.push({ position: [x, y, z], scale: [3.45, 2.72, 0.24] });
      windows.push({ position: [x, y, z + normal * 0.2], scale: [1.92, 1.66, 0.18] });
      tops.push({ position: [x, y + 1.42, z + normal * 0.38], scale: [3.7, 0.2, 0.86] });
      fins.push(
        { position: [x - 1.78, y, z + normal * 0.37], scale: [0.2, 2.96, 0.78] },
        { position: [x + 1.78, y, z + normal * 0.37], scale: [0.2, 2.96, 0.78] },
      );
    }
  }

  return { terracotta, windows, tops, fins };
}

function makeSideFacadeZone(from, to, columns, x, normal) {
  const terracotta = [];
  const windows = [];
  const tops = [];
  const fins = [];
  const spacing = (to - from) / Math.max(columns - 1, 1);
  const rotation = [0, Math.PI / 2, 0];

  for (let floor = 0; floor < FLOORS; floor += 1) {
    const y = 2.15 + floor * FLOOR_HEIGHT;
    for (let column = 0; column < columns; column += 1) {
      const z = from + column * spacing;
      terracotta.push({ position: [x, y, z], rotation, scale: [3.45, 2.72, 0.24] });
      windows.push({ position: [x + normal * 0.2, y, z], rotation, scale: [1.92, 1.66, 0.18] });
      tops.push({ position: [x + normal * 0.38, y + 1.42, z], rotation, scale: [3.7, 0.2, 0.86] });
      fins.push(
        { position: [x + normal * 0.37, y, z - 1.78], rotation, scale: [0.2, 2.96, 0.78] },
        { position: [x + normal * 0.37, y, z + 1.78], rotation, scale: [0.2, 2.96, 0.78] },
      );
    }
  }

  return { terracotta, windows, tops, fins };
}

function makeRearWindows() {
  const frames = [];
  const glass = [];
  const zones = [
    [-92, -18, 16],
    [18, 92, 16],
  ];
  zones.forEach(([from, to, columns]) => {
    const spacing = (to - from) / Math.max(columns - 1, 1);
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = 2.15 + floor * FLOOR_HEIGHT;
      for (let column = 0; column < columns; column += 1) {
        const x = from + column * spacing;
        frames.push({ position: [x, y, -10.25], scale: [2.8, 2.35, 0.18] });
        glass.push({ position: [x, y, -10.38], scale: [1.72, 1.55, 0.2] });
      }
    }
  });
  return { frames, glass };
}

export function GirlsHostelBlockTwo() {
  const building = useMemo(() => {
    const frontSpineFacade = makeFacadeZone(-92, 92, 38, 47.1);
    const rearLeftFacade = makeFacadeZone(-92, -50, 9, 24.9, -1);
    const rearMiddleFacade = makeFacadeZone(-22, 22, 9, 24.9, -1);
    const rearRightFacade = makeFacadeZone(50, 92, 9, 24.9, -1);
    const leftArmEastFacade = makeSideFacadeZone(-38, 22, 13, -24.1, 1);
    const leftArmWestFacade = makeSideFacadeZone(-38, 22, 13, -48.1, -1);
    const rightArmEastFacade = makeSideFacadeZone(-38, 22, 13, 48.1, 1);
    const rightArmWestFacade = makeSideFacadeZone(-38, 22, 13, 24.1, -1);
    const leftArmEndFacade = makeFacadeZone(-46, -26, 5, -40.1, -1);
    const rightArmEndFacade = makeFacadeZone(26, 46, 5, -40.1, -1);
    const rear = { frames: [], glass: [] };

    const bodies = [
      { position: [0, BODY_HEIGHT / 2, 36], scale: [190, BODY_HEIGHT, 22] },
      { position: [-36, BODY_HEIGHT / 2, -7.5], scale: [24, BODY_HEIGHT, 65] },
      { position: [36, BODY_HEIGHT / 2, -7.5], scale: [24, BODY_HEIGHT, 65] },
    ];

    const towerBodies = [
      { position: [-36, BODY_HEIGHT / 2 + 1.1, 35], scale: [13, BODY_HEIGHT + 2.2, 26] },
      { position: [36, BODY_HEIGHT / 2 + 1.1, 35], scale: [13, BODY_HEIGHT + 2.2, 26] },
    ];

    const roofCaps = [
      { position: [0, BODY_HEIGHT + 0.22, 36], scale: [190.8, 0.44, 22.8] },
      { position: [-36, BODY_HEIGHT + 0.22, -7.5], scale: [24.8, 0.44, 65.8] },
      { position: [36, BODY_HEIGHT + 0.22, -7.5], scale: [24.8, 0.44, 65.8] },
      { position: [-36, BODY_HEIGHT + 2.42, 35], scale: [13.8, 0.44, 26.8] },
      { position: [36, BODY_HEIGHT + 2.42, 35], scale: [13.8, 0.44, 26.8] },
    ];

    const parapets = [
      { position: [0, BODY_HEIGHT + 0.85, 47], scale: [190, 1.25, 0.45] },
      { position: [-36, BODY_HEIGHT + 0.85, -40], scale: [24, 1.25, 0.45] },
      { position: [36, BODY_HEIGHT + 0.85, -40], scale: [24, 1.25, 0.45] },
    ];

    const frontBands = [];
    const zones = [
      [0, 190, 47.58],
      [-36, 24, -40.58],
      [36, 24, -40.58],
    ];
    for (let floor = 0; floor <= FLOORS; floor += 1) {
      zones.forEach(([x, width, z]) => {
        frontBands.push({ position: [x, floor * FLOOR_HEIGHT + 0.38, z], scale: [width, 0.16, 0.62] });
      });
    }

    const leftTowerGlass = [];
    const stairTowerGlass = [];
    const stairMullions = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = 2.2 + floor * FLOOR_HEIGHT;
      leftTowerGlass.push(
        { position: [-36, y, 48.12], scale: [2.05, 1.7, 0.18] },
      );
      stairTowerGlass.push({ position: [36, y + 0.15, 48.12], scale: [3.25, 2.16, 0.2] });
      stairMullions.push({ position: [36, y + 1.42, 48.36], scale: [3.55, 0.2, 0.62] });
    }

    const coreSlits = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      coreSlits.push({ position: [0, 2.15 + floor * FLOOR_HEIGHT, 48.12], scale: [2.1, 0.48, 0.18] });
    }

    const sideFrames = [];
    const sideGlass = [];
    for (let floor = 0; floor < FLOORS; floor += 1) {
      const y = 2.15 + floor * FLOOR_HEIGHT;
      [29, 33.7, 38.4, 43.1].forEach((z) => {
        sideFrames.push(
          { position: [94.12, y, z], rotation: [0, Math.PI / 2, 0], scale: [2.9, 2.55, 0.2] },
          { position: [-94.12, y, z], rotation: [0, Math.PI / 2, 0], scale: [2.9, 2.55, 0.2] },
        );
        sideGlass.push(
          { position: [94.25, y, z], rotation: [0, Math.PI / 2, 0], scale: [1.76, 1.62, 0.18] },
          { position: [-94.25, y, z], rotation: [0, Math.PI / 2, 0], scale: [1.76, 1.62, 0.18] },
        );
      });
    }

    const rooftop = [
      { position: [0, BODY_HEIGHT + 5.3, 36], scale: [7, 4.2, 7] },
      { position: [-72, BODY_HEIGHT + 2.05, 36], scale: [5.2, 3.1, 5.4] },
      { position: [72, BODY_HEIGHT + 2.05, 36], scale: [5.2, 3.1, 5.4] },
      { position: [-36, BODY_HEIGHT + 2.05, -27], scale: [5.2, 3.1, 5.4] },
      { position: [36, BODY_HEIGHT + 2.05, -27], scale: [5.2, 3.1, 5.4] },
    ];

    return {
      bodies,
      towerBodies,
      roofCaps,
      parapets,
      frontBands,
      terracotta: [
        ...frontSpineFacade.terracotta,
        ...rearLeftFacade.terracotta,
        ...rearMiddleFacade.terracotta,
        ...rearRightFacade.terracotta,
        ...leftArmEastFacade.terracotta,
        ...leftArmWestFacade.terracotta,
        ...rightArmEastFacade.terracotta,
        ...rightArmWestFacade.terracotta,
        ...leftArmEndFacade.terracotta,
        ...rightArmEndFacade.terracotta,
      ],
      windows: [
        ...frontSpineFacade.windows,
        ...rearLeftFacade.windows,
        ...rearMiddleFacade.windows,
        ...rearRightFacade.windows,
        ...leftArmEastFacade.windows,
        ...leftArmWestFacade.windows,
        ...rightArmEastFacade.windows,
        ...rightArmWestFacade.windows,
        ...leftArmEndFacade.windows,
        ...rightArmEndFacade.windows,
      ],
      tops: [
        ...frontSpineFacade.tops,
        ...rearLeftFacade.tops,
        ...rearMiddleFacade.tops,
        ...rearRightFacade.tops,
        ...leftArmEastFacade.tops,
        ...leftArmWestFacade.tops,
        ...rightArmEastFacade.tops,
        ...rightArmWestFacade.tops,
        ...leftArmEndFacade.tops,
        ...rightArmEndFacade.tops,
      ],
      fins: [
        ...frontSpineFacade.fins,
        ...rearLeftFacade.fins,
        ...rearMiddleFacade.fins,
        ...rearRightFacade.fins,
        ...leftArmEastFacade.fins,
        ...leftArmWestFacade.fins,
        ...rightArmEastFacade.fins,
        ...rightArmWestFacade.fins,
        ...leftArmEndFacade.fins,
        ...rightArmEndFacade.fins,
      ],
      rear,
      leftTowerGlass,
      stairTowerGlass,
      stairMullions,
      coreSlits,
      sideFrames,
      sideGlass,
      rooftop,
    };
  }, []);

  const landscaping = useMemo(() => {
    const hedge = [];
    const trunks = [];
    const shrubs = [];
    const curb = [];
    for (let x = -92; x <= 92; x += 6.5) {
      hedge.push({ position: [x, 0.85, 71.7], scale: [3.2, 0.8, 1.05] });
    }
    [-84, -58, -31, 29, 57, 84].forEach((x, index) => {
      trunks.push({ position: [x, 1.15, 70.2], scale: [0.22, 2.3, 0.22] });
      shrubs.push({ position: [x, 2.6, 70.2], scale: [1.55 + (index % 2) * 0.25, 1.7, 1.55] });
    });
    for (let x = -104; x <= 104; x += 3.2) {
      curb.push({ position: [x, 0.25, 77.9], scale: [3, 0.48, 0.75] });
    }
    return { hedge, trunks, shrubs, curb };
  }, []);

  return (
    <group>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[218, 0.18, 158]} />
        <meshStandardMaterial color="#507346" roughness={1} />
      </mesh>
      <mesh position={[0, 0.08, 74.8]} receiveShadow>
        <boxGeometry args={[214, 0.18, 6]} />
        <meshStandardMaterial color="#b8b3a7" roughness={0.94} />
      </mesh>
      <mesh position={[0, 0.04, 82]} receiveShadow>
        <boxGeometry args={[220, 0.16, 7.8]} />
        <meshStandardMaterial color="#565b5b" roughness={0.95} />
      </mesh>

      <BoxInstances items={building.bodies} color={CONCRETE} roughness={0.83} castShadow receiveShadow />
      <BoxInstances items={building.towerBodies} color={TOWER_CONCRETE} roughness={0.86} castShadow receiveShadow />
      <mesh position={[0, BODY_HEIGHT / 2 + 1.45, 36]} castShadow receiveShadow>
        <boxGeometry args={[15.5, BODY_HEIGHT + 2.9, 22.5]} />
        <meshStandardMaterial color={DARK_CORE} roughness={0.96} />
      </mesh>
      <BoxInstances items={building.roofCaps} color={ROOF} roughness={0.74} />
      <BoxInstances items={building.parapets} color={LIGHT_CONCRETE} roughness={0.8} castShadow />
      <BoxInstances items={building.frontBands} color={LIGHT_CONCRETE} roughness={0.8} castShadow />

      <BoxInstances items={building.terracotta} color={TERRACOTTA} roughness={0.76} />
      <BoxInstances items={building.windows} color={GLASS} emissive="#14232b" emissiveIntensity={0.24} metalness={0.48} roughness={0.22} />
      <BoxInstances items={building.tops} color={LIGHT_CONCRETE} roughness={0.8} castShadow />
      <BoxInstances items={building.fins} color={LIGHT_CONCRETE} roughness={0.8} castShadow />

      <BoxInstances items={building.rear.frames} color={TERRACOTTA} roughness={0.76} />
      <BoxInstances items={building.rear.glass} color={GLASS} emissive="#14232b" emissiveIntensity={0.2} metalness={0.45} roughness={0.24} />
      <BoxInstances items={building.leftTowerGlass} color={GLASS} metalness={0.5} roughness={0.2} />
      <BoxInstances items={building.stairTowerGlass} color={GLASS} emissive="#182830" emissiveIntensity={0.2} metalness={0.55} roughness={0.18} />
      <BoxInstances items={building.stairMullions} color={LIGHT_CONCRETE} roughness={0.8} />
      <BoxInstances items={building.coreSlits} color="#25292b" roughness={0.38} />
      <BoxInstances items={building.sideFrames} color={TERRACOTTA} roughness={0.76} />
      <BoxInstances items={building.sideGlass} color={GLASS} metalness={0.5} roughness={0.2} />
      <BoxInstances items={building.rooftop} color="#aaa39a" roughness={0.84} castShadow />

      <BoxInstances items={landscaping.hedge} color="#315f32" roughness={1} castShadow />
      <CylinderInstances items={landscaping.trunks} color="#63513b" radialSegments={8} roughness={0.94} castShadow />
      <IcoInstances items={landscaping.shrubs} color="#3d713b" castShadow />
      <BoxInstances items={landscaping.curb.filter((_, index) => index % 2 === 0)} color="#d57798" roughness={0.9} />
      <BoxInstances items={landscaping.curb.filter((_, index) => index % 2 === 1)} color="#e7d9c4" roughness={0.9} />
    </group>
  );
}
