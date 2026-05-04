import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';

interface SignData {
  word: string;
  pose: number[];
  left_hand: number[];
  right_hand: number[];
}

interface AvatarAnimationProps {
  isTeaching?: boolean;
  currentWord?: string;
  signData?: SignData | null;
}

export function AvatarAnimation({
  isTeaching,
  currentWord,
  signData,
}: AvatarAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<THREE.Group | null>(null);
  const boneRefs = useRef<Map<string, THREE.Bone>>(new Map());

  const [loading, setLoading] = useState(true);

  const animationFrameRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const currentFrameIdx = useRef<number>(0);

  /* ---------------- LANDMARK EXTRACTION ---------------- */

  const getLandmarksFromFrame = (
    poseData: number[],
    frameIndex: number
  ): THREE.Vector3[] | null => {
    const FRAME_SIZE = 33 * 3;
    const totalFrames = Math.floor(poseData.length / FRAME_SIZE);
    if (frameIndex >= totalFrames) return null;

    const start = frameIndex * FRAME_SIZE;
    const frame = poseData.slice(start, start + FRAME_SIZE);

    return Array.from({ length: 33 }, (_, i) => {
      const x = frame[i * 3];
      const y = frame[i * 3 + 1];
      const z = frame[i * 3 + 2];

      return new THREE.Vector3(
        -(x - 0.5) * 2,
        -(y - 0.5) * 2,
        (z - 0.5) * 2
      );
    });
  };

  /* ---------------- APPLY POSE ---------------- */

  const applyPoseToAvatar = useCallback((landmarks: THREE.Vector3[]) => {
    const IDX = {
      LS: 11,
      RS: 12,
      LE: 13,
      RE: 14,
      LW: 15,
      RW: 16,
    };

    const rotateBone = (
      boneName: string,
      a: number,
      b: number,
      strength = 0.3
    ) => {
      const bone = boneRefs.current.get(boneName);
      if (!bone) return;

      const dir = new THREE.Vector3()
        .subVectors(landmarks[b], landmarks[a])
        .normalize();

      const tx = THREE.MathUtils.clamp(-dir.y, -1, 1);
      const ty = THREE.MathUtils.clamp(dir.x, -1, 1);

      bone.rotation.x += (tx - bone.rotation.x) * strength;
      bone.rotation.y += (ty - bone.rotation.y) * strength;
    };

    rotateBone('LeftArm', IDX.LS, IDX.LE);
    rotateBone('LeftForeArm', IDX.LE, IDX.LW, 0.4);
    rotateBone('RightArm', IDX.RS, IDX.RE);
    rotateBone('RightForeArm', IDX.RE, IDX.RW, 0.4);
    rotateBone('LeftHand', IDX.LE, IDX.LW, 0.45);
    rotateBone('RightHand', IDX.RE, IDX.RW, 0.45);
  }, []);

  /* ---------------- ANIMATION LOOP ---------------- */

  useEffect(() => {
    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (isTeaching && signData?.pose) {
        const lm = getLandmarksFromFrame(
          signData.pose,
          currentFrameIdx.current
        );
        if (lm) applyPoseToAvatar(lm);

        if (time - lastFrameTime.current > 66) {
          const total = Math.floor(signData.pose.length / (33 * 3));
          currentFrameIdx.current =
            (currentFrameIdx.current + 1) % Math.max(total, 1);
          lastFrameTime.current = time;
        }
      }

      rendererRef.current?.render(
        sceneRef.current!,
        cameraRef.current!
      );
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isTeaching, signData, applyPoseToAvatar]);

  useEffect(() => {
    currentFrameIdx.current = 0;
    lastFrameTime.current = 0;
  }, [signData]);

  /* ---------------- SCENE SETUP ---------------- */

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      40,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0.6, 2.8);
    camera.lookAt(0, 0.4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(
      canvasRef.current.clientWidth,
      canvasRef.current.clientHeight
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));

    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 5);
    scene.add(light);

    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(draco);

    loader.load('/68cce6822502835277181241.glb', (gltf) => {
      const model = gltf.scene;

      model.position.set(0, -1, 0);
      model.rotation.y = 0; // ✅ FRONT FACING

      scene.add(model);
      avatarRef.current = model;

      model.traverse((n) => {
        if (n instanceof THREE.Bone) {
          boneRefs.current.set(n.name, n);
        }
      });

      setLoading(false);
    });

    return () => renderer.dispose();
  }, [applyPoseToAvatar]);

  /* ---------------- UI ---------------- */

  return (
    <Card className="p-4 bg-white shadow-xl">
      <div className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-slate-100">
        <canvas ref={canvasRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            Loading avatar…
          </div>
        )}

        {!loading && isTeaching && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg">
            {currentWord}
          </div>
        )}
      </div>
    </Card>
  );
}
