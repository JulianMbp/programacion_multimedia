// src/App.tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Robot } from './components/models/Robot' // 👈 Importa el modelo

export default function App() {
  return (
    <Canvas
      camera={{
        position: [10, 10, 10],
        fov: 60,
        near: 0.1,
        far: 1000
      }}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} intensity={1} />

      {/* Tu cubo */}
      <mesh rotation={[0.5, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#44aa88" />
      </mesh>

      {/* El robot 👇 */}
      <Robot position={[10, 0, 0]} rotation={[0, Math.PI / 4, 0]} scale={1.2} />

      <OrbitControls enableDamping />
    </Canvas>
  )
}