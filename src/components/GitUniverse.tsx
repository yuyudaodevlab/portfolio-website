"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import * as THREE from "three";
import "./git-universe.css";

type Point = { graph: [number, number, number]; grid: [number, number, number]; label?: string; kind?: "head" | "commit" | "merge"; tint?: string };

const points: Point[] = [
  { graph: [-3.35, -1.5, 0.5], grid: [-3.55, 0, 0], label: "HEAD", kind: "head" },
  { graph: [-2.65, -1.35, 0.65], grid: [-2.45, 0, 0] },
  { graph: [-1.9, -0.92, 0.45], grid: [-1.2, 0, 0] },
  { graph: [-1.1, -0.34, 0.05], grid: [0, 0, 0] },
  { graph: [-0.25, 0.34, -0.42], grid: [1.2, 0, 0] },
  { graph: [0.65, 1.06, -0.55], grid: [2.4, 0, 0] },
  { graph: [1.55, 1.56, -0.24], grid: [3.55, 0, 0], kind: "merge" },
  { graph: [2.25, 1.72, 0.12], grid: [4.45, 0, 0] },
  { graph: [3.05, 1.53, 0.48], grid: [5.3, 0, 0], label: "release", kind: "head" },
  { graph: [-2.25, -0.3, 0.9], grid: [-2.45, 0.9, 0] },
  { graph: [-1.68, 0.5, 1.05], grid: [-1.2, 0.9, 0] },
  { graph: [-0.91, 1.42, 0.82], grid: [0, 0.9, 0] },
  { graph: [-0.1, 1.82, 0.36], grid: [1.2, 0.9, 0] },
  { graph: [0.72, 1.78, -0.04], grid: [2.4, 0.9, 0] },
  { graph: [1.55, 1.56, -0.24], grid: [3.55, 0, 0], kind: "merge" },
  { graph: [-1.05, -1.62, 0.03], grid: [0, -0.9, 0] },
  { graph: [-0.4, -1.98, 0.34], grid: [1.2, -0.9, 0] },
  { graph: [0.36, -1.89, 0.72], grid: [2.4, -0.9, 0] },
  { graph: [1.1, -0.95, 0.8], grid: [3.55, -0.9, 0] },
  { graph: [1.55, 1.56, -0.24], grid: [3.55, 0, 0], kind: "merge" },
  { graph: [-1.55, 0.15, -0.36], grid: [-1.2, 1.8, 0], tint: "#d8b4fe" },
  { graph: [-0.92, 0.78, -0.61], grid: [0, 1.8, 0], tint: "#d8b4fe" },
  { graph: [-0.18, 1.24, -0.52], grid: [1.2, 1.8, 0], tint: "#d8b4fe" },
];
const branches = [
  { nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8], color: "#a78bfa", name: "main" },
  { nodes: [2, 9, 10, 11, 12, 13, 14], color: "#46e7ff", name: "feature/design" },
  { nodes: [3, 15, 16, 17, 18, 19], color: "#88f7be", name: "feature/ai" },
  { nodes: [2, 20, 21, 22, 14], color: "#d8b4fe", name: "develop" },
];

