import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sound } from '../../utils/audio';

interface ScienceLab3DProps {
  magneticFieldStrength: number; // 0 - 100
  fuelType: 'Hydrogen' | 'Deuterium' | 'Tritium' | 'Helium-3';
  isReacting: boolean;
  onStabilityChange?: (stability: number) => void;
}

export const ScienceLab3D: React.FC<ScienceLab3DProps> = ({
  magneticFieldStrength,
  fuelType,
  isReacting,
  onStabilityChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState({ tempMK: 45, energyYieldMW: 850, stability: 96 });

  const propsRef = useRef({ magneticFieldStrength, fuelType, isReacting });
  useEffect(() => {
    propsRef.current = { magneticFieldStrength, fuelType, isReacting };
  }, [magneticFieldStrength, fuelType, isReacting]);

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
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 14);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Lighting
    const keyLight = new THREE.DirectionalLight(0x38bdf8, 3.5);
    keyLight.position.set(8, 12, 8);
    scene.add(keyLight);

    const coreLight = new THREE.PointLight(0x06b6d4, 4, 15);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    const fillLight = new THREE.HemisphereLight(0x0284c7, 0x0f172a, 1.2);
    scene.add(fillLight);

    // 1. Primary Silhouette: Tokamak Magnetic Torus Chamber
    const reactorGroup = new THREE.Group();
    scene.add(reactorGroup);

    // Outer Torus Ring
    const torusGeo = new THREE.TorusGeometry(4.2, 1.2, 24, 48);
    const torusMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 0.6,
      transparent: true,
      opacity: isSoftwareGl ? 0.7 : 0.85,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    torusMesh.rotation.x = Math.PI / 2;
    reactorGroup.add(torusMesh);

    // 2. Secondary Read: Magnetic Field Coils (12 coils around the perimeter)
    const coilGroup = new THREE.Group();
    const coilGeo = new THREE.TorusGeometry(1.6, 0.22, 16, 24);
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.1,
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.position.set(Math.cos(angle) * 4.2, 0, Math.sin(angle) * 4.2);
      coil.rotation.y = -angle;
      coilGroup.add(coil);
    }
    reactorGroup.add(coilGroup);

    // 3. Central Plasma Core (Glowing Energy Stream)
    const plasmaGeo = new THREE.TorusGeometry(4.2, 0.45, 16, 64);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: false,
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    plasmaMesh.rotation.x = Math.PI / 2;
    reactorGroup.add(plasmaMesh);

    // Swirling Subatomic Particles
    const pCount = isSoftwareGl ? 150 : 600;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.2 + (Math.random() - 0.5) * 0.9;
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      pPos[i * 3 + 2] = Math.sin(angle) * radius;

      pColors[i * 3] = 0.2 + Math.random() * 0.3;
      pColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      pColors[i * 3 + 2] = 1.0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
    });
    const particles = new THREE.Points(pGeo, pMat);
    reactorGroup.add(particles);

    // Floor Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(6.5, 7.5, 0.8, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      metalness: 0.85,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.2;
    scene.add(baseMesh);

    // Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(16, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6, depthWrite: false });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.55;
    scene.add(shadow);

    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();
      const currentProps = propsRef.current;

      // Rotate Tokamak Assembly
      reactorGroup.rotation.y = time * 0.15;

      // Color shifts based on fuel
      let targetColor = 0x06b6d4; // Cyan default
      if (currentProps.fuelType === 'Deuterium') targetColor = 0x3b82f6; // Blue
      else if (currentProps.fuelType === 'Tritium') targetColor = 0x8b5cf6; // Violet
      else if (currentProps.fuelType === 'Helium-3') targetColor = 0x10b981; // Emerald

      plasmaMat.color.setHex(targetColor);
      coreLight.color.setHex(targetColor);

      // Plasma intensity / pulsation based on magnetic confinement
      const magFactor = currentProps.magneticFieldStrength / 100;
      const pulse = 1.0 + Math.sin(time * 12) * (0.05 + (1 - magFactor) * 0.12);
      plasmaMesh.scale.set(pulse, pulse, pulse);

      // Calculate dynamic stability factor
      // Stability optimal around 85-95% magnetic field
      const stabilityCalc = Math.max(20, Math.min(100, Math.round(100 - Math.abs(magFactor - 0.9) * 110)));
      const tempCalc = Math.round(35 + magFactor * 80 + (currentProps.isReacting ? 45 : 0));
      const yieldCalc = currentProps.isReacting ? Math.round(magFactor * 1450) : 120;

      if (Math.random() < 0.08) {
        setTelemetry({ tempMK: tempCalc, energyYieldMW: yieldCalc, stability: stabilityCalc });
        if (onStabilityChange) onStabilityChange(stabilityCalc);
      }

      // High-speed subatomic particle orbit
      const speedMult = 2.4 * (0.6 + magFactor);
      particles.rotation.y = time * speedMult;

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
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Telemetry Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
          Core Temp: <span className="font-bold text-white">{telemetry.tempMK} MK</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-blue-500/40 text-[11px] font-mono text-blue-300">
          Output: <span className="font-bold text-white">{telemetry.energyYieldMW} MW</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
          Plasma Stability: <span className="font-bold text-white">{telemetry.stability}%</span>
        </div>
      </div>

      {/* Fuel Indicator Pill */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
        Reagent: <span className="text-cyan-400 font-bold">{fuelType}</span>
      </div>

      {/* Interactive Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <span className="text-xs font-mono text-slate-400">Tokamak Core 01 • Interactive PBR Simulation</span>
        <span className="text-[11px] font-mono text-cyan-400">Confinement Field: {magneticFieldStrength}%</span>
      </div>
    </div>
  );
};
