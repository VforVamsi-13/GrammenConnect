// ../components/FaceAuthLogin.tsx
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, RefreshCw, X } from 'lucide-react';
import { speak } from '../services/speechService';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  onSuccess: (userName: string) => void;
  onCancel: () => void;
}

const FaceAuthLogin: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const { t, language } = useLanguage();
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
        speak(t("Face recognition ready. Please look at the camera."), language);
      } catch (err) {
        speak(t("Failed to load face models."), language);
      }
    };
    loadModels();
  }, [language, t]);

  const handleLogin = async () => {
    if (!webcamRef.current || isProcessing) return;
    setIsProcessing(true);
    setStatus(t("Analyzing your face..."));
    speak(t("Analyzing your face..."), language);

    try {
      const video = webcamRef.current.video!;
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        const msg = t("No face detected. Please look straight at the camera.");
        setStatus(msg);
        speak(msg, language);
        setIsProcessing(false);
        return;
      }

      const embedding = Array.from(detection.descriptor);
      const response = await axios.post(`${API_URL}/login-face`, { embedding });
      const name = response.data.user.name;

      const welcomeMsg = `${t("Welcome back")}, ${name}!`;
      setStatus(welcomeMsg);
      speak(welcomeMsg, language);

      setTimeout(() => onSuccess(name), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.error || t("Face not recognized. Please register first.");
      setStatus(msg);
      speak(msg, language);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
        <p className="mt-6 text-lg font-black">{t("Loading face recognition...")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative w-80 h-80 mx-auto rounded-full overflow-hidden border-8 border-indigo-600 shadow-2xl">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          mirrored
        />
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/60 pointer-events-none" />
      </div>

      <p className="text-center text-xl font-black text-indigo-700 min-h-[3rem]">{status || t("Look straight at the camera")}</p>

      <div className="flex gap-4">
        <button
          onClick={handleLogin}
          disabled={isProcessing}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl disabled:opacity-70"
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={24} /> : <Camera size={24} />}
          {isProcessing ? t("Processing...") : t("Sign In with Face")}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-5 border-2 border-gray-300 rounded-3xl hover:bg-gray-50"
        >
          <X size={28} />
        </button>
      </div>
    </div>
  );
};

export default FaceAuthLogin;