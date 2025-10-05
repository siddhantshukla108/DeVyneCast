import React, { useEffect, useRef, useState } from "react";
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "7533fe28015c7d326363a17236f38f90";

export default function Chatbot(){
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Yo, buddy 😏! DeVyneCast here — I can tell if it’s hotter outside… or just inside you." }
  ]);
  const [input, setInput] = useState("");
  const messagesRef = useRef(null);

  useEffect(() => {
    // scroll to bottom on messages change
    if(messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  function addMessage(text, sender){
    setMessages(prev => [...prev, { from: sender, text }]);
  }

  function extractCityFromMessage(message) {
    const cleanMsg = message.replace(/[.,!?]/g, '');
    const triggers = [
      'weather in',
      'how is weather in',
      'should i go to',
      'travel to',
      'visit',
      'what about',
      'how about',
      'in',
      'at',
      'to'
    ];
    const lowerMsg = cleanMsg.toLowerCase();
    for (const trigger of triggers) {
      if (lowerMsg.includes(trigger)) {
        const regex = new RegExp(`${trigger}\\s+([a-zA-Z\\s]+)`, 'i');
        const match = cleanMsg.match(regex);
        if (match && match[1]) {
          return match[1].replace(/\b(today|now|please|tonight|tomorrow)\b/gi, '').trim();
        }
      }
    }
    const capitalWords = cleanMsg.split(' ').filter(w => /^[A-Z][a-z]/.test(w));
    if (capitalWords.length > 0) return capitalWords.join(' ');
    const words = cleanMsg.split(' ');
    return words[words.length - 1];
  }

  function generateTravelRecommendation(weatherData) {
    const temp = weatherData.main.temp;
    const condition = weatherData.weather[0].main.toLowerCase();
    const city = weatherData.name;
    const humidity = weatherData.main.humidity;
    const windSpeed = weatherData.wind.speed;

    let recommendation = `In ${city}, it's currently ${temp}°C with ${condition}. `;

    if (temp > 30) {
      recommendation += "It's quite hot! Make sure to stay hydrated and wear light clothing if you go out. ";
    } else if (temp > 20) {
      recommendation += "The temperature is pleasant! It's a great time to be outdoors. ";
    } else if (temp > 10) {
      recommendation += "It's a bit cool. You might want to bring a light jacket. ";
    } else {
      recommendation += "It's quite cold! Make sure to bundle up if you go outside. ";
    }

    if (condition.includes("rain")) {
      recommendation += "Since it's raining, you might want to carry an umbrella or consider indoor activities. ";
    } else if (condition.includes("cloud")) {
      recommendation += "The clouds might make it feel a bit cooler than it actually is. ";
    } else if (condition.includes("clear")) {
      recommendation += "The clear skies make it a perfect day to be outside! ";
    } else if (condition.includes("snow")) {
      recommendation += "There's snow, so be careful if you're driving or walking outside. ";
    }

    if (windSpeed > 8) {
      recommendation += "It's quite windy, so you might want to secure loose items and be cautious if doing outdoor activities. ";
    }

    if (temp >= 15 && temp <= 28 && !condition.includes("rain") && !condition.includes("storm") && windSpeed < 8) {
      recommendation += "Overall, it's a great time to visit! Enjoy your time there!";
    } else if (condition.includes("rain") || condition.includes("storm")) {
      recommendation += "You might want to reconsider outdoor activities or plan for indoor alternatives.";
    } else if (temp < 5 || temp > 35) {
      recommendation += "The extreme temperatures might make outdoor activities uncomfortable.";
    } else {
      recommendation += "Conditions are fairly average - not perfect but still okay for most activities.";
    }

    return recommendation;
  }

  async function processMessage(message){
    const lowerMessage = message.toLowerCase();
    const city = extractCityFromMessage(message);

    // if it looks like a city request, try to fetch weather
    if (city) {
      try {
        const endpoint = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        const res = await fetch(endpoint);
        const data = await res.json();
        if (res.ok) {
          const recommendation = generateTravelRecommendation(data);
          addMessage(recommendation, 'bot');
        } else {
          addMessage(`Hmm… DeVyneCast can’t find weather info for "${city}". Check the spelling? 😏`, 'bot');
        }
      } catch (err) {
        addMessage("Yo buddy 😎! DeVyneCast is having trouble fetching weather right now. Try again later!", 'bot');
      }
      return;
    }

    // greetings / help / fallback
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      addMessage("Yo, buddy 😏! DeVyneCast here. Wanna see if it’s hotter outside… or just in your vibe?", 'bot');
    } else if (lowerMessage.includes('help')) {
      addMessage("DeVyneCast’s got the 411 on cities & weather! Ask me: 'Is Paris nice today?' or 'Can I hit the beach in Bali?'", 'bot');
    } else {
      addMessage("I’m your weather wingman 🌤️—DeVyneCast style! Drop a city and I’ll spill if it’s chill or thrill there!", 'bot');
    }
  }

  function handleSend(){
    const text = input.trim();
    if(!text) return;
    addMessage(text, 'user');
    setInput("");
    const typing = { from: 'bot', text: '...' , typing: true};
    setMessages(prev => [...prev, typing]);
    setTimeout(() => {
      // remove typing placeholder
      setMessages(prev => prev.filter(m => !m.typing));
      processMessage(text);
    }, 1400);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button id="chatbot-toggle" onClick={()=>setOpen(o=>!o)} className="chatbot-toggle w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center shadow-lg hover:scale-105 transition">
        💬
      </button>

      {open && (
        <div id="chatbot-window" className="chatbot-window mt-3 w-[320px] h-[420px] bg-glass-2 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="chat-header p-3 flex justify-between items-center border-b border-white/10">
            <h3 className="text-sm font-semibold">Weather Assistant</h3>
            <button id="close-chat" onClick={()=>setOpen(false)} className="close-chat">✕</button>
          </div>

          <div id="chat-messages" ref={messagesRef} className="chat-messages p-3 flex-1 overflow-y-auto space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.from === 'bot' ? 'bot-message self-start bg-white/10 text-white' : 'user-message self-end bg-blue-600 text-white'} px-3 py-2 rounded-lg max-w-[75%]`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input p-2 border-t border-white/10 flex items-center gap-2">
            <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') handleSend() }} placeholder="Type your message..." className="flex-1 px-3 py-2 rounded-full bg-white/10 text-white outline-none" />
            <button id="send-message" onClick={handleSend} className="px-3 py-2 rounded-full bg-blue-600">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
