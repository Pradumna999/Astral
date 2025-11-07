import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const { followedSatellite, satellitePositions } = useSatelliteStore();
  
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const currentCameraOffset = useRef(new THREE.Vector3(0, 5, 15));
  
  useEffect(() => {
    if (!followedSatellite) {
      camera.position.set(0, 15, 30);
      camera.lookAt(0, 0, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [followedSatellite, camera]);
  
  useFrame(() => {
    if (!controlsRef.current) return;
    
    if (followedSatellite) {
      const satPos = satellitePositions.get(followedSatellite);
      
      if (satPos) {
        targetPosition.current.set(satPos.x, satPos.y, satPos.z);
        
        const satVector = targetPosition.current.clone().normalize();
        const offset = satVector.clone().multiplyScalar(3);
        const cameraPos = targetPosition.current.clone().add(offset);
        
        camera.position.lerp(cameraPos, 0.05);
        
        controlsRef.current.target.lerp(targetPosition.current, 0.05);
        controlsRef.current.update();
      }
    } else {
      controlsRef.current.update();
    }
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={50}
      enablePan={true}
      target={[0, 0, 0]}
    />
  );
}
