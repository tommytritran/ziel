import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { IllustratedRoute } from './routeGeometry';
import { WINDOW_HALF_DEPTH, WINDOW_HALF_LENGTH, WINDOW_LATERAL } from './undergroundWindow';
import type { UndergroundWindow } from './undergroundWindow';
import type { StoryStage } from './story';
import { stationAccesses } from './stationAccess';

export default function UndergroundMask({ route, window, stages }: { route: IllustratedRoute; window: UndergroundWindow; stages: StoryStage[] }) {
  const { scene, camera } = useThree();
  const uniforms = useMemo(() => ({
    uWindowActive: { value: 0 }, uWindowCenter: { value: new THREE.Vector2() },
    uWindowAxis: { value: new THREE.Vector2(1, 0) }, uWindowRay: { value: new THREE.Vector3() },
  }), []);
  const patched = useMemo(() => new Map<THREE.Material, { compile: THREE.Material['onBeforeCompile']; key: THREE.Material['customProgramCacheKey'] }>(), []);
  const accesses = useMemo(() => stationAccesses(stages).map(access => { const center = route.sample((access.start + access.end) / 2, 1.5); return { center, halfLength: (access.end - access.start) / 2 + .08 }; }), [route, stages]);
  useFrame(() => {
    const liveMaterials = new Set<THREE.Material>();
    const p = route.sample(window.center, window.lateral ?? WINDOW_LATERAL);
    const axis = route.sample(window.center);
    uniforms.uWindowActive.value = window.active ? 1 : 0;
    uniforms.uWindowCenter.value.set(p.x, p.z);
    uniforms.uWindowAxis.value.set(Math.cos(axis.yaw), -Math.sin(axis.yaw));
    camera.getWorldDirection(uniforms.uWindowRay.value).negate();
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        liveMaterials.add(material);
        if (patched.has(material)) continue;
        const compile = material.onBeforeCompile; const key = material.customProgramCacheKey;
        patched.set(material, { compile, key });
        material.onBeforeCompile = (shader: Parameters<THREE.Material['onBeforeCompile']>[0], renderer: THREE.WebGLRenderer) => {
          compile.call(material, shader, renderer);
          Object.assign(shader.uniforms, uniforms);
          const accessTest = accesses.map(access => `{
            vec2 delta = testPoint - vec2(${access.center.x.toFixed(6)}, ${access.center.z.toFixed(6)});
            if (abs(dot(delta, vec2(${Math.cos(access.center.yaw).toFixed(6)}, ${(-Math.sin(access.center.yaw)).toFixed(6)}))) < ${access.halfLength.toFixed(6)} && abs(dot(delta, vec2(${Math.sin(access.center.yaw).toFixed(6)}, ${Math.cos(access.center.yaw).toFixed(6)}))) < 0.66) accessOpening = true;
          }`).join('\n');
          shader.vertexShader = `varying vec3 vWindowWorld;\n${shader.vertexShader}`.replace('#include <project_vertex>', 'vWindowWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>');
          shader.fragmentShader = `varying vec3 vWindowWorld;\nuniform float uWindowActive;\nuniform vec2 uWindowCenter;\nuniform vec2 uWindowAxis;\nuniform vec3 uWindowRay;\n${shader.fragmentShader}`.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
            ${material.userData.stationSurface ? `if (vWindowWorld.y >= -0.11 && vWindowWorld.y <= 0.13) { vec2 testPoint = vWindowWorld.xz; bool accessOpening = false; ${accessTest} if (accessOpening) discard; }` : ''}
            if (vWindowWorld.y < -0.11) {
              float rayT = (-0.1 - vWindowWorld.y) / max(uWindowRay.y, 0.001);
              vec2 testPoint = (vWindowWorld + uWindowRay * rayT).xz;
              bool accessOpening = false;
              ${accessTest}
              vec2 groundPoint = testPoint - uWindowCenter;
              vec2 across = vec2(-uWindowAxis.y, uWindowAxis.x);
              vec2 ellipse = vec2(dot(groundPoint, uWindowAxis) / ${WINDOW_HALF_LENGTH.toFixed(2)}, dot(groundPoint, across) / ${WINDOW_HALF_DEPTH.toFixed(2)});
              if (!accessOpening && (uWindowActive < 0.5 || dot(ellipse, ellipse) > 1.0)) discard;
            }
          `);
        };
        material.customProgramCacheKey = () => `${key.call(material)}-underground-window-access-${JSON.stringify(accesses)}-${Boolean(material.userData.stationSurface)}`;
        material.needsUpdate = true;
      }
    });
    for (const [material, original] of patched) {
      if (!liveMaterials.has(material)) {
        material.onBeforeCompile = original.compile;
        material.customProgramCacheKey = original.key;
        patched.delete(material);
      }
    }
  });
  useEffect(() => () => { for (const [material, original] of patched) { material.onBeforeCompile = original.compile; material.customProgramCacheKey = original.key; material.needsUpdate = true; } patched.clear(); }, [patched, accesses]);
  return null;
}
