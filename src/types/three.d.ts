// Type declarations for Three.js examples modules
declare module 'three-stdlib' {
  import * as THREE from 'three';

  export interface GLTF {
    scene: THREE.Group;
    scenes: THREE.Group[];
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset: { [key: string]: unknown };
  }

  export class GLTFLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
  }

  export class DRACOLoader {
    constructor(manager?: THREE.LoadingManager);
    setDecoderPath(path: string): DRACOLoader;
    setDecoderConfig(config: { [key: string]: unknown }): DRACOLoader;
    setWorkerLimit(workerLimit: number): DRACOLoader;
    preload(): DRACOLoader;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/loaders/DRACOLoader.js' {
  import * as THREE from 'three';

  export class DRACOLoader {
    constructor(manager?: THREE.LoadingManager);
    setDecoderPath(path: string): DRACOLoader;
    setDecoderConfig(config: { [key: string]: unknown }): DRACOLoader;
    setWorkerLimit(workerLimit: number): DRACOLoader;
    preload(): DRACOLoader;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/utils/SkeletonUtils' {
  import * as THREE from 'three';

  export class SkeletonUtils {
    static clone(source: THREE.Object3D): THREE.Object3D;
    static retarget(target: THREE.Object3D, source: THREE.Object3D, options?: Record<string, unknown>): void;
    static retargetClip(target: THREE.Object3D, source: THREE.Object3D, clip: THREE.AnimationClip, options?: Record<string, unknown>): THREE.AnimationClip;
  }
}
