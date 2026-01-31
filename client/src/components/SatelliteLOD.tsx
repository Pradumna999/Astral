import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface SatelliteLODProps {
  position: [number, number, number];
  color: THREE.Color;
  scale: number;
  isSelected?: boolean;
  isHovered?: boolean;
}

/**
 * Level of Detail (LOD) component for satellites
 * Renders different complexity models based on distance from camera
 * 
 * Distance Ranges:
 * - < 10 units: Detailed model (body + panels + antenna + dish)
 * - 10-25 units: Medium model (body + panels)
 * - 25-40 units: Simple model (body only)
 * - > 40 units: Point (sphere)
 */
export function SatelliteLOD({ position, color, scale, isSelected, isHovered }: SatelliteLODProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [x, y, z] = position;
  
  const distance = useRef(0);
  const lodLevel = useRef<'point' | 'simple' | 'medium' | 'detailed'>('simple');
  
  // Memoize geometries for performance
  const geometries = useMemo(() => ({
    // Detailed model components
    body: new THREE.BoxGeometry(0.4, 0.6, 0.4),
    panel: new THREE.BoxGeometry(0.6, 1.2, 0.05),
    antenna: new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8),
    dish: new THREE.ConeGeometry(0.15, 0.1, 16),
    
    // Simple models
    simpleBody: new THREE.BoxGeometry(0.5, 0.7, 0.5),
    point: new THREE.SphereGeometry(0.3, 8, 8)
  }), []);
  
  // Memoize materials
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ 
      color: color,
      metalness: 0.8, 
      roughness: 0.2 
    }),
    panel: new THREE.MeshStandardMaterial({ 
      color: 0x1a3a5c,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0a1a2c,
      emissiveIntensity: 0.2
    }),
    antenna: new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      metalness: 0.7,
      roughness: 0.3
    }),
    dish: new THREE.MeshStandardMaterial({ 
      color: 0xdddddd,
      metalness: 0.6,
      roughness: 0.4
    }),
    point: new THREE.MeshBasicMaterial({ color: color })
  }), [color]);
  
  // Update LOD based on distance to camera
  useFrame(() => {
    if (!groupRef.current) return;
    
    const camPos = camera.position;
    const satPos = new THREE.Vector3(x, y, z);
    distance.current = camPos.distanceTo(satPos);
    
    // Determine LOD level
    let newLevel: 'point' | 'simple' | 'medium' | 'detailed';
    if (distance.current < 10) {
      newLevel = 'detailed';
    } else if (distance.current < 25) {
      newLevel = 'medium';
    } else if (distance.current < 40) {
      newLevel = 'simple';
    } else {
      newLevel = 'point';
    }
    
    lodLevel.current = newLevel;
  });
  
  // Render based on current LOD level
  const renderLOD = () => {
    const level = lodLevel.current;
    
    if (level === 'point') {
      // Point representation (furthest)
      return (
        <mesh geometry={geometries.point} material={materials.point} />
      );
    }
    
    if (level === 'simple') {
      // Simple body only
      return (
        <mesh geometry={geometries.simpleBody} material={materials.body} />
      );
    }
    
    if (level === 'medium') {
      // Body + solar panels
      return (
        <>
          <mesh geometry={geometries.body} material={materials.body} />
          <mesh position={[-0.8, 0, 0]} geometry={geometries.panel} material={materials.panel} />
          <mesh position={[0.8, 0, 0]} geometry={geometries.panel} material={materials.panel} />
        </>
      );
    }
    
    // Detailed model (closest)
    return (
      <>
        {/* Main body */}
        <mesh geometry={geometries.body} material={materials.body} />
        
        {/* Solar panels */}
        <mesh position={[-0.8, 0, 0]} geometry={geometries.panel} material={materials.panel} />
        <mesh position={[0.8, 0, 0]} geometry={geometries.panel} material={materials.panel} />
        
        {/* Antenna */}
        <mesh position={[0, 0.5, 0]} geometry={geometries.antenna} material={materials.antenna} />
        
        {/* Communication dish */}
        <mesh 
          position={[0, -0.4, 0.2]} 
          rotation={[Math.PI / 4, 0, 0]}
          geometry={geometries.dish} 
          material={materials.dish} 
        />
      </>
    );
  };
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {renderLOD()}
    </group>
  );
}

/**
 * Hook to determine if a satellite should be rendered based on frustum culling
 * Returns true if satellite is in camera view
 */
export function useIsInView(position: THREE.Vector3): boolean {
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const cameraViewProjectionMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  useFrame(() => {
    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
  });
  
  return frustum.containsPoint(position);
}
