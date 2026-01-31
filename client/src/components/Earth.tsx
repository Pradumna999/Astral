import { useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, BackSide, AdditiveBlending } from 'three';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

const EARTH_RADIUS = 6.371;

const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
  }
`;

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const { currentTime, isPaused, timeSpeed, setVisitedObject, setSelectedSatellite } = useSatelliteStore();
  const { pointer, camera, raycaster } = useThree();
  
  const dayTexture = useLoader(TextureLoader, '/textures/earth_day.jpg');
  const nightTexture = useLoader(TextureLoader, '/textures/earth_night.jpg');
  
  const earthShaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform vec3 sunDirection;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vec3 dayColor = texture2D(dayTexture, vUv).rgb;
          vec3 nightColor = texture2D(nightTexture, vUv).rgb;
          
          vec3 normalizedPos = normalize(vPosition);
          float cosineAngle = dot(normalizedPos, sunDirection);
          
          float mixValue = smoothstep(-0.1, 0.1, cosineAngle);
          
          vec3 color = mix(nightColor * 1.5, dayColor, mixValue);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }, [dayTexture, nightTexture]);
  
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true
    });
  }, []);
  
  const handleEarthClick = (event: any) => {
    event.stopPropagation();
    setVisitedObject('earth');
    setSelectedSatellite(null); // Deselect any satellite
  };
  
  useFrame((state, delta) => {
    if (earthRef.current && !isPaused) {
      earthRef.current.rotation.y += (delta * 0.05 * timeSpeed);
    }
    
    if (earthShaderMaterial && currentTime) {
      const dayOfYear = getDayOfYear(currentTime);
      const hourOfDay = currentTime.getUTCHours() + currentTime.getUTCMinutes() / 60;
      
      const sunLongitude = (hourOfDay / 24) * Math.PI * 2 - Math.PI;
      const sunLatitude = -23.44 * Math.cos((2 * Math.PI / 365.25) * (dayOfYear + 10)) * (Math.PI / 180);
      
      const sunDirection = new THREE.Vector3(
        Math.cos(sunLatitude) * Math.cos(sunLongitude),
        Math.sin(sunLatitude),
        Math.cos(sunLatitude) * Math.sin(sunLongitude)
      );
      
      earthShaderMaterial.uniforms.sunDirection.value = sunDirection;
    }
  });
  
  function getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
  
  return (
    <group>
      <mesh 
        ref={earthRef}
        onClick={handleEarthClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <primitive object={earthShaderMaterial} attach="material" />
      </mesh>
      
      <mesh ref={atmosphereRef} scale={1.015}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>
    </group>
  );
}

export { EARTH_RADIUS };
