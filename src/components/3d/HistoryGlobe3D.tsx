import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sound } from '../../utils/audio';

interface SitePin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  epoch: string;
  description: string;
  relic: string;
}

const HISTORICAL_SITES: SitePin[] = [
  {
    id: 'alexandria',
    name: 'Library of Alexandria',
    lat: 31.2,
    lng: 29.9,
    epoch: '280 BCE (Ptolemaic Kingdom)',
    description: 'The premier center of ancient scholarship housing over 400,000 papyrus scrolls.',
    relic: 'Archimedean Mathematical Palimpsest',
  },
  {
    id: 'giza',
    name: 'Great Pyramid of Giza',
    lat: 29.97,
    lng: 31.13,
    epoch: '2560 BCE (Old Kingdom of Egypt)',
    description: 'Astronomically aligned stone monument oriented to within 1/15th of a degree of true North.',
    relic: 'Celestial Orion Alignment Shaft',
  },
  {
    id: 'rome',
    name: 'Roman Colosseum & Forum',
    lat: 41.89,
    lng: 12.49,
    epoch: '80 CE (Flavian Dynasty)',
    description: 'Imperial arena and civic forum driving classical jurisprudence and engineering hydraulics.',
    relic: 'Bronze Roman Citizen Tablet',
  },
  {
    id: 'silk_road',
    name: 'Samarkand Silk Road Nexus',
    lat: 39.65,
    lng: 66.97,
    epoch: '100 BCE - 1400 CE',
    description: 'Crossroads of Eurasian trade, mathematical dissemination, paper technology, and astronomy.',
    relic: 'Ulugh Beg Astrolabe Component',
  },
  {
    id: 'athens',
    name: 'Acropolis & Academy of Athens',
    lat: 37.97,
    lng: 23.72,
    epoch: '387 BCE (Platonic Era)',
    description: 'Cradle of philosophical inquiry, dialectic logic, and democratic governance assemblies.',
    relic: 'Antikythera Astronomical Mechanism',
  },
];

interface HistoryGlobe3DProps {
  onSelectSite?: (site: SitePin) => void;
  selectedSiteId?: string;
}

export const HistoryGlobe3D: React.FC<HistoryGlobe3DProps> = ({
  onSelectSite,
  selectedSiteId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeSite, setActiveSite] = useState<SitePin>(HISTORICAL_SITES[0]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0xfef08a, 2.5);
    keyLight.position.set(8, 10, 8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0ea5e9, 2.2);
    rimLight.position.set(-8, 4, -8);
    scene.add(rimLight);

    const ambient = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambient);

    // Procedural Earth Globe Map Texture
    const createEarthTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      // Deep ocean base
      ctx.fillStyle = '#061329';
      ctx.fillRect(0, 0, 1024, 512);

      // Lat/Long Coordinate Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1024; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1024, y);
        ctx.stroke();
      }

      // Stylized continents (Europe, Africa, Eurasia, Americas)
      ctx.fillStyle = '#0f2b48';
      // Africa/Eurasia landmass approximation
      ctx.beginPath();
      ctx.ellipse(550, 240, 120, 100, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(620, 180, 160, 80, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Americas
      ctx.beginPath();
      ctx.ellipse(260, 210, 70, 140, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Topographic contour glow
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Primary Globe Sphere
    const globeGeo = new THREE.SphereGeometry(3.5, 36, 36);
    const globeMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.45,
      metalness: 0.4,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // 2. Atmospheric Aurora Halo
    const atmoGeo = new THREE.SphereGeometry(3.68, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // 3. Orbital Coordinate Ring
    const orbitRingGeo = new THREE.TorusGeometry(4.6, 0.04, 8, 48);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.4,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 3;
    globeGroup.add(orbitRing);

    // Function to calculate 3D sphere coordinate from lat/long
    const latLngToVector3 = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 4. Historical Site Holographic Pins
    const pinGroup = new THREE.Group();
    const pinMeshes: { site: SitePin; mesh: THREE.Group }[] = [];

    HISTORICAL_SITES.forEach((site) => {
      const pinObj = new THREE.Group();
      const pos = latLngToVector3(site.lat, site.lng, 3.52);
      pinObj.position.copy(pos);
      pinObj.lookAt(0, 0, 0);

      // Pin head
      const headGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const head = new THREE.Mesh(headGeo, headMat);
      pinObj.add(head);

      // Light beam
      const beamGeo = new THREE.CylinderGeometry(0.02, 0.08, 0.6, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.7 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.z = 0.3;
      beam.rotation.x = Math.PI / 2;
      pinObj.add(beam);

      pinGroup.add(pinObj);
      pinMeshes.push({ site, mesh: pinObj });
    });
    globeGroup.add(pinGroup);

    // Click handler for pins
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinGroup.children, true);
      if (hits.length > 0) {
        let parent = hits[0].object.parent;
        const match = pinMeshes.find((p) => p.mesh === parent);
        if (match) {
          sound.playClick();
          setActiveSite(match.site);
          if (onSelectSite) onSelectSite(match.site);
        }
      }
    };
    renderer.domElement.addEventListener('click', handlePointerDown);

    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const time = clock.getElapsedTime();
      globeGroup.rotation.y = time * 0.08;
      orbitRing.rotation.z = time * 0.05;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        frameId = window.setTimeout(tick, 80);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

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
      renderer.domElement.removeEventListener('click', handlePointerDown);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* Top Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-[11px] font-mono text-amber-300">
          Geospatial Epoch Scanner: <span className="font-bold text-white">Active</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
          Selected: <span className="text-amber-400 font-bold">{activeSite.name}</span>
        </div>
      </div>

      {/* Interactive Archaeological Site Dossier Card */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 border border-amber-500/40 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase">{activeSite.epoch}</span>
            <span className="text-[10px] font-mono text-slate-400">Lat: {activeSite.lat}° N, Lng: {activeSite.lng}° E</span>
          </div>
          <div className="text-sm font-bold text-white mt-0.5">{activeSite.name}</div>
          <p className="text-xs text-slate-300 max-w-xl mt-1">{activeSite.description}</p>
        </div>

        <div className="flex flex-col text-right shrink-0">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Archaeological Focus</span>
          <span className="text-xs font-bold text-amber-300">{activeSite.relic}</span>
        </div>
      </div>
    </div>
  );
};
