const apiKey = "849cbf61809e7d8fe21db589f3cabbe7"; // <-- ඔයාගේ API Key එක මෙතනට දාන්න

const searchBox = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const weatherBox = document.getElementById("weather-box");
const errorMsg = document.getElementById("error-msg");
const errorText = document.getElementById("error-text");
const loader = document.getElementById("loader");

// අද දිනය format කර ලබා ගැනීම
function getFormattedDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    return new Date().toLocaleDateString('en-US', options);
}

// නගරයේ නමින් Weather ලබා ගැනීම
async function fetchWeatherByCity(city) {
    if (!city) return;
    showLoader();

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${city}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=metric&q=${city}&appid=${apiKey}`;

    await getWeatherData(currentUrl, forecastUrl);
}

// GPS Coordinates (Lat, Lon) මගින් Weather ලබා ගැනීම
async function fetchWeatherByCoords(lat, lon) {
    showLoader();

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`;

    await getWeatherData(currentUrl, forecastUrl);
}

// API Requests දෙකම එකවර Fetch කිරීම
async function getWeatherData(currentUrl, forecastUrl) {
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);

        if (!currentRes.ok || !forecastRes.ok) {
            showError("City not found or API key not active yet!");
            return;
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        updateCurrentUI(currentData);
        updateForecastUI(forecastData);

        loader.style.display = "none";
        errorMsg.style.display = "none";
        weatherBox.style.display = "block";

    } catch (error) {
        showError("Network error. Please check your connection.");
        console.error(error);
    }
}

// Current Weather UI Update කිරීම
function updateCurrentUI(data) {
    document.getElementById("city").innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById("date").innerText = getFormattedDate();
    document.getElementById("temp").innerText = `${Math.round(data.main.temp)}°C`;
    document.getElementById("description").innerText = data.weather[0].description;
    document.getElementById("feels-like").innerText = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById("humidity").innerText = `${data.main.humidity}%`;
    document.getElementById("wind").innerText = `${Math.round(data.wind.speed * 3.6)} km/h`; // m/s to km/h

    const iconCode = data.weather[0].icon;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    // කාලගුණය අනුව Background theme එක මාරු කිරීම
    const weatherMain = data.weather[0].main.toLowerCase();
    document.body.className = "";
    if (weatherMain.includes("clear")) document.body.classList.add("clear");
    else if (weatherMain.includes("cloud")) document.body.classList.add("clouds");
    else if (weatherMain.includes("rain") || weatherMain.includes("drizzle")) document.body.classList.add("rain");
    else if (weatherMain.includes("snow")) document.body.classList.add("snow");
}

// 5-Day Forecast UI Update කිරීම
function updateForecastUI(data) {
    const forecastContainer = document.getElementById("forecast-container");
    forecastContainer.innerHTML = "";

    // API එකෙන් පැය 3න් 3ට data එන නිසා, දවසකට එක බැගින් (දවල් 12:00 data) පෙරා ගැනීම
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        const temp = Math.round(day.main.temp);
        const icon = day.weather[0].icon;

        const card = document.createElement("div");
        card.classList.add("forecast-item");
        card.innerHTML = `
            <p class="day">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon">
            <p class="f-temp">${temp}°C</p>
        `;
        forecastContainer.appendChild(card);
    });
}

function showLoader() {
    loader.style.display = "block";
    weatherBox.style.display = "none";
    errorMsg.style.display = "none";
}

function showError(message) {
    loader.style.display = "none";
    weatherBox.style.display = "none";
    errorText.innerText = message;
    errorMsg.style.display = "flex";
}

// Event Listeners
searchBtn.addEventListener("click", () => fetchWeatherByCity(searchBox.value.trim()));

searchBox.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fetchWeatherByCity(searchBox.value.trim());
});

// Current GPS Location Button Click
locationBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            () => {
                showError("Location access denied. Please enable location permissions.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});