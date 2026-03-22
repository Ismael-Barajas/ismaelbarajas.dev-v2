import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: 'forward' | 'reverse' | 'pingpong';
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 0.5, 0.2];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const vertex = `#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;

  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);

  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y));
    p.z -= 4.;
    S = p;
    d = p.y-T;

    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05);
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T));
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4;
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }

  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);

  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));

  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`;

const Plasma: React.FC<PlasmaProps> = ({
  color = '#ffffff',
  speed = 1,
  direction = 'forward',
  scale = 1,
  opacity = 1,
  mouseInteractive = true
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const programRef = useRef<InstanceType<typeof Program> | null>(null);

  // Update color uniform when it changes without re-mounting
  useEffect(() => {
    if (!programRef.current) return;
    const rgb = hexToRgb(color);
    const colorUniform = programRef.current.uniforms.uCustomColor.value as Float32Array;
    colorUniform[0] = rgb[0];
    colorUniform[1] = rgb[1];
    colorUniform[2] = rgb[2];
  }, [color]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderRaf = 0;
    let ro: ResizeObserver | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let gl: WebGL2RenderingContext | null = null;

    // Defer setup by one frame so any previous WebGL context (e.g. Dither/Three.js
    // with preserveDrawingBuffer) is fully released and layout is computed.
    const setupRaf = requestAnimationFrame(() => {
      if (!container) return;

      const useCustomColor = color ? 1.0 : 0.0;
      const customColorRgb = color ? hexToRgb(color) : ([1, 1, 1] as [number, number, number]);
      const directionMultiplier = direction === 'reverse' ? -1.0 : 1.0;

      const renderer = new Renderer({
        webgl: 2,
        alpha: true,
        antialias: false,
        dpr: Math.min(window.devicePixelRatio || 1, 2)
      });
      gl = renderer.gl as unknown as WebGL2RenderingContext;
      canvas = (renderer.gl as any).canvas as HTMLCanvasElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      container.appendChild(canvas);

      const geometry = new Triangle(renderer.gl);

      const program = new Program(renderer.gl, {
        vertex,
        fragment,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: new Float32Array([1, 1]) },
          uCustomColor: { value: new Float32Array(customColorRgb) },
          uUseCustomColor: { value: useCustomColor },
          uSpeed: { value: speed * 0.4 },
          uDirection: { value: directionMultiplier },
          uScale: { value: scale },
          uOpacity: { value: opacity },
          uMouse: { value: new Float32Array([0, 0]) },
          uMouseInteractive: { value: mouseInteractive ? 1.0 : 0.0 }
        }
      });

      programRef.current = program;

      const mesh = new Mesh(renderer.gl, { geometry, program });

      const handleMouseMove = (e: MouseEvent) => {
        if (!mouseInteractive) return;
        const rect = container.getBoundingClientRect();
        mousePos.current.x = e.clientX - rect.left;
        mousePos.current.y = e.clientY - rect.top;
        const mouseUniform = program.uniforms.uMouse.value as Float32Array;
        mouseUniform[0] = mousePos.current.x;
        mouseUniform[1] = mousePos.current.y;
      };

      const setSize = () => {
        const rect = container.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height);
        const res = program.uniforms.iResolution.value as Float32Array;
        res[0] = (renderer.gl as any).drawingBufferWidth;
        res[1] = (renderer.gl as any).drawingBufferHeight;
      };

      ro = new ResizeObserver(setSize);
      ro.observe(container);
      setSize();

      if (mouseInteractive) {
        container.addEventListener('mousemove', handleMouseMove);
      }

      const t0 = performance.now();
      const loop = (t: number) => {
        let timeValue = (t - t0) * 0.001;
        if (direction === 'pingpong') {
          const pingpongDuration = 10;
          const segmentTime = timeValue % pingpongDuration;
          const isForward = Math.floor(timeValue / pingpongDuration) % 2 === 0;
          const u = segmentTime / pingpongDuration;
          const smooth = u * u * (3 - 2 * u);
          const pingpongTime = isForward ? smooth * pingpongDuration : (1 - smooth) * pingpongDuration;
          (program.uniforms.uDirection as any).value = 1.0;
          (program.uniforms.iTime as any).value = pingpongTime;
        } else {
          (program.uniforms.iTime as any).value = timeValue;
        }
        renderer.render({ scene: mesh });
        renderRaf = requestAnimationFrame(loop);
      };
      renderRaf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(setupRaf);
      cancelAnimationFrame(renderRaf);
      ro?.disconnect();
      programRef.current = null;
      // Explicitly lose context to free GPU resources for the next WebGL consumer
      if (gl) {
        const ext = (gl as any).getExtension('WEBGL_lose_context');
        ext?.loseContext();
      }
      if (canvas) {
        try { container.removeChild(canvas); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, direction, scale, opacity, mouseInteractive]);

  return <div ref={containerRef} className="w-full h-full relative overflow-hidden" />;
};

export default Plasma;
