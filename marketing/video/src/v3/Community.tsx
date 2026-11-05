import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, useVideoConfig } from "remotion";
import * as THREE from "three";
import { roster, soloBuilder } from "../data";
import type { Layout } from "../timing";
import { useCardTextures } from "../v2/textures";

const EASE = Easing.inOut(Easing.cubic);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / Math.max(0.0001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function place(i: number, layout: Layout) {
  const cols = layout === "vertical" ? 4 : 6;
  const col = i % cols;
  const row = Math.floor(i / cols);
  const rows = Math.ceil(roster.length / cols);
  const gapX = layout === "vertical" ? 1.7 : 1.85;
  const gapY = 1.02;
  const x = (col - (cols - 1) / 2) * gapX;
  const y = ((rows - 1) / 2 - row) * gapY;
  const z = ((i * 5) % 5 - 2) * 0.28;
  return { x, y, z };
}

function CameraRig({
  x,
  y,
  z,
  lookX,
  lookY,
  lookZ,
  fov,
}: {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  fov: number;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = fov;
    camera.position.set(x, y, z);
    camera.lookAt(lookX, lookY, lookZ);
    camera.updateProjectionMatrix();
  }, [camera, fov, lookX, lookY, lookZ, x, y, z]);
  return null;
}

export function CommunityWall({ frame, layout }: { frame: number; layout: Layout }) {
  const { width, height } = useVideoConfig();
  const textures = useCardTextures(roster);
  const hero = Math.max(0, roster.findIndex((b) => b.username === soloBuilder.username));
  const progress = interpolate(frame, [600, 1140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const heroPos = place(hero, layout);
  const dist = interpolate(progress, [0, 1], [4.15, layout === "vertical" ? 10.8 : 9.2]);
  const camX = heroPos.x * (1 - progress);
  const camY = heroPos.y * (1 - progress);
  const camZ = heroPos.z + dist;
  const positions = roster.map((_, i) => place(i, layout));
  const appear = roster.map((_, i) => (i === hero ? 1 : smoothstep(0.06 + (i / roster.length) * 0.78, 0.18 + (i / roster.length) * 0.78, progress)));
  const cols = layout === "vertical" ? 4 : 6;
  const links = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < roster.length; i++) {
      if (i % cols !== cols - 1 && i + 1 < roster.length) pairs.push([i, i + 1]);
      if (i + cols < roster.length) pairs.push([i, i + cols]);
    }
    return pairs;
  }, [cols]);

  return (
    <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["#050505"]} />
      <CameraRig x={camX} y={camY} z={camZ} lookX={camX} lookY={camY} lookZ={heroPos.z} fov={layout === "vertical" ? 38 : 34} />
      {links.map(([a, b]) => {
        const opacity = Math.min(appear[a], appear[b]) * 0.22;
        if (opacity < 0.05) return null;
        const pa = positions[a];
        const pb = positions[b];
        return <Join key={`${a}-${b}`} a={pa} b={pb} opacity={opacity} />;
      })}
      {textures
        ? roster.map((card, i) => {
            if (appear[i] < 0.02) return null;
            const map = textures.get(card.username);
            if (!map) return null;
            const p = positions[i];
            return (
              <mesh key={card.username} position={[p.x, p.y, p.z]}>
                <planeGeometry args={[1.2, 0.68]} />
                <meshBasicMaterial map={map} transparent opacity={appear[i]} toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </ThreeCanvas>
  );
}

function Join({
  a,
  b,
  opacity,
}: {
  a: { x: number; y: number; z: number };
  b: { x: number; y: number; z: number };
  opacity: number;
}) {
  const geom = useMemo(() => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const t = Math.min(0.62, len * 0.32) / len;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x + dx * t, a.y + dy * t, a.z + dz * t),
      new THREE.Vector3(b.x - dx * t, b.y - dy * t, b.z - dz * t),
    ]);
  }, [a.x, a.y, a.z, b.x, b.y, b.z]);
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: "#C8FF00", transparent: true, opacity }),
    [opacity],
  );
  const line = useMemo(() => new THREE.Line(geom, mat), [geom, mat]);
  return <primitive object={line} />;
}
