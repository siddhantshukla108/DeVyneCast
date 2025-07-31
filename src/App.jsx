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
    <div className="h-screen bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-lg p-8 w-96 text-center">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city name"
          className="w-full p-3 mb-4 rounded border focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Search
        </button>

        {data && (
          <div className="mt-6 animate-fade-in">
            <h2 className="text-2xl font-semibold">{data.name}</h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleString()}
            </p>
            <img
              src={`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
              alt="Weather icon"
              className="mx-auto w-20 h-20"
            />
            <p className="text-3xl font-bold">{Math.round(data.main.temp)}°C</p>
            <p className="text-lg capitalize">{data.weather[0].description}</p>
            <p className="text-sm text-red-500 mt-2">
              Wind Speed: {data.wind.speed} m/s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
