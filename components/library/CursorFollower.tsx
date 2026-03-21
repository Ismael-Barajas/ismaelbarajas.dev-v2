import { useEffect, useRef } from "react";
import gsap from "gsap";

const STIFFNESS = 0.14;
const DAMPING = 0.78;

const CursorFollower = () => {
  const blobRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.cursor = "none";

    const dot = dotRef.current!;
    const blob = blobRef.current!;

    gsap.set([dot, blob], { xPercent: -50, yPercent: -50 });
    gsap.ticker.lagSmoothing(0);

    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const setBlobX = gsap.quickSetter(blob, "x", "px");
    const setBlobY = gsap.quickSetter(blob, "y", "px");
    const setBlobScale = gsap.quickSetter(blob, "scale");
    const setBlobOpacity = gsap.quickSetter(blob, "opacity");

    const mouse = { x: -300, y: -300 };
    const pos = { x: -300, y: -300 };
    const vel = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      setDotX(e.clientX);
      setDotY(e.clientY);
    };

    const tick = () => {
      vel.x = vel.x * DAMPING + (mouse.x - pos.x) * STIFFNESS;
      vel.y = vel.y * DAMPING + (mouse.y - pos.y) * STIFFNESS;
      pos.x += vel.x;
      pos.y += vel.y;

      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);

      setBlobX(pos.x);
      setBlobY(pos.y);
      setBlobScale(1 + Math.min(speed / 18, 0.6));
      setBlobOpacity(Math.max(0.25, 1 - speed / 24));
    };

    window.addEventListener("mousemove", onMove);
    gsap.ticker.add(tick);

    return () => {
      document.documentElement.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 size-2 rounded-full bg-primary pointer-events-none z-1000 will-change-transform"
      />
      <div
        ref={blobRef}
        className="fixed top-0 left-0 size-24 rounded-full border-2 border-primary pointer-events-none z-999 will-change-transform"
      />
    </>
  );
};

export default CursorFollower;
