import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export default function MetroTrain({ door, line, destination }: { door: number; line: string; destination: string }) {
  const display = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#151b20'; context.fillRect(0, 0, 768, 128);
      context.fillStyle = '#ffb84e'; context.textBaseline = 'middle';
      context.font = 'bold 88px monospace'; context.fillText(line || 'T', 20, 67, 140);
      let size = 52; context.font = `bold ${size}px monospace`;
      while (context.measureText(destination).width > 555 && size > 24) { size -= 2; context.font = `bold ${size}px monospace`; }
      context.fillText(destination, 185, 67, 555);
      context.fillStyle = '#151b2040';
      for (let x = 0; x < 768; x += 5) context.fillRect(x, 0, 1, 128);
      for (let y = 0; y < 128; y += 5) context.fillRect(0, y, 768, 1);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [line, destination]);
  useEffect(() => () => display.dispose(), [display]);
  return <group>
    {[0, -4.35].map((offset, index) => <group key={offset} position={[offset, 0, 0]}>
      {[-1.3,1.3].map(x => <mesh key={x} position={[x, .95, 0]} castShadow><boxGeometry args={[1.5, 1.45, 1.3]}/><meshStandardMaterial color="#f5f5ee" roughness={.38}/></mesh>)}
      <mesh position={[0,.95,-.6]}><boxGeometry args={[1.1,1.45,.1]}/><meshStandardMaterial color="#354e64"/></mesh>
      <mesh position={[0,1.65,0]}><boxGeometry args={[1.15,.15,1.3]}/><meshStandardMaterial color="#f5f5ee"/></mesh>
      <mesh position={[0, 1.73, 0]}><boxGeometry args={[4.05, .13, 1.32]}/><meshStandardMaterial color="#e8e8dc"/></mesh>
      <mesh position={[0, .39, 0]}><boxGeometry args={[3.8, .32, 1.18]}/><meshStandardMaterial color="#4f5a69"/></mesh>
      <mesh position={[0, .65, .66]}><boxGeometry args={[4.08, .12, .025]}/><meshStandardMaterial color="#eff0db"/></mesh>
      {[-1.3, 1.3].map(x => <mesh key={x} position={[x, 1.29, .665]}><boxGeometry args={[1.3, .66, .03]}/><meshStandardMaterial color="#263d4e"/></mesh>)}
      <mesh position={[1.3, 1.42, .688]} name={`metro-led-${line}`}><planeGeometry args={[1.18, .22]}/><meshBasicMaterial map={display} toneMapped={false}/></mesh>
      {[-1, 1].map(side => <group key={side} position={[side * (.255 + door * .52), 1, .71]}><mesh><boxGeometry args={[.5, 1.25, .055]}/><meshStandardMaterial color="#f0f1eb"/></mesh><mesh position={[0, .28, .035]}><boxGeometry args={[.34, .42, .02]}/><meshStandardMaterial color="#293f50"/></mesh><mesh position={[side * -.16, -.08, .04]}><boxGeometry args={[.025, .16, .025]}/><meshStandardMaterial color="#b7bec0"/></mesh></group>)}
      {[-1.3, 1.3].map(x => <group key={x} position={[x, .2, 0]}><mesh><boxGeometry args={[.8, .25, .9]}/><meshStandardMaterial color="#424b59"/></mesh>{[-.48,.48].map(z => <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.14, .14, .1, 16]}/><meshStandardMaterial color="#48525e" metalness={.5}/></mesh>)}</group>)}
      {index === 0 ? <><mesh position={[2.07, 1.2, 0]}><boxGeometry args={[.055, .65, 1.05]}/><meshStandardMaterial color="#344e65"/></mesh>{[-.43,.43].map(z => <mesh key={z} position={[2.11,.68,z]}><boxGeometry args={[.035,.12,.15]}/><meshBasicMaterial color="#ffe9b0"/></mesh>)}</> : <mesh position={[2.16, .95, 0]}><boxGeometry args={[.3, 1.22, 1.05]}/><meshStandardMaterial color="#586373"/></mesh>}
    </group>)}
  </group>;
}
