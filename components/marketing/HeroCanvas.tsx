'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 1500;

function Particles() {
  const ref = useRef<THREE.Points>(null);
  
  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const colorRatio = Math.random();
      colors[i * 3] = 0.18 + colorRatio * 0.15;
      colors[i * 3 + 1] = 0.49 + colorRatio * 0.2;
      colors[i * 3 + 2] = 0.27 + colorRatio * 0.1;
      
      sizes[i] = 0.02 + Math.random() * 0.03;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
      transparent: true,
      vertexColors: true,
      size: 1,
      sizeAttenuation: true,
      depthWrite: false,
      opacity: 0.8,
    });
    
    const points = new THREE.Points(geometry, material);
    ref.current = points;
    
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, []);

  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.02;
      ref.current.rotation.x += dt * 0.01;
      
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.0001;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return ref.current ? <primitive object={ref.current} /> : null;
}

export default function HeroCanvas() {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-900 opacity-20" aria-hidden="true" />
    );
  }

  return (
    <Canvas 
      camera={{ position: [0, 0, 15], fov: 50 }} 
      className="absolute inset-0"
      style={{ outline: 'none' }}
    >
      <color attach="background" args={['#F5F0E1']} />
      <fog attach="fog" args={['#F5F0E1', 10, 30]} />
      <Particles />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
    </Canvas>
  );
}