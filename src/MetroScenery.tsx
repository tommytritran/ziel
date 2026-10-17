import { useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { IllustratedRoute } from './routeGeometry';
import type { StoryStage } from './story';
import { METRO_DEPTH } from './metro';
import { Ribbon } from './RouteScenery';
import { WINDOW_HALF_DEPTH, WINDOW_HALF_LENGTH, WINDOW_LATERAL } from './undergroundWindow';
import type { UndergroundWindow } from './undergroundWindow';

function Block({ x = 0, y = 0, z = 0, w, h, d, color }: { x?: number; y?: number; z?: number; w: number; h: number; d: number; color: string }) { return <mesh position={[x, y, z]} castShadow receiveShadow><boxGeometry args={[w, h, d]}/><meshStandardMaterial color={color} roughness={.75}/></mesh>; }
export function StationSign({ name, width = 2.4 }: { name: string; width?: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 192;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#526b83'; context.fillRect(0, 0, canvas.width, canvas.height);
      let size = 82; context.font = `600 ${size}px sans-serif`;
      while (context.measureText(name).width > 950 && size > 24) { size -= 2; context.font = `600 ${size}px sans-serif`; }
      context.fillStyle = '#f7e8b8'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(name, 512, 100, 950);
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [name]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh name={`station-sign-${name}`}><planeGeometry args={[width, .45]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false}/></mesh>;
}
function Entrance({ route, start, length, exit = false }: { route: IllustratedRoute; start: number; length: number; exit?: boolean }) {
  const p = route.sample(start, 1.5);
  const slope = Math.atan2(-METRO_DEPTH, length);
  const coveredLength = length * .65;
  const coveredDrop = -METRO_DEPTH * .65;
  const coverStart = exit ? length - coveredLength : 0;
  const coverCenterY = 2.72 - coveredDrop / 2;
  return <group position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}>
    <group position={[exit ? length : 0, 0, 0]}>
      <Block x={-.55} y={.07} w={2.5} h={.14} d={1.25} color="#dad8cf"/>
      <Block x={.53} y={1.1} z={-.87} w={.16} h={2.2} d={.22} color="#d9e1d8"/><Block x={.53} y={1.1} z={.87} w={.16} h={2.2} d={.22} color="#d9e1d8"/>
      <Block x={-.55} y={1.3} z={-1} w={2.2} h={2.6} d={.16} color="#729b9d"/><Block x={-.55} y={1.3} z={1} w={2.2} h={2.6} d={.16} color="#729b9d"/>
      <Block x={-.55} y={2.72} w={2.5} h={.2} d={2.4} color="#66828f"/><Block x={-.55} y={2.39} z={1.11} w={2.2} h={.38} d={.1} color="#526b83"/>
      <Block x={-.88} y={2.39} z={1.18} w={.065} h={.25} d={.025} color="#f7e8b8"/><Block x={-.36} y={2.39} z={1.18} w={.065} h={.25} d={.025} color="#f7e8b8"/>
      <mesh position={[-.75,2.39,1.18]} rotation={[0,0,.8]}><boxGeometry args={[.065,.34,.025]}/><meshBasicMaterial color="#f7e8b8"/></mesh><mesh position={[-.49,2.39,1.18]} rotation={[0,0,-.8]}><boxGeometry args={[.065,.34,.025]}/><meshBasicMaterial color="#f7e8b8"/></mesh>
      {Array.from({length:6},(_,row)=>[-1.091,1.091].map(z=><Block key={`${row}-${z}`} x={-.55} y={.2+row*.32} z={z} w={2.1} h={.018} d={.012} color="#a7bcbc"/>))}
      {[-1.091,1.091].map(z=><group key={z}>{[-1.2,-.55,.1].map((x,i)=><Block key={x} x={x} y={1.2} z={z} w={.014} h={1.95} d={.012} color={i%2?'#a7bcbc':'#b9cccc'}/>)}</group>)}
      <mesh position={[-.3,2.57,0]}><boxGeometry args={[1.3,.06,.35]}/><meshStandardMaterial color="#fff0c5" emissive="#ffe5b0" emissiveIntensity={.8}/></mesh>
      <Block x={.25} y={.15} z={-.65} w={.5} h={.12} d={.12} color="#e7c878"/><Block x={.25} y={.15} z={.65} w={.5} h={.12} d={.12} color="#e7c878"/>
    </group>
    <group name="connected-escalator-enclosure">
      <mesh position={[coverStart + coveredLength / 2, coverCenterY, 0]} rotation={[0,0,exit ? slope : -slope]} castShadow><boxGeometry args={[Math.hypot(coveredLength, coveredDrop) + .22,.18,2.4]}/><meshStandardMaterial color="#66828f" roughness={.65}/></mesh>
      {[-1,1].map(z=><group key={z}>
        {Array.from({length:5},(_,i)=>{
          const t=i/4;
          const d=exit ? 1-t : t;
          return <group key={i} position={[coverStart+t*coveredLength, -coveredDrop*d, z]}><Block y={1.28} w={.065} h={2.56} d={.09} color="#91adb0"/></group>;
        })}
        <mesh position={[coverStart+coveredLength/2,coverCenterY-1.25,z]} rotation={[0,0,exit?slope:-slope]}><boxGeometry args={[Math.hypot(coveredLength,coveredDrop),2.25,.055]}/><meshStandardMaterial color="#86aeb3" transparent opacity={.35} roughness={.35} depthWrite={false}/></mesh>
        <mesh position={[coverStart+coveredLength/2,coverCenterY-.15,z]} rotation={[0,0,exit?slope:-slope]}><boxGeometry args={[Math.hypot(coveredLength,coveredDrop),.08,.1]}/><meshStandardMaterial color="#b4c5c0"/></mesh>
      </group>)}
    </group>
    {Array.from({ length: 22 }, (_, i) => { const t = i / 21; return <Block key={i} x={t * length} y={(exit ? METRO_DEPTH * (1 - t) : METRO_DEPTH * t) - .1} w={length / 21 + .05} h={.2} d={1.2} color={i % 2 ? '#c5d0cc' : '#e0e4d9'}/>; })}
    {[-.82,.82].map(z=><mesh key={z} position={[length/2,METRO_DEPTH/2-.15,z]} rotation={[0,0,exit?slope:-slope]}><boxGeometry args={[Math.hypot(length,METRO_DEPTH),.6,.18]}/><meshStandardMaterial color="#6e9098" roughness={.7}/></mesh>)}
    {[-.7, .7].map(z => <mesh key={z} position={[length / 2, METRO_DEPTH / 2 + .65, z]} rotation={[0, 0, exit ? slope : -slope]}><boxGeometry args={[Math.hypot(length, METRO_DEPTH), .12, .13]}/><meshStandardMaterial color="#70677e"/></mesh>)}
  </group>;
}

function WindowClip({ route, window, children }: { route: IllustratedRoute; window: UndergroundWindow; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const planes = useMemo(() => {
    const p = route.sample(window.center); const normal = new THREE.Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
    const center = new THREE.Vector3(p.x, 0, p.z);
    return [new THREE.Plane(normal.clone(), WINDOW_HALF_LENGTH - normal.dot(center)), new THREE.Plane(normal.clone().negate(), WINDOW_HALF_LENGTH + normal.dot(center))];
  }, [route, window.center]);
  useEffect(() => {
    gl.localClippingEnabled = true;
    ref.current?.traverse(object => { if (object instanceof THREE.Mesh) { const materials = Array.isArray(object.material) ? object.material : [object.material]; for (const material of materials) { material.clippingPlanes = planes; material.needsUpdate = true; } } });
    return () => { ref.current?.traverse(object => { if (object instanceof THREE.Mesh) { const materials = Array.isArray(object.material) ? object.material : [object.material]; for (const material of materials) material.clippingPlanes = null; } }); };
  }, [gl, planes]);
  return <group ref={ref} visible={window.active}>{children}</group>;
}
export function CutawayGround({ route, stages, window, onReady }: { route: IllustratedRoute; stages: StoryStage[]; window: UndergroundWindow; onReady: () => void }) {
  const geometry = useMemo(() => {
    const extent = stages.at(-1)!.xEnd * 4 + 100;
    const shape = new THREE.Shape(); shape.moveTo(-extent, -extent); shape.lineTo(extent, -extent); shape.lineTo(extent, extent); shape.lineTo(-extent, extent); shape.closePath();
    if (window.active) {
      const hole = new THREE.Path();
      const center = route.sample(window.center, window.lateral ?? WINDOW_LATERAL);
      const yaw = route.sample(window.center).yaw;
      for (let i = 0; i <= 96; i++) { const angle = i / 96 * Math.PI * 2; const along = Math.cos(angle) * WINDOW_HALF_LENGTH; const lateral = Math.sin(angle) * WINDOW_HALF_DEPTH; const p = { x: center.x + Math.cos(yaw) * along + Math.sin(yaw) * lateral, z: center.z - Math.sin(yaw) * along + Math.cos(yaw) * lateral }; if (i === 0) hole.moveTo(p.x, -p.z); else hole.lineTo(p.x, -p.z); }
      hole.closePath(); shape.holes.push(hole);
    }
    return new THREE.ShapeGeometry(shape);
  }, [route, stages, window.center, window.active, window.lateral]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} geometry={geometry} receiveShadow onAfterRender={onReady}><meshStandardMaterial color="#e7d7ae" side={THREE.DoubleSide} userData={{ stationSurface: true }}/></mesh>;
}

export default function MetroScenery({ route, stages, window }: { route: IllustratedRoute; stages: StoryStage[]; window: UndergroundWindow }) {
  return <>{stages.filter(s => s.kind === 'metro').map(stage => {
    const index = stages.indexOf(stage); const previous = stages[index - 1]?.kind === 'wait' ? stages[index - 2] : stages[index - 1];
    const length = previous?.kind === 'walk' ? (previous.xEnd - previous.xStart) * .3 : 3;
    return <group key={stage.id}>
      <Entrance route={route} start={stage.xStart - length} length={length}/><Entrance route={route} start={stage.xEnd} length={3} exit/>
      <WindowClip route={route} window={window}>
      <Ribbon route={route} start={stage.xStart - 20} end={stage.xEnd + 10} lateral={-.6} width={2.5} y={METRO_DEPTH - .12} color="#777586"/>
      {[-.5, .5].map(offset => <Ribbon key={offset} route={route} start={stage.xStart - 20} end={stage.xEnd + 10} lateral={offset} width={.08} y={METRO_DEPTH + .07} color="#cbd2ce"/>)}
      {Array.from({ length: Math.ceil((stage.xEnd - stage.xStart + 30) / .6) }, (_, i) => { const p = route.sample(stage.xStart - 20 + i * .6); return <group key={i} position={[p.x, METRO_DEPTH -.02, p.z]} rotation={[0, p.yaw, 0]}><Block w={.16} h={.12} d={1.6} color="#565768"/></group>; })}
      <Ribbon route={route} start={stage.xStart - length} end={stage.xEnd + 4} lateral={1.75} width={2.3} y={METRO_DEPTH + .05} color="#ded9cf"/>
      <Ribbon route={route} start={stage.xStart - length} end={stage.xEnd + 4} lateral={.64} width={.12} y={METRO_DEPTH + .07} color="#edcc70"/>
      {Array.from({ length: Math.ceil((stage.xEnd - stage.xStart + length + 4) / 1.5) }, (_, i) => { const p = route.sample(stage.xStart - length + i * 1.5, -2.8); return <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}><Block y={METRO_DEPTH / 2} w={1.55} h={-METRO_DEPTH} d={.24} color="#b79b90"/><Block y={METRO_DEPTH + 1.25} z={.15} w={1.5} h={2.5} d={.06} color={i % 2 ? '#a5b8bc' : '#b2c4c4'}/><Block y={METRO_DEPTH + 2.4} z={.23} w={1} h={.09} d={.12} color="#ffedbd"/></group>; })}
      {[stage.xStart, stage.xEnd].map((d, index) => { const p = route.sample(d, 2.6); return <group key={d} position={[p.x, METRO_DEPTH, p.z]} rotation={[0, p.yaw, 0]}><Block x={-.8} y={.45} w={1.3} h={.12} d={.4} color="#9f8d7d"/><Block x={1.2} y={1.5} w={2.4} h={.45} d={.12} color="#5c8195"/><group position={[1.2,1.5,.075]}><StationSign name={index === 0 ? stage.leg.fromPlace.name : stage.leg.toPlace.name}/></group><Block x={1.2} y={.72} w={.07} h={1.45} d={.07} color="#8a8191"/></group>; })}
      </WindowClip>
    </group>;
  })}</>;
}
