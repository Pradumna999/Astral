import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

interface TrailPoint {
  position: THREE.Vector3;
  timestamp: number;
}

const MAX_TRAIL_POINTS = 100;
const TRAIL_LIFETIME = 10000; // 10 seconds

export function MotionTrails() {
  const {
    selectedSatellite,
    visitedObject,
    getRealtimePosition,
    showTrails
  } = useSatelliteStore();
  
  const trailData = useRef<Map<string, TrailPoint[]>>(new Map());
  const linesRef = useRef<Map<string, THREE.Line>>(new Map());
  const groupRef = useRef<THREE.Group>(null);
  
  // Determine which satellites should have trails
  const shouldShowTrail = (satId: string): boolean => {
    if (!showTrails) return false;
    
    // Show trail for selected satellite
    if (selectedSatellite === satId) return true;
    
    // Show trail for visited satellite
    if (visitedObject === satId) return true;
    
    return false;
  };
  
  // Update trails every frame
  useFrame(() => {
    if (!groupRef.current) return;
    
    const now = performance.now();
    
    // Get satellites that need trails
    const satellitesWithTrails = new Set<string>();
    
    if (selectedSatellite) {
      satellitesWithTrails.add(selectedSatellite);
    }
    
    if (visitedObject && visitedObject !== 'earth') {
      satellitesWithTrails.add(visitedObject);
    }
    
    // Update each satellite's trail
    satellitesWithTrails.forEach(satId => {
      const position = getRealtimePosition(satId);
      if (!position) return;
      
      // Get or create trail for this satellite
      let trail = trailData.current.get(satId);
      if (!trail) {
        trail = [];
        trailData.current.set(satId, trail);
      }
      
      // Add new point to trail
      const newPoint: TrailPoint = {
        position: new THREE.Vector3(position.x, position.y, position.z),
        timestamp: now
      };
      
      trail.push(newPoint);
      
      // Remove old points
      const cutoffTime = now - TRAIL_LIFETIME;
      const validPoints = trail.filter(point => point.timestamp > cutoffTime);
      
      // Limit number of points
      if (validPoints.length > MAX_TRAIL_POINTS) {
        validPoints.splice(0, validPoints.length - MAX_TRAIL_POINTS);
      }
      
      trailData.current.set(satId, validPoints);
      
      // Update or create line geometry
      if (validPoints.length > 1) {
        updateTrailLine(satId, validPoints, now);
      }
    });
    
    // Clean up trails for satellites no longer being tracked
    const currentTrails = Array.from(trailData.current.keys());
    currentTrails.forEach(satId => {
      if (!satellitesWithTrails.has(satId)) {
        // Remove trail data
        trailData.current.delete(satId);
        
        // Remove line from scene
        const line = linesRef.current.get(satId);
        if (line && groupRef.current) {
          groupRef.current.remove(line);
          line.geometry.dispose();
          if (Array.isArray(line.material)) {
            line.material.forEach(m => m.dispose());
          } else {
            line.material.dispose();
          }
        }
        linesRef.current.delete(satId);
      }
    });
  });
  
  const updateTrailLine = (satId: string, points: TrailPoint[], currentTime: number) => {
    if (!groupRef.current) return;
    
    // Create geometry from points
    const positions: number[] = [];
    const colors: number[] = [];
    
    points.forEach((point, index) => {
      positions.push(point.position.x, point.position.y, point.position.z);
      
      // Calculate opacity based on age
      const age = currentTime - point.timestamp;
      const opacity = 1 - (age / TRAIL_LIFETIME);
      
      // Color based on satellite (selected = yellow, visited = purple)
      let baseColor: THREE.Color;
      if (satId === selectedSatellite) {
        baseColor = new THREE.Color(0xffff00); // Yellow
      } else if (satId === visitedObject) {
        baseColor = new THREE.Color(0xaa00ff); // Purple
      } else {
        baseColor = new THREE.Color(0x00aaff); // Blue
      }
      
      // Apply opacity to color
      colors.push(
        baseColor.r * opacity,
        baseColor.g * opacity,
        baseColor.b * opacity
      );
    });
    
    // Get or create line
    let line = linesRef.current.get(satId);
    
    if (!line) {
      // Create new line
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
      });
      
      line = new THREE.Line(geometry, material);
      groupRef.current.add(line);
      linesRef.current.set(satId, line);
    }
    
    // Update geometry
    const geometry = line.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      linesRef.current.forEach(line => {
        line.geometry.dispose();
        if (Array.isArray(line.material)) {
          line.material.forEach(m => m.dispose());
        } else {
          line.material.dispose();
        }
      });
    };
  }, []);
  
  if (!showTrails) return null;
  
  return <group ref={groupRef} />;
}
