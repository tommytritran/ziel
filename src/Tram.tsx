import VehicleDisplay from './VehicleDisplay';

export default function Tram({ door, line, destination }: { door: number; line: string; destination: string }) {
  return <group>
    {[0, -2.65, -5.3].map((offset, index) => <group key={offset} position={[offset, 0, 0]}>
      <mesh position={[0, .82, 0]} castShadow><boxGeometry args={[2.45, 1.27, 1.13]}/><meshStandardMaterial color="#6badd0" roughness={.5}/></mesh>
      <mesh position={[0, .29, 0]}><boxGeometry args={[2.4, .2, 1.14]}/><meshStandardMaterial color="#397b9e"/></mesh>
      <mesh position={[0, 1.48, 0]}><boxGeometry args={[2.42, .1, 1.12]}/><meshStandardMaterial color="#e2e0d8"/></mesh>
      <mesh position={[0, .52, .577]}><boxGeometry args={[2.43, .09, .022]}/><meshStandardMaterial color="#eee9d5"/></mesh>
      {[-.86, .82].map(x => <mesh key={x} position={[x, 1.08, .58]}><boxGeometry args={[.72, .65, .025]}/><meshStandardMaterial color="#293f50"/></mesh>)}
      <VehicleDisplay line={line} destination={destination} position={[-.86,1.23,.6]} width={.65} height={.15} side/>
      <mesh position={[0, .82, .58]}><boxGeometry args={[.86, 1.12, .025]}/><meshStandardMaterial color="#344c60"/></mesh>
      {[-1, 1].map(side => <group key={side} position={[side * (.21 + door * .42), .82, .62]}><mesh><boxGeometry args={[.41, 1.1, .045]}/><meshStandardMaterial color="#90c5dd"/></mesh><mesh position={[0, .22, .03]}><boxGeometry args={[.28, .5, .02]}/><meshStandardMaterial color="#496377"/></mesh></group>)}
      {index === 0 && <VehicleDisplay line={line} destination={destination} position={[1.276,1.29,0]} width={.92} height={.2}/>}
      {[-.8,.8].map(x => <group key={x} position={[x,.13,0]}><mesh><boxGeometry args={[.5,.18,.8]}/><meshStandardMaterial color="#51566a"/></mesh>{[-.43,.43].map(z=><mesh key={z} position={[0,0,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.12,.08,14]}/><meshStandardMaterial color="#4d5360" metalness={.4}/></mesh>)}</group>)}
      {index < 2 && <group position={[-1.32,.83,0]}>{[-.08,0,.08].map(x=><mesh key={x} position={[x,0,0]}><boxGeometry args={[.04,1.16,1.02]}/><meshStandardMaterial color="#706b87"/></mesh>)}</group>}
      {index === 0 && <><mesh position={[1.24,1.03,0]}><boxGeometry args={[.035,.66,.95]}/><meshStandardMaterial color="#334e65"/></mesh>{[-.37,.37].map(z=><mesh key={z} position={[1.27,.52,z]}><boxGeometry args={[.035,.1,.14]}/><meshBasicMaterial color="#fff0bd"/></mesh>)}</>}
    </group>)}
    <group position={[-2.65,1.57,0]}>
      <mesh position={[0,0,0]}><boxGeometry args={[1,.12,.65]}/><meshStandardMaterial color="#8a879a"/></mesh>
      {[-1,1].map(side=><group key={side} position={[0,.28,side*.15]}><mesh rotation={[0,0,.65]} position={[-.18,0,0]}><boxGeometry args={[.07,.65,.055]}/><meshStandardMaterial color="#5f5972"/></mesh><mesh rotation={[0,0,-.65]} position={[.18,0,0]}><boxGeometry args={[.07,.65,.055]}/><meshStandardMaterial color="#5f5972"/></mesh></group>)}
      <mesh position={[0,.57,0]}><boxGeometry args={[.8,.05,.48]}/><meshStandardMaterial color="#5f5972"/></mesh>
    </group>
  </group>;
}
