import { useLayoutEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { useVideoConfig } from "remotion";
import { roster, type BuilderCard } from "../data";
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
  lookY,
  fov,
}: {
  x: number;
  y: number;
  z: number;
  lookY: number;
  fov: number;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.fov = fov;
    camera.position.set(x, y, z);
    camera.lookAt(0, lookY, 0);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z, lookY, fov]);
  return null;
}

function Particles({ frame }: { frame: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        x: ((i * 47) % 100) / 14 - 3.4,
        y: ((i * 29) % 100) / 10 - 5,
        z: -0.4 - (i % 5) * 0.35,
      })),
    [],
  );
  return (
    <>
      {seeds.map((p, i) => {
        const drift = Math.sin((frame + i * 9) * 0.07) * 0.06;
        return (
          <mesh key={i} position={[p.x, p.y + drift, p.z]}>
            <planeGeometry args={[0.045, 0.045]} />
            <meshBasicMaterial color="#C8FF00" />
          </mesh>
        );
      })}
    </>
  );
}

function CardMesh({ card, x, y, map }: { card: BuilderCard; x: number; y: number; map: THREE.Texture }) {
  return (
    <mesh position={[x, y, 0]}>
      <planeGeometry args={[1.05, 0.59]} />
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
  const cols = layout === "vertical" ? 2 : 4;
  const rows = Math.ceil(roster.length / cols);
  const gapX = 1.22;
  const gapY = 0.74;
  const local = frame - shot.from;
  const t = ramp(local, shot.dur, shot.ramp);
  const row = shot.from % rows;
  const lookY = ((rows - 1) / 2 - row) * gapY;
  const span = (cols - 1) * gapX + 1.2;
  const fov = layout === "vertical" ? 28 : 32;
  const aspect = width / height;
  const fitZ = span / (2 * Math.tan((fov * Math.PI) / 360) * aspect);
  const z = shot.fast ? fitZ * (1.35 - t * 0.45) : fitZ * (1.08 - t * 0.08);

  return (
    <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["#050505"]} />
      <CameraRig x={0} y={lookY} z={z} lookY={lookY} fov={fov} />
      <Particles frame={frame} />
      {textures
        ? roster.map((card, i) => {
            const col = i % cols;
            const r = Math.floor(i / cols);
            const x = (col - (cols - 1) / 2) * gapX;
            const y = ((rows - 1) / 2 - r) * gapY;
            const map = textures.get(card.username);
            if (!map) return null;
            return <CardMesh key={card.username} card={card} x={x} y={y} map={map} />;
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

  const t = 1 - (1 - Math.min(1, local / Math.max(1, dur * 0.72))) ** 3;

  return (
    <ThreeCanvas width={width} height={height} dpr={1} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={["#050505"]} />
      <CameraRig x={0} y={0} z={z} lookY={0} fov={fov} />
      {slices.map((slice, i) => {
        const w = totalW * slice.width;
        const locked = -totalW / 2 + SLICES.slice(0, i).reduce((s, n) => s + totalW * n.width, 0) + w / 2;
        const x = locked + (1 - t) * (i - 1) * 1.7;
        const z = (1 - t) * 1.1 * (i === 1 ? -1 : 1);
        const rot = (1 - t) * 0.55 * (i - 1);
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
