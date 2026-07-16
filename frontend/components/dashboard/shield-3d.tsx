"use client"

import { Environment, Float } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { Suspense, useMemo, useRef } from "react"
import * as THREE from "three"

// Build a shield outline as an extruded 3D shape.
function useShieldGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    const w = 1
    const top = 1.35
    const shoulder = 0.95
    shape.moveTo(0, top)
    shape.bezierCurveTo(w * 0.7, shoulder, w, shoulder, w, 0.35)
    shape.bezierCurveTo(w, -0.4, w * 0.55, -1.05, 0, -1.4)
    shape.bezierCurveTo(-w * 0.55, -1.05, -w, -0.4, -w, 0.35)
    shape.bezierCurveTo(-w, shoulder, -w * 0.7, shoulder, 0, top)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.1,
      bevelSegments: 6,
      curveSegments: 48,
    })
    geo.center()
    return geo
  }, [])
}

function ShieldMesh({ threat }: { threat: number }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useShieldGeometry()

  // Color shifts from safe-teal toward danger-red as threat rises.
  const color = useMemo(() => {
    const safe = new THREE.Color("#e23636")
    return safe
  }, [])

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.5
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.12
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={group} scale={0.62}>
        {/* Main shield body */}
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial
            color={color}
            metalness={0.85}
            roughness={0.25}
            emissive="#e23636"
            emissiveIntensity={0.25}
          />
        </mesh>
        {/* Glowing core checkmark bar */}
        <mesh position={[0, 0, 0.32]}>
          <boxGeometry args={[0.12, 0.9, 0.08]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffd5d5"
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
        {/* Wireframe halo */}
        <mesh geometry={geometry} scale={1.06}>
          <meshBasicMaterial color="#e23636" wireframe transparent opacity={0.12} />
        </mesh>
      </group>
    </Float>
  )
}

function Particles() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 120
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.04
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#e23636" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

export function Shield3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <pointLight position={[-3, -2, 2]} intensity={30} color="#e23636" />
        <ShieldMesh threat={0.5} />
        <Particles />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  )
}
