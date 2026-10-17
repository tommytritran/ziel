import { Component, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { StoryStage, VehicleKind } from './story';
import { destinationEntry, storyPosition, transitMotion, waitingVehicle } from './story';
import { buildIllustratedRoute } from './routeGeometry';
import type { IllustratedRoute } from './routeGeometry';
import RouteScenery from './RouteScenery';

function RoutePlacement({ route, distance, children }: { route: IllustratedRoute; distance: number; children: ReactNode }) {
  const p = route.sample(distance);
  return <group position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}><group position={[-distance, 0, 0]}>{children}</group></group>;
}

interface Props { stages: StoryStage[]; progress: number; reduced: boolean; onMonitorLayout: (x: number, y: number, width: number, viewportWidth: number) => void; onActorLayout: (x: number, y: number, actor: 'character' | 'vehicle') => void }
function Box({ position, size, color, radius = 0 }: { position: [number, number, number]; size: [number, number, number]; color: string; radius?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={radius || .85}/></mesh>;
}
function Ball({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position} scale={size} castShadow><sphereGeometry args={[1, 20, 14]}/><meshStandardMaterial color={color} roughness={.9}/></mesh>;
}
function Character({ phase, walking, arrived, waiting, reduced }: { phase: number; walking: boolean; arrived: boolean; waiting: boolean; reduced: boolean }) {
  const stride = walking ? Math.sin(phase) * .65 : 0;
  const body = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const foot = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const forearm = useRef<THREE.Group>(null);
  const { invalidate, gl } = useThree();
  const waitingTime = useRef(0);
  useEffect(() => {
    waitingTime.current = 0;
    const resume = () => { if (!document.hidden) invalidate(); };
    document.addEventListener('visibilitychange', resume);
    invalidate();
    return () => document.removeEventListener('visibilitychange', resume);
  }, [waiting, reduced, invalidate]);
  useFrame((_, delta) => {
    if (!waiting) return;
    const animate = !reduced && !document.hidden;
    if (animate) waitingTime.current += Math.min(delta, .05);
    const t = waitingTime.current;
    const cycle = (t + .8) % 6;
    const glance = reduced ? 1 : cycle < .8 ? THREE.MathUtils.smoothstep(cycle, 0, .8) : cycle < 3.3 ? 1 : 1 - THREE.MathUtils.smoothstep(cycle, 3.3, 4.2);
    if (body.current) {
      body.current.rotation.z = -.025 * glance;
      body.current.position.y = reduced ? 0 : Math.sin(t * 2.5) * .012;
    }
    if (wrist.current) { wrist.current.rotation.z = glance * .25; wrist.current.rotation.x = glance * -.12; }
    if (forearm.current) forearm.current.rotation.z = glance * 2.15;
    if (head.current) { head.current.rotation.z = -glance * .4; head.current.rotation.y = glance * -.3; }
    if (foot.current) foot.current.rotation.z = .035;
    gl.domElement.dataset.waitingPose = reduced ? 'still' : document.hidden ? 'paused' : 'animated';
    gl.domElement.dataset.waitingPhase = t.toFixed(3);
    gl.domElement.dataset.watchCheck = glance > .9 ? 'looking' : 'lowering';
    if (animate) invalidate();
  });
  return <group ref={body} position={[0, walking ? Math.abs(Math.sin(phase)) * .035 : 0, 0]}>
    <group position={[0, .69, 0]} rotation={[0, 0, stride]}><Box position={[0, -.26, -.075]} size={[.17, .52, .19]} color="#393d62"/><Ball position={[.075, -.52, -.075]} size={[.19, .085, .12]} color="#fff7df"/></group>
    <group ref={foot} position={[0, .69, .17]} rotation={[0, 0, -stride]}><Box position={[0, -.26, 0]} size={[.17, .52, .19]} color="#4a4770"/><Ball position={[.075, -.52, 0]} size={[.19, .085, .12]} color="#fff7df"/></group>
    <Ball position={[0, .94, .06]} size={[.27, .38, .23]} color="#ea7255"/>
    <Box position={[-.21, 1, -.11]} size={[.17, .43, .28]} color="#8d80b3"/>
    <group ref={wrist} position={[.02, 1.14, .29]} rotation={[0, 0, arrived ? -2 : -stride * .8]}>{waiting ? <><Ball position={[0, -.13, 0]} size={[.085, .17, .085]} color="#ed7e60"/><group ref={forearm} position={[0, -.26, 0]}><Ball position={[0, -.13, 0]} size={[.075, .17, .075]} color="#efbd93"/><Ball position={[0, -.29, 0]} size={[.085, .09, .085]} color="#efbd93"/><Box position={[0, -.22, 0]} size={[.18, .09, .18]} color="#a58470"/><mesh position={[0, -.22, .105]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.095, .095, .035, 20]}/><meshStandardMaterial color="#f9e7b2"/></mesh><Box position={[.025, -.205, .128]} size={[.055, .014, .012]} color="#66546c"/><Box position={[0, -.19, .128]} size={[.014, .06, .012]} color="#66546c"/></group></> : <><Ball position={[0, -.2, 0]} size={[.085, .25, .085]} color="#ed7e60"/><Ball position={[0, -.43, 0]} size={[.083, .09, .085]} color="#edba8e"/></>}</group>
    <group position={[.02, 1.14, -.19]} rotation={[0, 0, stride * .8]}><Ball position={[0, -.2, 0]} size={[.085, .25, .085]} color="#df684f"/></group>
    <group ref={head} position={[0, 1.45, .06]}><group position={[0, -1.45, -.06]}>
    <Ball position={[.02, 1.54, .06]} size={[.215, .25, .215]} color="#efbd93"/>
    <Ball position={[-.055, 1.67, .03]} size={[.215, .17, .22]} color="#493f4f"/>
    <Ball position={[.22, 1.53, .06]} size={[.07, .07, .075]} color="#efbd93"/>
    <Ball position={[.165, 1.59, .215]} size={[.021, .03, .015]} color="#393640"/>
    <mesh position={[.04, 1.78, .06]} rotation={[0, 0, -.08]}><cylinderGeometry args={[.21, .22, .12, 24]}/><meshStandardMaterial color="#edb845"/></mesh>
    <Box position={[.18, 1.75, .06]} size={[.3, .04, .35]} color="#edb845"/>
    </group></group>
  </group>;
}
function Wheels({ long }: { long: boolean }) {
  return <>{[-1, 1].flatMap(side => [-1, 1].map(end => <group key={`${side}-${end}`} position={[end * (long ? 1.1 : .87), .35, side * .53]}><mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.29, .29, .15, 20]}/><meshStandardMaterial color="#494456"/></mesh><mesh position={[0, 0, side * .08]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.13, .13, .012, 16]}/><meshStandardMaterial color="#e8decc"/></mesh></group>))}</>;
}
function Vehicle({ kind, door }: { kind: VehicleKind; door: number }) {
  const rail = ['metro', 'tram', 'train'].includes(kind);
  const color = kind === 'bus' ? '#f4ba48' : kind === 'metro' ? '#71b7b6' : kind === 'train' ? '#7492c9' : kind === 'tram' ? '#b0a0d0' : '#e5b05e';
  if (kind === 'ferry') return <group><Ball position={[0, .3, 0]} size={[1.8, .43, .7]} color="#fcf4df"/><Box position={[0, .68, 0]} size={[2.3, .5, 1]} color="#f1c557"/><Box position={[-.25, 1.15, 0]} size={[1.6, .48, .8]} color="#fff6e4"/>{[-.7, -.2, .3].map(x => <Box key={x} position={[x, 1.16, .415]} size={[.32, .24, .02]} color="#719dad"/>)}<Box position={[-.65, 1.6, 0]} size={[.2, .5, .2]} color="#e47d5c"/></group>;
  if (kind === 'bike') return <group>{[-.7, .7].map(x => <mesh key={x} position={[x, .45, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.43, .055, 8, 24]}/><meshStandardMaterial color="#534c61"/></mesh>)}<Box position={[0, .72, 0]} size={[1.3, .1, .1]} color="#8caa72"/><Box position={[.5, 1.12, 0]} size={[.07, .75, .07]} color="#8caa72"/><Box position={[.5, 1.5, 0]} size={[.1, .06, .45]} color="#514b5d"/><Box position={[-.3, 1.07, 0]} size={[.42, .09, .21]} color="#514b5d"/></group>;
  if (kind === 'plane') return <group><Ball position={[0, .9, 0]} size={[1.8, .4, .4]} color="#fff5e2"/><Box position={[-.1, .7, 0]} size={[.7, .09, 3]} color="#8aa0cb"/><Box position={[-1.3, 1.3, 0]} size={[.5, .8, .08]} color="#e2a16c"/></group>;
  if (kind === 'cable') return <group><Box position={[0, .9, 0]} size={[1.6, 1.4, 1]} color="#ce98af"/><Box position={[0, 1.14, .52]} size={[1.35, .65, .03]} color="#496d7e"/><Box position={[0, 2, 0]} size={[.08, .9, .08]} color="#504a60"/></group>;
  if (kind === 'transit') return <group><Box position={[0, .7, 0]} size={[2.2, 1.1, 1]} color="#8ba5a1"/><Box position={[0, 1, .52]} size={[1.7, .4, .03]} color="#435f6a"/><Wheels long={false}/></group>;
  return <group>
    <Ball position={[0, 1.1, 0]} size={[rail ? 1.85 : 1.65, .83, .62]} color={color}/>
    <Box position={[0, .87, 0]} size={[rail ? 3.45 : 3.05, .86, 1.15]} color={color}/>
    <Box position={[0, .58, .586]} size={[rail ? 3.35 : 2.95, .13, .02]} color="#fff4df"/>
    {[-1.05, -.48, .09, .66].map(x => <Box key={x} position={[x, 1.32, .574]} size={[.45, .46, .045]} color="#4c687a"/>)}
    <Box position={[1.39, 1.3, 0]} size={[.09, .55, .9]} color="#496b78"/>
    <Box position={[-.72, 1.85, 0]} size={[rail ? .8 : .6, .13, .65]} color={rail ? '#eee8da' : '#ffe3a0'}/>
    <Box position={[.95 + door * .28, 1.06, .611]} size={[.4, .98, .035]} color={color}/>
    <Box position={[.95 + door * .28, 1.27, .637]} size={[.29, .45, .02]} color="#466777"/>
    <Box position={[1.54, .8, .37]} size={[.08, .17, .18]} color="#fff5c8"/>
    <Wheels long/>
    {(kind === 'metro' || kind === 'train') && <group position={[-3.55, 0, 0]}>
      <Box position={[1.8, .92, 0]} size={[.35, 1.1, .9]} color="#81758d"/>
      <Box position={[0, 1, 0]} size={[3.3, 1.35, 1.1]} color={color}/>
      <Box position={[0, 1.72, 0]} size={[3.25, .12, 1.12]} color="#f0e7d8"/>
      {[-1.15, -.55, .05, .65, 1.2].map(wx => <Box key={wx} position={[wx, 1.24, .57]} size={[.42, .48, .035]} color="#4c687a"/>)}
      <Box position={[0, .57, .57]} size={[3.25, .13, .02]} color="#fff4df"/><Wheels long/>
    </group>}
    {rail && <><Box position={[0, .27, 0]} size={[2.9, .18, .8]} color="#656277"/>{kind === 'tram' && <group position={[0, 2, 0]} rotation={[0, 0, .3]}><Box position={[0, .2, 0]} size={[.06, .5, .06]} color="#655b77"/><Box position={[0, .43, 0]} size={[.65, .04, .06]} color="#655b77"/></group>}</>}
  </group>;
}
function Tree({ x, z, size = 1, color = '#93b783' }: { x: number; z: number; size?: number; color?: string }) {
  return <group position={[x, 0, z]} scale={size}><Box position={[0, .58, 0]} size={[.16, 1.16, .16]} color="#af8869"/><Ball position={[0, 1.5, 0]} size={[.65, .91, .6]} color={color}/><Ball position={[.35, 1.28, 0]} size={[.47, .57, .46]} color={color}/></group>;
}
function Building({ x, z, color, height = 3, home = false }: { x: number; z: number; color: string; height?: number; home?: boolean }) {
  return <group position={[x, 0, z]}>
    <Box position={[0, height / 2, 0]} size={[2.7, height, 2]} color={color}/>
    {home ? <mesh position={[0, height + .55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.05, 1.2, 4]}/><meshStandardMaterial color="#b9827f"/></mesh> : <Box position={[0, height + .08, 0]} size={[2.86, .16, 2.15]} color="#f6dfc6"/>}
    {[-.8, .15, .95].flatMap((wx, col) => Array.from({ length: Math.max(1, Math.floor(height / 1.1)) }, (_, row) => <group key={`${col}-${row}`}><Box position={[wx, 1 + row * 1.1, 1.02]} size={[.43, .56, .06]} color="#ffedca"/><Box position={[wx, 1 + row * 1.1, 1.06]} size={[.04, .56, .02]} color="#dcb99e"/></group>))}
    <Box position={[.1, .55, 1.04]} size={[.65, 1.1, .08]} color="#7c9a8e"/>
  </group>;
}
function GlassTower({ x, z, door = 0 }: { x: number; z: number; door?: number }) {
  return <group position={[x, 0, z]}>
    <Box position={[0, 5.25, -.5]} size={[5.6, 6.1, 3]} color="#8cb5bd"/>
    <Box position={[.55, 9.2, -.8]} size={[4.5, 2, 2.4]} color="#a6c8ce"/>
    <Box position={[.55, 10.25, -.8]} size={[4.65, .12, 2.55]} color="#dee9e4"/>
    {[-2.3, -1.15, 0, 1.15, 2.3].flatMap(wx => [2.8, 3.9, 5, 6.1, 7.2].map(wy => <mesh key={`${wx}-${wy}`} position={[wx, wy, 1.025]}><boxGeometry args={[1.07, 1.02, .04]}/><meshStandardMaterial color={(wx + wy) % 2 > 1 ? '#a8cfd1' : '#77a6b7'} metalness={.35} roughness={.22}/></mesh>))}
    {[-2.85, -1.7, -.55, .6, 1.75, 2.85].map(wx => <Box key={wx} position={[wx, 5.25, 1.07]} size={[.055, 6.15, .06]} color="#d3e3df"/>)}
    {[2.22, 3.35, 4.45, 5.55, 6.65, 7.75, 8.3].map(wy => <Box key={wy} position={[0, wy, 1.07]} size={[5.75, .055, .08]} color="#cbdcda"/>)}
    <Box position={[-1.95, 1.08, 0]} size={[1.7, 2.16, 2]} color="#a3c6c7"/><Box position={[1.95, 1.08, 0]} size={[1.7, 2.16, 2]} color="#a3c6c7"/>
    <Box position={[0, 1.07, -.5]} size={[2.2, 2.14, .06]} color="#555f70"/>
    {[-1, 1].map(side => <group key={side} position={[side * (.55 + door * 1.05), 1.07, 1.05]}><mesh><boxGeometry args={[1.05, 2.14, .08]}/><meshStandardMaterial color="#86bac3" metalness={.25} roughness={.15} transparent opacity={.8}/></mesh><Box position={[0, 0, .055]} size={[.045, 2.14, .035]} color="#dce9e4"/><Box position={[0, .2, .055]} size={[1.05, .04, .035]} color="#e4eee9"/></group>)}
    <Box position={[0, 2.25, 1.35]} size={[3.1, .16, 1]} color="#e4e5dc"/>
    <Box position={[0, 2.4, 1.09]} size={[.3, .1, .1]} color="#697887"/><Ball position={[0, 2.4, 1.16]} size={[.045, .025, .02]} color="#bfe2a7"/>
    <Box position={[0, .035, 1.4]} size={[2.5, .07, .9]} color="#e6e6d6"/>
  </group>;
}
function DestinationBuilding({ x, home, door }: { x: number; home: boolean; door: number }) {
  if (!home) return <GlassTower x={x + 3.1} z={-3.5} door={door}/>;
  const height = home ? 3.6 : 5.8;
  const width = home ? 3.6 : 5.2;
  const color = home ? '#e9b87c' : '#a0b3bf';
  return <group position={[x + 3.1, 0, -3.5]}>
    <Box position={[-(width + 1.05) / 4, .98, 0]} size={[(width - 1.05) / 2, 1.96, 2]} color={color}/><Box position={[(width + 1.05) / 4, .98, 0]} size={[(width - 1.05) / 2, 1.96, 2]} color={color}/>
    <Box position={[0, (height + 1.96) / 2, 0]} size={[width, height - 1.96, 2]} color={color}/>
    <Box position={[0, .97, -.2]} size={[1.05, 1.94, .08]} color="#574e60"/>
    <group position={[-.525, 0, 1.04]} rotation={[0, -door * 1.6, 0]}><Box position={[.525, .97, 0]} size={[1.05, 1.94, .09]} color={home ? '#8ca88d' : '#72959d'}/><Ball position={[.88, .92, .07]} size={[.035, .035, .025]} color="#f2d99b"/></group>
    <Box position={[0, .035, 1.4]} size={[1.4, .07, .9]} color="#f5ddbb"/>
    {home ? <mesh position={[0, height + .55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[2.65, 1.3, 4]}/><meshStandardMaterial color="#b9827f"/></mesh> : <Box position={[0, height + .1, 0]} size={[width + .2, .2, 2.2]} color="#e9e1d5"/>}
    {[-1.25, 0, 1.25].flatMap(wx => Array.from({ length: home ? 1 : 3 }, (_, row) => <Box key={`${wx}-${row}`} position={[wx, 2.6 + row * 1.15, 1.03]} size={[.65, .7, .06]} color={home ? '#fff0cb' : '#d3e2df'}/>))}
  </group>;
}
function OriginBuilding({ apartment }: { apartment: boolean }) {
  if (apartment) return <group position={[-2.8, 0, -3.5]}>
    <Box position={[0, 2, 0]} size={[3.8, 4, 2.5]} color="#d7a59a"/>
    <Box position={[0, 4.15, 0]} size={[4.05, .3, 2.7]} color="#b98984"/>
    <Box position={[0, .62, 1.3]} size={[.8, 1.24, .13]} color="#799d95"/>
    <Box position={[0, 1.4, 1.5]} size={[1.3, .12, .8]} color="#f4d4b1"/>
    {[-1.2, 1.2].flatMap(wx => [1, 2.5].map(wy => <group key={`${wx}-${wy}`}><Box position={[wx, wy + .3, 1.28]} size={[.73, .94, .07]} color="#fff0cb"/><Box position={[wx, wy + .3, 1.33]} size={[.06, .94, .035]} color="#c38e83"/><Box position={[wx, wy - .13, 1.5]} size={[.95, .12, .48]} color="#a58e9c"/><Box position={[wx, wy + .05, 1.72]} size={[.95, .38, .05]} color="#b69ba4"/></group>))}
    <Box position={[0, 2.75, 1.28]} size={[.55, .8, .07]} color="#fff0cb"/>
    <Tree x={-2.6} z={1.5} size={.6}/>
  </group>;
  return <GlassTower x={-3.8} z={-3.5}/>;
}
function DepartureMonitor() {
  return <group position={[1.65, 0, .65]} rotation={[0, -.15, 0]}>
    <Box position={[0, .13, 0]} size={[1.25, .2, .8]} color="#82768b"/>
    <Box position={[0, .88, 0]} size={[.16, 1.5, .16]} color="#82768b"/>
  </group>;
}
function Stop({ x, kind }: { x: number; kind: VehicleKind }) {
  return <group position={[x, 0, -1.1]}>
    <Box position={[0, .08, 0]} size={[3.5, .16, 1.5]} color="#eedbc6"/>
    <Box position={[-.55, 1.25, -.5]} size={[.08, 2.5, .08]} color="#82758e"/>
    <Box position={[.95, 1.25, -.5]} size={[.08, 2.5, .08]} color="#82758e"/>
    <Box position={[.2, 2.5, -.1]} size={[2.4, .14, 1.3]} color={kind === 'bus' ? '#efbe59' : '#ad9cc6'}/>
    <Box position={[.2, 1.25, -.55]} size={[1.4, 2.3, .045]} color="#d4dfd1"/>
    <Box position={[.2, .6, -.18]} size={[1.3, .13, .4]} color="#ad8c75"/>
    <Box position={[1.8, 1.35, .3]} size={[.07, 2.7, .07]} color="#82758e"/>
    <mesh position={[1.8, 2.62, .32]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.28, .28, .07, 24]}/><meshStandardMaterial color={kind === 'bus' ? '#e8aa39' : '#9d86b9'}/></mesh>
  </group>;
}
function World({ stages, progress, reduced, onMonitorLayout, onActorLayout }: Props) {
  const { camera, size, gl } = useThree();
  const avatar = useRef<THREE.Group>(null);
  const ride = useRef<THREE.Group>(null);
  const current = storyPosition(stages, progress);
  const route = useMemo(() => buildIllustratedRoute(stages), [stages]);
  const endX = stages[stages.length - 1].xEnd;
  const entry = destinationEntry(progress, endX);
  const trees = useMemo(() => Array.from({ length: Math.ceil(endX / 3) + 5 }, (_, i) => ({ x: -8 + i * 3.4, z: i % 3 === 0 ? 4 : -4.7, size: .65 + (i % 4) * .15 })), [endX]);
  const walking = current.stage.kind === 'walk';
  const waiting = current.stage.kind === 'wait';
  const nextStage = stages[current.index + 1];
  const waitingForVehicle = waiting && nextStage && !['walk', 'wait'].includes(nextStage.kind);
  const walkingToVehicle = walking && nextStage && !['walk', 'wait'].includes(nextStage.kind);
  const motion = transitMotion(stages, current.index, current.local, reduced);
  const arriving = !walking && !waiting && motion.arriving;
  const arrival = waitingVehicle(walkingToVehicle ? (current.local - .45) / .55 : current.local, walkingToVehicle ? current.stage.xEnd : current.stage.xStart, reduced);
  const boarding = !walking && !waiting && motion.boarding;
  const alighting = !walking && !waiting && current.local > .925;
  const rideStart = current.stage.xStart;
  const travel = walking || waiting ? current.local : motion.travel;
  const x = current.stage.xStart + (current.stage.xEnd - current.stage.xStart) * travel;
  const checking = progress < .018;
  const boardingProgress = motion.boardingProgress;
  const vehicleX = waitingForVehicle || walkingToVehicle ? arrival.x : arriving ? motion.arrival.x : boarding ? rideStart + .9 : x + .9;
  const vehicleDoor = waitingForVehicle || walkingToVehicle ? arrival.door : arriving ? motion.arrival.door : boarding ? 1 - boardingProgress : 0;
  const vehicleVisible = !checking && (waitingForVehicle || walkingToVehicle ? arrival.state !== 'approaching' : arriving ? motion.arrival.state !== 'approaching' : true);
  const monitorProjection = useMemo(() => ({ center: new THREE.Vector3(), left: new THREE.Vector3(), right: new THREE.Vector3() }), []);
  const actorProjection = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const focus = route.sample(entry.active ? entry.x : x);
    const cameraX = focus.x + 1.7;
    camera.position.set(cameraX + 4.5, 6.3, focus.z + (size.width < 650 ? 13.5 : 12.5));
    camera.lookAt(cameraX, 1, focus.z);
    if (camera instanceof THREE.OrthographicCamera) {
      const zoom = Math.min(size.width / (size.width < 650 ? 12 : 22), size.height / 9.5);
      if (Math.abs(camera.zoom - zoom) > .1) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    }
    camera.updateMatrixWorld();
    const origin = route.sample(0);
    const monitorPoint = (along: number) => ({ x: origin.x + Math.cos(origin.yaw) * along + Math.sin(origin.yaw) * .65, z: origin.z - Math.sin(origin.yaw) * along + Math.cos(origin.yaw) * .65 });
    const monitorCenter = monitorPoint(1.65);
    const monitorLeft = monitorPoint(.325);
    const monitorRight = monitorPoint(2.975);
    monitorProjection.center.set(monitorCenter.x, 2, monitorCenter.z).project(camera);
    monitorProjection.left.set(monitorLeft.x, 2, monitorLeft.z).project(camera);
    monitorProjection.right.set(monitorRight.x, 2, monitorRight.z).project(camera);
    onMonitorLayout((monitorProjection.center.x + 1) * size.width / 2, (1 - monitorProjection.center.y) * size.height / 2, Math.abs(monitorProjection.right.x - monitorProjection.left.x) * size.width / 2, size.width);
    if (avatar.current) {
      avatar.current.visible = walking || waiting || arriving || boarding || alighting || progress >= .998;
      if (checking) avatar.current.visible = true;
      avatar.current.position.set(boarding ? rideStart + boardingProgress * .9 : alighting ? x + .9 * (1 - (current.local - .925) / .075) : x, .15, boarding ? 1.05 - boardingProgress * .9 : alighting ? .15 + (current.local - .925) / .075 * .9 : 1.05);
      avatar.current.scale.setScalar(boarding ? 1 - boardingProgress * .35 : 1);
      avatar.current.rotation.y = checking ? .24 : 0;
      if (entry.active) {
        avatar.current.visible = !entry.inside;
        avatar.current.position.set(entry.x, .15, entry.z);
        avatar.current.rotation.y = entry.rotation;
        avatar.current.scale.setScalar(1);
      }
      const p = route.sample(avatar.current.position.x, avatar.current.position.z);
      avatar.current.position.set(p.x, .15, p.z);
      avatar.current.rotation.y += p.yaw;
    }
    const vehiclePosition = route.sample(vehicleX);
    if (ride.current) { ride.current.position.set(vehiclePosition.x, .15, vehiclePosition.z); ride.current.rotation.y = vehiclePosition.yaw; ride.current.visible = vehicleVisible; }
    gl.domElement.dataset.routeGeometry = route.hasGeometry ? 'entur' : 'illustrative';
    gl.domElement.dataset.routeX = focus.x.toFixed(3);
    gl.domElement.dataset.routeZ = focus.z.toFixed(3);
    gl.domElement.dataset.vehicleHeading = vehiclePosition.yaw.toFixed(3);
    gl.domElement.dataset.vehicleVisible = String(Boolean(ride.current && vehicleVisible));
    gl.domElement.dataset.vehicleArrival = waitingForVehicle || walkingToVehicle ? arrival.state : arriving ? motion.arrival.state : boarding ? 'boarding' : 'travelling';
    gl.domElement.dataset.vehicleX = vehicleX.toFixed(3);
    gl.domElement.dataset.vehicleDoor = vehicleDoor.toFixed(3);
    gl.domElement.dataset.destinationEntry = entry.inside ? 'inside' : entry.active ? 'entering' : 'travelling';
    gl.domElement.dataset.destinationDoor = entry.door.toFixed(3);
    const characterVisible = walking || waiting || arriving || boarding || alighting || checking || progress >= .998;
    const characterX = boarding ? rideStart + boardingProgress * .9 : alighting ? x + .9 * (1 - (current.local - .925) / .075) : x;
    const characterZ = boarding ? 1.05 - boardingProgress * .9 : alighting ? .15 + (current.local - .925) / .075 * .9 : 1.05;
    const bubblePosition = route.sample(entry.active ? entry.x : characterVisible ? characterX : x + .9, entry.active ? entry.z : characterVisible ? characterZ : 0);
    actorProjection.set(bubblePosition.x, characterVisible || entry.active ? 2.2 : 2.5, bubblePosition.z).project(camera);
    onActorLayout((actorProjection.x + 1) * size.width / 2, (1 - actorProjection.y) * size.height / 2, characterVisible ? 'character' : 'vehicle');
  });
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow onAfterRender={() => { gl.domElement.dataset.ready = 'true'; }}><planeGeometry args={[endX * 4 + 100, endX * 4 + 100]}/><meshStandardMaterial color="#e7d7ae"/></mesh>
    <RouteScenery route={route} stages={stages}/>
    <RoutePlacement route={route} distance={0}><OriginBuilding apartment/><DepartureMonitor/></RoutePlacement>
    <RoutePlacement route={route} distance={endX}><DestinationBuilding x={endX} home door={entry.door}/></RoutePlacement>
    {Array.from({ length: Math.ceil(endX / 9) }, (_, i) => <RoutePlacement key={`building-${i}`} route={route} distance={7 + i * 9}><Building x={7 + i * 9} z={-5.5 - i % 2 * 1.5} color={['#c9b6c9', '#d5aa9e', '#dfbc85', '#a8bfa6'][i % 4]} height={2.2 + i % 3 * .8}/></RoutePlacement>)}
    {trees.map((tree, i) => <RoutePlacement key={`tree-${tree.x}`} route={route} distance={tree.x}><Tree {...tree} color={i % 3 === 0 ? '#b7b587' : '#94b18c'}/></RoutePlacement>)}
    {Array.from({ length: Math.ceil(endX / 5) + 2 }, (_, i) => <RoutePlacement key={`flowers-${i}`} route={route} distance={i * 5 - 4}><group position={[i * 5 - 4, .12, 3.2]}>{[0, 1, 2].map(j => <Ball key={j} position={[j * .19, .05, (j % 2) * .12]} size={[.12, .13, .12]} color={j % 2 ? '#d59da8' : '#e8c165'}/>)}</group></RoutePlacement>)}
    {stages.filter(s => !['walk', 'wait', 'bike', 'plane'].includes(s.kind)).map(s => <group key={`stops-${s.id}`}><RoutePlacement route={route} distance={s.xStart}><Stop x={s.xStart} kind={s.kind}/></RoutePlacement><RoutePlacement route={route} distance={s.xEnd}><Stop x={s.xEnd} kind={s.kind}/></RoutePlacement></group>)}
    <group ref={avatar}><Character key={waiting ? 'waiting' : 'travelling'} phase={reduced || checking ? 0 : entry.active ? entry.phase * 30 : current.local * (current.stage.xEnd - current.stage.xStart) * 5} walking={(walking || entry.active) && !reduced && !checking && progress < 1} arrived={progress >= .998} waiting={waiting} reduced={reduced}/></group>
    {(!walking && !waiting || waitingForVehicle || walkingToVehicle) && <group ref={ride}><Vehicle kind={waitingForVehicle || walkingToVehicle ? nextStage.kind : current.stage.kind} door={vehicleDoor}/></group>}
    {progress > .985 && <RoutePlacement route={route} distance={endX}><group position={[endX + 1, 2.4, 0]}>{[0, 1, 2, 3, 4].map(i => <mesh key={i} position={[Math.sin(i * 2) * .9, Math.cos(i * 2) * .6, .2]} rotation={[0, 0, i]}><boxGeometry args={[.11, .23, .04]}/><meshStandardMaterial color={['#e7b548', '#a18bc3', '#86afa3'][i % 3]}/></mesh>)}</group></RoutePlacement>}
  </>;
}
function FlatFallback({ stages, progress, onActorLayout }: Props) {
  const { stage, local } = storyPosition(stages, progress);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const update = () => {
      const svg = node.querySelector('svg');
      if (!svg || svg.clientWidth === 0 || svg.clientHeight === 0) return;
      const scale = Math.min(svg.clientWidth / 900, svg.clientHeight / 360);
      const isCharacter = stage.kind === 'walk' || stage.kind === 'wait';
      onActorLayout((svg.clientWidth - 900 * scale) / 2 + ((progress < .018 ? 210 : 80) + local * 700) * scale, svg.getBoundingClientRect().top - node.getBoundingClientRect().top + (svg.clientHeight - 360 * scale) / 2 + (isCharacter ? 172 : 175) * scale, isCharacter ? 'character' : 'vehicle');
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [local, onActorLayout, progress, stage.kind]);
  return <div ref={container} className="flat-story"><svg viewBox="0 0 900 360" role="img" aria-label={`${stage.label}, ${Math.round(local * 100)} percent complete`}><circle cx="730" cy="80" r="35" fill="#f0c673"/><path d="M0 240Q150 90 300 240Q480 100 650 240Q800 140 900 240V360H0" fill="#b5c7ab"/>{progress < .018 && <g><rect x="20" y={105} width={145} height={170} fill={'#d7a59a'}/>{[0, 1, 2].map(row => [0, 1, 2].map(col => <rect key={`${row}-${col}`} x={35 + col * 40} y={(125) + row * 43} width="23" height="28" fill="#f7e9c8"/>))}<rect x="245" y="155" width="100" height="75" rx="5" fill="#3e4956"/><text x="295" y="180" textAnchor="middle" fontSize="9" fill="#f1d69c">DEPARTURES ↗</text><path d="M260 197H330M260 211H330M295 230V275" stroke="#b2bfac" strokeWidth="3"/></g>}<path d="M0 310H900" stroke="#a99cab" strokeWidth="50"/><g transform={`translate(${(progress < .018 ? 210 : 80) + local * 700},230)`}>{stage.kind === 'walk' || stage.kind === 'wait' ? <><circle cy="-38" r="14" fill="#d4a17e"/><path d="M0-20V17M0 0L-18 12M0 0L18-10M0 17L-14 48M0 17L16 48" stroke="#d9795b" strokeWidth="13" strokeLinecap="round"/></> : <><rect x="-65" y="-55" width="150" height="65" rx="15" fill={stage.color}/><rect x="-50" y="-43" width="110" height="25" rx="5" fill="#526b7b"/><circle cx="-35" cy="15" r="13" fill="#50465b"/><circle cx="55" cy="15" r="13" fill="#50465b"/><text x="0" y="-4" fontSize="12" textAnchor="middle" fill="#453c50">{stage.label}</text></>}</g></svg><span>2D journey view · {stage.label}</span></div>;
}
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function JourneyScene(props: Props) {
  const fallback = <FlatFallback {...props}/>;
  return <SceneBoundary fallback={fallback}><Canvas frameloop="demand" orthographic shadows dpr={[1, 1.6]} camera={{ position: [4, 6, 13], zoom: 45, near: .1, far: 250 }} fallback={fallback} gl={{ antialias: true, alpha: true }}>
    <fog attach="fog" args={['#f8dfca', 30, 85]}/><ambientLight intensity={1.5}/><hemisphereLight args={['#fff4dd', '#b6b1cb', 1.3]}/><directionalLight position={[-8, 14, 9]} intensity={2.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-100} shadow-camera-right={100} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-normalBias={.035}/>
    <World {...props}/>
  </Canvas></SceneBoundary>;
}
