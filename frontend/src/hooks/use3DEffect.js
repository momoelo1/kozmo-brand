import { useEffect, useRef } from 'react';

const use3DEffect = (intensity = 15) => {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Check if device supports touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Disable 3D effect on touch devices for better performance
    if (isTouchDevice) {
      return;
    }

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / centerY * -intensity;
      const rotateY = (x - centerX) / centerX * intensity;
      
      // Apply 3D transform with hardware acceleration
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05) translateZ(0)`;
      card.style.transition = 'transform 0.1s ease-out';
      
      // Add subtle shadow effect based on rotation
      const shadowX = rotateY * 0.5;
      const shadowY = rotateX * 0.5;
      card.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.3), ${shadowX}px ${shadowY}px 20px rgba(0, 0, 0, 0.2)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0)';
      card.style.transition = 'transform 0.3s ease-out, box-shadow 0.3s ease-out';
      card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
    };

    const handleMouseEnter = () => {
      card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
    };

    // Add event listeners with passive option for better performance
    card.addEventListener('mousemove', handleMouseMove, { passive: true });
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [intensity]);

  return cardRef;
};

export default use3DEffect; 