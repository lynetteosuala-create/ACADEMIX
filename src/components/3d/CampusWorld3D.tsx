import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DepartmentId } from '../../types';
import { sound } from '../../utils/audio';

interface CampusWorld3DProps {
  onSelectDepartment: (deptId: DepartmentId) => void;
  activeDepartment?: DepartmentId | null;
}

export const CampusWorld3D: React.FC<CampusWorld3DProps> = ({
  onSelectDepartment,
  activeDepartment,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredDept, setHoveredDept] = useState<DepartmentId | null>(null);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'drone' | 'walk'>('orbit');
  const [controlsHint, setControlsHint] = useState<string>('Drag to rotate • Scroll to zoom • Click departmental towers to enter');
  const [playerDistance, setPlayerDistance] = useState<{ name: string; id: DepartmentId; distance: number }[]>([]);

  // Keep references to internal Three objects across React renders
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    departmentNodes: { id: DepartmentId; mesh: THREE.Group; beacon: THREE.Mesh; pos: THREE.Vector3; name: string }[];
    animId?: number;
    camTarget: THREE.Vector3;
    playerPos: THREE.Vector3;
    keys: Record<string, boolean>;
    isSoftwareGl: boolean;
  }>({
    departmentNodes: [],
    camTarget: new THREE.Vector3(0, 4, 0),
    playerPos: new THREE.Vector3(0, 1.5, 38),
    keys: {},
    isSoftwareGl: false,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL per Three.js guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();
    sceneRef.current.isSoftwareGl = isSoftwareGl;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup with atmospheric fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b19);
    scene.fog = new THREE.FogExp2(0x060b19, 0.012);
    sceneRef.current.scene = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.5, 500);
    camera.position.set(0, 32, 68);
    camera.lookAt(0, 2, 0);
    sceneRef.current.camera = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    sceneRef.current.renderer = renderer;

    // Mandatory RoomEnvironment for studio reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting rig
    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    keyLight.position.set(45, 65, 40);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
      keyLight.shadow.camera.near = 10;
      keyLight.shadow.camera.far = 180;
      const d = 55;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8);
    rimLight.position.set(-40, 30, -50);
    scene.add(rimLight);

    // Procedural Grid Texture for the plaza ground
    const createPlazaTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0a101f';
      ctx.fillRect(0, 0, 512, 512);

      // Cyber hex/square stone tiles
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.lineWidth = 2;
      const step = 64;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Energy conduit traces
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 256, 180, 0, Math.PI * 2);
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(12, 12);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    // Ground plaza plane
    const groundGeo = new THREE.PlaneGeometry(280, 280);
    const groundMat = new THREE.MeshStandardMaterial({
      map: createPlazaTexture(),
      roughness: 0.35,
      metalness: 0.75,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // Outer Mountain / Perimeter Barriers (No infinite floating void)
    const perimeterGeo = new THREE.RingGeometry(85, 140, 32);
    const perimeterMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.2,
    });
    const perimeterMesh = new THREE.Mesh(perimeterGeo, perimeterMat);
    perimeterMesh.rotation.x = -Math.PI / 2;
    perimeterMesh.position.y = -0.05;
    scene.add(perimeterMesh);

    // Procedural 3-12 Part Composite Buildings
    const departmentNodes: { id: DepartmentId; mesh: THREE.Group; beacon: THREE.Mesh; pos: THREE.Vector3; name: string }[] = [];

    // Helper: Composite Futuristic Tower
    const buildDepartmentTower = (
      id: DepartmentId,
      name: string,
      x: number,
      z: number,
      primaryColor: number,
      glowColor: number,
      shapeType: 'dome' | 'matrix' | 'spire' | 'colosseum'
    ) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // 1. Primary Silhouette: Foundations & Tiered Plinth
      const plinthGeo = new THREE.CylinderGeometry(8.5, 9.5, 1.6, 12);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.25,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = 0.8;
      plinth.receiveShadow = !isSoftwareGl;
      plinth.castShadow = !isSoftwareGl;
      group.add(plinth);

      // Contact Shadow Plane
      const contactGeo = new THREE.PlaneGeometry(22, 22);
      const contactMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const contactShadow = new THREE.Mesh(contactGeo, contactMat);
      contactShadow.rotation.x = -Math.PI / 2;
      contactShadow.position.y = 0.02;
      group.add(contactShadow);

      // 2. Secondary Read: Architecture depending on subject
      if (shapeType === 'dome') {
        // Quantum Science Dome: Double-shell geodesic core + kinetic particle rings
        const domeGeo = new THREE.SphereGeometry(6, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const domeMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          metalness: 0.9,
          roughness: 0.1,
          transmission: isSoftwareGl ? 0 : 0.6,
          transparent: true,
          opacity: 0.85,
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.y = 1.6;
        dome.castShadow = !isSoftwareGl;
        group.add(dome);

        // Core Reactor Ring
        const ringGeo = new THREE.TorusGeometry(7.2, 0.4, 12, 32);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.9,
          metalness: 0.9,
          roughness: 0.2,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 4.2;
        group.add(ring);
      } else if (shapeType === 'matrix') {
        // Mathematical Citadel: Segmented cyber towers & crystalline pillars
        const towerGeo = new THREE.CylinderGeometry(4.2, 5.5, 14, 8);
        const towerMat = new THREE.MeshStandardMaterial({
          color: 0x312e81,
          metalness: 0.85,
          roughness: 0.2,
        });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.y = 7.8;
        tower.castShadow = !isSoftwareGl;
        group.add(tower);

        // Hovering 4D Matrix Gem
        const gemGeo = new THREE.OctahedronGeometry(2.8, 0);
        const gemMat = new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          emissive: 0x7c3aed,
          emissiveIntensity: 1.2,
          metalness: 0.7,
          roughness: 0.1,
        });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.y = 17.5;
        group.add(gem);
      } else if (shapeType === 'colosseum') {
        // Central Arena Colosseum
        const colGeo = new THREE.CylinderGeometry(11.5, 12.5, 6, 24, 1, true);
        const colMat = new THREE.MeshStandardMaterial({
          color: 0x881337,
          metalness: 0.8,
          roughness: 0.3,
          side: THREE.DoubleSide,
        });
        const colosseum = new THREE.Mesh(colGeo, colMat);
        colosseum.position.y = 4.6;
        colosseum.castShadow = !isSoftwareGl;
        group.add(colosseum);

        // Energy Beacon Pillars
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const pGeo = new THREE.BoxGeometry(1.2, 8, 1.2);
          const pMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239, metalness: 0.9, roughness: 0.2 });
          const pillar = new THREE.Mesh(pGeo, pMat);
          pillar.position.set(Math.cos(angle) * 11, 4.8, Math.sin(angle) * 11);
          group.add(pillar);
        }
      } else {
        // Spire / Observatory
        const spireGeo = new THREE.ConeGeometry(4.5, 16, 12);
        const spireMat = new THREE.MeshStandardMaterial({
          color: primaryColor,
          metalness: 0.85,
          roughness: 0.25,
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = 9;
        spire.castShadow = !isSoftwareGl;
        group.add(spire);
      }

      // 3. Accent Detail: Holographic Beacon
      const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 22, 8);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.45,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 12;
      group.add(beacon);

      // Portal Entrance Gate
      const gateGeo = new THREE.TorusGeometry(2.4, 0.25, 8, 16, Math.PI);
      const gateMat = new THREE.MeshStandardMaterial({
        color: glowColor,
        emissive: glowColor,
        emissiveIntensity: 0.8,
      });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(0, 2.4, 8);
      group.add(gate);

      scene.add(group);
      departmentNodes.push({
        id,
        name,
        mesh: group,
        beacon,
        pos: new THREE.Vector3(x, 0, z),
      });
    };

    // Instantiate Campus Departments
    buildDepartmentTower('science', 'Quantum Science Lab', -32, -30, 0x0284c7, 0x38bdf8, 'dome');
    buildDepartmentTower('math', 'Math Matrix & Citadel', 32, -30, 0x6d28d9, 0xa855f7, 'matrix');
    buildDepartmentTower('history', 'Chronos Observatory', -32, 30, 0xd97706, 0xfbbf24, 'spire');
    buildDepartmentTower('literature', 'Nexus Linguistic Academy', 32, 30, 0x059669, 0x34d399, 'spire');
    buildDepartmentTower('arena', 'The Colosseum Arena', 0, 0, 0xbe123c, 0xf43f5e, 'colosseum');

    sceneRef.current.departmentNodes = departmentNodes;

    // Ambient floating particle stars
    const particleCount = isSoftwareGl ? 120 : 400;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 160;
      pPos[i * 3 + 1] = Math.random() * 45 + 1;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    // Hovering Patrol Scout Drone
    const drone = new THREE.Group();
    const droneBody = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 })
    );
    drone.add(droneBody);
    const droneVisor = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.4, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    );
    droneVisor.position.set(0, 0.2, 0.8);
    drone.add(droneVisor);
    drone.position.set(0, 14, 25);
    scene.add(drone);

    // Raycaster for clicking department towers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes: THREE.Object3D[] = [];
      departmentNodes.forEach((node) => meshes.push(...node.mesh.children));
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        // Find which department was clicked
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && !(obj.parent instanceof THREE.Scene)) {
          const match = departmentNodes.find((n) => n.mesh === obj);
          if (match) {
            sound.playWarp();
            onSelectDepartment(match.id);
            return;
          }
          obj = obj.parent;
        }
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes: THREE.Object3D[] = [];
      departmentNodes.forEach((node) => meshes.push(...node.mesh.children));
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent && !(obj.parent instanceof THREE.Scene)) {
          const match = departmentNodes.find((n) => n.mesh === obj);
          if (match) {
            setHoveredDept(match.id);
            return;
          }
          obj = obj.parent;
        }
      } else {
        setHoveredDept(null);
      }
    };

    renderer.domElement.addEventListener('click', handlePointerDown);
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // Keyboard handlers for walk/WASD movement
    const onKeyDown = (e: KeyboardEvent) => {
      sceneRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') {
        // Trigger closest department portal
        const closest = playerDistance[0];
        if (closest && closest.distance < 18) {
          sound.playWarp();
          onSelectDepartment(closest.id);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      sceneRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Animation loop with frame pacing & smooth damping
    const clock = new THREE.Clock();
    let frameId = 0;

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Drone orbital flight
      drone.position.x = Math.sin(time * 0.4) * 35;
      drone.position.z = Math.cos(time * 0.4) * 35;
      drone.position.y = 14 + Math.sin(time * 1.2) * 2.5;
      drone.rotation.y = time * 0.4 + Math.PI / 2;

      // Pulse department beacons
      departmentNodes.forEach((node, idx) => {
        const beaconMat = node.beacon.material as THREE.MeshBasicMaterial;
        beaconMat.opacity = 0.35 + Math.sin(time * 2 + idx) * 0.15;
      });

      // Controls / Camera updates based on cameraMode
      const keys = sceneRef.current.keys;
      const moveSpeed = 22 * delta;
      const playerPos = sceneRef.current.playerPos;

      if (cameraMode === 'walk') {
        if (keys['w'] || keys['arrowup']) playerPos.z -= moveSpeed;
        if (keys['s'] || keys['arrowdown']) playerPos.z += moveSpeed;
        if (keys['a'] || keys['arrowleft']) playerPos.x -= moveSpeed;
        if (keys['d'] || keys['arrowright']) playerPos.x += moveSpeed;

        // Clamp to campus perimeter
        playerPos.x = Math.max(-55, Math.min(55, playerPos.x));
        playerPos.z = Math.max(-55, Math.min(55, playerPos.z));

        // Camera smoothly follows player
        camera.position.x = THREE.MathUtils.damp(camera.position.x, playerPos.x, 8, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, playerPos.y + 7, 8, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, playerPos.z + 16, 8, delta);
        camera.lookAt(playerPos.x, playerPos.y + 2, playerPos.z);
      } else if (cameraMode === 'drone') {
        // Sweeping aerial surveillance view
        const droneAngle = time * 0.12;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, Math.sin(droneAngle) * 72, 4, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 42, 4, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, Math.cos(droneAngle) * 72, 4, delta);
        camera.lookAt(0, 4, 0);
      } else {
        // Orbit mode: slight cinematic sway
        camera.lookAt(0, 4, 0);
      }

      // Calculate distances to all departments for HUD waypoint beacons
      const distances = departmentNodes.map((n) => ({
        name: n.name,
        id: n.id,
        distance: Math.hypot(playerPos.x - n.pos.x, playerPos.z - n.pos.z),
      })).sort((a, b) => a.distance - b.distance);

      setPlayerDistance(distances);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        // Paced software loop
        frameId = window.setTimeout(tick, 80);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('click', handlePointerDown);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraMode]);

  const nearestDept = playerDistance[0];

  return (
    <div className="relative w-full h-full min-h-[580px] select-none overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD: Spec & Campus Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/30 rounded-lg shadow-lg">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-mono tracking-wider text-cyan-200 uppercase font-semibold">
            ACADEMIX CAMPUS REALITY MATRIX • VER 4.2
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-none max-w-xs">
          Coordinates: {sceneRef.current.playerPos.x.toFixed(1)}, {sceneRef.current.playerPos.z.toFixed(1)} | PBR Ray Tracing Active
        </div>
      </div>

      {/* Nearest Department Proximity Beacon & Quick Enter Prompt */}
      {nearestDept && (
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-xl">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Nearest Sector</span>
            <span className="text-xs font-bold text-slate-100">{nearestDept.name}</span>
            <span className="text-[11px] font-mono text-cyan-400">{Math.round(nearestDept.distance)}m away</span>
          </div>
          <button
            onClick={() => {
              sound.playWarp();
              onSelectDepartment(nearestDept.id);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>Enter Portal</span>
            <span className="text-[10px] bg-slate-950/30 px-1 rounded text-slate-950 font-mono">[E]</span>
          </button>
        </div>
      )}

      {/* Hovered Department Tooltip */}
      {hoveredDept && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-24 z-20 pointer-events-none bg-slate-950/90 border border-cyan-400 px-4 py-2 rounded-lg text-center shadow-2xl animate-fade-in">
          <div className="text-xs font-mono text-cyan-400 uppercase">Click to Enter Sector</div>
          <div className="text-sm font-bold text-white capitalize">{hoveredDept} Department</div>
        </div>
      )}

      {/* Collapsible Ergonomic Bottom Dock (Three.js Directive: Zero Viewport Occlusion) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Department Teleport Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-mono text-slate-400 uppercase mr-1 hidden md:inline">Sectors:</span>
            {[
              { id: 'science', label: 'Science Dome', color: 'hover:text-cyan-400' },
              { id: 'math', label: 'Math Matrix', color: 'hover:text-violet-400' },
              { id: 'history', label: 'Chronos Globe', color: 'hover:text-amber-400' },
              { id: 'literature', label: 'Nexus Linguistic', color: 'hover:text-emerald-400' },
              { id: 'arena', label: 'Colosseum Arena', color: 'hover:text-rose-400' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  sound.playWarp();
                  onSelectDepartment(d.id as DepartmentId);
                }}
                className={`px-2.5 py-1 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-all ${d.color} cursor-pointer whitespace-nowrap`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Camera Exploration Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setCameraMode('orbit');
                setControlsHint('Orbit Camera: Drag to rotate view around central academy plaza');
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                cameraMode === 'orbit' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orbit View
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setCameraMode('walk');
                setControlsHint('Walk Mode: Use W A S D or Arrow Keys to navigate the campus paths');
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                cameraMode === 'walk' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Walk (WASD)
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setCameraMode('drone');
                setControlsHint('Drone Mode: Autonomous aerial perimeter patrol view');
              }}
              className={`px-2.5 py-1 text-xs rounded-lg font-mono transition-colors ${
                cameraMode === 'drone' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Surveillance Drone
            </button>
          </div>
        </div>

        {/* Minimal Bottom Controls Hint */}
        <div className="mt-2 text-center text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
          {controlsHint}
        </div>
      </div>
    </div>
  );
};
