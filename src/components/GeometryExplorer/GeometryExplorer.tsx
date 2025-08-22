
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

type GeometryKey = 'box' | 'sphere' | 'plane' | 'cone' | 'cylinder' | 'torus' | 'torusKnot' | 'ring'
interface GeometryInfo {
  name: string
  color: string
  create: () => THREE.BufferGeometry
}

export default function GeometryExplorer() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const currentMeshRef = useRef<THREE.Mesh | null>(null)
  const animRef = useRef<number | null>(null)

  const GEOMETRIES: Record<GeometryKey, GeometryInfo> = useMemo(() => ({
    box: {
      name: 'Cubo',
      color: '#44aa88',
      create: () => new THREE.BoxGeometry(1.5, 1.5, 1.5)
    },
    sphere: {
      name: 'Esfera',
      color: '#FF6B6B',
      create: () => new THREE.SphereGeometry(1, 32, 16)
    },
    plane: {
      name: 'Plano',
      color: '#4ECDC4',
      create: () => new THREE.PlaneGeometry(2, 2)
    },
    cone: {
      name: 'Cono',
      color: '#FFD93D',
      create: () => new THREE.ConeGeometry(1, 2, 16)
    },
    cylinder: {
      name: 'Cilindro',
      color: '#1A535C',
      create: () => new THREE.CylinderGeometry(1, 1, 2, 16)
    },
    torus: {
      name: 'Toro',
      color: '#FF6B6B',
      create: () => new THREE.TorusGeometry(1, 0.3, 16, 64)
    },
    torusKnot: {
      name: 'Nudo Toroidal',
      color: '#4ECDC4',
      create: () => new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
    },
    ring: {
      name: 'Anillo',
      color: '#FFD93D',
      create: () => new THREE.RingGeometry(0.5, 1, 32)
    },
  }), [])

  // Estado de geometría seleccionada (persistente)
  const [geometryKey, setGeometryKey] = useState<GeometryKey>(() => {
    const stored = localStorage.getItem('geometryKey')
    if (stored && Object.keys(GEOMETRIES).includes(stored)) {
      return stored as GeometryKey
    }
    return 'box'
  })
  const [wireframe, setWireframe] = useState<boolean>(() => {
    return localStorage.getItem("wireframe") === "true"
  })
  const [autoRotate, setAutoRotate] = useState<boolean>(() => {
    return localStorage.getItem("autoRotate") !== "false"
  })

  // Refs espejo
  const wireframeRef = useRef(wireframe)
  const autoRotateRef = useRef(autoRotate)

  // Sync React -> Ref + localStorage
  useEffect(() => {
    wireframeRef.current = wireframe
    localStorage.setItem("wireframe", String(wireframe))
    console.log("🎨 Wireframe actualizado:", wireframe)
  }, [wireframe])

  useEffect(() => {
    autoRotateRef.current = autoRotate
    localStorage.setItem("autoRotate", String(autoRotate))
    console.log("🔄 AutoRotate actualizado:", autoRotate)
  }, [autoRotate])

  useEffect(() => {
    localStorage.setItem('geometryKey', geometryKey)
    console.log('📦 Geometría guardada:', geometryKey)
  }, [geometryKey])


  // Inicializar escena y mesh
  useEffect(() => {
    if (!mountRef.current) return
    console.log("🎬 Inicializando escena...")

    // Escena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0a)
    sceneRef.current = scene

    // Cámara
    const { width, height } = mountRef.current.getBoundingClientRect()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(3, 2, 4)
    cameraRef.current = camera

    // Renderer (evitar duplicados)
    if (rendererRef.current) {
      rendererRef.current.dispose()
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement)
      }
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Luces (agregar DESPUÉS de limpiar escena)
    const ambient = new THREE.AmbientLight(0xffffff, 0.35)
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 5, 5)
    scene.add(ambient, dir)

    // Mesh principal según geometría seleccionada
    const geoObj = GEOMETRIES[geometryKey]
    const geometry = geoObj.create()
    const material = new THREE.MeshPhongMaterial({ color: geoObj.color, wireframe: wireframeRef.current })
    const mesh = new THREE.Mesh(geometry, material)

    // Restaurar rotación desde localStorage si existe
    const rotStr = localStorage.getItem('meshRotation')
    if (rotStr) {
      try {
        const rot = JSON.parse(rotStr)
        if (rot && typeof rot.x === 'number' && typeof rot.y === 'number' && typeof rot.z === 'number') {
          mesh.rotation.set(rot.x, rot.y, rot.z)
        }
      } catch {}
    }

    currentMeshRef.current = mesh
    scene.add(mesh)

    // Helpers
    const axes = new THREE.AxesHelper(2)
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(axes, grid)

    // Animación
    const animate = () => {
      animRef.current = requestAnimationFrame(animate)
      if (autoRotateRef.current && currentMeshRef.current) {
        currentMeshRef.current.rotation.x += 0.01
        currentMeshRef.current.rotation.y += 0.015
        // Guardar rotación en localStorage
        const r = currentMeshRef.current.rotation
        localStorage.setItem('meshRotation', JSON.stringify({ x: r.x, y: r.y, z: r.z }))
      }
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const rect = mountRef.current.getBoundingClientRect()
      const w = rect.width || 800
      const h = rect.height || 600
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      console.log("🧹 Limpiando escena...")
      window.removeEventListener('resize', handleResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      scene.clear()
    }
  }, [geometryKey])

  // Wireframe dinámico
  useEffect(() => {
    const mesh = currentMeshRef.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshPhongMaterial
    mat.wireframe = wireframe
    mat.needsUpdate = true
    console.log("✅ Wireframe aplicado:", wireframe)
  }, [wireframe])

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* Panel lateral de geometrías */}
      <aside style={{ width: 220, background: '#222', color: '#fff', padding: 16 }}>
        <h2>Catálogo de Geometrías</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.entries(GEOMETRIES).map(([key, g]) => (
            <li key={key} style={{ marginBottom: 12 }}>
              <button
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: geometryKey === key ? g.color : '#333',
                  color: geometryKey === key ? '#222' : '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
                onClick={() => setGeometryKey(key as GeometryKey)}
              >
                {g.name}
                <br />
              </button>
            </li>
          ))}
        </ul>
        <hr style={{ border: '1px solid #444' }} />
        <button onClick={() => setWireframe(w => !w)} style={{ margin: '8px 0', width: '100%' }}>
          {wireframe ? '🔲 Sólido' : '🔳 Wireframe'}
        </button>
        <button onClick={() => setAutoRotate(r => !r)} style={{ margin: '8px 0', width: '100%' }}>
          {autoRotate ? '⏸️ Pausar Rotación' : '▶️ Reanudar Rotación'}
        </button>
      </aside>
      {/* Canvas Three.js */}
      <main style={{ flex: 1, position: 'relative' }}>
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      </main>
    </div>
  )
}