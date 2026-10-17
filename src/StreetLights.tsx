import type { IllustratedRoute } from './routeGeometry';
import type { StoryStage } from './story';
import { useMemo } from 'react';
import { placeStreetLights } from './lampPlacement';

export default function StreetLights({ route, stages, darkness }: { route: IllustratedRoute; stages: StoryStage[]; darkness: number }) {
  const lamps = useMemo(() => placeStreetLights(route, stages), [route, stages]);
  return <>{lamps.map((p, i) => {
    return <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.yaw, 0]}>
      <mesh position={[0, 1.5, 0]} castShadow><cylinderGeometry args={[.035, .055, 3, 8]}/><meshStandardMaterial color="#797887"/></mesh>
      <mesh position={[0, 3, .3]}><boxGeometry args={[.09, .09, .7]}/><meshStandardMaterial color="#797887"/></mesh>
      <mesh position={[0, 2.94, .62]}><boxGeometry args={[.48, .1, .55]}/><meshStandardMaterial color="#ede1b6" emissive="#ffd48a" emissiveIntensity={darkness * 4}/></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .14, 1.6]} scale={[1.2, .9, 1]}><circleGeometry args={[3.8, 48]}/><meshBasicMaterial color="#ffde9e" transparent opacity={darkness * .13} depthWrite={false}/></mesh>
      {darkness > .05 && <pointLight position={[0, 2.65, 1.3]} color="#ffdca0" intensity={darkness * 12} distance={12} decay={2}/>}
    </group>;
  })}</>;
}
