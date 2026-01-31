import { useMemo } from 'react';
import * as THREE from 'three';

interface SatelliteGlowProps {
  position: [number, number, number];
  color?: number;
  intensity?: number;
  scale?: number;
}

/**
 * Adds a glow effect around satellites
 * Used for highlighting selected or visited satellites
 */
export function SatelliteGlow({ 
  position, 
  color = 0xffff00, 
  intensity = 1.0,
  scale = 0.5
}: SatelliteGlowProps) {
  
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        intensity: { value: intensity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float glowIntensity = pow(0.8 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(glowColor, glowIntensity * intensity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
  }, [color, intensity]);
  
  return (
    <mesh position={position} scale={scale * 3}>
      <sphereGeometry args={[1, 16, 16]} />
      <primitive object={glowMaterial} attach="material" />
    </mesh>
  );
}

/**
 * Pulsing glow effect for special attention
 */
export function PulsingGlow({ position, color = 0xff00ff }: SatelliteGlowProps) {
  const glowMaterial = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float time;
        varying vec3 vNormal;
        
        void main() {
          float pulse = sin(time * 2.0) * 0.5 + 0.5;
          float glowIntensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, glowIntensity * pulse);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    
    // Animate the pulse
    const animate = () => {
      material.uniforms.time.value += 0.016; // ~60fps
      requestAnimationFrame(animate);
    };
    animate();
    
    return material;
  }, [color]);
  
  return (
    <mesh position={position} scale={2}>
      <sphereGeometry args={[1, 16, 16]} />
      <primitive object={glowMaterial} attach="material" />
    </mesh>
  );
}
