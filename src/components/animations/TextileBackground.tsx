import { useEffect, useRef, type MutableRefObject } from 'react';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';

/**
 * Procedural midnight-green satin with fine woven threads, rendered in WebGL.
 *
 * - A height field of slow, domain-warped folds is lit with a broad sheen and a
 *   tight specular lobe (satin), plus champagne-gold glints on the crests.
 * - Warp/weft threads follow the drape and catch the light.
 * - The light and a soft local swell follow the cursor.
 * - Values in `controller` are tweened by the intro timeline.
 */
export interface TextileController {
  /** 0 = flat midnight, 1 = full satin shading */
  reveal: number;
  /** thread visibility (amplitude) */
  threads: number;
  /** 0..1 horizontal sweep of the threads from the centre outwards */
  sweep: number;
  /** extra darkening, used while scrolling away */
  dim: number;
}

const VERT = `
attribute vec2 a;
varying vec2 vUv;
void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uReveal;
uniform float uThreads;
uniform float uSweep;
uniform float uDim;
varying vec2 vUv;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(3.1, 1.7); a *= 0.5; }
  return v;
}
float fold(vec2 p, float t){
  vec2 q = p + 0.8 * vec2(fbm(p * 0.62 + vec2(t * 0.9, -t * 0.6)), fbm(p * 0.62 + vec2(4.7 - t * 0.5, 2.3 + t * 0.8)));
  float h = sin(q.x * 1.45 + q.y * 2.25 + t * 1.7) * 0.56;
  h += sin(-q.x * 2.2 + q.y * 1.05 - t * 1.25 + 1.7) * 0.34;
  h += sin(q.x * 3.7 + q.y * 3.0 + t * 2.3 + 0.6) * 0.09;
  h += (fbm(q * 1.35 + t * 0.3) - 0.5) * 0.42;
  vec2 d = p - uMouse;
  h += exp(-dot(d, d) * 2.4) * 0.2;
  return h;
}

void main(){
  vec2 frag = vUv * uRes;
  vec2 p = (frag - 0.5 * uRes) / uRes.y * 2.4;
  float t = uTime * 0.05;
  float e = 0.014;
  float h = fold(p, t);
  float hx = fold(p + vec2(e, 0.0), t);
  float hy = fold(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3(-(hx - h) / e * 0.5, -(hy - h) / e * 0.5, 1.0));

  vec3 L = normalize(vec3(-0.45 + uMouse.x * 0.16, 0.55 + uMouse.y * 0.14, 0.78));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = smoothstep(-0.25, 1.0, dot(n, L));
  float nh = max(dot(n, H), 0.0);
  float sheen = pow(nh, 8.0);
  float spec = pow(nh, 54.0);

  vec3 deep = vec3(0.004, 0.030, 0.025);
  vec3 base = vec3(0.035, 0.176, 0.149);
  vec3 emer = vec3(0.090, 0.290, 0.235);
  vec3 teal = vec3(0.32, 0.58, 0.50);
  vec3 gold = vec3(0.79, 0.68, 0.48);

  vec3 satin = mix(deep, base, diff);
  satin = mix(satin, emer, sheen * 0.85);
  satin += teal * spec * 0.5;
  satin += gold * pow(spec, 2.4) * 0.3 * smoothstep(-0.1, 0.6, h);

  vec3 plain = base * 0.82;
  vec3 col = mix(plain, satin, uReveal);

  // Woven threads following the drape
  float warp = (p.y * 0.95 + p.x * 0.2 + h * 0.18) * 34.0;
  float weft = (p.x * 0.95 - p.y * 0.14 + h * 0.08) * 34.0;
  float tw = pow(abs(sin(warp * 3.14159)), 10.0);
  float tf = pow(abs(sin(weft * 3.14159)), 14.0);
  float lit = mix(0.75, 0.05 + sheen * 1.2 + spec * 2.4, uReveal);
  float sweep = 1.0 - smoothstep(uSweep * 1.25 - 0.3, uSweep * 1.25, abs(vUv.x - 0.5) * 2.0);
  col += vec3(0.86, 0.79, 0.64) * (tw * 0.045 + tf * 0.008) * lit * uThreads * sweep;

  vec2 uv = vUv - 0.5;
  col *= mix(1.0, 0.5, smoothstep(0.3, 0.95, length(uv * vec2(1.1, 1.0)) * 1.35));
  col *= 1.0 - uDim;
  col += (hash(frag + fract(uTime) * 91.7) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface Props {
  controller: MutableRefObject<TextileController>;
  className?: string;
}

export function TextileBackground({ controller, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      canvas.dataset.fallback = 'true';
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        console.error('[TextileBackground] shader compile error:', gl.getShaderInfoLog(s));
      }
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      canvas.dataset.fallback = 'true';
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes');
    const uTime = u('uTime');
    const uMouse = u('uMouse');
    const uReveal = u('uReveal');
    const uThreads = u('uThreads');
    const uSweep = u('uSweep');
    const uDim = u('uDim');

    const reduced = prefersReducedMotion();
    const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
    const scale = coarse ? 0.42 : 0.6;

    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(2, Math.round(rect.width * dpr * scale));
      height = Math.max(2, Math.round(rect.height * dpr * scale));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      needsFrame = true;
    };

    const mouse = { x: 0.35, y: 0.1, tx: 0.35, ty: 0.1 };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.height) return;
      mouse.tx = ((e.clientX - rect.left - rect.width / 2) / rect.height) * 2.4;
      mouse.ty = (-(e.clientY - rect.top - rect.height / 2) / rect.height) * 2.4;
    };

    let visible = true;
    let needsFrame = true;
    let raf = 0;
    let last = performance.now();
    let time = 12.0;
    let prevKey = '';

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      const c = controller.current;
      if (!reduced) {
        time += dt;
        mouse.x += (mouse.tx - mouse.x) * 0.035;
        mouse.y += (mouse.ty - mouse.y) * 0.035;
      } else {
        const key = `${c.reveal.toFixed(3)}${c.threads.toFixed(3)}${c.sweep.toFixed(3)}${c.dim.toFixed(3)}`;
        if (key === prevKey && !needsFrame) return;
        prevKey = key;
      }
      needsFrame = false;
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uReveal, c.reveal);
      gl.uniform1f(uThreads, c.threads);
      gl.uniform1f(uSweep, c.sweep);
      gl.uniform1f(uDim, c.dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    if (!reduced && !coarse) window.addEventListener('pointermove', onMove, { passive: true });
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      // Release GPU objects but keep the context alive: React may remount on the same canvas.
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, [controller]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
