import VehicleDisplay from './VehicleDisplay';

function Panel({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.5}/></mesh>;
}

function Doors({ x, open }: { x: number; open: number }) {
  return <group position={[x, .96, .68]}>
    <Panel position={[0, 0, -.06]} size={[.8, 1.45, .045]} color="#243b49"/>
    {[-1, 1].map(side => <group key={side} position={[side * (.19 + open * .36), 0, open * .07]}>
      <Panel position={[0, 0, 0]} size={[.37, 1.45, .045]} color="#cb3e40"/>
      <Panel position={[0, .24, .031]} size={[.28, .83, .02]} color="#293f4c"/>
      <Panel position={[side * -.12, -.2, .045]} size={[.018, .2, .02]} color="#e1ded1"/>
    </group>)}
  </group>;
}

export default function Bus({ door, line, destination }: { door: number; line: string; destination: string }) {
  return <group name="city-bus">
    <Panel position={[0, .98, -.59]} size={[5.2, 1.6, .12]} color="#c94144"/>
    <Panel position={[0, 1.82, 0]} size={[5.24, .16, 1.38]} color="#ecebe2"/>
    <Panel position={[0, .32, 0]} size={[5.2, .24, 1.3]} color="#942f39"/>
    <Panel position={[0, .53, .64]} size={[5.17, .19, .08]} color="#cf4547"/>
    <Panel position={[-1.6, 1.1, .61]} size={[1.95, 1.27, .1]} color="#ce4447"/>
    <Panel position={[.43, 1.1, .61]} size={[1.15, 1.27, .1]} color="#ce4447"/>
    <Panel position={[2.44, 1.1, .61]} size={[.3, 1.27, .1]} color="#ce4447"/>
    <Panel position={[-1.56, 1.36, .67]} size={[1.75, .64, .035]} color="#263e4c"/>
    <Panel position={[.38, 1.36, .67]} size={[1.03, .64, .035]} color="#263e4c"/>
    <Panel position={[0, 1.36, -.666]} size={[4.85, .64, .035]} color="#263e4c"/>
    <VehicleDisplay line={line} destination={destination} position={[-1.56, 1.5, .697]} width={1.58} height={.23} side/>
    <Doors x={1.72} open={door}/><Doors x={-.45} open={door}/>
    <Panel position={[2.61, 1.22, 0]} size={[.06, .91, 1.2]} color="#253d4b"/>
    <Panel position={[2.62, .64, 0]} size={[.08, .27, 1.3]} color="#cb4144"/>
    <Panel position={[2.65, .35, 0]} size={[.1, .15, 1.3]} color="#3d4653"/>
    <VehicleDisplay line={line} destination={destination} position={[2.653, 1.66, 0]} width={1.1} height={.24}/>
    <Panel position={[2.66, 1.21, 0]} size={[.025, .81, .045]} color="#697783"/>
    {[-.47, .47].map(z => <group key={z}>
      <mesh position={[2.68, .63, z]}><boxGeometry args={[.035, .13, .21]}/><meshBasicMaterial color="#fff2c8"/></mesh>
      <Panel position={[2.3, 1.56, z * 1.7]} size={[.15, .26, .12]} color="#354655"/>
      <Panel position={[2.4, 1.7, z * 1.5]} size={[.35, .045, .05]} color="#354655"/>
    </group>)}
    <Panel position={[-2.61, 1, 0]} size={[.08, 1.55, 1.3]} color="#b63840"/>
    <Panel position={[-2.66, .97, 0]} size={[.025, .55, .94]} color="#34444f"/>
    {[-1.72, 1.5].flatMap(x => [-1, 1].map(side => <group key={`${x}-${side}`} position={[x, .34, side * .64]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.38, .38, .09, 24]}/><meshStandardMaterial color="#772e38"/></mesh>
      <mesh position={[0, -.04, side * .04]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.3, .3, .15, 24]}/><meshStandardMaterial color="#30343e"/></mesh>
      <mesh position={[0, -.04, side * .125]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.155, .155, .018, 20]}/><meshStandardMaterial color="#a9afb0" metalness={.5}/></mesh>
    </group>))}
    <Panel position={[-.4, 1.98, 0]} size={[1.8, .19, .95]} color="#d4d6d0"/>
    {[-1.02,-.76,-.5,-.24,.02,.28].map(x => <Panel key={x} position={[x, 2.085, 0]} size={[.025,.02,.72]} color="#9da6a6"/>)}
  </group>;
}
