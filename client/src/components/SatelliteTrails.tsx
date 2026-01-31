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
const LOD_UPDATE_THRESHOLD = 5; // Only update LOD if distance changes by more than 5 units

export function SatelliteTrails() {
  const { satellites, selectedSatellite, showTrails, currentTime } = useSatelliteStore();
  const { camera } = useThree();
  const [lodSegments, setLodSegments] = useState(MAX_TRAIL_SEGMENTS);
  
  // Use ref to store satellite position - doesn't trigger re-renders
  const satellitePositionRef = useRef<THREE.Vector3 | null>(null);
  const lastDistanceRef = useRef<number>(0);
  
  useFrame(() => {
    if (!showTrails || !selectedSatellite || !satellitePositionRef.current) {
      return;
    }
    
    const distance = camera.position.distanceTo(satellitePositionRef.current);
    
    // Only update LOD if distance changed significantly
    if (Math.abs(distance - lastDistanceRef.current) < LOD_UPDATE_THRESHOLD) {
      return;
    }
    
    lastDistanceRef.current = distance;
    
    let newSegments: number;
    
    if (distance > MAX_VISIBLE_DISTANCE) {
      newSegments = 0;
    } else if (distance < LOD_NEAR_DISTANCE) {
      newSegments = MAX_TRAIL_SEGMENTS;
    } else if (distance < LOD_FAR_DISTANCE) {
      const t = (distance - LOD_NEAR_DISTANCE) / (LOD_FAR_DISTANCE - LOD_NEAR_DISTANCE);
      newSegments = Math.floor(MAX_TRAIL_SEGMENTS - t * (MAX_TRAIL_SEGMENTS - MIN_TRAIL_SEGMENTS));
    } else {
      const t = (distance - LOD_FAR_DISTANCE) / (MAX_VISIBLE_DISTANCE - LOD_FAR_DISTANCE);
      newSegments = Math.floor(MIN_TRAIL_SEGMENTS * (1 - t));
      newSegments = Math.max(0, newSegments);
    }
    
    // Only update state if segments actually changed
    if (newSegments !== lodSegments) {
      setLodSegments(newSegments);
    }
  });
  
  // Compute trails - pure computation only, no side effects
  const trailData = useMemo(() => {
    if (lodSegments === 0) {
      return { trails: [], currentPosition: null };
    }
    
    const sat = satellites.find(s => s.noradId === selectedSatellite);
    if (!sat) {
      return { trails: [], currentPosition: null };
    }
    
    try {
      const satrec = satellite.twoline2satrec(sat.line1, sat.line2);
      const points: THREE.Vector3[] = [];
      let currentPosition: THREE.Vector3 | null = null;
      
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
          
          // Store current position (i === 0) to return it
          if (i === 0) {
            currentPosition = point;
          }
        }
      }
      
      return {
        trails: points.length > 1 ? [points] : [],
        currentPosition
      };
    } catch (error) {
      console.error('Error generating trail:', error);
      return { trails: [], currentPosition: null };
    }
  }, [satellites, selectedSatellite, showTrails, currentTime, lodSegments]);
  
  // Update satellite position ref when trails change - using useEffect for side effects
  useEffect(() => {
    if (trailData?.currentPosition) {
      satellitePositionRef.current = trailData.currentPosition;
    }
  }, [trailData]);
  
  // Early return AFTER all hooks to comply with Rules of Hooks
  if (!showTrails || !selectedSatellite || trailData.trails.length === 0) {
    return null;
  }
  
  return (
    <group>
      {trailData.trails.map((points, index) => (
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
