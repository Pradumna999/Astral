import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';
import { Line } from '@react-three/drei';

/**
 * Renders a red line between the selected satellite and its closest neighbor
 * Also displays distance markers
 */
export function ClosestSatelliteLine() {
  const {
    selectedSatellite,
    closestSatelliteMode,
    closestSatelliteId,
    closestSatelliteDistance,
    getRealtimePosition
  } = useSatelliteStore();
  
  const lineRef = useRef<THREE.Line>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Update line position every frame
  useFrame(() => {
    if (!closestSatelliteMode || !selectedSatellite || !closestSatelliteId) {
      return;
    }
    
    const selectedPos = getRealtimePosition(selectedSatellite);
    const closestPos = getRealtimePosition(closestSatelliteId);
    
    if (!selectedPos || !closestPos || !lineRef.current) return;
    
    // Update line geometry with new positions
    const positions = new Float32Array([
      selectedPos.x, selectedPos.y, selectedPos.z,
      closestPos.x, closestPos.y, closestPos.z
    ]);
    
    lineRef.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  if (!closestSatelliteMode || !selectedSatellite || !closestSatelliteId) {
    return null;
  }
  
  const selectedPos = getRealtimePosition(selectedSatellite);
  const closestPos = getRealtimePosition(closestSatelliteId);
  
  if (!selectedPos || !closestPos) return null;
  
  const points = [
    new THREE.Vector3(selectedPos.x, selectedPos.y, selectedPos.z),
    new THREE.Vector3(closestPos.x, closestPos.y, closestPos.z)
  ];
  
  return (
    <group ref={groupRef}>
      {/* Main red line */}
      <Line
        ref={lineRef}
        points={points}
        color="red"
        lineWidth={3}
        dashed={false}
      />
      
      {/* Glowing effect line (thicker, transparent) */}
      <Line
        points={points}
        color="red"
        lineWidth={6}
        transparent
        opacity={0.3}
      />
      
      {/* Distance marker at midpoint */}
      {closestSatelliteDistance && (
        <DistanceMarker
          position={[
            (selectedPos.x + closestPos.x) / 2,
            (selectedPos.y + closestPos.y) / 2,
            (selectedPos.z + closestPos.z) / 2
          ]}
          distance={closestSatelliteDistance}
        />
      )}
    </group>
  );
}

/**
 * Floating distance marker showing the distance between satellites
 */
function DistanceMarker({ position, distance }: { position: [number, number, number], distance: number }) {
  return (
    <group position={position}>
      {/* Small sphere marker */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>
      
      {/* Pulsing glow */}
      <mesh scale={1.5}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial 
          color="red" 
          transparent 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
