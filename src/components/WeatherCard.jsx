import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import moment from "moment";

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

export default function WeatherCard() {
  const [city, setCity] = useState("");
  const [current, setCurrent] = useState({
    name: "Loading...",
    temp: "--",
    description: "--",
    icon: null, // default null (no warning now)
    other: "--",
    date: "--",
  });
  const [recent, setRecent] = useState([]);
  const [isLight, setIsLight] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // load saved theme & recent
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setIsLight(true);
      document.documentElement.classList.add("light-theme");
    }
    const rec = JSON.parse(localStorage.getItem("recent") || "[]");
    setRecent(rec);
    // initial default city
    weatherFn("Noida");
  }, []);

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  }, [isLight]);

  async function weatherFn(cityName) {
    if (!cityName) {
      alert("Please enter a city name.");
      return;
    }
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      if (res.ok) {
        showWeather(data);
        updateRecent(data.name);
        fetchForecast(data.coord.lat, data.coord.lon);
      } else {
        alert("City not found.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  }

  function showWeather(data) {
    setCurrent({
      name: data.name,
      temp: Math.round(data.main.temp) + "°C",
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
      other: `Humidity: ${data.main.humidity}% | Wind: ${data.wind.speed} m/s`,
      date: moment().format("MMMM Do YYYY, h:mm:ss a"),
    });
  }

  function updateRecent(cityName) {
    let list = JSON.parse(localStorage.getItem("recent") || "[]");
    list = [
      cityName,
      ...list.filter((c) => c.toLowerCase() !== cityName.toLowerCase()),
    ].slice(0, 6);
    localStorage.setItem("recent", JSON.stringify(list));
    setRecent(list);
  }

  async function getWeatherByLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );
          const data = await res.json();
          if (res.ok) {
            showWeather(data);
            updateRecent(data.name);
            fetchForecast(lat, lon);
          }
        } catch (err) {
          console.error(err);
          alert("Could not fetch location-based weather.");
        }
      },
      () => {
        alert("Permission denied or location unavailable.");
      }
    );
  }

  async function fetchForecast(lat, lon) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      if (res.ok) {
        const dailyTemps = {};
        data.list.forEach((item) => {
          const date = item.dt_txt.split(" ")[0];
          if (!dailyTemps[date]) dailyTemps[date] = [];
          dailyTemps[date].push(item.main.temp);
        });
        const labels = Object.keys(dailyTemps).slice(0, 7);
        const temps = labels.map((d) =>
          Math.round(
            dailyTemps[d].reduce((a, b) => a + b, 0) / dailyTemps[d].length
          )
        );
        renderChart(labels, temps);
      }
    } catch (err) {
      console.error("Forecast fetch error:", err);
    }
  }

  function renderChart(labels, temps) {
    const ctx = chartRef.current.getContext("2d");
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Avg Temp (°C)",
            data: temps,
            backgroundColor: "rgba(104,180,211,0.1)",
            borderColor: "#FFFFFF",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        scales: {
          x: { ticks: { color: isLight ? "#111" : "#fff" } },
          y: { ticks: { color: isLight ? "#111" : "#fff" } },
        },
        plugins: {
          legend: { labels: { color: isLight ? "#111" : "#fff" } },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  // render
  return (
    <div
      className={`relative w-[90%] max-w-[950px] flex justify-between p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex-wrap ${
        isLight ? "bg-white/80 text-black" : "bg-glass text-white"
      }`}
    >
      {/* Left Panel */}
      <div className="flex-1 p-4">
        {/* Weather Icon ABOVE temperature */}
        {current.icon && (
          <div className="flex justify-center mb-2">
            <img
              id="weather-icon"
              src={current.icon}
              alt="Weather icon"
              className="w-20 h-20"
            />
          </div>
        )}
        <div id="temperature" className="text-4xl font-bold mt-2">
          {current.temp}
        </div>
        <div id="city-name" className="text-lg font-semibold mt-2">
          {current.name}
        </div>
        <div id="date" className="text-sm opacity-90 mt-1">
          {current.date}
        </div>
        <div id="description" className="text-lg mt-2 capitalize">
          {current.description}
        </div>
        <div id="other-info" className="text-sm opacity-80 mt-1">
          {current.other}
        </div>
        <div className="mt-6" style={{ height: 200 }}>
          <canvas
            id="forecastChart"
            ref={chartRef}
            className="w-full h-full canvas-dark"
          ></canvas>
        </div>
      </div>

      {/* Right Panel */}
      <div
        className={`w-64 p-4 rounded-lg ${
          isLight ? "bg-white/70 text-black" : "bg-glass-2 text-white"
        }`}
      >
        <div className="toggle-section flex justify-end mb-3">
          <label className="switch inline-flex items-center cursor-pointer">
            <input
              id="theme-toggle"
              type="checkbox"
              checked={isLight}
              onChange={(e) => setIsLight(e.target.checked)}
              className="sr-only"
            />
            <span className="relative inline-block w-12 h-6 bg-gray-400 rounded-full transition-all">
              <span
                className={`absolute left-1 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isLight ? "transform translate-x-6" : ""
                }`}
              ></span>
            </span>
          </label>
          <span className="ml-3 text-sm">{isLight ? "Light" : "Dark"}</span>
        </div>

        <input
          id="search-box"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name"
          className={`w-full px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring-0 ${
            isLight ? "bg-white/50 text-black" : "bg-white/10 text-black/40"
          }`}
        />

        {/* Search Button */}
        <button
          onClick={() => weatherFn(city)}
          className={`w-full px-3 py-2 mb-2 rounded-md backdrop-blur-md transition-all 
          ${
            isLight
              ? "bg-white/40 text-black hover:bg-white/60 shadow-md"
              : "bg-white/10 text-white hover:bg-white/20 shadow-lg border border-white/20"
          }`}
        >
          🔍 Search
        </button>

        {/* Location Button */}
        <button
          onClick={getWeatherByLocation}
          className={`w-full px-3 py-2 rounded-md backdrop-blur-md transition-all 
          ${
            isLight
              ? "bg-white/40 text-black hover:bg-white/60 shadow-md"
              : "bg-white/10 text-white hover:bg-white/20 shadow-lg border border-white/20"
          }`}
        >
          📍 Use My Location
        </button>

        <div className="recent mt-3">
          <h4 className="font-semibold mb-2">Recent Searches</h4>
          <ul id="recent-list" className="space-y-1 text-sm">
            {recent.map((c, i) => (
              <li
                key={i}
                className="cursor-pointer text-gray-200 hover:underline"
                onClick={() => weatherFn(c)}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-center text-opacity-70 mt-4">
          Developed by Siddhant
        </div>
      </div>
    </div>
  );
}
