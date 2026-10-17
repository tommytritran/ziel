import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { IllustratedRoute } from './routeGeometry';
import type { StoryStage } from './story';

export function Ribbon({ route, start, end, lateral, width, y, color }: { route: IllustratedRoute; start: number; end: number; lateral: number; width: number; y: number; color: string }) {
  const geometry = useMemo(() => {
    const count = Math.min(600, Math.max(2, Math.ceil((end - start) * 4)));
    const positions: number[] = []; const indices: number[] = [];
    for (let i = 0; i <= count; i++) {
      const distance = start + (end - start) * i / count;
      for (const offset of [-width / 2, width / 2]) { const p = route.sample(distance, lateral + offset); positions.push(p.x, y, p.z); }
      if (i < count) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); result.setIndex(indices); result.computeVertexNormals();
    return result;
  }, [route, start, end, lateral, width, y]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={.9} userData={{ stationSurface: y >= 0 }}/></mesh>;
}
export default function RouteScenery({ route, stages }: { route: IllustratedRoute; stages: StoryStage[] }) {
  const end = stages[stages.length - 1].xEnd;
  return <>
    <Ribbon route={route} start={-15} end={end + 15} lateral={1.2} width={7} y={.025} color="#efc7a3"/>
    {stages.filter(s => s.xEnd > s.xStart).map(stage => <Ribbon key={stage.id} route={route} start={stage.xStart} end={stage.xEnd} lateral={-.5} width={3} y={.095} color={stage.kind === 'ferry' ? '#94c5c7' : '#b9b1bb'}/>)}
    <Ribbon route={route} start={-15} end={0} lateral={-.5} width={3} y={.095} color="#b9b1bb"/>
    <Ribbon route={route} start={end} end={end + 15} lateral={-.5} width={3} y={.095} color="#b9b1bb"/>
    <Ribbon route={route} start={-15} end={end + 15} lateral={1.35} width={.16} y={.11} color="#f6e5c8"/>
    <Ribbon route={route} start={-15} end={end + 15} lateral={-2.2} width={.16} y={.11} color="#f6e5c8"/>
    {Array.from({ length: Math.ceil(end / 2.7) + 9 }, (_, i) => { const p = route.sample(-10 + i * 2.7, -.6); return <mesh key={`mark-${i}`} position={[p.x, .12, p.z]} rotation={[0, p.yaw, 0]}><boxGeometry args={[1.1, .012, .07]}/><meshStandardMaterial color="#f0ddd0"/></mesh>; })}
    {stages.filter(s => ['tram', 'train'].includes(s.kind)).flatMap(stage => [-.4, .4].map(offset => <Ribbon key={`${stage.id}-${offset}`} route={route} start={stage.xStart - 1} end={stage.xEnd + 1} lateral={offset} width={.045} y={.13} color="#7d768e"/>))}
  </>;
}
