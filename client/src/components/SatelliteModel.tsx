import { useRef } from 'react';
import * as THREE from 'three';

interface SatelliteModelProps {
  scale?: number;
  color?: string | number;
}

export function SatelliteModel({ scale = 1, color = 0xcccccc }: SatelliteModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={groupRef} scale={scale}>
      {/* Main body - rectangular box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Solar Panel Left */}
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.05]} />
        <meshStandardMaterial 
          color={0x1a3a5c} 
          metalness={0.9} 
          roughness={0.1}
          emissive={0x0a1a2c}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Solar Panel Right */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.6, 1.2, 0.05]} />
        <meshStandardMaterial 
          color={0x1a3a5c} 
          metalness={0.9} 
          roughness={0.1}
          emissive={0x0a1a2c}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Antenna */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
        <meshStandardMaterial color={0x888888} metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Communication dish */}
      <mesh position={[0, -0.4, 0.2]} rotation={[Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.15, 0.1, 16]} />
        <meshStandardMaterial color={0xdddddd} metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

// For instanced rendering, we need to create a merged geometry
export function createSatelliteGeometry(): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  
  // Main body
  const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
  geometries.push(bodyGeometry);
  
  // Solar panels
  const panelGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.05);
  const leftPanel = panelGeometry.clone();
  leftPanel.translate(-0.8, 0, 0);
  geometries.push(leftPanel);
  
  const rightPanel = panelGeometry.clone();
  rightPanel.translate(0.8, 0, 0);
  geometries.push(rightPanel);
  
  // Antenna
  const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
  antennaGeometry.translate(0, 0.5, 0);
  geometries.push(antennaGeometry);
  
  // Communication dish
  const dishGeometry = new THREE.ConeGeometry(0.15, 0.1, 16);
  dishGeometry.rotateX(Math.PI / 4);
  dishGeometry.translate(0, -0.4, 0.2);
  geometries.push(dishGeometry);
  
  // Merge all geometries into one
  const merged: THREE.BufferGeometry[] = [];
  for (const geom of geometries) {
    merged.push(geom);
  }
  
  // Combine geometries by copying vertices and indices
  const combinedGeometry = new THREE.BufferGeometry();
  let vertexOffset = 0;
  const vertices: number[] = [];
  const indices: number[] = [];
  
  for (const geometry of merged) {
    const positions = geometry.getAttribute('position');
    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        vertices.push(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
      }
      
      if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i++) {
          indices.push((geometry.index.getX(i) as number) + vertexOffset);
        }
        vertexOffset += positions.count;
      }
    }
  }
  
  combinedGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  if (indices.length > 0) {
    combinedGeometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  }
  
  return combinedGeometry;
}
