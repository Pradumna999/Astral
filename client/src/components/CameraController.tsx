import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';
import { EARTH_RADIUS } from './Earth';

// Camera states
type CameraState = 'overview' | 'visiting_earth' | 'visiting_satellite' | 'closest_satellite_view' | 'transitioning';

// Camera presets for different views
const CAMERA_PRESETS = {
  overview: {
    position: new THREE.Vector3(0, 15, 30),
    target: new THREE.Vector3(0, 0, 0),
    minDistance: 8,
    maxDistance: 50,
    enableRotate: true,
    autoRotate: false,
    autoRotateSpeed: 0.5
  },
  visitingEarth: {
    position: new THREE.Vector3(0, EARTH_RADIUS * 1.5, EARTH_RADIUS * 2),
    target: new THREE.Vector3(0, 0, 0),
    minDistance: EARTH_RADIUS + 1,
    maxDistance: EARTH_RADIUS * 4,
    enableRotate: true,
    autoRotate: true,
    autoRotateSpeed: 0.3
  },
  visitingSatellite: {
    minDistance: 0.5,
    maxDistance: 5,
    enableRotate: true,
    autoRotate: true,
    autoRotateSpeed: 1.0
  },
  closestSatelliteView: {
    minDistance: 5,
    maxDistance: 50,
    enableRotate: true,
    autoRotate: false,
    autoRotateSpeed: 0
  }
};

