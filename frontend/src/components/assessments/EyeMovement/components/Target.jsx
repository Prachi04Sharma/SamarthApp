import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

const Target = ({ phase, isRecording }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Center position in percentage

  useEffect(() => {
    if (!isRecording || !phase) return;

    let animationFrame;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      switch (phase) {
        case 'CALIBRATION':
          // Static center position
          setPosition({ x: 50, y: 50 });
          break;

        case 'SACCADIC_TEST':
          // Jump between positions every 1 second
          const positions = [
            { x: 20, y: 20 }, { x: 80, y: 20 },
            { x: 50, y: 50 },
            { x: 20, y: 80 }, { x: 80, y: 80 }
          ];
          const index = Math.floor(elapsed / 1000) % positions.length;
          setPosition(positions[index]);
          break;

        case 'PURSUIT_TEST':
          // Smooth circular movement
          const radius = 30;
          const centerX = 50;
          const centerY = 50;
          const angle = (elapsed / 2000) * Math.PI * 2;
          setPosition({
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          });
          break;

        case 'FIXATION_TEST':
          // Static center position
          setPosition({ x: 50, y: 50 });
          break;

        default:
          break;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [phase, isRecording]);

  if (!isRecording || !phase) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: { xs: 16, sm: 20 },
        height: { xs: 16, sm: 20 },
        borderRadius: '50%',
        backgroundColor: 'primary.main',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        transition: phase === 'SACCADIC_TEST' ? 'none' : 'all 0.1s linear',
        zIndex: 10
      }}
    />
  );
};

export default Target;