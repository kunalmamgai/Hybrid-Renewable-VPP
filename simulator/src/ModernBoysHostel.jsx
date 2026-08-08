import { useMemo } from "react";
import { BoxInstances, CylinderInstances } from "./ScenePrimitives";

export function ModernBoysHostel() {
  // Building dimensions: 110m long x 22m wide x 28m tall (8 floors)
  const floorHeight = 3.5;
  const buildingLength = 110;
  const buildingWidth = 22;
  const buildingHeight = 28;

  // Main structural form
  const mainWall = useMemo(
    () => [
      {
        position: [0, buildingHeight / 2, 0],
        scale: [buildingLength, buildingHeight, buildingWidth],
      },
    ],
    [],
  );

  // Horizontal floor groove lines (7 grooves for 8 floors)
  const floorGrooves = useMemo(() => {
    const grooves = [];
    for (let floor = 1; floor < 8; floor += 1) {
      grooves.push({
        position: [0, floor * floorHeight, buildingWidth / 2 + 0.08],
        scale: [buildingLength + 0.2, 0.16, 0.4],
      });
      grooves.push({
        position: [0, floor * floorHeight, -buildingWidth / 2 - 0.08],
        scale: [buildingLength + 0.2, 0.16, 0.4],
      });
    }
    return grooves;
  }, []);

  // Window grid (perfect repetitive grid)
  // 7 windows per bay, 8 floors, multiple bays across length
  const windowGrid = useMemo(() => {
    const windows = [];
    const baysAlong = Math.floor(buildingLength / 3.5); // ~31 bays
    const windowsPerBay = 3;
    const windowSize = 1.2;
    const windowSpacing = 3.2;

    // Front facade windows
    for (let floor = 0; floor < 8; floor += 1) {
      const yPos = 1.8 + floor * floorHeight;
      for (let x = 0; x < buildingLength; x += windowSpacing) {
        const xPos = -buildingLength / 2 + 2.2 + x;
        if (Math.abs(xPos) < buildingLength / 2 - 3) {
          windows.push({
            position: [xPos, yPos, buildingWidth / 2 + 0.12],
            scale: [windowSize, windowSize, 0.15],
          });
        }
      }
    }

    // Back facade windows (same pattern)
    for (let floor = 0; floor < 8; floor += 1) {
      const yPos = 1.8 + floor * floorHeight;
      for (let x = 0; x < buildingLength; x += windowSpacing) {
        const xPos = -buildingLength / 2 + 2.2 + x;
        if (Math.abs(xPos) < buildingLength / 2 - 3) {
          windows.push({
            position: [xPos, yPos, -buildingWidth / 2 - 0.12],
            scale: [windowSize, windowSize, 0.15],
          });
        }
      }
    }

    return windows;
  }, []);

  // RED FEATURE PANELS - signature architectural elements
  // Asymmetrically placed with different floor spans
  const redFeaturePanels = useMemo(
    () => [
      // Panel 1: spans 3 floors (left side, lower)
      {
        position: [-36, 7.8, buildingWidth / 2 + 0.32],
        scale: [10.2, 10.8, 0.48],
      },
      // Panel 2: spans 4 floors (center-left, middle)
      {
        position: [-14, 10.2, buildingWidth / 2 + 0.32],
        scale: [8.8, 14.2, 0.48],
      },
      // Panel 3: spans 2 floors (center, upper)
      {
        position: [12, 16.4, buildingWidth / 2 + 0.32],
        scale: [9.4, 7.2, 0.48],
      },
      // Panel 4: spans 3 floors (right-center, middle)
      {
        position: [32, 8.8, buildingWidth / 2 + 0.32],
        scale: [11.2, 10.8, 0.48],
      },
      // Panel 5: spans 4 floors (far right, upper)
      {
        position: [48, 11.8, buildingWidth / 2 + 0.32],
        scale: [9.8, 14.2, 0.48],
      },

      // Matching panels on back facade (but fewer)
      {
        position: [-28, 9.2, -buildingWidth / 2 - 0.32],
        scale: [9.6, 11.2, 0.48],
      },
      {
        position: [24, 12.2, -buildingWidth / 2 - 0.32],
        scale: [10.4, 13.8, 0.48],
      },
    ],
    [],
  );

  // Black vertical aluminium fins inside red frames
  const blackFins = useMemo(
    () => [
      // Fins for panel 1
      { position: [-42, 7.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },
      { position: [-36, 7.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },
      { position: [-30, 7.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },
      { position: [-24, 7.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },

      // Fins for panel 2
      { position: [-18, 10.2, buildingWidth / 2 + 0.8], scale: [0.26, 13.8, 0.6] },
      { position: [-10, 10.2, buildingWidth / 2 + 0.8], scale: [0.26, 13.8, 0.6] },

      // Fins for panel 3
      { position: [8, 16.4, buildingWidth / 2 + 0.8], scale: [0.26, 7.0, 0.6] },
      { position: [14, 16.4, buildingWidth / 2 + 0.8], scale: [0.26, 7.0, 0.6] },
      { position: [18, 16.4, buildingWidth / 2 + 0.8], scale: [0.26, 7.0, 0.6] },

      // Fins for panel 4
      { position: [26, 8.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },
      { position: [32, 8.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },
      { position: [38, 8.8, buildingWidth / 2 + 0.8], scale: [0.26, 10.6, 0.6] },

      // Fins for panel 5
      { position: [43, 11.8, buildingWidth / 2 + 0.8], scale: [0.26, 13.6, 0.6] },
      { position: [50, 11.8, buildingWidth / 2 + 0.8], scale: [0.26, 13.6, 0.6] },
      { position: [56, 11.8, buildingWidth / 2 + 0.8], scale: [0.26, 13.6, 0.6] },

      // Back facade fins
      { position: [-32, 9.2, -buildingWidth / 2 - 0.8], scale: [0.26, 10.8, 0.6] },
      { position: [-24, 9.2, -buildingWidth / 2 - 0.8], scale: [0.26, 10.8, 0.6] },

      { position: [19, 12.2, -buildingWidth / 2 - 0.8], scale: [0.26, 13.4, 0.6] },
      { position: [28, 12.2, -buildingWidth / 2 - 0.8], scale: [0.26, 13.4, 0.6] },
    ],
    [],
  );

  // Vertical stair towers - recessed dark grey
  const stairTowers = useMemo(
    () => [
      {
        position: [-38, buildingHeight / 2, 0],
        scale: [4.8, buildingHeight - 1.2, 3.2],
      },
      {
        position: [0, buildingHeight / 2, 0],
        scale: [4.2, buildingHeight - 1.2, 3.2],
      },
      {
        position: [38, buildingHeight / 2, 0],
        scale: [4.8, buildingHeight - 1.2, 3.2],
      },
    ],
    [],
  );

  // Stair tower glazing
  const stairGlazing = useMemo(
    () => [
      {
        position: [-38, buildingHeight / 2, buildingWidth / 2 + 0.18],
        scale: [4.6, buildingHeight - 2.2, 0.18],
      },
      {
        position: [0, buildingHeight / 2, buildingWidth / 2 + 0.18],
        scale: [4.0, buildingHeight - 2.2, 0.18],
      },
      {
        position: [38, buildingHeight / 2, buildingWidth / 2 + 0.18],
        scale: [4.6, buildingHeight - 2.2, 0.18],
      },
    ],
    [],
  );

  // Ground floor lobby and entrance
  const entranceCanopy = useMemo(
    () => [
      {
        position: [0, 3.2, buildingWidth / 2 + 1.8],
        scale: [buildingLength + 2, 0.56, 6.4],
      },
      {
        position: [0, 6.2, buildingWidth / 2 + 1.8],
        scale: [buildingLength - 8, 4.8, 0.92],
      },
    ],
    [],
  );

  // Canopy support columns
  const canopyColumns = useMemo(() => {
    const cols = [];
    for (let x = -buildingLength / 2 + 10; x < buildingLength / 2; x += 12) {
      cols.push({
        position: [x, 4.8, buildingWidth / 2 + 3.8],
        scale: [0.42, 7.2, 0.42],
      });
    }
    return cols;
  }, []);

  // Roof elements
  const roofSlab = useMemo(
    () => [
      {
        position: [0, buildingHeight + 0.12, 0],
        scale: [buildingLength + 0.8, 0.24, buildingWidth + 0.8],
      },
    ],
    [],
  );

  // Parapet walls
  const parapets = useMemo(
    () => [
      {
        position: [0, buildingHeight + 0.6, buildingWidth / 2 + 0.2],
        scale: [buildingLength + 0.8, 1.2, 0.6],
      },
      {
        position: [0, buildingHeight + 0.6, -buildingWidth / 2 - 0.2],
        scale: [buildingLength + 0.8, 1.2, 0.6],
      },
      {
        position: [buildingLength / 2 + 0.2, buildingHeight + 0.6, 0],
        scale: [0.6, 1.2, buildingWidth + 1.2],
      },
      {
        position: [-buildingLength / 2 - 0.2, buildingHeight + 0.6, 0],
        scale: [0.6, 1.2, buildingWidth + 1.2],
      },
    ],
    [],
  );

  // Rooftop service rooms
  const roofServices = useMemo(
    () => [
      {
        position: [-32, buildingHeight + 2.2, 0],
        scale: [14.2, 4.4, 6.8],
      },
      {
        position: [24, buildingHeight + 2.4, 0],
        scale: [12.8, 4.8, 6.2],
      },
    ],
    [],
  );

  // Site ground
  const siteGround = useMemo(
    () => [
      {
        position: [0, 0.06, 0],
        scale: [buildingLength + 18, 0.12, buildingWidth + 28],
      },
    ],
    [],
  );

  return (
    <group>
      {/* Main wall structure */}
      <BoxInstances items={mainWall} color="#d9d6d1" roughness={0.88} castShadow receiveShadow />

      {/* Floor grooves */}
      <BoxInstances items={floorGrooves} color="#8b8885" roughness={0.8} />

      {/* Window grid */}
      <BoxInstances items={windowGrid} color="#1a1a1a" metalness={0.3} roughness={0.2} castShadow />

      {/* Red feature panels */}
      <BoxInstances items={redFeaturePanels} color="#e74c3c" roughness={0.68} castShadow />

      {/* Black vertical fins */}
      <BoxInstances items={blackFins} color="#0d0d0d" roughness={0.5} castShadow />

      {/* Stair towers - dark grey */}
      <BoxInstances items={stairTowers} color="#5a5a56" roughness={0.82} castShadow />

      {/* Stair tower glazing */}
      <BoxInstances items={stairGlazing} color="#0e1419" metalness={0.8} roughness={0.12} />

      {/* Entrance canopy - light grey/cream */}
      <BoxInstances items={entranceCanopy} color="#d4d0c8" roughness={0.86} castShadow />

      {/* Canopy columns - dark grey */}
      <BoxInstances items={canopyColumns} color="#3d3d39" roughness={0.6} castShadow />

      {/* Roof slab */}
      <BoxInstances items={roofSlab} color="#7a7a76" roughness={0.78} castShadow receiveShadow />

      {/* Parapets */}
      <BoxInstances items={parapets} color="#8a8985" roughness={0.8} castShadow />

      {/* Roof service rooms */}
      <BoxInstances items={roofServices} color="#6b6b67" roughness={0.8} castShadow />

      {/* Site ground */}
      <BoxInstances items={siteGround} color="#9a9894" roughness={0.94} receiveShadow />
    </group>
  );
}
