import React, { useEffect, useRef } from 'react';
import { Holistic, type Results } from '@mediapipe/holistic';

interface SignAvatar2DProps {
  word: string;                
  onSignComplete?: () => void; 
  paused?: boolean;            
}

// Character Style Constants
const CHAR = {
  skin: '#FFCCAA',
  shirt: '#FF6B6B',
  pants: '#4ECDC4',
  outline: '#333333',
  strokeW: 5,
};

const FIXED_CANVAS_WIDTH = 1280;
const FIXED_CANVAS_HEIGHT = 720;
const PROCESS_INTERVAL_MS = 33; // ~30 fps

export const SignAvatar2D: React.FC<SignAvatar2DProps> = ({ word, onSignComplete, paused = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [queue, setQueue] = React.useState<string[]>([]);
  const [current, setCurrent] = React.useState<string>('');
  
  // Track if we are actively playing to prevent skipping
  const isPlayingRef = useRef(false);

  // Refs for tracking loss
  const lastPoseRef = useRef<{ x: number; y: number }[] | null>(null);
  const lastLeftHandRef = useRef<{ x: number; y: number }[] | null>(null);
  const lastRightHandRef = useRef<{ x: number; y: number }[] | null>(null);

  const getCoordinateMapper = (videoW: number, videoH: number, canvasW: number, canvasH: number) => {
    const vw = videoW || 640;
    const vh = videoH || 480;
    const videoAspect = vw / vh;
    const canvasAspect = canvasW / canvasH;
    let scale, xOffset, yOffset;

    if (videoAspect > canvasAspect) {
      scale = canvasW / vw;
      xOffset = 0;
      yOffset = (canvasH - vh * scale) / 2;
    } else {
      scale = canvasH / vh;
      xOffset = (canvasW - vw * scale) / 2;
      yOffset = 0;
    }

    return {
      mapX: (nx: number) => xOffset + nx * vw * scale,
      mapY: (ny: number) => yOffset + ny * vh * scale,
    };
  };

  // ==========================================
  // 1. MEDIAPIPE & CANVAS DRAWING LOGIC
  // ==========================================
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d')!;

    const drawHead = (pose: { x: number; y: number }[]) => {
      const nose = pose[0];
      const earL = pose[7];
      const earR = pose[8];
      if (!nose) return;

      const x = nose.x;
      const y = nose.y;
      let size = 50;
      if (earL && earR) size = Math.abs(earL.x - earR.x) * 1.5;

      ctx.fillStyle = CHAR.skin;
      ctx.strokeStyle = CHAR.outline;
      ctx.lineWidth = CHAR.strokeW;
      ctx.beginPath();
      ctx.rect(x - size * 0.2, y, size * 0.4, size * 0.8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = CHAR.skin;
      ctx.strokeStyle = CHAR.outline;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.2, size / 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(x - size * 0.25, y - size * 0.3, size * 0.1, 0, Math.PI * 2);
      ctx.arc(x + size * 0.25, y - size * 0.3, size * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y - size * 0.1, size * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    };

    const drawTorso = (pose: { x: number; y: number }[]) => {
      const shL = pose[11];
      const shR = pose[12];
      const hipL = pose[23];
      const hipR = pose[24];

      ctx.fillStyle = CHAR.shirt;
      ctx.strokeStyle = CHAR.outline;
      ctx.lineWidth = CHAR.strokeW;

      ctx.beginPath();
      ctx.moveTo(shL.x, shL.y);
      ctx.lineTo(shR.x, shR.y);
      ctx.quadraticCurveTo(shR.x + 20, (shR.y + hipR.y) / 2, hipR.x, hipR.y);
      ctx.lineTo(hipL.x, hipL.y);
      ctx.quadraticCurveTo(shL.x - 20, (shL.y + hipL.y) / 2, shL.x, shL.y);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'white';
      const cx = (shL.x + shR.x) / 2;
      const cy = (shL.y + shR.y) / 2 + 30;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawArm = (sh: { x: number; y: number }, el: { x: number; y: number }, wr: { x: number; y: number }) => {
      if (!sh || !el || !wr) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = CHAR.shirt;
      ctx.lineWidth = 35;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(el.x, el.y);
      ctx.stroke();

      ctx.strokeStyle = CHAR.skin;
      ctx.lineWidth = 25;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(wr.x, wr.y);
      ctx.stroke();
    };

    const drawHand = (landmarks: { x: number; y: number }[]) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const fingers = [
        [0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [0, 9, 10, 11, 12],
        [0, 13, 14, 15, 16], [0, 17, 18, 19, 20],
      ];

      for (const f of fingers) {
        ctx.beginPath();
        for (let i = 0; i < f.length; i++) {
          const pt = landmarks[f[i]];
          if (!pt) continue;
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.save();
        ctx.strokeStyle = CHAR.outline;
        ctx.lineWidth = 22;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = CHAR.skin;
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawHandCircle = (wrist: { x: number; y: number }) => {
      if (!wrist) return;
      ctx.fillStyle = CHAR.skin;
      ctx.strokeStyle = CHAR.outline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(wrist.x, wrist.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    const holistic = new Holistic({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
    });

    holistic.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    holistic.onResults((results: Results) => {
      canvasElement.width = FIXED_CANVAS_WIDTH;
      canvasElement.height = FIXED_CANVAS_HEIGHT;
      const w = canvasElement.width;
      const h = canvasElement.height;
      ctx.clearRect(0, 0, w, h);

      let poseToDraw: { x: number; y: number }[] | null = null;
      let leftHandToDraw: { x: number; y: number }[] | null = null;
      let rightHandToDraw: { x: number; y: number }[] | null = null;

      if (results.poseLandmarks) {
        const mapper = getCoordinateMapper(videoElement.videoWidth || 640, videoElement.videoHeight || 480, w, h);
        const currentPose = results.poseLandmarks.map((lm) => ({ x: mapper.mapX(lm.x), y: mapper.mapY(lm.y) }));
        lastPoseRef.current = currentPose;
        poseToDraw = currentPose;

        if (results.leftHandLandmarks) {
          const currentLeft = results.leftHandLandmarks.map((lm) => ({ x: mapper.mapX(lm.x), y: mapper.mapY(lm.y) }));
          lastLeftHandRef.current = currentLeft;
          leftHandToDraw = currentLeft;
        } else {
          leftHandToDraw = null;
        }

        if (results.rightHandLandmarks) {
          const currentRight = results.rightHandLandmarks.map((lm) => ({ x: mapper.mapX(lm.x), y: mapper.mapY(lm.y) }));
          lastRightHandRef.current = currentRight;
          rightHandToDraw = currentRight;
        } else {
          rightHandToDraw = null;
        }
      } else if (lastPoseRef.current) {
        poseToDraw = lastPoseRef.current;
        leftHandToDraw = lastLeftHandRef.current;
        rightHandToDraw = lastRightHandRef.current;
      }

      if (poseToDraw) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        drawTorso(poseToDraw);
        drawHead(poseToDraw);
        drawArm(poseToDraw[11], poseToDraw[13], poseToDraw[15]);
        drawArm(poseToDraw[12], poseToDraw[14], poseToDraw[16]);
        if (leftHandToDraw) {
          drawHand(leftHandToDraw);
        } else {
          drawHandCircle(poseToDraw[15]);
        }

        if (rightHandToDraw) {
          drawHand(rightHandToDraw);
        } else {
          drawHandCircle(poseToDraw[16]);
        }
        ctx.restore();
      }
    });

    let lastProcessTime = 0;
    let animationFrameId: number;

    const processVideo = async (now: number) => {
      if (!paused && videoElement.readyState >= 2 && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        if (now - lastProcessTime >= PROCESS_INTERVAL_MS) {
          lastProcessTime = now;
          await holistic.send({ image: videoElement });
        }
      }
      animationFrameId = requestAnimationFrame(processVideo);
    };

    const startProcessing = () => {
      animationFrameId = requestAnimationFrame(processVideo);
    };

    if (videoElement.readyState >= 2) {
      startProcessing();
    } else {
      videoElement.addEventListener('loadeddata', startProcessing);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      holistic.close();
      videoElement.removeEventListener('loadeddata', startProcessing);
    };
  }, [paused]);

  // ==========================================
  // 2. VIDEO QUEUE & PLAYBACK LOGIC
  // ==========================================
  
  useEffect(() => {
    if (!word) {
      setQueue([]);
      setCurrent('');
      return;
    }
    setQueue([word.toLowerCase()]);
    setCurrent(word.toLowerCase());
  }, [word]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || !word) {
      isPlayingRef.current = false;
      return;
    }

    const videoUrl = `/videos/${current}.mp4`;
    
    if (!video.src.endsWith(videoUrl)) {
      video.src = videoUrl;
      video.load();
    }

    if (!paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => { isPlayingRef.current = true; })
          .catch((err) => {
            // BUG FIX: Removed handleVideoError() from here.
            // This catch block only fires for harmless browser play interruptions, 
            // NOT when a file is actually missing.
            console.warn("Playback interrupted (usually harmless buffering):", err);
          });
      }
    } else {
      video.pause();
      isPlayingRef.current = false;
    }

    const handleEnded = () => {
      if (!word || !isPlayingRef.current) return;

      if (queue.length > 1) {
        const nextQueue = queue.slice(1);
        setQueue(nextQueue);
        setCurrent(nextQueue[0]);
      } else {
        isPlayingRef.current = false;
        setTimeout(() => {
          if (word) onSignComplete?.();
        }, 50);
      }
    };

    const handleVideoError = () => {
      // This 'error' event specifically fires when a file returns a 404 Not Found.
      // NOW it will only split into alphabets if the video is TRULY missing.
      if (!word) return;

      if (current.length > 1) {
        const alphabets = current.split('');
        setQueue(alphabets);
        setCurrent(alphabets[0]);
      } else {
        handleEnded();
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleVideoError);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleVideoError);
    };
  }, [current, paused, word, queue, onSignComplete]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border-4 border-slate-800 shadow-xl">
      <img
        src="/bg.jpg"
        alt="avatar background"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <video ref={videoRef} className="hidden" muted loop={false} playsInline />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        style={{ width: '100%', height: '100%' }}
      />
      {!word && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-20">
          <p className="text-slate-600 font-bold">Waiting for word...</p>
        </div>
      )}
    </div>
  );
};