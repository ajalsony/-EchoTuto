import React, { useEffect, useRef, useState } from 'react';

interface StitchShaderBackgroundProps {
  className?: string;
  opacity?: number;
}

/**
 * StitchShaderBackground
 * 
 * High-performance WebGL fluid cyan ribbon shader with particle field
 * and obsidian vignette mask.
 * 
 * Built with safety and accessibility:
 * - Respects prefers-reduced-motion
 * - Auto-pauses when outside viewport (IntersectionObserver)
 * - Auto-cleans WebGL resources, listeners, and RAF loops
 * - Throttled resolution scale to prevent GPU strain
 * - Pure CSS gradient fallback when WebGL is unavailable
 * - pointer-events-none to prevent blocking interaction
 */
export const StitchShaderBackground: React.FC<StitchShaderBackgroundProps> = ({
  className = 'absolute inset-0 w-full h-[680px] pointer-events-none opacity-50 mix-blend-screen',
  opacity = 0.5,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', handleMotionChange);

    const canvas = canvasRef.current;
    if (!canvas || motionQuery.matches) {
      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    // 2. Initialize WebGL
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvas.getContext('webgl', { powerPreference: 'low-power' }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }

    if (!gl) {
      setHasWebGL(false);
      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    // 3. Shaders
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      void main() {
        vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        float t = u_time * 0.4;
        
        // Wave disturbance & fluid cyan ribbons
        float d = length(st);
        float wave1 = sin(st.x * 2.5 + t + sin(st.y * 3.0 + t * 0.5));
        float wave2 = cos(st.y * 2.8 - t * 0.8 + cos(st.x * 2.0));
        float ribbon = abs(wave1 * 0.5 + wave2 * 0.5 + st.y * 1.2);
        
        // Antigravity particles simulation
        float particle = 0.0;
        for(float i = 1.0; i <= 6.0; i++) {
          vec2 pos = vec2(sin(i * 1.7 + t * 0.3) * 0.9, fract(t * 0.15 + i * 0.23) * 2.2 - 1.1);
          float dist = length(st - pos);
          particle += 0.002 / (dist * dist + 0.002);
        }
        
        // Color synthesis: obsidian (#0A0B0D) and electric cyan (#00F0FF)
        vec3 baseColor = vec3(0.039, 0.043, 0.051); // #0A0B0D
        vec3 surfaceDeep = vec3(0.06, 0.08, 0.10);
        vec3 electricCyan = vec3(0.0, 0.941, 1.0);  // #00F0FF
        vec3 deepCyan = vec3(0.0, 0.35, 0.45);
        
        float glow = 0.08 / (ribbon + 0.12);
        vec3 col = mix(baseColor, surfaceDeep, st.y * 0.5 + 0.5);
        col += deepCyan * glow * 1.2;
        col += electricCyan * pow(glow, 2.0) * 0.7;
        col += electricCyan * particle * 0.4;
        
        // Optical obsidian vignette
        col *= clamp(1.4 - d * 0.65, 0.0, 1.0);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compileShader(type: number, src: string): WebGLShader | null {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setHasWebGL(false);
      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    const prog = gl.createProgram();
    if (!prog) {
      setHasWebGL(false);
      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setHasWebGL(false);
      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
      };
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    // Clamp DPR to max 1.5 to prevent high-DPI GPU exhaustion
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const syncSize = () => {
      if (!canvas || !gl) return;
      const w = Math.floor((canvas.clientWidth || 1280) * dpr);
      const h = Math.floor((canvas.clientHeight || 720) * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    syncSize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let isVisible = true;
    let animId: number = 0;

    const render = (time: number) => {
      if (!isVisible || !gl) return;
      if (uTime) gl.uniform1f(uTime, time * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    // 4. Viewport visibility intersection observer
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              animId = requestAnimationFrame(render);
            }
          } else {
            isVisible = false;
            cancelAnimationFrame(animId);
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(containerRef.current);
    }

    // Start animation loop
    animId = requestAnimationFrame(render);

    // 5. Teardown & cleanup
    return () => {
      cancelAnimationFrame(animId);
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('mousemove', handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();

      if (gl) {
        try {
          gl.deleteBuffer(buf);
          gl.deleteProgram(prog);
          gl.deleteShader(vs);
          gl.deleteShader(fs);
        } catch {
          // Context loss cleanup
        }
      }
    };
  }, []);

  // Static Accessible / Fallback Gradient if WebGL unavailable or reduced motion enabled
  if (!hasWebGL || reducedMotion) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className={className}
        style={{
          opacity,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 25%, rgba(0, 240, 255, 0.15) 0%, rgba(10, 11, 13, 0.8) 65%, #0A0B0D 100%)',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={className}
      style={{ opacity, display: 'block' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};
