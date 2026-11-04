"use client";

import { useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
import * as THREE from "three";

/**
 * The FITX wordmark as real extruded 3D geometry (no font file, no texture):
 * bold geometric caps built from flat outlines, so "FIT" can take a chrome
 * material and "X" the brand orange. Cap height is 1 unit and the word is
 * centred on the origin, sitting in the XY plane with its depth on Z.
 *
 * F, I and T are drawn here by hand; the X is traced vertex-for-vertex from
 * `public/images/fitx/3d/logo-horizontal.png` so it keeps the logo's wide
 * slanted legs, the notched top-right blade and the detached upper-left shard.
 */

type Point = [number, number];

/** Cap height, stem weight and the gap between letters. */
const STEM = 0.21;
const GAP = 0.16;
const DEPTH = 0.18;

const F: Point[] = [
  [0, -0.5],
  [STEM, -0.5],
  [STEM, -0.06],
  [0.44, -0.06],
  [0.44, 0.15],
  [STEM, 0.15],
  [STEM, 0.28],
  [0.6, 0.28],
  [0.6, 0.5],
  [0, 0.5],
];

const I: Point[] = [
  [0, -0.5],
  [STEM, -0.5],
  [STEM, 0.5],
  [0, 0.5],
];

const T: Point[] = [
  [(0.6 - STEM) / 2, -0.5],
  [(0.6 + STEM) / 2, -0.5],
  [(0.6 + STEM) / 2, 0.28],
  [0.6, 0.28],
  [0.6, 0.5],
  [0, 0.5],
  [0, 0.28],
  [(0.6 - STEM) / 2, 0.28],
];

/**
 * The X from the horizontal logo, traced in logo pixels (cap height 132px,
 * baseline y=205) and converted to cap-height units. It stays wider than F, I
 * and T exactly as in the artwork, and its bottom-right leg sits 0.18 below the
 * baseline. Two outlines: the main body and the separate upper-left shard.
 */
const X_BODY: Point[] = [
  [0.886, 0.356],
  [1.242, 0.356],
  [0.841, -0.023],
  [0.841, -0.053],
  [1.576, -0.682],
  [1.136, -0.667],
  [0.629, -0.235],
  [0.341, -0.5],
  [0, -0.5],
];

const X_SHARD: Point[] = [
  [0, 0.364],
  [0.364, 0.356],
  [0.545, 0.205],
  [0.545, 0.182],
  [0.371, 0.03],
  [0.348, 0.03],
];

const GLYPHS: { width: number; outlines: Point[][] }[] = [
  { width: 0.6, outlines: [F] },
  { width: STEM, outlines: [I] },
  { width: 0.6, outlines: [T] },
  { width: 1.583, outlines: [X_BODY, X_SHARD] },
];

let cached: THREE.ExtrudeGeometry[][] | null = null;

function letterGeometries() {
  if (cached) return cached;

  const total = GLYPHS.reduce((sum, g) => sum + g.width, 0) + GAP * (GLYPHS.length - 1);
  let cursor = -total / 2;

  cached = GLYPHS.map(({ width, outlines }) => {
    const shapes = outlines.map((points) => {
      const shape = new THREE.Shape();
      points.forEach(([x, y], i) => {
        if (i === 0) shape.moveTo(x + cursor, y);
        else shape.lineTo(x + cursor, y);
      });
      shape.closePath();
      return shape;
    });
    cursor += width + GAP;

    return shapes.map((shape) => {

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 2,
        curveSegments: 6,
      });
      geometry.translate(0, 0, -DEPTH / 2);
      geometry.computeVertexNormals();
      return geometry;
    });
  });

  return cached;
}

export function FitxWordmark({
  chrome,
  accent,
  ...props
}: { chrome: THREE.Material; accent: THREE.Material } & ThreeElements["group"]) {
  const letters = useMemo(() => letterGeometries(), []);

  return (
    <group {...props}>
      {letters.map((outlines, i) =>
        outlines.map((geometry, j) => (
          <mesh
            key={`${i}-${j}`}
            geometry={geometry}
            material={i === GLYPHS.length - 1 ? accent : chrome}
          />
        )),
      )}
    </group>
  );
}