export function CameraController() {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  
  const visitedObject = useSatelliteStore((state) => state.visitedObject);
  const followedSatellite = useSatelliteStore((state) => state.followedSatellite);
  const getRealtimePosition = useSatelliteStore((state) => state.getRealtimePosition);
  const closestSatelliteMode = useSatelliteStore((state) => state.closestSatelliteMode);
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);
  const closestSatelliteId = useSatelliteStore((state) => state.closestSatelliteId);
  
  const [cameraState, setCameraState] = useState<CameraState>('overview');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const targetPosition = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const transitionProgress = useRef(0);
  const startCameraPosition = useRef(new THREE.Vector3());
  const startCameraTarget = useRef(new THREE.Vector3());
  
  // Smooth easing function (ease-out exponential)
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };
  
  // Handle closest satellite mode
  useEffect(() => {
    if (!controlsRef.current) return;
    
    if (closestSatelliteMode && selectedSatellite && closestSatelliteId) {
      // Position camera to see both satellites
      setCameraState('closest_satellite_view');
      
      const pos1 = getRealtimePosition(selectedSatellite);
      const pos2 = getRealtimePosition(closestSatelliteId);
      
      if (pos1 && pos2) {
        // Calculate midpoint
        const midpoint = new THREE.Vector3(
          (pos1.x + pos2.x) / 2,
          (pos1.y + pos2.y) / 2,
          (pos1.z + pos2.z) / 2
        );
        
        // Calculate distance between satellites
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Position camera to see both satellites
        // Camera should be perpendicular to the line and at appropriate distance
        const normal = midpoint.clone().normalize();
        const cameraDistance = Math.max(distance * 2, 15); // At least 15 units away
        const cameraPos = midpoint.clone().add(normal.multiplyScalar(cameraDistance * 0.7));
        
        startTransition(cameraPos, midpoint);
        
        setTimeout(() => {
          if (controlsRef.current) {
            const preset = CAMERA_PRESETS.closestSatelliteView;
            controlsRef.current.autoRotate = preset.autoRotate;
            controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;
          }
        }, 100);
      }
      
      return;
    }
    
    // Original visit logic
    if (!visitedObject) {
      // Return to overview
      setCameraState('overview');
      const preset = CAMERA_PRESETS.overview;
      startTransition(preset.position, preset.target);
      
      setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.autoRotate = preset.autoRotate;
          controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;
        }
      }, 100);
      
    } else if (visitedObject === 'earth') {
      // Visit Earth
      setCameraState('visiting_earth');
      const preset = CAMERA_PRESETS.visitingEarth;
      startTransition(preset.position, preset.target);
      
      setTimeout(() => {
        if (controlsRef.current) {
          controlsRef.current.autoRotate = preset.autoRotate;
          controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;
        }
      }, 100);
      
    } else {
      // Visit satellite
      setCameraState('visiting_satellite');
      const satPos = getRealtimePosition(visitedObject);
      if (satPos) {
        const satVector = new THREE.Vector3(satPos.x, satPos.y, satPos.z);
        const normal = satVector.clone().normalize();
        
        const distance = 2.5;
        const offset = normal.clone().multiplyScalar(distance);
        const tangent = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
        const cameraPos = satVector.clone().add(offset).add(tangent.multiplyScalar(0.5));
        
        startTransition(cameraPos, satVector);
        
        setTimeout(() => {
          if (controlsRef.current) {
            const preset = CAMERA_PRESETS.visitingSatellite;
            controlsRef.current.autoRotate = preset.autoRotate;
            controlsRef.current.autoRotateSpeed = preset.autoRotateSpeed;
          }
        }, 100);
      }
    }
  }, [visitedObject, closestSatelliteMode, selectedSatellite, closestSatelliteId, getRealtimePosition]);
  
  const startTransition = (newPosition: THREE.Vector3, newTarget: THREE.Vector3) => {
    startCameraPosition.current.copy(camera.position);
    if (controlsRef.current) {
      startCameraTarget.current.copy(controlsRef.current.target);
    }
    targetPosition.current.copy(newPosition);
    targetLookAt.current.copy(newTarget);
    transitionProgress.current = 0;
    setIsTransitioning(true);
    setCameraState('transitioning');
    
    if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  };
  
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // Handle smooth transitions
    if (isTransitioning) {
      transitionProgress.current += delta * 1.2;
      
      if (transitionProgress.current >= 1) {
        transitionProgress.current = 1;
        setIsTransitioning(false);
        
        if (closestSatelliteMode) {
          setCameraState('closest_satellite_view');
        } else if (!visitedObject) {
          setCameraState('overview');
        } else if (visitedObject === 'earth') {
          setCameraState('visiting_earth');
        } else {
          setCameraState('visiting_satellite');
        }
      }
      
      const easedProgress = easeOutExpo(transitionProgress.current);
      
      camera.position.lerpVectors(
        startCameraPosition.current,
        targetPosition.current,
        easedProgress
      );
      
      const currentTarget = new THREE.Vector3().lerpVectors(
        startCameraTarget.current,
        targetLookAt.current,
        easedProgress
      );
      
      controlsRef.current.target.copy(currentTarget);
      controlsRef.current.update();
      
      return;
    }
    
    // Handle closest satellite view (keep both in view)
    if (cameraState === 'closest_satellite_view' && closestSatelliteMode && selectedSatellite && closestSatelliteId) {
      const pos1 = getRealtimePosition(selectedSatellite);
      const pos2 = getRealtimePosition(closestSatelliteId);
      
      if (pos1 && pos2) {
        const midpoint = new THREE.Vector3(
          (pos1.x + pos2.x) / 2,
          (pos1.y + pos2.y) / 2,
          (pos1.z + pos2.z) / 2
        );
        
        // Smoothly follow the midpoint
        controlsRef.current.target.lerp(midpoint, 0.05);
        controlsRef.current.update();
      }
    }
    // Handle continuous following/visiting behavior
    else if (cameraState === 'visiting_satellite' && visitedObject && visitedObject !== 'earth') {
      const satPos = getRealtimePosition(visitedObject);
      
      if (satPos) {
        const satVector = new THREE.Vector3(satPos.x, satPos.y, satPos.z);
        
        controlsRef.current.target.lerp(satVector, 0.1);
        
        const currentDistance = camera.position.distanceTo(satVector);
        const normal = satVector.clone().normalize();
        
        if (currentDistance > 4 || currentDistance < 1.5) {
          const offset = normal.clone().multiplyScalar(2.5);
          const idealPos = satVector.clone().add(offset);
          camera.position.lerp(idealPos, 0.05);
        }
        
        controlsRef.current.update();
      }
    } else if (cameraState === 'visiting_earth') {
      controlsRef.current.update();
    } else if (followedSatellite && !visitedObject && !closestSatelliteMode) {
      const satPos = getRealtimePosition(followedSatellite);
      
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
  
  // Dynamic camera limits based on state
  const getMinDistance = () => {
    if (cameraState === 'visiting_earth') return CAMERA_PRESETS.visitingEarth.minDistance;
    if (cameraState === 'visiting_satellite') return CAMERA_PRESETS.visitingSatellite.minDistance;
    if (cameraState === 'closest_satellite_view') return CAMERA_PRESETS.closestSatelliteView.minDistance;
    return CAMERA_PRESETS.overview.minDistance;
  };
  
  const getMaxDistance = () => {
    if (cameraState === 'visiting_earth') return CAMERA_PRESETS.visitingEarth.maxDistance;
    if (cameraState === 'visiting_satellite') return CAMERA_PRESETS.visitingSatellite.maxDistance;
    if (cameraState === 'closest_satellite_view') return CAMERA_PRESETS.closestSatelliteView.maxDistance;
    return CAMERA_PRESETS.overview.maxDistance;
  };
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={getMinDistance()}
      maxDistance={getMaxDistance()}
      enablePan={true}
      target={[0, 0, 0]}
      autoRotate={false}
      autoRotateSpeed={0.5}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  );
}
