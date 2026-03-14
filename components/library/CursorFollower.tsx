import { useEffect, useRef } from "react";

const BASE_SIZE = 96;

const getScale = (dx: number, dy: number) =>
  Math.min(Math.sqrt(dx * dx + dy * dy) / 400, 0.45);

const getAngle = (dx: number, dy: number) =>
  (Math.atan2(dy, dx) * 180) / Math.PI;

const CursorFollower = () => {
  const blobRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -300, y: -300 });
  const pos = useRef({ x: -300, y: -300 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.065;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.065;

      const dx = mouse.current.x - pos.current.x;
      const dy = mouse.current.y - pos.current.y;
      const scale = getScale(dx, dy);
      const angle = getAngle(dx, dy);

      if (blobRef.current) {
        // Fold width growth into scaleX to avoid layout reflow on every frame
        const scaleX = ((BASE_SIZE + scale * 150) / BASE_SIZE) * (1 + scale);
        blobRef.current.style.transform =
          `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) rotate(${angle}deg) scaleX(${scaleX}) scaleY(${1 - scale})`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      className="fixed top-0 left-0 rounded-full border-2 border-primary pointer-events-none z-999 will-change-transform"
      style={{ width: BASE_SIZE, height: BASE_SIZE }}
    />
  );
};

export default CursorFollower;
