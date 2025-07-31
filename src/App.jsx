import React, { useEffect, useState } from "react";

const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

export default function App() {
  const [city, setCity] = useState("Noida");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchWeather(city);
  }, []);

  async function fetchWeather(cityName) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
      );
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        alert("City not found!");
      }
    } catch (err) {
      console.error(err);
    }
  }

  const handleSearch = () => {
    if (city.trim() !== "") {
      fetchWeather(city);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#74ebd5] to-[#ACB6E5] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-xl p-8 w-full max-w-md border border-white/30 text-white transition-all duration-300">
        <h1 className="text-2xl font-bold text-center mb-4">Weather Forecast</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city"
            className="flex-grow px-4 py-2 rounded-lg bg-white/20 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            onClick={handleSearch}
            className="px-5 py-2 bg-white/30 hover:bg-white/50 rounded-lg font-semibold transition"
          >
            Search
          </button>
        </div>

        {data && (
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold">{data.name}, {data.sys.country}</h2>
            <p className="text-sm">{new Date().toLocaleString()}</p>
            <img
              src={`http://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`}
              alt="Weather icon"
              className="mx-auto w-24 h-24"
            />
            <p className="text-4xl font-bold">{Math.round(data.main.temp)}°C</p>
            <p className="capitalize text-lg">{data.weather[0].description}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-white/80">
              <div className="bg-white/10 rounded-xl p-2">Feels like: {Math.round(data.main.feels_like)}°C</div>
              <div className="bg-white/10 rounded-xl p-2">Humidity: {data.main.humidity}%</div>
              <div className="bg-white/10 rounded-xl p-2">Pressure: {data.main.pressure} hPa</div>
              <div className="bg-white/10 rounded-xl p-2">Wind: {data.wind.speed} m/s</div>
              <div className="bg-white/10 rounded-xl p-2">Sunrise: {new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</div>
              <div className="bg-white/10 rounded-xl p-2">Sunset: {new Date(data.sys.sunset * 1000).toLocaleTimeString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