function GitScene({ progress, pointer, visible }: { progress: React.MutableRefObject<number>; pointer: React.MutableRefObject<[number, number]>; visible: React.MutableRefObject<boolean> }) {
  const root = useRef<THREE.Group>(null);
  const nodeRefs = useRef<(THREE.Group | null)[]>([]);
  const lineRefs = useRef<(THREE.Mesh | null)[]>([]);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const { viewport, camera, invalidate } = useThree();
  const pointPositions = useMemo(() => points.map((point) => new THREE.Vector3(...point.graph)), []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const curves = useMemo(() => branches.map(() => new THREE.CatmullRomCurve3()), []);
  const tubeParams = useMemo(() => branches.map((branch) => ({ color: new THREE.Color(branch.color), radius: branch.name === "main" ? 0.027 : 0.021, reveal: branch.name === "main" ? 0.76 : 0.64 })), []);

  useEffect(() => {
    const onInvalidate = () => { if (visible.current) invalidate(); };
    window.addEventListener("git-universe-invalidate", onInvalidate);
    return () => window.removeEventListener("git-universe-invalidate", onInvalidate);
  }, [invalidate, visible]);

  useFrame((_, delta) => {
    const p = THREE.MathUtils.smoothstep(progress.current, 0, 0.08);
    const group = root.current;
    if (!group) return;
    const fit = Math.min(1.28, Math.max(0.78, viewport.width / 7.4));
    group.scale.setScalar(THREE.MathUtils.lerp(1.03, 0.76, p) * fit);
    group.position.set(THREE.MathUtils.lerp(0, -0.04, p), THREE.MathUtils.lerp(0.06, 0, p), 0);
    const targetY = pointer.current[0] * 0.09 * (1 - p);
    const targetX = -pointer.current[1] * 0.065 * (1 - p) - 0.09 * (1 - p);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, targetY, 4.5, delta);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, targetX, 4.5, delta);
    if (visible.current && (Math.abs(group.rotation.y - targetY) > 0.001 || Math.abs(group.rotation.x - targetX) > 0.001)) invalidate();

    const reveal = THREE.MathUtils.clamp(0.64 + progress.current * 4.5, 0.64, 1);
    points.forEach((point, index) => {
      const position = pointPositions[index].set(...point.graph).lerp(scratch.set(...point.grid), p);
      if (nodeRefs.current[index]) {
        nodeRefs.current[index]!.position.copy(position);
        nodeRefs.current[index]!.visible = reveal >= (index < 9 ? 0.25 + (index / 8) * 0.65 : 0.3 + ((index % 8) / 9) * 0.65);
        const scale = point.kind === "head" || point.kind === "merge" ? 1 : 0.82;
        nodeRefs.current[index]!.scale.setScalar(scale * THREE.MathUtils.clamp((reveal - 0.28) * 6, 0, 1));
      }
    });
    branches.forEach((branch, index) => {
      const path = branch.nodes.map((nodeIndex) => pointPositions[nodeIndex]);
      const curve = curves[index];
      curve.points = path;
      curve.curveType = "catmullrom";
      curve.tension = 0.52;
      const params = tubeParams[index];
      const branchReveal = THREE.MathUtils.clamp(reveal + (branch.name === "main" ? 0.16 : 0), 0.15, 1);
      const visiblePath = curve.getPoints(Math.max(4, Math.round((path.length - 1) * 12 * branchReveal)));
      [lineRefs.current[index], glowRefs.current[index]].forEach((mesh, layer) => {
        if (!mesh) return;
        const radius = params.radius * (layer ? 3.5 : 1);
        const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(visiblePath), visiblePath.length * 2, radius, 10, false);
        mesh.geometry.dispose();
        mesh.geometry = geometry;
        mesh.visible = true;
      });
    });
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.position.x = THREE.MathUtils.lerp(0, -0.18, p);
    perspective.position.y = THREE.MathUtils.lerp(0, -0.12, p);
    perspective.position.z = THREE.MathUtils.lerp(10.6, 8.25, p);
    perspective.lookAt(0, 0.02, 0);
  });

  return <group ref={root}>
    {branches.map((branch, index) => <group key={`branch-${branch.name}`}>
      <mesh ref={(el) => { glowRefs.current[index] = el; }}><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0.001, 0, 0)]), 1, 0.01, 8, false]} /><meshBasicMaterial color={branch.color} transparent opacity={0.11} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      <mesh ref={(el) => { lineRefs.current[index] = el; }}><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0.001, 0, 0)]), 1, 0.01, 8, false]} /><meshBasicMaterial color={branch.color} transparent opacity={branch.name === "main" ? 0.94 : 0.86} depthWrite={false} /></mesh>
    </group>)}
    {points.map((point, index) => {
      const color = point.tint ?? (point.kind === "merge" ? "#e8dcff" : branches.find((branch) => branch.nodes.includes(index))?.color ?? "#a78bfa");
      return <group key={`node-${index}`} ref={(el) => { nodeRefs.current[index] = el; }}>
        <mesh><sphereGeometry args={[point.kind === "head" ? 0.105 : 0.082, 18, 18]} /><meshStandardMaterial color={point.kind === "head" ? "#ffffff" : color} emissive={color} emissiveIntensity={point.kind === "head" ? 1.2 : 0.95} roughness={0.18} metalness={0.2} /></mesh>
        <mesh scale={point.kind === "head" ? 1 : 0.75}><sphereGeometry args={[point.kind === "head" ? 0.19 : 0.135, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
        {(point.kind === "head" || point.kind === "merge") && <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[point.kind === "head" ? 0.19 : 0.14, 0.014, 8, 36]} /><meshBasicMaterial color={point.kind === "head" ? "#ffffff" : color} transparent opacity={0.88} /></mesh>}
        {point.label && <Html distanceFactor={8} position={[0, point.label === "HEAD" ? -0.3 : 0.3, 0]} center><span className="git-u-label">{point.label}</span></Html>}
      </group>;
    })}
    <Html distanceFactor={8} position={[-1.5, 1.92, 0.7]} center><span className="git-u-branch git-u-branch-cyan">feature/design</span></Html>
    <Html distanceFactor={8} position={[0.25, 0.95, -0.55]} center><span className="git-u-branch git-u-branch-violet">develop</span></Html>
    <Html distanceFactor={8} position={[-2.7, -1.65, 0.5]} center><span className="git-u-branch git-u-branch-violet">main</span></Html>
    <Html distanceFactor={8} position={[0.55, -2.16, 0.68]} center><span className="git-u-branch git-u-branch-green">feature/ai</span></Html>
    <Html distanceFactor={8} position={[1.45, 1.25, 0.2]} center><span className="git-u-pr">PR&nbsp; merged <i>✓</i></span></Html>
  </group>;
}

