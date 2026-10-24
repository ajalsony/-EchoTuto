import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoiceURI: (uri: string) => void;
  speak: (text: string, onEnd?: () => void) => void;
  stop: () => void;
  replay: (text: string, onEnd?: () => void) => void;
  pause: () => void;
  resume: () => void;
  errorMessage: string | null;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  // 1. Detect browser support & populate available voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);

          // Select preferred voice if none selected
          setSelectedVoiceURI((current) => {
            if (current && available.some((v) => v.voiceURI === current)) {
              return current;
            }
            // Prefer natural English voices
            const preferred =
              available.find(
                (v) =>
                  v.lang.startsWith('en') &&
                  (v.name.includes('Google') ||
                    v.name.includes('Natural') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Daniel') ||
                    v.name.includes('Zira') ||
                    v.name.includes('David'))
              ) ||
              available.find((v) => v.lang.startsWith('en')) ||
              available[0];

            return preferred ? preferred.voiceURI : '';
          });
        }
      } catch (err) {
        console.warn('[EchoTutor Voice] Error loading voices:', err);
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI) || null;

  // 2. Stop ongoing speech immediately
  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }
    activeUtteranceRef.current = null;
    onEndCallbackRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  // 3. Speak given text using browser SpeechSynthesis
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setErrorMessage('Speech synthesis is not supported in this browser.');
        return;
      }

      if (!text || !text.trim()) return;

      // Always stop previous utterance before starting new speech
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }

      setErrorMessage(null);
      onEndCallbackRef.current = onEnd || null;

      try {
        const utterance = new SpeechSynthesisUtterance(text.trim());
        activeUtteranceRef.current = utterance;

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = 0.98; // Natural, clear interview pacing
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          activeUtteranceRef.current = null;
          if (onEndCallbackRef.current) {
            onEndCallbackRef.current();
            onEndCallbackRef.current = null;
          }
        };

        utterance.onerror = (e) => {
          // If cancelled explicitly, do not treat as an error
          if (e.error === 'canceled' || e.error === 'interrupted') {
            setIsSpeaking(false);
            setIsPaused(false);
            return;
          }
          console.warn('[EchoTutor Voice] Utterance error:', e.error);
          setIsSpeaking(false);
          setIsPaused(false);
          activeUtteranceRef.current = null;
        };

        utterance.onpause = () => {
          setIsPaused(true);
        };

        utterance.onresume = () => {
          setIsPaused(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Speech synthesis failure';
        setErrorMessage(msg);
        setIsSpeaking(false);
      }
    },
    [selectedVoice]
  );

  // 4. Replay from the beginning
  const replay = useCallback(
    (text: string, onEnd?: () => void) => {
      stop();
      speak(text, onEnd);
    },
    [stop, speak]
  );

  // 5. Pause & Resume
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoiceURI,
    selectedVoice,
    setSelectedVoiceURI,
    speak,
    stop,
    replay,
    pause,
    resume,
    errorMessage,
  };
}
