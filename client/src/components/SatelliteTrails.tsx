import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as satellite from 'satellite.js';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';
import { EARTH_RADIUS } from './Earth';
import { Line } from '@react-three/drei';

const SCALE_FACTOR = 1 / 1000;
const MAX_TRAIL_SEGMENTS = 100;
const MIN_TRAIL_SEGMENTS = 10;
const TIME_STEP_MINUTES = 2;
const MAX_VISIBLE_DISTANCE = 100;
const LOD_NEAR_DISTANCE = 15;
const LOD_FAR_DISTANCE = 50;

export function SatelliteTrails() {
  const { satellites, selectedSatellite, showTrails, currentTime } = useSatelliteStore();
  const { camera } = useThree();
  const [lodSegments, setLodSegments] = useState(MAX_TRAIL_SEGMENTS);
  const [satellitePosition, setSatellitePosition] = useState<THREE.Vector3 | null>(null);
  
  useFrame(() => {
    if (!showTrails || !selectedSatellite || !satellitePosition) {
      return;
    }
    
    const distance = camera.position.distanceTo(satellitePosition);
    
    if (distance > MAX_VISIBLE_DISTANCE) {
      setLodSegments(0);
    } else if (distance < LOD_NEAR_DISTANCE) {
      setLodSegments(MAX_TRAIL_SEGMENTS);
    } else if (distance < LOD_FAR_DISTANCE) {
      const t = (distance - LOD_NEAR_DISTANCE) / (LOD_FAR_DISTANCE - LOD_NEAR_DISTANCE);
      const segments = Math.floor(MAX_TRAIL_SEGMENTS - t * (MAX_TRAIL_SEGMENTS - MIN_TRAIL_SEGMENTS));
      setLodSegments(segments);
    } else {
      const t = (distance - LOD_FAR_DISTANCE) / (MAX_VISIBLE_DISTANCE - LOD_FAR_DISTANCE);
      const segments = Math.floor(MIN_TRAIL_SEGMENTS * (1 - t));
      setLodSegments(Math.max(0, segments));
    }
  });
  
  const trails = useMemo(() => {
    if (!showTrails || !selectedSatellite || lodSegments === 0) return [];
    
    const sat = satellites.find(s => s.noradId === selectedSatellite);
    if (!sat) return [];
    
    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const points: THREE.Vector3[] = [];
      
      const baseTime = new Date(currentTime);
      
      for (let i = -lodSegments / 2; i < lodSegments / 2; i++) {
        const time = new Date(baseTime.getTime() + i * TIME_STEP_MINUTES * 60 * 1000);
        
        const positionAndVelocity = satellite.propagate(satrec, time);
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
          const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          
          const lat = positionGd.latitude;
          const lon = positionGd.longitude;
          const alt = positionGd.height;
          
          const radius = (EARTH_RADIUS + alt * SCALE_FACTOR);
          
          const x = radius * Math.cos(lat) * Math.cos(lon);
          const y = radius * Math.sin(lat);
          const z = radius * Math.cos(lat) * Math.sin(lon);
          
          const point = new THREE.Vector3(x, y, z);
          points.push(point);
          
          if (i === 0) {
            setSatellitePosition(point);
          }
        }
      }
      
      return points.length > 1 ? [points] : [];
    } catch (error) {
      console.error('Error generating trail:', error);
      return [];
    }
  }, [satellites, selectedSatellite, showTrails, currentTime, lodSegments]);
  
  if (!showTrails || trails.length === 0) return null;
  
  return (
    <group>
      {trails.map((points, index) => (
        <Line
          key={index}
          points={points}
          color="#ffff00"
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      ))}
    </group>
  );
}