function GitGraphSvg() {
  return <svg className="git-u-svg" viewBox="0 0 640 500" role="img" aria-label="Git branches main, feature design, and feature ai merge into release">
    <defs><filter id="git-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" filter="url(#git-glow)">
      <path d="M64 385 C160 360 220 322 280 267 S427 147 574 102" stroke="#a78bfa"/><path d="M182 339 C211 300 223 215 285 176 S399 163 462 220" stroke="#46e7ff"/><path d="M245 289 C284 337 300 408 367 398 S429 299 462 220" stroke="#88f7be"/><path d="M214 328 C254 285 283 224 341 215 S421 203 462 220" stroke="#d8b4fe"/>
    </g><g fill="#100e1c" strokeWidth="3">{[[64,385,"#fff"],[142,365,"#a78bfa"],[220,322,"#a78bfa"],[280,267,"#a78bfa"],[356,208,"#a78bfa"],[427,147,"#d8caff"],[500,125,"#a78bfa"],[574,102,"#fff"],[285,176,"#46e7ff"],[351,164,"#46e7ff"],[405,181,"#46e7ff"],[367,398,"#88f7be"],[423,299,"#88f7be"],[341,215,"#d8b4fe"]].map(([x,y,c],i)=><circle key={i} cx={x} cy={y} r={i===0||i===7?8:6} stroke={String(c)}/>)}</g>
    <g fill="#e7e4f3" fontFamily="ui-monospace,monospace" fontSize="12"><text x="42" y="414">HEAD</text><text x="265" y="145" fill="#46e7ff">feature/design</text><text x="350" y="432" fill="#88f7be">feature/ai</text><text x="326" y="195" fill="#d8b4fe">develop</text><text x="114" y="354" fill="#d8b4fe">main</text><text x="554" y="82">release</text></g>
    <rect x="409" y="235" width="92" height="24" rx="12" fill="#201c33" stroke="#51436f"/><text x="422" y="251" fill="#e7e4f3" fontFamily="ui-monospace,monospace" fontSize="10">PR · merged</text>
  </svg>;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.setState({ failed: true }); }
  render() { return this.state.failed ? <GitGraphSvg /> : this.props.children; }
}

export default function GitUniverse() {
  const host = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const progress = useRef(0);
  const pointer = useRef<[number, number]>([0, 0]);
  const [fallback, setFallback] = useState(false);
  const [motionReduced, setMotionReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const cleanupWebGL = useRef<null | (() => void)>(null);
  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); setFallback(true); };
    canvas.addEventListener("webglcontextlost", lost);
    cleanupWebGL.current?.();
    cleanupWebGL.current = () => canvas.removeEventListener("webglcontextlost", lost);
    setReady(true);
  }, []);
  useEffect(() => () => cleanupWebGL.current?.(), []);
  useEffect(() => {
    const element = host.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting) window.dispatchEvent(new Event("git-universe-invalidate"));
    }, { rootMargin: "100px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionReduced(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const onProgress = (event: Event) => {
      const value = (event as CustomEvent<number>).detail;
      progress.current = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
      window.dispatchEvent(new Event("git-universe-invalidate"));
    };
    window.addEventListener("portfolio-progress", onProgress);
    return () => window.removeEventListener("portfolio-progress", onProgress);
  }, []);
  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current = [(event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1];
    window.dispatchEvent(new Event("git-universe-invalidate"));
  };
  const resetPointer = () => { pointer.current = [0, 0]; window.dispatchEvent(new Event("git-universe-invalidate")); };

  return <div ref={host} className="git-universe" aria-label="Interactive visualization of a Git branch graph" onPointerMove={handlePointer} onPointerLeave={resetPointer}>
    {fallback || motionReduced ? <GitGraphSvg /> : <CanvasErrorBoundary><Canvas className="git-universe-canvas" frameloop="demand" dpr={[1, 1.6]} camera={{ position: [0, 0, 10.6], fov: 38 }} gl={{ alpha: true, antialias: true }} onCreated={onCreated} fallback={<GitGraphSvg />}>
      <ambientLight intensity={1.25} /><pointLight position={[-4, 4, 4]} intensity={2} color="#a78bfa" />
      <GitScene progress={progress} pointer={pointer} visible={visible} />
    </Canvas></CanvasErrorBoundary>}
    {!ready && !fallback && !motionReduced && <div className="git-u-static"><GitGraphSvg /></div>}
  </div>;
}
