import { useState, useRef, useEffect, useCallback } from 'react';
import type { SpeechRecognitionState } from '../types';

// Browser Web Speech API type shims
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (text: string) => void;
  initialTranscript?: string;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  state: SpeechRecognitionState;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  errorMessage: string | null;
  startListening: (existingText?: string) => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  setTranscript: (text: string) => void;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [state, setState] = useState<SpeechRecognitionState>('ready');
  const [transcript, setTranscriptState] = useState<string>(options?.initialTranscript || '');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // References
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>(options?.initialTranscript || '');
  const finalizedSegmentsRef = useRef<string[]>([]);
  const onTranscriptChangeRef = useRef(options?.onTranscriptChange);

  // Audio level meter references (local Web Audio API only)
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    onTranscriptChangeRef.current = options?.onTranscriptChange;
  }, [options?.onTranscriptChange]);

  // 1. Detect browser Web Speech API support
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsSupported(false);
      return;
    }

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const hasRecognition = Boolean(
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition
    );

    setIsSupported(hasRecognition);
  }, []);

  // 2. Audio Meter Cleanup
  const cleanupAudioMeter = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignore
      }
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore
        }
      });
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // 3. Initialize Audio Meter for live reactive animation
  const initAudioMeter = useCallback(async () => {
    cleanupAudioMeter();
    if (!navigator?.mediaDevices?.getUserMedia) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      mediaStreamRef.current = stream;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtx) return;

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

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const pollLevel = () => {
        if (!analyserRef.current || !isListeningRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        const len = Math.min(dataArray.length, 64);
        for (let i = 0; i < len; i++) sum += dataArray[i];
        const avg = len > 0 ? sum / len : 0;
        const scaled = Math.min(1, Math.max(0, avg / 120));

        setAudioLevel(scaled);
        animationFrameRef.current = requestAnimationFrame(pollLevel);
      };

      animationFrameRef.current = requestAnimationFrame(pollLevel);
    } catch {
      // Audio meter is secondary; speech recognition can continue even if AudioContext fails
    }
  }, [cleanupAudioMeter]);

  // 4. Stop Listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    cleanupAudioMeter();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore already stopped error
      }
    }

    setInterimTranscript('');
    setState((prev) => (prev === 'listening' ? 'completed' : prev));
  }, [cleanupAudioMeter]);

  // 5. Start Listening
  const startListening = useCallback(
    async (existingText?: string) => {
      if (typeof window === 'undefined') return;

      const windowWithSpeech = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };

      const SpeechRec =
        windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

      if (!SpeechRec) {
        setState('error');
        setErrorMessage(
          'Web Speech Recognition is not supported by your browser. You can seamlessly type your answer in Silent Typed Mode.'
        );
        return;
      }

      // Stop any existing session
      stopListening();

      // Preserve existing text so candidate work is never lost
      const initial = existingText !== undefined ? existingText : transcript;
      baseTextRef.current = initial.trim() ? initial.trim() + ' ' : '';
      finalizedSegmentsRef.current = [];

      setErrorMessage(null);
      setInterimTranscript('');
      setState('listening');
      isListeningRef.current = true;

      // Start reactive audio meter
      initAudioMeter();

      try {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setState('listening');
          isListeningRef.current = true;
        };

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let interimText = '';
          const newFinals: string[] = [];

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const text = res[0]?.transcript?.trim() || '';
            if (res.isFinal) {
              if (text) newFinals.push(text);
            } else {
              interimText += (interimText ? ' ' : '') + text;
            }
          }

          if (newFinals.length > 0) {
            // Avoid repeating identical consecutive segments
            newFinals.forEach((seg) => {
              const last = finalizedSegmentsRef.current[finalizedSegmentsRef.current.length - 1];
              if (last !== seg) {
                finalizedSegmentsRef.current.push(seg);
              }
            });

            const updatedFull = (
              baseTextRef.current + finalizedSegmentsRef.current.join(' ')
            ).trim();
            setTranscriptState(updatedFull);
            if (onTranscriptChangeRef.current) {
              onTranscriptChangeRef.current(updatedFull);
            }
          }

          setInterimTranscript(interimText);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
          console.warn('[EchoTutor Speech-to-Text] Recognition error:', event.error);
          cleanupAudioMeter();

          if (event.error === 'no-speech') {
            // Treat no-speech as an informational completed state rather than fatal error
            setState('completed');
            setErrorMessage('No speech detected. You can speak again or type your answer.');
          } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setState('error');
            setErrorMessage(
              'Microphone permission was denied. Please allow microphone permissions or switch to Silent Typed Mode.'
            );
          } else if (event.error === 'network') {
            setState('error');
            setErrorMessage(
              'Speech recognition network error. Check your connection or type your answer.'
            );
          } else if (event.error === 'audio-capture') {
            setState('error');
            setErrorMessage('Audio capture failed. Ensure your microphone is properly connected.');
          } else {
            setState('error');
            setErrorMessage(`Speech recognition error: ${event.error}. You can type your answer.`);
          }
        };

        recognition.onend = () => {
          cleanupAudioMeter();
          setInterimTranscript('');
          if (isListeningRef.current) {
            // User was still listening, finish up
            isListeningRef.current = false;
            setState('completed');
          }
        };

        recognition.start();
      } catch (err: unknown) {
        cleanupAudioMeter();
        setState('error');
        const msg = err instanceof Error ? err.message : 'Failed to initialize speech recognition';
        setErrorMessage(msg);
      }
    },
    [transcript, stopListening, initAudioMeter, cleanupAudioMeter]
  );

  // 6. Reset Transcript
  const resetTranscript = useCallback(() => {
    stopListening();
    baseTextRef.current = '';
    finalizedSegmentsRef.current = [];
    setTranscriptState('');
    setInterimTranscript('');
    setState('ready');
    setErrorMessage(null);
    if (onTranscriptChangeRef.current) {
      onTranscriptChangeRef.current('');
    }
  }, [stopListening]);

  // 7. Manually Set Transcript (e.g. candidate typed changes)
  const setTranscript = useCallback((text: string) => {
    setTranscriptState(text);
    baseTextRef.current = text.trim() ? text.trim() + ' ' : '';
    finalizedSegmentsRef.current = [];
    if (onTranscriptChangeRef.current) {
      onTranscriptChangeRef.current(text);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isSupported,
    state,
    transcript,
    interimTranscript,
    audioLevel,
    errorMessage,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
