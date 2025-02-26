import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const WaveformVisualizer = ({ audioData, height = 100 }) => {
  const canvasRef = React.useRef(null);
  const theme = useTheme();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = theme.palette.primary.main;
    
    const sliceWidth = width / audioData.length;
    let x = 0;

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let i = 0; i < audioData.length; i++) {
      const y = (audioData[i] / 255.0) * height;
      ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, [audioData, theme]);

  return (
    <canvas
      ref={canvasRef}
      height={height}
      width={400}
      style={{ width: '100%', height }}
    />
  );
};

export const PitchGraph = ({ data, labels }) => {
  const theme = useTheme();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Pitch Variation Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Frequency (Hz)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time (s)'
        }
      }
    }
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pitch',
        data,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light + '40',
        fill: true,
        tension: 0.4
      }
    ]
  };

  return <Line options={options} data={chartData} />;
};

export const EmotionTimeline = ({ emotionData }) => {
  const theme = useTheme();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Emotional Markers Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'Intensity'
        }
      }
    }
  };

  const chartData = {
    labels: emotionData.timestamps,
    datasets: [
      {
        label: 'Confidence',
        data: emotionData.confidence,
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light + '40',
        fill: true,
      },
      {
        label: 'Stress',
        data: emotionData.stress,
        borderColor: theme.palette.error.main,
        backgroundColor: theme.palette.error.light + '40',
        fill: true,
      },
      {
        label: 'Hesitation',
        data: emotionData.hesitation,
        borderColor: theme.palette.warning.main,
        backgroundColor: theme.palette.warning.light + '40',
        fill: true,
      }
    ]
  };

  return <Line options={options} data={chartData} />;
}; 