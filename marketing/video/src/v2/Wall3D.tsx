import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { useVideoConfig } from "remotion";
import { roster } from "../data";
import type { Shot } from "../edit";
import type { Layout } from "../timing";
import { useCardTextures, useLogoTexture } from "./textures";

function ramp(local: number, dur: number, mode: "in" | "out" | undefined) {
  const t = Math.max(0, Math.min(1, local / Math.max(1, dur)));
  if (mode === "out") return 1 - (1 - t) ** 3;
  return t ** 3;
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
  }, [camera, x, y, z, lookX, lookY, lookZ, fov]);
  return null;
}

function Particles({ frame, depth, camZ }: { frame: number; depth: number; camZ: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: ((i * 53) % 100) / 18 - 2.6,
        y: ((i * 37) % 100) / 22 - 2.2,
        z: -((i * 17) % 100) / 100 * depth,
        size: i % 5 === 0 ? 0.11 : 0.07,
      })),
    [depth],
  );
  return (
    <>
      {seeds.map((p, i) => {
        if (p.z > camZ - 1.4) return null;
        const drift = Math.sin((frame + i * 9) * 0.07) * 0.08;
        return (
          <mesh key={i} position={[p.x, p.y + drift, p.z]}>
            <planeGeometry args={[p.size, p.size]} />
            <meshBasicMaterial color="#C8FF00" toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

function CardMesh({
  x,
  y,
  z,
  map,
}: {
  x: number;
  y: number;
  z: number;
  map: THREE.Texture;
}) {
  return (
    <mesh position={[x, y, z]}>
      <planeGeometry args={[1.15, 0.65]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

export function FlyWall({
  frame,
  shot,
  layout,
}: {
  frame: number;
  shot: Shot;
  layout: Layout;
}) {
  const { width, height } = useVideoConfig();
  const textures = useCardTextures(roster);
  const local = frame - shot.from;
  const t = ramp(local, shot.dur, shot.ramp);
  const stride = 2.15;
  const depth = roster.length * stride;
  const lanes = layout === "vertical" ? 1.45 : 2.05;
  const focus = shot.from % roster.length;
  const focusZ = -focus * stride;
  const dist = 6.4 - t * 2.15;
  const camZ = focusZ + dist;
  const camX = Math.sin(shot.from * 0.21) * (layout === "vertical" ? 0.18 : 0.42) * (0.35 + t);
  const camY = Math.cos(shot.from * 0.13) * 0.1;
  const fov = layout === "vertical" ? 42 : 38;

  return (
    <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["#050505"]} />
      <CameraRig x={camX} y={camY} z={camZ} lookX={camX * 0.25} lookY={0} lookZ={camZ - 6} fov={fov} />
      <Particles frame={frame} depth={depth} camZ={camZ} />
      {textures
        ? roster.map((card, i) => {
            const lane = i % 3;
            const x = lane === 0 ? 0 : lane === 1 ? -lanes : lanes;
            const y = lane === 0 ? 0 : ((i % 5) - 2) * 0.32;
            const z = -i * stride;
            if (z > camZ - 1.15) return null;
            const map = textures.get(card.username);
            if (!map) return null;
            return <CardMesh key={card.username} x={x} y={y} z={z} map={map} />;
          })
        : null}
    </ThreeCanvas>
  );
}

const SLICES = [
  { start: 0, width: 0.3 },
  { start: 0.3, width: 0.42 },
  { start: 0.72, width: 0.28 },
];

export function LogoAssemble({ local, dur }: { local: number; dur: number }) {
  const { width, height } = useVideoConfig();
  const source = useLogoTexture();
  const totalW = 4.2;
  const fov = 28;
  const aspect = width / height;
  const z = (totalW * 1.18) / (2 * Math.tan((fov * Math.PI) / 360) * aspect);
  const slices = useMemo(() => {
    if (!source) return [];
    return SLICES.map((slice) => {
      const tex = source.clone();
      tex.repeat.set(slice.width, 1);
      tex.offset.set(slice.start, 0);
      tex.needsUpdate = true;
      return { tex, width: slice.width };
    });
  }, [source]);

  const t = 1 - (1 - Math.min(1, local / 18)) ** 3;

  return (
    <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["#050505"]} />
      <CameraRig x={0} y={0} z={z} lookX={0} lookY={0} lookZ={0} fov={fov} />
      {slices.map((slice, i) => {
        const w = totalW * slice.width;
        const locked = -totalW / 2 + SLICES.slice(0, i).reduce((s, n) => s + totalW * n.width, 0) + w / 2;
        const x = locked + (1 - t) * (i - 1) * 3.6;
        const z = (1 - t) * 2.6 * (i === 1 ? -1 : 1);
        const rot = (1 - t) * 1.15 * (i - 1);
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, rot, 0]} scale={0.86 + 0.14 * t}>
            <planeGeometry args={[w, w / slice.width / 4.1]} />
            <meshBasicMaterial map={slice.tex} transparent toneMapped={false} />
          </mesh>
        );
      })}
    </ThreeCanvas>
  );
}
