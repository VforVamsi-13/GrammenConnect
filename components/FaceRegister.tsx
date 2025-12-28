// src/components/FaceRegister.tsx
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Camera, RefreshCw, X, User, Check } from 'lucide-react';
import { speak } from '../services/speechService';
import { useLanguage } from '../contexts/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  onSuccess: (userName: string) => void;
  onCancel: () => void;
}

const FaceRegister: React.FC<Props> = ({ onSuccess, onCancel }) => {
  const { t, language } = useLanguage();
  const webcamRef = useRef<Webcam>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [name, setName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);

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
        speak(t("Face registration ready. Please enter your name first."), language);
      } catch (err) {
        speak(t("Failed to load models."), language);
      }
    };
    loadModels();
  }, [language, t]);

  const handleRegister = async () => {
    if (!webcamRef.current || isProcessing) return;
    setIsProcessing(true);
    setStatus(t("Capturing your face..."));
    speak(t("Hold still. Capturing your face."), language);

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

      await axios.post(`${API_URL}/register-face`, { name, embedding });

      const successMsg = t("Registration successful! Welcome") + `, ${name}!`;
      setStatus(successMsg);
      speak(successMsg, language);

      setTimeout(() => onSuccess(name), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.error || t("Registration failed. Please try again.");
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
        <p className="mt-6 text-lg font-black">{t("Loading face models...")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!nameSubmitted ? (
        <div className="space-y-6">
          <div className="text-center">
            <User size={64} className="mx-auto text-indigo-600 mb-4" />
            <h3 className="text-2xl font-black text-indigo-700">{t("What is your name?")}</h3>
            <p className="text-gray-600 mt-2">{t("This helps us remember you")}</p>
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Enter your name")}
            className="w-full px-6 py-5 text-xl text-center rounded-3xl border-2 border-indigo-200 focus:border-indigo-600 outline-none font-bold"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && setNameSubmitted(true)}
          />

          <button
            onClick={() => name.trim() && setNameSubmitted(true)}
            disabled={!name.trim() || isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl"
          >
            {t("Continue")}
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h3 className="text-2xl font-black text-indigo-700">
              {t("Hello")} {name}!
            </h3>
            <p className="text-gray-600 mt-2">{t("Now look at the camera to register your face")}</p>
          </div>

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

          <p className="text-center text-xl font-black text-indigo-700 min-h-[3rem]">{status || t("Look straight and stay still")}</p>

          <div className="flex gap-4">
            <button
              onClick={handleRegister}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl disabled:opacity-70"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={24} /> : <Camera size={24} />}
              {isProcessing ? t("Registering...") : t("Register Face")}
            </button>
            <button
              onClick={() => setNameSubmitted(false)}
              className="px-6 py-5 border-2 border-gray-300 rounded-3xl hover:bg-gray-50"
            >
              <X size={28} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FaceRegister;