import { useState, useRef, useEffect, useCallback } from 'react';
import type { MicStatus } from '../types';

interface UseMicrophoneTestReturn {
  micStatus: MicStatus;
  audioLevel: number;
  errorMessage: string | null;
  isTesting: boolean;
  startTest: () => Promise<void>;
  stopTest: () => void;
  resetError: () => void;
}

export function useMicrophoneTest(): UseMicrophoneTestReturn {
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const cleanupAudio = useCallback(() => {
    // 1. Cancel RAF polling
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 2. Disconnect audio graph nodes
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      analyserRef.current = null;
    }

    // 3. Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore close errors
      }
      audioContextRef.current = null;
    }

    // 4. Release all active microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop errors
        }
      });
      mediaStreamRef.current = null;
    }

    setAudioLevel(0);
    setIsTesting(false);
  }, []);

  const stopTest = useCallback(() => {
    cleanupAudio();
    setMicStatus((prev) => (prev === 'active' || prev === 'requesting' ? 'idle' : prev));
  }, [cleanupAudio]);

  const resetError = useCallback(() => {
    setErrorMessage(null);
    setMicStatus('idle');
  }, []);

  const startTest = useCallback(async () => {
    // Check browser mediaDevices support
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setMicStatus('unsupported');
      setErrorMessage(
        'Your current browser or environment does not support audio input capture. You can practise with zero friction in Silent Typed Mode.'
      );
      return;
    }

    // Reset previous audio resources
    cleanupAudio();
    setMicStatus('requesting');
    setErrorMessage(null);

    try {
      // Prompt user for actual microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      mediaStreamRef.current = stream;

      // Initialize Web Audio API pipeline
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error('Web Audio API not supported in this browser.');
      }

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      // Processing frequency data for real acoustic levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        // Focus on speech frequency band
        const speechBandLength = Math.min(dataArray.length, 64);
        for (let i = 0; i < speechBandLength; i++) {
          sum += dataArray[i];
        }

        const avg = speechBandLength > 0 ? sum / speechBandLength : 0;
        // Non-linear perceptual scaling
        const scaled = Math.min(1, Math.max(0, avg / 120));

        setAudioLevel(scaled);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      setMicStatus('active');
      setIsTesting(true);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    } catch (err: unknown) {
      cleanupAudio();
      const errorObj = err as { name?: string; message?: string };
      const name = errorObj.name || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setMicStatus('denied');
        setErrorMessage(
          'Microphone permission was denied by browser settings. Please enable microphone permissions, or practice seamlessly in Silent Typed Mode.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setMicStatus('missing');
        setErrorMessage(
          'No microphone was detected on this device. Switch to Silent Typed Mode to practice without audio hardware.'
        );
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setMicStatus('error');
        setErrorMessage(
          'Microphone hardware is busy or claimed by another application. Free the microphone or switch to Silent Typed Mode.'
        );
      } else {
        setMicStatus('error');
        setErrorMessage(
          errorObj.message ||
            'Audio capture could not be initialized. You can continue practicing in Silent Typed Mode.'
        );
      }
    }
  }, [cleanupAudio]);

  // Clean up all hardware streams when component unmounts
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return {
    micStatus,
    audioLevel,
    errorMessage,
    isTesting,
    startTest,
    stopTest,
    resetError,
  };
}
