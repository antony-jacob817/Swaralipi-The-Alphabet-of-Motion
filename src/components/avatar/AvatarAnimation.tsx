// AvatarAnimation.tsx - FIXED BACKGROUND VISIBILITY
import { useRef, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';

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

// Enhanced bone mapping for Ready Player Me avatar
const BONE_MAPPING = {
  // Body bones
  hips: 'Hips',
  spine: 'Spine',
  spine1: 'Spine1',
  spine2: 'Spine2',
  neck: 'Neck',
  head: 'Head',
  
  // Left arm bones
  leftShoulder: 'LeftShoulder',
  leftArm: 'LeftArm',
  leftForeArm: 'LeftForeArm',
  leftHand: 'LeftHand',
  leftHandThumb1: 'LeftHandThumb1',
  leftHandThumb2: 'LeftHandThumb2',
  leftHandThumb3: 'LeftHandThumb3',
  leftHandIndex1: 'LeftHandIndex1',
  leftHandIndex2: 'LeftHandIndex2',
  leftHandIndex3: 'LeftHandIndex3',
  leftHandMiddle1: 'LeftHandMiddle1',
  leftHandMiddle2: 'LeftHandMiddle2',
  leftHandMiddle3: 'LeftHandMiddle3',
  leftHandRing1: 'LeftHandRing1',
  leftHandRing2: 'LeftHandRing2',
  leftHandRing3: 'LeftHandRing3',
  leftHandPinky1: 'LeftHandPinky1',
  leftHandPinky2: 'LeftHandPinky2',
  leftHandPinky3: 'LeftHandPinky3',
  
  // Right arm bones
  rightShoulder: 'RightShoulder',
  rightArm: 'RightArm',
  rightForeArm: 'RightForeArm',
  rightHand: 'RightHand',
  rightHandThumb1: 'RightHandThumb1',
  rightHandThumb2: 'RightHandThumb2',
  rightHandThumb3: 'RightHandThumb3',
  rightHandIndex1: 'RightHandIndex1',
  rightHandIndex2: 'RightHandIndex2',
  rightHandIndex3: 'RightHandIndex3',
  rightHandMiddle1: 'RightHandMiddle1',
  rightHandMiddle2: 'RightHandMiddle2',
  rightHandMiddle3: 'RightHandMiddle3',
  rightHandRing1: 'RightHandRing1',
  rightHandRing2: 'RightHandRing2',
  rightHandRing3: 'RightHandRing3',
  rightHandPinky1: 'RightHandPinky1',
  rightHandPinky2: 'RightHandPinky2',
  rightHandPinky3: 'RightHandPinky3',
};

export function AvatarAnimation({ isTeaching, currentWord, signData }: AvatarAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  
  // Bone references for sign animation
  const boneRefs = useRef<Map<string, THREE.Bone>>(new Map());
  
  // Animation state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Animation timing constants
  const SIGN_DURATION = 2000; // 2 seconds per sign
  const FRAME_RATE = 30; // 30 fps
  const TOTAL_FRAMES = (SIGN_DURATION / 1000) * FRAME_RATE;

  // Setup Three.js scene with background plane
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Fallback background color
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(25, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 1000);
    camera.position.set(0, 0.3, 3.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Create background plane instead of using scene.background
    const createBackgroundPlane = (texture: THREE.Texture) => {
      // Remove existing background plane
      if (backgroundPlaneRef.current) {
        scene.remove(backgroundPlaneRef.current);
      }

      // Calculate aspect ratio of the texture
      const imageAspect = texture.image.width / texture.image.height;
      const canvasAspect = canvasRef.current!.clientWidth / canvasRef.current!.clientHeight;
      
      let planeWidth, planeHeight;
      
      if (canvasAspect > imageAspect) {
        // Canvas is wider than image
        planeHeight = 2;
        planeWidth = planeHeight * imageAspect;
      } else {
        // Canvas is taller than image
        planeWidth = 2;
        planeHeight = planeWidth / imageAspect;
      }

      // Create a large plane for the background
      const geometry = new THREE.PlaneGeometry(planeWidth * 4, planeHeight * 4);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
      });
      
      const backgroundPlane = new THREE.Mesh(geometry, material);
      backgroundPlane.position.z = -5; // Place behind everything
      backgroundPlane.renderOrder = -1; // Render first
      
      scene.add(backgroundPlane);
      backgroundPlaneRef.current = backgroundPlane;
    };

    // Load background texture with better error handling
    const textureLoader = new THREE.TextureLoader();
    
    const possiblePaths = [
      '/bg.jpg',
      './bg.jpg',
      'bg.jpg'
    ];

    const loadBackground = (pathIndex = 0) => {
      if (pathIndex >= possiblePaths.length) {
        console.warn('All background image paths failed, using fallback color');
        setBackgroundLoaded(true);
        return;
      }

      const currentPath = possiblePaths[pathIndex];
      console.log(`Attempting to load background from: ${currentPath}`);

      textureLoader.load(
        currentPath,
        (texture) => {
          console.log('Background image loaded successfully:', currentPath);
          
          // Configure texture properly
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          // Create background plane with the texture
          createBackgroundPlane(texture);
          setBackgroundLoaded(true);
        },
        // onProgress callback
        (progress) => {
          console.log(`Background loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
        },
        // onError callback
        (error) => {
          console.warn(`Failed to load background from ${currentPath}:`, error);
          // Try next path
          loadBackground(pathIndex + 1);
        }
      );
    };

    // Start loading background
    loadBackground();

    // Enhanced lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 3, -3);
    scene.add(fillLight);

    // Remove grid or make it very subtle
    const grid = new THREE.GridHelper(4, 4, 0x444444, 0x666666);
    grid.position.y = -1;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.1; // Very subtle
    scene.add(grid);

    const handleResize = () => {
      if (!canvasRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);

      // Update background plane size on resize
      if (backgroundPlaneRef.current && backgroundPlaneRef.current.material instanceof THREE.MeshBasicMaterial) {
        const texture = backgroundPlaneRef.current.material.map;
        if (texture) {
          const imageAspect = texture.image.width / texture.image.height;
          const canvasAspect = width / height;
          
          let planeWidth, planeHeight;
          
          if (canvasAspect > imageAspect) {
            planeHeight = 2;
            planeWidth = planeHeight * imageAspect;
          } else {
            planeWidth = 2;
            planeHeight = planeWidth / imageAspect;
          }

          backgroundPlaneRef.current.scale.set(planeWidth * 2, planeHeight * 2, 1);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (backgroundPlaneRef.current) {
        const material = backgroundPlaneRef.current.material as THREE.MeshBasicMaterial;
        if (material.map) {
          material.map.dispose();
        }
        material.dispose();
        backgroundPlaneRef.current.geometry.dispose();
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      animationId = requestAnimationFrame(animate);
      
      const delta = time - lastTime;
      lastTime = time;

      // Update animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(delta * 0.001);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  // Handle sign animation when signData changes
  useEffect(() => {
    if (signData && isTeaching) {
      console.log('Starting sign animation for:', signData.word);
      startSignAnimation(signData);
    } else {
      resetToIdlePose();
      setAnimationProgress(0);
    }
  }, [signData, isTeaching]);

  const startSignAnimation = (signData: SignData) => {
    setAnimationProgress(0);
    
    // Animate over the sign duration
    const startTime = Date.now();
    const animateSign = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SIGN_DURATION, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animateSign);
      } else {
        // Animation complete
        setTimeout(() => {
          if (!isTeaching) {
            resetToIdlePose();
          }
        }, 500);
      }
      
      // Apply the sign data based on progress
      applySignData(signData, progress);
    };
    
    animateSign();
  };

  const resetToIdlePose = () => {
    // Smoothly reset all bones to default position
    boneRefs.current.forEach((bone, boneName) => {
      if (boneName.includes('Hand') || boneName.includes('Arm') || boneName.includes('Shoulder')) {
        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, 0, 0.1);
        bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, 0, 0.1);
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, 0, 0.1);
      }
    });
  };

  const applySignData = (signData: SignData, progress: number) => {
    if (!avatarRef.current) return;

    // Calculate frame index based on progress
    const frameIndex = Math.floor(progress * (signData.pose.length / 3 - 1));
    
    // Apply pose data
    applyPoseData(signData.pose, frameIndex);
    
    // Apply hand data
    applyHandData(signData.left_hand, frameIndex, 'left');
    applyHandData(signData.right_hand, frameIndex, 'right');
  };

  const applyPoseData = (poseData: number[], frameIndex: number) => {
    const pointsPerFrame = 33; // MediaPipe pose has 33 points
    const startIdx = frameIndex * pointsPerFrame * 3;
    
    if (startIdx >= poseData.length) return;

    // Apply body pose based on keypoints
    // This is a simplified mapping - you can expand this based on your specific needs
    
    // Shoulders
    const leftShoulder = boneRefs.current.get(BONE_MAPPING.leftShoulder);
    const rightShoulder = boneRefs.current.get(BONE_MAPPING.rightShoulder);
    
    if (leftShoulder && rightShoulder) {
      // Use shoulder keypoints (indices 11 and 12)
      const leftShoulderX = (poseData[startIdx + 11 * 3] || 0) * 0.5;
      const leftShoulderY = (poseData[startIdx + 11 * 3 + 1] || 0) * 0.3;
      const rightShoulderX = (poseData[startIdx + 12 * 3] || 0) * 0.5;
      const rightShoulderY = (poseData[startIdx + 12 * 3 + 1] || 0) * 0.3;
      
      leftShoulder.rotation.x = leftShoulderY;
      leftShoulder.rotation.y = leftShoulderX;
      rightShoulder.rotation.x = rightShoulderY;
      rightShoulder.rotation.y = rightShoulderX;
    }

    // Head movement
    const head = boneRefs.current.get(BONE_MAPPING.head);
    if (head) {
      // Use nose keypoint (index 0) for head orientation
      const headX = (poseData[startIdx] || 0) * 0.1;
      const headY = (poseData[startIdx + 1] || 0) * 0.1;
      head.rotation.x = headY;
      head.rotation.y = headX;
    }
  };

  const applyHandData = (handData: number[], frameIndex: number, side: 'left' | 'right') => {
    const pointsPerFrame = 21; // MediaPipe hand has 21 points
    const startIdx = frameIndex * pointsPerFrame * 3;
    
    if (startIdx >= handData.length) return;

    // Apply wrist position and rotation
    const wrist = boneRefs.current.get(BONE_MAPPING[`${side}Hand`]);
    const forearm = boneRefs.current.get(BONE_MAPPING[`${side}ForeArm`]);
    
    if (wrist && forearm) {
      // Wrist position (point 0)
      const wristX = (handData[startIdx] || 0) * 2;
      const wristY = (handData[startIdx + 1] || 0) * 2;
      const wristZ = (handData[startIdx + 2] || 0) * 2;
      
      wrist.rotation.x = wristY;
      wrist.rotation.y = wristX;
      wrist.rotation.z = wristZ;
      
      // Enhanced arm movement based on wrist position
      forearm.rotation.x = wristY * 0.3;
      forearm.rotation.y = wristX * 0.3;
    }

    // Apply finger rotations
    applyFingerData(handData, startIdx, side, 'Thumb', [1, 2, 3, 4]);
    applyFingerData(handData, startIdx, side, 'Index', [5, 6, 7, 8]);
    applyFingerData(handData, startIdx, side, 'Middle', [9, 10, 11, 12]);
    applyFingerData(handData, startIdx, side, 'Ring', [13, 14, 15, 16]);
    applyFingerData(handData, startIdx, side, 'Pinky', [17, 18, 19, 20]);
  };

  const applyFingerData = (handData: number[], startIdx: number, side: 'left' | 'right', finger: string, pointIndices: number[]) => {
    for (let i = 0; i < 3; i++) { // Three finger bones per finger
      const boneName = `${side}Hand${finger}${i + 1}` as keyof typeof BONE_MAPPING;
      const bone = boneRefs.current.get(BONE_MAPPING[boneName]);
      
      if (bone && pointIndices[i] !== undefined) {
        const pointIdx = startIdx + pointIndices[i] * 3;
        if (pointIdx + 2 < handData.length) {
          const x = (handData[pointIdx] || 0) * 1.5;
          const y = (handData[pointIdx + 1] || 0) * 1.5;
          const z = (handData[pointIdx + 2] || 0) * 1.5;
          
          bone.rotation.x = y;
          bone.rotation.y = x;
          bone.rotation.z = z;
        }
      }
    }
  };

  // Load avatar and setup bone mapping
  useEffect(() => {
    const loadAvatar = async () => {
      if (!sceneRef.current) return;

      setLoading(true);
      setError(null);

      try {
        // Clear existing avatar
        if (avatarRef.current) {
          sceneRef.current.remove(avatarRef.current);
          avatarRef.current = null;
        }

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        loader.setDRACOLoader(dracoLoader);

        // Using a generic Ready Player Me avatar - replace with your actual model URL
        const avatarUrl = 'https://models.readyplayer.me/68cce6822502835277181241.glb';

        const gltf = await new Promise<THREE.GLTF>((resolve, reject) => {
          loader.load(avatarUrl, resolve, undefined, (error) => {
            console.error('GLTF loading error:', error);
            reject(error);
          });
        });

        const model = gltf.scene;
        model.scale.set(1.2, 1.2, 1.2);
        model.position.set(0, -1.2, 0);

        // Enhanced shadow setup
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Improve material appearance
            if (child.material) {
              child.material.roughness = 0.7;
              child.material.metalness = 0.1;
            }
          }
        });

        sceneRef.current.add(model);
        avatarRef.current = model;

        // Extract and map bones
        extractBones(model);
        
        // Setup idle animation if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const idleClip = gltf.animations.find((clip: THREE.AnimationClip) => 
            clip.name.toLowerCase().includes('idle') || clip.duration > 1
          );
          if (idleClip) {
            const action = mixerRef.current.clipAction(idleClip);
            action.setEffectiveTimeScale(0.3); // Very slow idle
            action.setEffectiveWeight(0.3); // Reduced influence to not interfere with signing
            action.play();
          }
        }

        setLoading(false);
        
      } catch (err) {
        console.error('Failed to load avatar:', err);
        setError('Avatar model failed to load. Using simplified mode.');
        setLoading(false);
        createFallbackAvatar();
      }
    };

    const extractBones = (model: THREE.Group) => {
      boneRefs.current.clear();
      
      model.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Bone) {
          // Store bone with its original name
          boneRefs.current.set(child.name, child);
          
          // Also try to map common naming conventions
          const simplifiedName = child.name
            .replace(/^mixamorig/, '')
            .replace(/^Armature_/, '')
            .replace(/\./g, '');
            
          if (simplifiedName && simplifiedName !== child.name) {
            boneRefs.current.set(simplifiedName, child);
          }
        }
      });

      console.log('Available bones for animation:', Array.from(boneRefs.current.keys()));
      
      // Log which bones we successfully mapped
      Object.values(BONE_MAPPING).forEach(boneName => {
        if (boneRefs.current.has(boneName)) {
          console.log(`✓ Mapped bone: ${boneName}`);
        } else {
          console.log(`✗ Missing bone: ${boneName}`);
        }
      });
    };

    const createFallbackAvatar = () => {
      if (!sceneRef.current) return;
      
      // Create a simple fallback with basic geometry
      const group = new THREE.Group();
      
      // Body
      const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4f46e5 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.3;
      group.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 1.1;
      group.add(head);
      
      // Simple arms for demonstration
      const armGeometry = new THREE.CapsuleGeometry(0.08, 0.6, 4, 8);
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.4, 0.6, 0);
      group.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.4, 0.6, 0);
      group.add(rightArm);
      
      sceneRef.current.add(group);
      avatarRef.current = group;
    };

    loadAvatar();
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">ISL Teaching Avatar</h3>
        <p className="text-sm text-gray-600">Real-time Indian Sign Language Interpreter</p>
      </div>

      <div className="relative w-full h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading ISL interpreter...</p>
              {!backgroundLoaded && (
                <p className="text-xs text-gray-500 mt-2">Loading background...</p>
              )}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center p-4">
              <div className="text-yellow-600 mb-2">⚠️ Using Fallback Mode</div>
              <p className="text-sm text-gray-600 mb-2">{error}</p>
              <p className="text-xs text-gray-500">Basic visualization active</p>
            </div>
          </div>
        )}
      </div>

      {/* Animation Status */}
      <div className="mt-4 p-4 bg-white rounded-lg border">
        <div className="text-center mb-2">
          <p className="text-gray-800 font-medium">
            {currentWord ? (
              <>Signing: <span className="text-blue-600">"{currentWord}"</span></>
            ) : (
              <span className="text-gray-500">Ready for ISL teaching</span>
            )}
          </p>
        </div>
        
        {signData && isTeaching && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span>Animation Progress:</span>
              <span>{Math.round(animationProgress * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${animationProgress * 100}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium">Pose Data</div>
                <div>{signData.pose.length} points</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium">Left Hand</div>
                <div>{signData.left_hand.length} points</div>
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <div className="font-medium">Right Hand</div>
                <div>{signData.right_hand.length} points</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex justify-center gap-4 mt-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isTeaching ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">Teaching</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentWord ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">Word Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${signData ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">Sign Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${backgroundLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
          <span className="text-sm text-gray-600">Background</span>
        </div>
      </div>
    </Card>
  );
}