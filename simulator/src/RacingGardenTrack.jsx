import { useMemo } from "react";
import { BoxInstances, CylinderInstances, SphereInstances } from "./ScenePrimitives";

export function RacingGardenTrack() {
  // Racing garden positioned between Boys Hostel Block-1 and Blocks 2-5
  // Space: roughly 180m along Z-axis

  // Main ground surface
  const groundPlane = useMemo(
    () => [
      {
        position: [0, 0.06, 0],
        scale: [140, 0.12, 180],
      },
    ],
    [],
  );

  const trackRadius = 30;
  const trackWidth = 10;
  const trackBaseY = 0.12;
  const trackInnerRadius = trackRadius - trackWidth;
  const trackOuterRadius = trackRadius + trackWidth;

  const trackAccessPath = useMemo(
    () => [
      {
        position: [0, 0.1, trackOuterRadius + 15],
        scale: [trackOuterRadius * 1.3, 0.08, 8],
      },
      {
        position: [0, 0.1, -trackOuterRadius - 15],
        scale: [trackOuterRadius * 1.3, 0.08, 8],
      },
    ],
    [trackOuterRadius],
  );

  const trackSegments = useMemo(() => {
    const segments = [];
    const segmentCount = 48;
    const segmentLength = (2 * Math.PI * trackRadius) / segmentCount;

    for (let i = 0; i < segmentCount; i += 1) {
      const angle = (Math.PI * 2 * i) / segmentCount;
      const x = Math.cos(angle) * trackRadius;
      const z = Math.sin(angle) * trackRadius;
      segments.push({
        position: [x, trackBaseY + 0.02, z],
        rotation: [0, angle + Math.PI / 2, 0],
        scale: [segmentLength * 1.04, 0.06, trackWidth],
      });
    }
    return segments;
  }, [trackBaseY, trackRadius, trackWidth]);

  const trackBorderSegments = useMemo(() => {
    const borders = [];
    const segmentCount = 32;
    const borderLength = (2 * Math.PI * trackInnerRadius) / segmentCount;
    const borderWidth = 0.25;
    for (let i = 0; i < segmentCount; i += 1) {
      const angle = (Math.PI * 2 * i) / segmentCount;
      const x = Math.cos(angle) * trackInnerRadius;
      const z = Math.sin(angle) * trackInnerRadius;
      borders.push({
        position: [x, trackBaseY + 0.04, z],
        rotation: [0, angle + Math.PI / 2, 0],
        scale: [borderLength, 0.02, borderWidth],
      });
      const xOuter = Math.cos(angle) * trackOuterRadius;
      const zOuter = Math.sin(angle) * trackOuterRadius;
      borders.push({
        position: [xOuter, trackBaseY + 0.04, zOuter],
        rotation: [0, angle + Math.PI / 2, 0],
        scale: [borderLength, 0.02, borderWidth],
      });
    }
    return borders;
  }, [trackBaseY, trackInnerRadius, trackOuterRadius]);

  const trackInnerField = useMemo(
    () => [
      {
        position: [0, trackBaseY, 0],
        scale: [trackInnerRadius * 2, 0.08, trackInnerRadius * 2],
      },
    ],
    [trackBaseY, trackInnerRadius],
  );

  // Basketball court
  const basketballCourt = useMemo(
    () => [
      {
        position: [-35, 0.08, -50],
        scale: [28, 0.12, 15],
      },
    ],
    [],
  );

  // Basketball hoops
  const basketballHoops = useMemo(
    () => [
      {
        position: [-35, 3.2, -44],
        scale: [0.18, 0.18, 0.18],
      },
      {
        position: [-35, 3.2, -56],
        scale: [0.18, 0.18, 0.18],
      },
    ],
    [],
  );

  // Hoop support poles
  const hoopPoles = useMemo(
    () => [
      {
        position: [-35, 1.6, -44],
        scale: [0.3, 3.2, 0.3],
      },
      {
        position: [-35, 1.6, -56],
        scale: [0.3, 3.2, 0.3],
      },
    ],
    [],
  );

  // Tennis courts
  const tennisCourts = useMemo(
    () => [
      {
        position: [35, 0.08, -50],
        scale: [26, 0.12, 18],
      },
    ],
    [],
  );

  // Tennis net posts
  const tennisNets = useMemo(
    () => [
      {
        position: [35, 0.8, -40],
        scale: [25, 1.6, 0.18],
      },
      {
        position: [35, 0.8, -60],
        scale: [25, 1.6, 0.18],
      },
    ],
    [],
  );

  // Grass areas - garden
  const grassArea = useMemo(
    () => [
      {
        position: [-40, 0.08, 40],
        scale: [50, 0.12, 50],
      },
      {
        position: [40, 0.08, 40],
        scale: [50, 0.12, 50],
      },
      {
        position: [0, 0.08, -80],
        scale: [100, 0.12, 30],
      },
    ],
    [],
  );

  // Pathways and walkways
  const pathways = useMemo(
    () => [
      {
        position: [0, 0.1, -30],
        scale: [140, 0.08, 3],
      },
      {
        position: [-50, 0.1, 0],
        scale: [3, 0.08, 80],
      },
      {
        position: [50, 0.1, 0],
        scale: [3, 0.08, 80],
      },
    ],
    [],
  );

  // Benches and seating areas
  const benches = useMemo(() => {
    const seatList = [];
    const positions = [
      [-60, 5],
      [-60, 25],
      [60, 5],
      [60, 25],
      [-20, -70],
      [20, -70],
    ];

    positions.forEach(([x, z]) => {
      seatList.push({
        position: [x, 0.4, z],
        scale: [1.2, 0.6, 0.5],
      });
    });

    return seatList;
  }, []);

  // Trees and vegetation
  const trees = useMemo(() => {
    const treeList = [];
    const positions = [
      [-55, 45],
      [-45, 50],
      [55, 48],
      [48, 55],
      [-30, -75],
      [35, -75],
      [-65, 15],
      [65, 12],
    ];

    positions.forEach(([x, z]) => {
      treeList.push({
        position: [x, 2.5, z],
        scale: [0.5, 5, 0.5],
      });
    });

    return treeList;
  }, []);

  // Tree foliage
  const foliage = useMemo(() => {
    const foliageList = [];
    const positions = [
      [-55, 45],
      [-45, 50],
      [55, 48],
      [48, 55],
      [-30, -75],
      [35, -75],
      [-65, 15],
      [65, 12],
    ];

    positions.forEach(([x, z]) => {
      foliageList.push({
        position: [x, 5.5, z],
        scale: [3, 3.5, 3],
      });
    });

    return foliageList;
  }, []);

  // Street lights and poles
  const lightPoles = useMemo(() => {
    const poles = [];
    for (let z = -60; z <= 60; z += 25) {
      poles.push({
        position: [-65, 4, z],
        scale: [0.2, 8, 0.2],
      });
      poles.push({
        position: [65, 4, z],
        scale: [0.2, 8, 0.2],
      });
    }
    return poles;
  }, []);

  // Light fixtures
  const lightFixtures = useMemo(() => {
    const fixtures = [];
    for (let z = -60; z <= 60; z += 25) {
      fixtures.push({
        position: [-65, 7.8, z],
        scale: [0.4, 0.3, 0.4],
      });
      fixtures.push({
        position: [65, 7.8, z],
        scale: [0.4, 0.3, 0.4],
      });
    }
    return fixtures;
  }, []);

  // Fencing around the garden
  const fence = useMemo(
    () => [
      {
        position: [-68, 1.2, 0],
        scale: [0.6, 2.4, 180],
      },
      {
        position: [68, 1.2, 0],
        scale: [0.6, 2.4, 180],
      },
    ],
    [],
  );

  // Entry gates
  const gates = useMemo(
    () => [
      {
        position: [-30, 1, -85],
        scale: [6, 2.2, 0.3],
      },
      {
        position: [30, 1, -85],
        scale: [6, 2.2, 0.3],
      },
    ],
    [],
  );

  return (
    <group>
      {/* Ground */}
      <BoxInstances items={groundPlane} color="#8b9467" roughness={0.94} receiveShadow />

      {/* Track surface */}
      <BoxInstances items={trackInnerField} color="#467a21" roughness={0.9} castShadow />
      <BoxInstances items={trackSegments} color="#d32f2f" roughness={0.7} castShadow />
      <BoxInstances items={trackBorderSegments} color="#ffffff" roughness={0.6} castShadow />
      <BoxInstances items={trackAccessPath} color="#a0a09a" roughness={0.88} castShadow receiveShadow />

      {/* Basketball court */}
      <BoxInstances items={basketballCourt} color="#d4af37" roughness={0.8} castShadow />
      <BoxInstances items={hoopPoles} color="#1a1a1a" roughness={0.5} castShadow />
      <BoxInstances items={basketballHoops} color="#ff6600" roughness={0.5} castShadow />

      {/* Tennis courts */}
      <BoxInstances items={tennisCourts} color="#4a90e2" roughness={0.8} castShadow />
      <BoxInstances items={tennisNets} color="#cccccc" roughness={0.6} castShadow />

      {/* Grass and garden areas */}
      <BoxInstances items={grassArea} color="#6b9f3d" roughness={0.96} castShadow receiveShadow />

      {/* Pathways */}
      <BoxInstances items={pathways} color="#a0a09a" roughness={0.88} castShadow receiveShadow />

      {/* Seating */}
      <BoxInstances items={benches} color="#8b4513" roughness={0.7} castShadow />

      {/* Trees and vegetation */}
      <CylinderInstances items={trees} color="#5d4e37" radialSegments={8} castShadow />
      <SphereInstances items={foliage} color="#4d7c3b" roughness={0.96} castShadow />

      {/* Lighting */}
      <CylinderInstances items={lightPoles} color="#2a2a2a" radialSegments={6} castShadow />
      <BoxInstances items={lightFixtures} color="#ffeb3b" metalness={0.6} roughness={0.4} />

      {/* Fencing */}
      <BoxInstances items={fence} color="#4d4d4d" roughness={0.7} castShadow />

      {/* Gates */}
      <BoxInstances items={gates} color="#333333" roughness={0.6} castShadow />
    </group>
  );
}
