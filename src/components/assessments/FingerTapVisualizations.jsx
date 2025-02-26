export const RhythmAnalysisChart = ({ data }) => {
  if (!data?.timestamps?.length || !data?.intervals?.length) {
    return <div>No rhythm data available</div>;
  }

  const chartData = {
    labels: data.timestamps.map(timestamp => 
      new Date(timestamp).toLocaleTimeString('en-US', { 
        minute: '2-digit', 
        second: '2-digit',
        fractionalSecondDigits: 3 
      })
    ),
    datasets: [
      {
        label: 'Tap Intervals',
        data: data.intervals,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Target Interval',
        data: Array(data.timestamps.length).fill(data.targetInterval),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderDash: [5, 5],
        tension: 0,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Tapping Rhythm Analysis'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Interval (ms)'
        },
        min: 0,
        suggestedMax: data.targetInterval * 2
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  };

  return (
    <div className="chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
}; 