import React, { useEffect, useRef } from 'react';

const RetroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frameId: number;
    let offset = 0;

    // Configuration - OPTIMIZED FOR LESS CLUTTER
    const SUN_RADIUS_RATIO = 0.2; // Slightly smaller sun (was 0.25)
    const HORIZON_RATIO = 0.6;
    const GRID_SPEED = 1.5; // Slower grid (was 2)
    
    // Star setup - Reduced count
    const stars: { x: number; y: number; size: number; alpha: number; blinkSpeed: number }[] = [];
    const numStars = 40; // Reduced from 100
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * HORIZON_RATIO),
        size: Math.random() * 2, // Smaller stars (was 2+1)
        alpha: Math.random(),
        blinkSpeed: 0.005 + Math.random() * 0.01 // Slower blinking
      });
    }

    // Particle setup
    const particles: { x: number; y: number; size: number; color: string; speed: number; life: number }[] = [];
    // More muted particle colors
    const particleColors = ['#34d399', '#818cf8', '#facc15']; 

    const spawnParticle = () => {
        // RADICALLY REDUCED SPAWN RATE
        // Only spawn if random is < 0.02 (2% chance per frame vs 90% previously)
        if (Math.random() > 0.02) return; 
        
        particles.push({
            x: Math.random() * width,
            y: height + 10,
            size: Math.random() * 3 + 1, // Smaller particles (1-4px)
            color: particleColors[Math.floor(Math.random() * particleColors.length)],
            speed: Math.random() * 1.5 + 0.5,
            life: 1.0
        });
    };

    const draw = () => {
      // 1. Background Fill - Darker, cleaner
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#020617'); // Slate 950
      gradient.addColorStop(HORIZON_RATIO, '#1e1b4b'); // Dark Indigo (Less purple/intense)
      gradient.addColorStop(1, '#020617'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const horizonY = height * HORIZON_RATIO;
      const sunRadius = Math.min(width, height) * SUN_RADIUS_RATIO;

      // 2. Retro Sun - Cleaner gradient
      const sunGradient = ctx.createLinearGradient(width/2, horizonY - sunRadius*2, width/2, horizonY);
      sunGradient.addColorStop(0, '#f59e0b'); // Amber
      sunGradient.addColorStop(1, '#db2777'); // Pink
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(width / 2, horizonY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sun Scanlines - Thicker, fewer cuts for cleaner look
      ctx.fillStyle = '#1e1b4b'; // Match horizon
      const numCuts = 8; // Reduced from 12
      for (let i = 0; i < numCuts; i++) {
          const yPos = horizonY - (i * (sunRadius / numCuts) * 1.2);
          const barHeight = i * 1.5 + 2; 
          if (yPos > horizonY - sunRadius*2) {
            ctx.fillRect(width/2 - sunRadius, yPos, sunRadius * 2, barHeight);
          }
      }

      // 3. Stars - Subtle
      ctx.fillStyle = '#94a3b8'; // Slate 400 (not pure white)
      stars.forEach((star) => {
        star.alpha += star.blinkSpeed;
        if (star.alpha > 0.8 || star.alpha < 0.2) star.blinkSpeed *= -1;
        ctx.globalAlpha = Math.max(0, Math.min(0.8, star.alpha)); // Max alpha 0.8
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // 4. 3D Grid Floor - Cleaner
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizonY, width, height - horizonY);
      ctx.clip(); 

      // Floor Background - Very dark
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      floorGrad.addColorStop(0, '#0f172a'); 
      floorGrad.addColorStop(1, '#020617'); 
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      const lineSpeed = offset % 60;
      
      // Vertical Lines - Subtle & Fewer
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // Very faint blue (was 0.4)
      // Removed dashed line for cleaner look
      const centerX = width / 2;
      const numVLines = 12; // Reduced from 20
      
      for (let i = -numVLines; i <= numVLines; i++) {
        ctx.beginPath();
        // Fan out logic
        ctx.moveTo(centerX + (i * 40), horizonY); 
        ctx.lineTo(centerX + (i * 400), height); 
        ctx.stroke();
      }

      // Horizontal Lines
      offset += GRID_SPEED;
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.25)'; // Faint pink (was 0.8)
      
      for (let z = 0; z < 16; z++) { // Reduced from 20
          const rawY = (z * 50 + lineSpeed) % 800; // Increased spacing
          const progress = rawY / 800; 
          const screenY = horizonY + (progress * progress * (height - horizonY));
          
          if (screenY > height) continue;

          ctx.beginPath();
          ctx.globalAlpha = progress * 0.5; // Even fainter near horizon
          ctx.moveTo(0, screenY);
          ctx.lineTo(width, screenY);
          ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      ctx.restore();

      // 5. Particles - Less frequent
      spawnParticle();
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.y -= p.speed;
          p.life -= 0.01; // Fade faster
          
          if (p.y < -50 || p.life <= 0) {
              particles.splice(i, 1);
              continue;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life * 0.6; // Max opacity 0.6
          ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      // 6. Horizon Line
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(width, horizonY);
      ctx.stroke();

      frameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-slate-950"
    />
  );
};

export default RetroBackground;