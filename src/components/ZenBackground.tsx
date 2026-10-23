import React, { useEffect, useRef, useState } from 'react';

interface ZenBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  opacity?: number;
  speed?: number;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_opacity;

out vec4 fragColor;

// Simplex-inspired 2D noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// 2-octave FBM for smooth, organic fluid motion
float fbm(vec2 p) {
  float f = 0.0;
  f += 0.65 * snoise(p);
  p *= 2.02;
  f += 0.35 * snoise(p);
  return f;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = st * 2.0 - 1.0;
  p.x *= u_resolution.x / u_resolution.y;

  // Very slow, soothing temporal flow
  float t = u_time * 0.12;

  // Domain warping for zen-like liquid atmosphere
  vec2 q = vec2(fbm(p + vec2(t * 0.3, t * 0.2)), fbm(p + vec2(-t * 0.2, t * 0.25)));
  vec2 r = vec2(fbm(p + 1.4 * q + vec2(1.7, 9.2) + 0.15 * t), fbm(p + 1.4 * q + vec2(8.3, 2.8) + 0.126 * t));
  float f = fbm(p + 1.8 * r);

  // Minimal Purple Palette:
  // Deep Aubergine: #100D1B -> (0.0627, 0.0510, 0.1059)
  // Muted Plum:     #211C30 -> (0.1294, 0.1098, 0.1882)
  // Soft Violet:    #9B87F5 -> (0.6078, 0.5294, 0.9608)
  // Lavender:       #B8A5FF -> (0.7216, 0.6471, 1.0000)
  vec3 cAubergine = vec3(0.0627, 0.0510, 0.1059);
  vec3 cPlum      = vec3(0.1294, 0.1098, 0.1882);
  vec3 cViolet    = vec3(0.6078, 0.5294, 0.9608);
  vec3 cLavender  = vec3(0.7216, 0.6471, 1.0000);

  // Smooth color blending with restrained violet highlights
  vec3 color = mix(cAubergine, cPlum, clamp(f * 1.5, 0.0, 1.0));
  color = mix(color, cViolet, clamp(length(q) * 0.45 - 0.1, 0.0, 0.6));
  color = mix(color, cLavender, clamp(pow(r.x, 2.0) * 0.35, 0.0, 0.4));

  // Central dark vignette to ensure foreground text has AAA contrast
  float distFromCenter = length(st - vec2(0.5, 0.5));
  float vignette = smoothstep(0.2, 0.85, distFromCenter);
  // Center is deepened toward Deep Aubergine
  color = mix(cAubergine, color, 0.35 + vignette * 0.65);

  fragColor = vec4(color, u_opacity);
}
`;

export const ZenBackground: React.FC<ZenBackgroundProps> = ({
  className = '',
  children,
  opacity = 0.5,
  speed = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Compile Shader helper
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('ZenBackground Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vertShader || !fragShader) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('ZenBackground Program link error:', gl.getProgramInfoLog(program));
      setWebglSupported(false);
      return;
    }

    // Geometry: Fullscreen Quad (two triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uOpacity = gl.getUniformLocation(program, 'u_opacity');

    let animationFrameId: number;
    let isVisible = true;
    let startTime = performance.now();

    // Cap DPR at 1.5 for desktop, 1.0 for mobile (<640px)
    const resize = () => {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const isMobile = window.innerWidth < 640;
      const maxDpr = isMobile ? 1.0 : 1.5;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

      const displayWidth = Math.floor(width * dpr);
      const displayHeight = Math.floor(height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Render loop
    const render = (currentTime: number) => {
      if (!isVisible) return;

      const elapsed = ((currentTime - startTime) / 1000) * speed;

      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uOpacity, opacity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    // Pause rendering when canvas is not visible or tab is hidden
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              animationFrameId = requestAnimationFrame(render);
            }
          } else {
            isVisible = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isVisible = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial trigger
    animationFrameId = requestAnimationFrame(render);

    // Full cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', resize);

      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, [reducedMotion, opacity, speed]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* WebGL2 Canvas or Static Gradient Fallback */}
      {webglSupported && !reducedMotion ? (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none -z-10"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_50%_25%,#211C30_0%,#161224_55%,#100D1B_100%)] opacity-80"
        />
      )}

      {/* Subtle vignette layer to protect foreground contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_center,rgba(16,13,27,0.7)_0%,rgba(16,13,27,0.35)_70%,rgba(16,13,27,0.9)_100%)]"
      />

      {children}
    </div>
  );
};
