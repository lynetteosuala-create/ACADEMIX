import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface MathMatrix3DProps {
  angleXW?: number;
  angleYW?: number;
  angleZW?: number;
  showEigenvectors?: boolean;
}

export const MathMatrix3D: React.FC<MathMatrix3DProps> = ({
  angleXW = 0.5,
  angleYW = 0.5,
  angleZW = 0.5,
  showEigenvectors = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState({ determinant: '1.000', trace: '4.000', eigenvalues: 'λ₁=1, λ₂=1' });

  const propsRef = useRef({ angleXW, angleYW, angleZW, showEigenvectors });
  useEffect(() => {
    propsRef.current = { angleXW, angleYW, angleZW, showEigenvectors };
  }, [angleXW, angleYW, angleZW, showEigenvectors]);

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
    scene.background = new THREE.Color(0x050414);
    scene.fog = new THREE.FogExp2(0x050414, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isSoftwareGl, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Lights
    const keyLight = new THREE.DirectionalLight(0xa855f7, 3.2);
    keyLight.position.set(6, 10, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 2.0);
    fillLight.position.set(-6, -4, -6);
    scene.add(fillLight);

    const ambient = new THREE.AmbientLight(0x1e1b4b, 1.2);
    scene.add(ambient);

    // 16 4D Vertices of a unit tesseract: (±1, ±1, ±1, ±1)
    const vertices4D: number[][] = [];
    for (let i = 0; i < 16; i++) {
      vertices4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }

    // 32 Edges connecting vertices with Hamming distance of 1
    const edges: [number, number][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diffCount = 0;
        for (let k = 0; k < 4; k++) {
          if (vertices4D[i][k] !== vertices4D[j][k]) diffCount++;
        }
        if (diffCount === 1) {
          edges.push([i, j]);
        }
      }
    }

    const tesseractGroup = new THREE.Group();
    scene.add(tesseractGroup);

    // Glowing Vertex Spheres
    const vertexMeshes: THREE.Mesh[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.12, 16, 12);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 1.2,
      metalness: 0.8,
      roughness: 0.2,
    });
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      tesseractGroup.add(mesh);
      vertexMeshes.push(mesh);
    }

    // Dynamic Edge Lines
    const edgeGeo = new THREE.BufferGeometry();
    const edgePositions = new Float32Array(edges.length * 2 * 3);
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    tesseractGroup.add(edgeLines);

    // Coordinate Frame Vector Arrows (X, Y, Z, W projections)
    const axisGroup = new THREE.Group();
    const arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3.5, 0xec4899, 0.4, 0.2);
    const arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 3.5, 0x8b5cf6, 0.4, 0.2);
    const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 3.5, 0x06b6d4, 0.4, 0.2);
    axisGroup.add(arrowX, arrowY, arrowZ);
    scene.add(axisGroup);

    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const time = clock.getElapsedTime();
      const currentProps = propsRef.current;

      const angleXW = time * 0.45 * currentProps.angleXW;
      const angleYW = time * 0.35 * currentProps.angleYW;
      const angleZW = time * 0.25 * currentProps.angleZW;

      // 4D Rotation Matrix logic
      const projected3D: THREE.Vector3[] = [];
      const d = 2.8; // Perspective 4D camera distance

      for (let i = 0; i < 16; i++) {
        let [x, y, z, w] = vertices4D[i];

        // Rotate in X-W plane
        const cosXW = Math.cos(angleXW);
        const sinXW = Math.sin(angleXW);
        const x1 = x * cosXW - w * sinXW;
        const w1 = x * sinXW + w * cosXW;

        // Rotate in Y-W plane
        const cosYW = Math.cos(angleYW);
        const sinYW = Math.sin(angleYW);
        const y2 = y * cosYW - w1 * sinYW;
        const w2 = y * sinYW + w1 * cosYW;

        // Rotate in Z-W plane
        const cosZW = Math.cos(angleZW);
        const sinZW = Math.sin(angleZW);
        const z3 = z * cosZW - w2 * sinZW;
        const w3 = z * sinZW + w2 * cosZW;

        // Stereographic 4D-to-3D projection
        const scale = 2.4 / (d - w3 * 0.4);
        const v3 = new THREE.Vector3(x1 * scale, y2 * scale, z3 * scale);
        projected3D.push(v3);

        vertexMeshes[i].position.copy(v3);
      }

      // Update edge line buffers
      const positions = edgeGeo.attributes.position.array as Float32Array;
      let ptr = 0;
      for (let e = 0; e < edges.length; e++) {
        const [u, v] = edges[e];
        const p1 = projected3D[u];
        const p2 = projected3D[v];

        positions[ptr++] = p1.x;
        positions[ptr++] = p1.y;
        positions[ptr++] = p1.z;
        positions[ptr++] = p2.x;
        positions[ptr++] = p2.y;
        positions[ptr++] = p2.z;
      }
      edgeGeo.attributes.position.needsUpdate = true;

      tesseractGroup.rotation.y = time * 0.1;
      axisGroup.visible = currentProps.showEigenvectors;

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
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-violet-500/30 shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Top Mathematical Stats Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-violet-500/40 text-[11px] font-mono text-violet-300">
          Dimensional Projection: <span className="font-bold text-white">4D ➔ 3D Stereographic</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/40 text-[11px] font-mono text-indigo-300">
          Manifold Metric: <span className="font-bold text-white">SO(4) Lie Algebra</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300">
        Topology: <span className="text-violet-400 font-bold">16 Vertices • 32 Edges</span>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <span className="text-xs font-mono text-slate-400">Interactive Hypercube Tesseract • Vector Field Visualizer</span>
        <span className="text-[11px] font-mono text-violet-400">Orthogonal Rotation Active</span>
      </div>
    </div>
  );
};
