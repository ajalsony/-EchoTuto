import React, {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../lib/utils';

export type LiquidMetalVariant = 'chrome' | 'gold' | 'mercury' | 'oil';

export interface LiquidMetalProps {
  children?: ReactNode;
  className?: string;
  distortion?: number;
  maskText?: boolean;
  paused?: boolean;
  pointerInfluence?: boolean;
  speed?: number;
  variant?: LiquidMetalVariant;
  opacity?: number;
}

const DEFAULT_SPEED = 0.8;
const DEFAULT_DISTORTION = 0.9;
const MAX_DPR = 1.5;
const MS_PER_SECOND = 1000;
const MAX_FRAME_DELTA = 1 / 20;
const POINTER_EASE = 0.08;
const POINTER_RANGE = 2;
const POINTER_CENTER = 0.5;
const TEXT_SWEEP_SECONDS = 9;
const TEXT_SWEEP_RANGE = 100;
const TEXT_POINTER_SHIFT = 18;
const TEXT_BACKGROUND_SIZE = '300% 100%';
const HALF = 0.5;

const VARIANT_INDEX: Record<LiquidMetalVariant, number> = {
  chrome: 0,
  gold: 1,
  mercury: 2,
  oil: 3,
};

const FALLBACK_SURFACE: Record<LiquidMetalVariant, string> = {
  chrome:
    'conic-gradient(from 210deg at 50% 50%, #0b0d10, #3a424e, #8f9aa8, #2a3038, #6f7b8c, #14181d, #5a6472, #0b0d10)',
  gold:
    'conic-gradient(from 210deg at 50% 50%, #1c1505, #5a4216, #b3832a, #2a1c05, #8a5f16, #140d02, #6e4e13, #1c1505)',
  mercury:
    'conic-gradient(from 200deg at 50% 50%, #0a0d12, #2f3742, #7f8b99, #1b2028, #dbe4ee, #10141a, #4a5462, #0a0d12)',
  oil:
    'conic-gradient(from 190deg at 50% 50%, #120b22, #244677, #217d74, #6f8639, #915d22, #83315c, #3f257d, #120b22)',
};

const TEXT_SURFACE: Record<LiquidMetalVariant, string> = {
  chrome:
    'linear-gradient(100deg, #4a545f 0%, #e9eef5 16%, #8f9aa8 32%, #ffffff 46%, #6f7b8c 62%, #dfe6ef 78%, #3c454f 100%)',
  gold:
    'linear-gradient(100deg, #7a5410 0%, #f6dd8f 16%, #b3832a 32%, #fff6d0 46%, #8a5f16 62%, #edc862 78%, #6a460b 100%)',
  mercury:
    'linear-gradient(100deg, #55606d 0%, #dbe4ee 16%, #8f9aa8 32%, #ffffff 46%, #6b7684 62%, #cfd9e5 78%, #454f5b 100%)',
  oil:
    'linear-gradient(100deg, #3f7fd6 0%, #38d0c0 16%, #b9e05f 32%, #f2a03d 46%, #e0509b 62%, #6b3fd6 78%, #3f7fd6 100%)',
};

const VERTEX_SHADER = `#version 300 es
in vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform float uDistortion;
uniform float uVariant;
uniform vec2 uPointer;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float value = 0.0;
  float amplitude = 0.5;
  mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++){
    value += amplitude * noise(p);
    p = turn * p;
    amplitude *= 0.5;
  }
  return value;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (uv - 0.5) * aspect * 2.2;
  vec2 push = uPointer * 0.45;
  float warp = clamp(uDistortion, 0.0, 3.0);

  vec2 q = vec2(fbm(p + push), fbm(p + vec2(5.2, 1.3) - push));
  vec2 flow = p + warp * 2.8 * q;
  vec2 r = vec2(
    fbm(flow + vec2(1.7, 9.2) + uTime * 0.14),
    fbm(flow + vec2(8.3, 2.8) - uTime * 0.11)
  );

  vec2 base = p + warp * 2.4 * r;
  float eps = 0.007;
  float h = fbm(base);
  float hx = fbm(base + vec2(eps, 0.0));
  float hy = fbm(base + vec2(0.0, eps));
  vec3 n = normalize(vec3((h - hx) / eps * 0.045, (h - hy) / eps * 0.045, 1.0));

  vec3 view = normalize(vec3((uv - 0.5) * aspect, 1.0));
  vec3 refl = reflect(view, n);
  float f = clamp(refl.y * 0.5 + 0.5, 0.0, 1.0);
  float sideways = clamp(refl.x * 0.5 + 0.5, 0.0, 1.0);

  // Controlled dark titanium / graphite base
  vec3 lo = vec3(0.03, 0.04, 0.05);
  vec3 hi = vec3(0.72, 0.78, 0.85);
  vec3 tint = vec3(0.45, 0.55, 0.68);

  if (uVariant > 0.5 && uVariant < 1.5) {
    lo = vec3(0.12, 0.08, 0.02);
    hi = vec3(0.95, 0.82, 0.52);
    tint = vec3(0.75, 0.50, 0.12);
  } else if (uVariant > 1.5 && uVariant < 2.5) {
    // Pure reflective mercury / liquid chrome
    lo = vec3(0.04, 0.05, 0.06);
    hi = vec3(0.85, 0.90, 0.96);
    tint = vec3(0.38, 0.46, 0.58);
  } else if (uVariant > 2.5) {
    lo = vec3(0.04, 0.02, 0.10);
    hi = vec3(0.75, 0.85, 0.95);
    tint = vec3(0.28, 0.45, 0.80);
  }

  vec3 col = mix(lo, hi, smoothstep(0.05, 0.95, f));
  col = mix(col, tint, pow(sideways, 2.0) * 0.45);

  float spec = pow(max(dot(n, normalize(vec3(0.35, 0.75, 0.55))), 0.0), 38.0);
  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
  col += spec * 0.75 + fresnel * 0.18;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const STRIP = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

interface MetalController {
  destroy: () => void;
  setDistortion: (value: number) => void;
  setPointer: (x: number, y: number) => void;
  setRunning: (running: boolean) => void;
  setSpeed: (value: number) => void;
  setVariant: (value: LiquidMetalVariant) => void;
}

const compileShader = (
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

const resizeCanvas = (
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext
) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
};

const createMetalController = (
  canvas: HTMLCanvasElement,
  initialVariant: LiquidMetalVariant,
  initialSpeed: number,
  initialDistortion: number
): MetalController | null => {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!(vertex && fragment && program)) return null;

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, STRIP, gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uDistortion = gl.getUniformLocation(program, 'uDistortion');
  const uVariant = gl.getUniformLocation(program, 'uVariant');
  const uPointer = gl.getUniformLocation(program, 'uPointer');

  let variant = initialVariant;
  let speed = initialSpeed;
  let distortion = initialDistortion;
  let elapsed = 0;
  let lastFrameAt = performance.now();
  let frame = 0;
  let running = false;
  let destroyed = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const draw = () => {
    resizeCanvas(canvas, gl);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, elapsed);
    gl.uniform1f(uDistortion, distortion);
    gl.uniform1f(uVariant, VARIANT_INDEX[variant]);
    gl.uniform2f(uPointer, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const tick = () => {
    if (destroyed) return;
    const now = performance.now();
    const delta = Math.min((now - lastFrameAt) / MS_PER_SECOND, MAX_FRAME_DELTA);
    lastFrameAt = now;
    elapsed += delta * speed;
    pointerX += (targetX - pointerX) * POINTER_EASE;
    pointerY += (targetY - pointerY) * POINTER_EASE;
    draw();
    frame = requestAnimationFrame(tick);
  };

  draw();

  return {
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(frame);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
    setDistortion: (value: number) => {
      distortion = value;
    },
    setPointer: (x: number, y: number) => {
      targetX = x;
      targetY = y;
    },
    setRunning: (next: boolean) => {
      if (destroyed || next === running) return;
      running = next;
      if (running) {
        lastFrameAt = performance.now();
        frame = requestAnimationFrame(tick);
        return;
      }
      cancelAnimationFrame(frame);
      draw();
    },
    setSpeed: (value: number) => {
      speed = value;
    },
    setVariant: (value: LiquidMetalVariant) => {
      variant = value;
    },
  };
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const listener = () => setReduced(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return reduced;
}

export const LiquidMetal: React.FC<LiquidMetalProps> = ({
  children,
  className,
  distortion = DEFAULT_DISTORTION,
  maskText = false,
  paused = false,
  pointerInfluence = true,
  speed = DEFAULT_SPEED,
  variant = 'mercury',
  opacity = 0.35,
}) => {
  const shouldReduceMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<MetalController | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [isSupported, setIsSupported] = useState(true);
  const [isInView, setIsInView] = useState(true);

  const usesShader = !(maskText || shouldReduceMotion) && isSupported;
  const isPlaying = !(paused || shouldReduceMotion) && isInView;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        setIsInView(entry.isIntersecting);
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!usesShader) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = createMetalController(canvas, variant, speed, distortion);
    if (!controller) {
      setIsSupported(false);
      return;
    }
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [usesShader]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    controller.setVariant(variant);
    controller.setSpeed(speed);
    controller.setDistortion(distortion);
  }, [distortion, speed, variant]);

  useEffect(() => {
    controllerRef.current?.setRunning(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!(wrapper && pointerInfluence) || shouldReduceMotion) return;
    const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!hoverQuery.matches) return;

    const handleMove = (event: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - POINTER_CENTER) * POINTER_RANGE;
      const y = (POINTER_CENTER - (event.clientY - rect.top) / rect.height) * POINTER_RANGE;
      pointerRef.current = { x, y };
      controllerRef.current?.setPointer(x, y);
    };
    const handleLeave = () => {
      pointerRef.current = { x: 0, y: 0 };
      controllerRef.current?.setPointer(0, 0);
    };

    wrapper.addEventListener('pointermove', handleMove);
    wrapper.addEventListener('pointerleave', handleLeave);
    return () => {
      wrapper.removeEventListener('pointermove', handleMove);
      wrapper.removeEventListener('pointerleave', handleLeave);
    };
  }, [pointerInfluence, shouldReduceMotion]);

  useEffect(() => {
    const node = textRef.current;
    if (!(maskText && node) || shouldReduceMotion || paused || !isInView) return;
    let frame = 0;
    const startedAt = performance.now();
    const step = () => {
      const seconds = ((performance.now() - startedAt) / MS_PER_SECOND) * Math.max(speed, 0);
      const cycle = (seconds / TEXT_SWEEP_SECONDS) % 1;
      const offset = pointerInfluence ? pointerRef.current.x * TEXT_POINTER_SHIFT : 0;
      node.style.backgroundPosition = `${cycle * TEXT_SWEEP_RANGE + offset}% 50%`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [isInView, maskText, paused, pointerInfluence, shouldReduceMotion, speed]);

  if (maskText) {
    const textStyle: CSSProperties = {
      backgroundClip: 'text',
      backgroundImage: TEXT_SURFACE[variant],
      backgroundPosition: `${TEXT_SWEEP_RANGE * HALF}% 50%`,
      backgroundSize: TEXT_BACKGROUND_SIZE,
      color: 'transparent',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    };

    return (
      <span
        className={cn('inline-block', className)}
        ref={(node) => {
          wrapperRef.current = node;
        }}
      >
        <span ref={textRef} style={textStyle}>
          {children}
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn('relative isolate overflow-hidden', className)}
      ref={(node) => {
        wrapperRef.current = node;
      }}
    >
      {usesShader ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{ opacity }}
        >
          <canvas className="h-full w-full" ref={canvasRef} />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundImage: FALLBACK_SURFACE[variant], opacity }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default LiquidMetal;
