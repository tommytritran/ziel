import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export default function VehicleDisplay({ line, destination, position, width, height, side = false }: { line: string; destination: string; position: [number, number, number]; width: number; height: number; side?: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 160;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#131b22'; context.fillRect(0, 0, 768, 160);
      context.fillStyle = '#ffc260'; context.textBaseline = 'middle';
      context.font = 'bold 100px monospace'; context.fillText(line || '—', 18, 84, 145);
      let size = 62; context.font = `bold ${size}px monospace`;
      while (context.measureText(destination).width > 555 && size > 24) { size -= 2; context.font = `bold ${size}px monospace`; }
      context.fillText(destination, 182, 84, 560);
      context.fillStyle = '#131b2245';
      for (let x = 0; x < 768; x += 5) context.fillRect(x, 0, 1, 160);
      for (let y = 0; y < 160; y += 5) context.fillRect(0, y, 768, 1);
    }
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; return result;
  }, [line, destination]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position} rotation={[0, side ? 0 : Math.PI / 2, 0]} name={`${side ? 'side' : 'front'}-display-${line}-${destination}`}><planeGeometry args={[width, height]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
