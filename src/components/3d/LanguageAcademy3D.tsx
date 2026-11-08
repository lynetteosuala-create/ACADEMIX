import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sound } from '../../utils/audio';

interface LexiconNode {
  id: string;
  label: string;
  domain: string;
  etymon: string;
  pos: [number, number, number];
  color: number;
}

const NODES: LexiconNode[] = [
  { id: 'etymology', label: 'Etymology', domain: 'Proto-Indo-European roots & lexical drift', etymon: 'Greek: étymon (true sense) + lógos (word)', pos: [0, 1.8, 0], color: 0x10b981 },
  { id: 'syntax', label: 'Syntax & Parse Trees', domain: 'Transformational grammar & constituent trees', etymon: 'Greek: sýntaxis (arrangement together)', pos: [-2.5, 0.4, 1.5], color: 0x06b6d4 },
  { id: 'rhetoric', label: 'Classical Rhetoric', domain: 'Ethos, Pathos, Logos & stylistic tropes', etymon: 'Greek: rhētorikē (art of the orator)', pos: [2.5, 0.4, 1.5], color: 0xa855f7 },
  { id: 'semantics', label: 'Cognitive Semantics', domain: 'Truth-conditional logic & lexical fields', etymon: 'Greek: sēmantikós (significant meaning)', pos: [-1.8, -1.5, -1.5], color: 0x3b82f6 },
  { id: 'prosody', label: 'Prosodic Meter & Verse', domain: 'Iambic meter, cadences & phonology', etymon: 'Greek: prosōidía (song sung to music)', pos: [1.8, -1.5, -1.5], color: 0xf59e0b },
];

export const LanguageAcademy3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<LexiconNode>(NODES[0]);

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
    scene.background = new THREE.Color(0x041014);
    scene.fog = new THREE.FogExp2(0x041014, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2, 9);
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
    const keyLight = new THREE.DirectionalLight(0x34d399, 2.5);
    keyLight.position.set(6, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    rimLight.position.set(-6, -4, -6);
    scene.add(rimLight);

    const networkGroup = new THREE.Group();
    scene.add(networkGroup);

    // Create 3D Nodes
    const nodeMeshes: { node: LexiconNode; mesh: THREE.Mesh }[] = [];
    const sphereGeo = new THREE.SphereGeometry(0.35, 20, 16);

    NODES.forEach((n) => {
      const mat = new THREE.MeshStandardMaterial({
        color: n.color,
        emissive: n.color,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(...n.pos);
      networkGroup.add(mesh);
      nodeMeshes.push({ node: n, mesh });
    });

    // Connecting Synaptic Energy Lines between all nodes
    const lineGeo = new THREE.BufferGeometry();
    const linePos: number[] = [];
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        linePos.push(...NODES[i].pos);
        linePos.push(...NODES[j].pos);
      }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.35,
    });
    const networkLines = new THREE.LineSegments(lineGeo, lineMat);
    networkGroup.add(networkLines);

    // Floating Glyphs Ring
    const ringGeo = new THREE.TorusGeometry(3.6, 0.05, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    networkGroup.add(ring);

    // Click handler for nodes
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = nodeMeshes.map((n) => n.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        const match = nodeMeshes.find((m) => m.mesh === hits[0].object);
        if (match) {
          sound.playClick();
          setSelectedNode(match.node);
        }
      }
    };
    renderer.domElement.addEventListener('click', handlePointerDown);

    let frameId = 0;
    const clock = new THREE.Clock();

    const tick = () => {
      const time = clock.getElapsedTime();
      networkGroup.rotation.y = time * 0.12;

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
    <div className="relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/30 shadow-2xl">
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-[11px] font-mono text-emerald-300">
          Neural Lexicon Graph: <span className="font-bold text-white">Synthesizing</span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 border border-emerald-500/40 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-emerald-400 font-bold uppercase">{selectedNode.label}</div>
          <div className="text-sm font-bold text-white">{selectedNode.domain}</div>
          <p className="text-xs text-slate-300 mt-1 font-mono">{selectedNode.etymon}</p>
        </div>
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Click nodes in 3D graph to inspect linguistic etymology
        </div>
      </div>
    </div>
  );
};
