const apiKey = '7533fe28015c7d326363a17236f38f90';

document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('theme-toggle');
  const bodyEl = document.body;

  // === Load Saved Theme ===
  if (localStorage.getItem('theme') === 'light') {
    bodyEl.classList.add('light-theme');
    toggleSwitch.checked = true;
  }

  toggleSwitch.addEventListener('change', () => {
    const isLight = toggleSwitch.checked;
    bodyEl.classList.toggle('light-theme', isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // Load default city and recent search
  weatherFn('Noida');
  updateRecentSearches('');
});

// === Weather Fetch by City Name ===
async function weatherFn(cityName) {
  if (!cityName) {
    alert('Please enter a city name.');
    return;
  }

  const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (res.ok) {
      weatherShowFn(data);
      updateRecentSearches(cityName);
      fetchForecast(data.coord.lat, data.coord.lon);
    } else {
      alert('City not found.');
    }
  } catch (err) {
    console.error(err);
    alert('Network error. Please try again.');
  }
}

// === Display Weather Data ===
function weatherShowFn(data) {
  document.getElementById('city-name').textContent = data.name;
  document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById('description').textContent = data.weather[0].description;
  document.getElementById('date').textContent = moment().format('MMMM Do YYYY, h:mm:ss a');
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  document.getElementById('other-info').textContent = `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`;
}

// === Update & Render Recent Search List ===
function updateRecentSearches(city) {
  let list = JSON.parse(localStorage.getItem('recent') || '[]');

  if (city) {
    list = [city, ...list.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 6);
    localStorage.setItem('recent', JSON.stringify(list));
  }

  const ul = document.getElementById('recent-list');
  ul.innerHTML = '';
  list.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    li.onclick = () => weatherFn(c);
    ul.appendChild(li);
  });
}

// === Weather by Device Geolocation ===
async function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
      const data = await res.json();
      if (res.ok) {
        weatherShowFn(data);
        updateRecentSearches(data.name);
        fetchForecast(lat, lon);
      }
    } catch (err) {
      console.error(err);
      alert('Could not fetch location-based weather.');
    }
  }, (err) => {
    alert('Permission denied or location unavailable.');
  });
}

// === Fetch 5-Day Forecast ===
async function fetchForecast(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = await res.json();

    if (res.ok) {
      const dailyTemps = {};

      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyTemps[date]) dailyTemps[date] = [];
        dailyTemps[date].push(item.main.temp);
      });

      const labels = Object.keys(dailyTemps).slice(0, 7);
      const temps = labels.map(date => {
        const avg = dailyTemps[date].reduce((a, b) => a + b, 0) / dailyTemps[date].length;
        return Math.round(avg);
      });

      renderChart(labels, temps);
    }
  } catch (err) {
    console.error('Forecast fetch error:', err);
  }
}

// === Render Chart using Chart.js ===
let forecastChart;
function renderChart(labels, temps) {
  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (forecastChart) forecastChart.destroy();

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Avg Temp (°C)',
        data: temps,
        backgroundColor: 'rgba(104, 180, 211, 0.1)',
        borderColor: '#fff',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      scales: {
        x: { ticks: { color: '#fff' } },
        y: { ticks: { color: '#fff' } }
      },
      plugins: {
        legend: {
          labels: { color: '#fff' }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
