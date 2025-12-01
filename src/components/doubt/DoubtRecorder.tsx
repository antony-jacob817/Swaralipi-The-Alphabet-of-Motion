import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Square, RotateCcw } from 'lucide-react';

interface DoubtRecorderProps {
  onDoubtSubmitted: (doubtText: string) => void;
  onClose: () => void;
}

export function DoubtRecorder({ onDoubtSubmitted, onClose }: DoubtRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [predictedText, setPredictedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const startRecording = async () => {
    setIsRecording(true);
    setPredictedText('');
    
    // TODO: Connect to MediaPipe + LSTM model for real-time sign detection
    // TODO: Start capturing frames at regular intervals
    console.log('Starting sign language recording...');
    
    // Mock prediction after 3 seconds
    setTimeout(() => {
      simulateSignPrediction();
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // TODO: Stop frame capture
    // TODO: Send final frames to prediction model
    console.log('Stopping sign language recording...');
    
    // Mock processing time
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const simulateSignPrediction = () => {
    // Mock sign-to-text prediction
    const mockPredictions = [
      'BOOK',
      'HELP ME',
      'I NEED BOOK',
      'WHAT IS THIS',
      'EXPLAIN PLEASE',
      'I DON T UNDERSTAND'
    ];
    
    const randomPrediction = mockPredictions[Math.floor(Math.random() * mockPredictions.length)];
    setPredictedText(randomPrediction);
  };

  const submitDoubt = () => {
    if (predictedText) {
      onDoubtSubmitted(predictedText);
    }
  };

  const resetRecording = () => {
    setPredictedText('');
    setIsRecording(false);
    setIsProcessing(false);
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Ask Your Doubt in Sign Language
        </h3>
        <p className="text-sm text-gray-600">
          Use sign language and we'll convert it to text
        </p>
      </div>

      {/* Webcam Display */}
      <div className="relative w-full max-w-md mx-auto mb-6">
        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            className="w-full h-full object-cover"
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: 'user'
            }}
          />
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Recording
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        {!isRecording ? (
          <Button onClick={startRecording} className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Start Recording
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
        
        <Button onClick={resetRecording} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="text-center mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">Processing sign language...</p>
        </div>
      )}

      {/* Predicted Text */}
      {predictedText && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-2">Detected Sign:</h4>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xl font-medium text-blue-800">"{predictedText}"</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {predictedText && (
          <Button onClick={submitDoubt} className="bg-green-600 hover:bg-green-700">
            Submit Doubt
          </Button>
        )}
        <Button onClick={onClose} variant="outline">
          Cancel
        </Button>
      </div>

      {/* Development Notes */}
      <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
        <p className="font-semibold text-yellow-800">ML Integration Points:</p>
        <ul className="text-yellow-700 mt-1 space-y-1">
          <li>• MediaPipe hands detection for landmark extraction</li>
          <li>• LSTM model for sequence classification</li>
          <li>• Real-time frame processing at 30fps</li>
          <li>• API endpoint: POST /api/predict-sign</li>
        </ul>
      </div>
    </Card>
  );
}