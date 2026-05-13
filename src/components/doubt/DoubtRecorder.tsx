import { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Square, RotateCcw, Send } from 'lucide-react';

interface DoubtRecorderProps {
  onDoubtSubmitted: (doubtText: string) => void;
  onClose: () => void;
}

export function DoubtRecorder({ onDoubtSubmitted, onClose }: DoubtRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [sentence, setSentence] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(4);
  
  const [predictedWord, setPredictedWord] = useState("");
  const [manualInput, setManualInput] = useState("");
  
  const webcamRef = useRef<Webcam>(null);
  const framesRef = useRef<string[]>([]);
  const recentPredsRef = useRef<{word: string, conf: number}[]>([]); 
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const predictIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);

  const captureFrame = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        framesRef.current = [...framesRef.current, imageSrc].slice(-30);
      }
    }
  }, []);

  const fetchLivePrediction = useCallback(async () => {
    if (framesRef.current.length < 30 || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const framesToSend = [...framesRef.current];

    try {
      const response = await fetch('https://antonyjacob817-swaralipi-api.hf.space/api/predict-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frames: framesToSend }),
      });

      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        const topWord = data.predictions[0].word;
        
        setPredictedWord(topWord); 
        
        recentPredsRef.current.push({ 
          word: topWord, 
          conf: data.predictions[0].confidence 
        });
      }

    } catch (error) {
      console.error('Network error:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, []); 

  const finalizeWord = useCallback(() => {
    const preds = recentPredsRef.current;
    
    if (preds.length > 0) {
      const labelScores: Record<string, number[]> = {};
      
      preds.forEach(({ word, conf }) => {
        if (!labelScores[word]) labelScores[word] = [];
        labelScores[word].push(conf);
      });

      let bestLabel = "";
      let highestAvg = -1;

      for (const [label, scores] of Object.entries(labelScores)) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > highestAvg) {
          highestAvg = avg;
          bestLabel = label;
        }
      }

      if (bestLabel) {
        // Appends the highest averaged word straight into the sentence
        setSentence((prev) => [...prev, bestLabel]);
      }
    }

    recentPredsRef.current = [];
    setPredictedWord(""); 
  }, []);

  useEffect(() => {
    let wordFinalizeInterval: ReturnType<typeof setInterval>;

    if (isRecording) {
      setCountdown(4);
      recentPredsRef.current = [];
      framesRef.current = [];
      setPredictedWord("");

      captureRef.current = setInterval(captureFrame, 50);
      predictIntervalRef.current = setInterval(fetchLivePrediction, 500);

      // 1. PURELY VISUAL: Just updates the UI number every second
      timerRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 4 : prev - 1));
      }, 1000);
      
      // 2. THE LOGIC LOOP: Appends the word exactly every 4 seconds safely
      wordFinalizeInterval = setInterval(() => {
        finalizeWord();
      }, 4000);
      
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (captureRef.current) clearInterval(captureRef.current);
      if (predictIntervalRef.current) clearInterval(predictIntervalRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (captureRef.current) clearInterval(captureRef.current);
      if (predictIntervalRef.current) clearInterval(predictIntervalRef.current);
      if (wordFinalizeInterval) clearInterval(wordFinalizeInterval);
    };
  }, [isRecording, captureFrame, fetchLivePrediction, finalizeWord]);

  const startRecording = () => {
    setIsRecording(true);
    setSentence([]);
    setPredictedWord("");
  };

  const stopRecording = () => {
    // When stop is clicked, instantly finalize the last partial word before shutting down
    finalizeWord(); 
    setIsRecording(false);
  };

  const submitDoubt = () => {
    const text = manualInput.trim() || sentence.join(" ");
    if (!text) return;
    onDoubtSubmitted(text);
  };

  const resetRecording = () => {
    setSentence([]);
    setIsRecording(false);
    setCountdown(4);
    setPredictedWord("");
    framesRef.current = [];
    recentPredsRef.current = [];
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto bg-white dark:bg-black border-gray-200 dark:border-gray-800">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Ask Your Doubt in Sign Language
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sign continuously. A new word is detected every 4 seconds.
        </p>
      </div>

      <div className="relative w-full max-w-md mx-auto mb-6">
        <div className="aspect-video bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden relative shadow-inner">
          <Webcam
            ref={webcamRef}
            audio={false}
            className="w-full h-full object-cover"
            screenshotFormat="image/jpeg"
            screenshotQuality={0.5} 
            videoConstraints={{ width: 320, height: 240, facingMode: 'user' }} 
          />

          {isRecording && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-7xl font-black opacity-30 z-10 drop-shadow-lg">
              {countdown}
            </div>
          )}
        </div>
        
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-20 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            REC
          </div>
        )}
      </div>

      <div className="h-10 flex items-center justify-center mb-4">
        {isRecording && predictedWord ? (
          <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
            <span className="text-sm font-medium text-gray-500">Detecting:</span>
            <span className="text-2xl font-bold uppercase tracking-wider">{predictedWord}</span>
          </div>
        ) : isRecording ? (
          <span className="text-gray-400 animate-pulse">Watching for signs...</span>
        ) : null}
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6"
          >
            <Camera className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2 px-6">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
        
        <Button 
          onClick={resetRecording} 
          variant="outline" 
          className="flex items-center gap-2 border-gray-300 dark:border-gray-700"
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Detected Sentence:</h4>
        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border-2 border-dashed border-pink-200 dark:border-pink-800/50 rounded-xl min-h-[80px] flex items-center flex-wrap gap-2 transition-all">
          {sentence.length > 0 ? (
            sentence.map((word, idx) => (
              <span 
                key={idx} 
                className="bg-pink-600 text-white px-4 py-1.5 rounded-full font-bold shadow-sm uppercase tracking-wide animate-in fade-in zoom-in duration-200"
              >
                {word}
              </span>
            ))
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic text-sm">
              Your detected words will appear here...
            </span>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-semibold mb-2 text-gray-600">Manual Override (Optional):</h4>
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Type gloss like: WATER CYCLE"
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-black dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
        />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button 
          onClick={onClose} 
          variant="ghost"
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </Button>
        <Button 
          onClick={submitDoubt} 
          disabled={(sentence.length === 0 && manualInput.trim() === "") || isRecording}
          className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 flex items-center gap-2 px-8 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Ask Doubt
        </Button>
      </div>
    </Card>
  );
}