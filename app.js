// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAR_cihK_6g9TBEx2uWuCecX4VmHJgGYUA",
  authDomain: "iotfueltankmonitoring-cd519.firebaseapp.com",
  databaseURL: "https://iotfueltankmonitoring-cd519-default-rtdb.firebaseio.com",
  projectId: "iotfueltankmonitoring-cd519",
  storageBucket: "iotfueltankmonitoring-cd519.firebasestorage.app",
  messagingSenderId: "602758251389",
  appId: "1:602758251389:web:13a473b2ad68ac7d014214"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements
const fuelPercentEl = document.getElementById('fuelPercent');
const flowRateEl = document.getElementById('flowRate');
const theftEl = document.getElementById('theft'); 
const lastUpdateEl = document.getElementById('lastUpdate');
const gaugeFillEl = document.getElementById('gaugeFill');
const peakFlowEl = document.getElementById('peakFlow');

// Data history for charts
let flowRateHistory = [];
let fuelLevelHistory = [];
let peakFlowRate = 0;
const maxHistoryPoints = 60; // Store 60 data points (1 minute at 1s intervals)

// Initialize Chart
const historyCtx = document.getElementById('historyChart').getContext('2d');
const historyChart = new Chart(historyCtx, {
  type: 'line',
  data: {
    labels: Array(maxHistoryPoints).fill(''),
    datasets: [{
      label: 'Fuel Level %',
      data: [],
      borderColor: '#4361ee',
      backgroundColor: 'rgba(67, 97, 238, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 20
        }
      }
    }
  }
});

// Update gauge visualization
function updateGauge(percent) {
  const degrees = parseFloat(percent) * 1.8; // Convert percent to degrees (0-180)
  gaugeFillEl.style.transform = `rotate(${degrees/180}turn)`;
  
  // Change color based on level
  if (parseFloat(percent) < 20) {
    gaugeFillEl.style.background = 'linear-gradient(90deg, #f72585, #f8961e)';
  } else if (parseFloat(percent) < 50) {
    gaugeFillEl.style.background = 'linear-gradient(90deg, #f8961e, #4cc9f0)';
  } else {
    gaugeFillEl.style.background = 'linear-gradient(90deg, #4361ee, #4cc9f0)';
  }
}

// Update flow rate sparkline
function updateFlowRateSparkline(rate) {
  flowRateHistory.push(parseFloat(rate));
  if (flowRateHistory.length > maxHistoryPoints) {
    flowRateHistory.shift();
  }
  
  // Update peak flow rate
  if (parseFloat(rate) > peakFlowRate) {
    peakFlowRate = parseFloat(rate);
    peakFlowEl.textContent = `${peakFlowRate.toFixed(2)} L/min`;
  }
}

// Format time for last update display
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Listen for data changes from Firebase
database.ref('Tank').on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    const now = new Date();
    
    // Update DOM elements
    fuelPercentEl.textContent = `${parseFloat(data.fuelPercent).toFixed(2)}%`;
    flowRateEl.textContent = parseFloat(data.flowRate).toFixed(2);
    theftEl.textContent = data.theft ? "ATTENTION: Fuel Theft Detected!" : "No Theft Detected";
    theftEl.style.color = data.theft ? "var(--danger)" : "var(--success)"; // Apply color based on theft status
    lastUpdateEl.textContent = `Last update: ${formatTime(now)}`;
    lastUpdateEl.style.color = 'var(--dark)'; // Reset color on successful update
    
    // Update visualizations
    updateGauge(data.fuelPercent);
    updateFlowRateSparkline(data.flowRate);
    
    // Update history chart
    fuelLevelHistory.push(parseFloat(data.fuelPercent));
    if (fuelLevelHistory.length > maxHistoryPoints) {
      fuelLevelHistory.shift();
    }
    historyChart.data.datasets[0].data = fuelLevelHistory;
    historyChart.update();
  } else {
    console.warn('No data available in Firebase under /Tank.');
    lastUpdateEl.textContent = 'No data';
    lastUpdateEl.style.color = '#f72585';
  }
}, (error) => {
  console.error('Firebase read failed:', error);
  lastUpdateEl.textContent = 'Connection error';
  lastUpdateEl.style.color = '#f72585';
});

// Time range buttons functionality
document.querySelectorAll('.time-range button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('.time-range button.active').classList.remove('active');
    button.classList.add('active');
    // In a full implementation, this would update the chart time range
  });
});

