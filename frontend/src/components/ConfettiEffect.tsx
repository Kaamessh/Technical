import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger?: boolean;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger = true }) => {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#f59e0b', '#10b981', '#ec4899'],
      });
    }
  }, [trigger]);

  return null;
};
