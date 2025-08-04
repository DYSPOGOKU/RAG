import axios from 'axios';
import { PluginResult, WeatherData, PluginExecutionContext } from '../types';

export class WeatherPlugin {
  private apiKey: string | undefined;
  private baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
  }

  /**
   * Check if the user message contains weather-related intent
   */
  public shouldExecute(userMessage: string): boolean {
    const weatherKeywords = [
      'weather', 'temperature', 'forecast', 'climate', 'rain', 'sunny', 
      'cloudy', 'storm', 'humidity', 'wind', 'hot', 'cold', 'degrees'
    ];
    
    const messageWords = userMessage.toLowerCase().split(/\s+/);
    return weatherKeywords.some(keyword => 
      messageWords.some(word => word.includes(keyword))
    );
  }

  /**
   * Extract location from user message
   */
  private extractLocation(userMessage: string): string {
    // Simple pattern matching for location extraction
    const patterns = [
      /weather\s+in\s+([^?\s.!]+)/i,
      /temperature\s+in\s+([^?\s.!]+)/i,
      /forecast\s+for\s+([^?\s.!]+)/i,
      /how.*(?:hot|cold|warm)\s+(?:is\s+it\s+)?in\s+([^?\s.!]+)/i
    ];

    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Default fallback
    return 'New York';
  }

  /**
   * Execute weather plugin
   */
  public async execute(context: PluginExecutionContext): Promise<PluginResult> {
    try {
      const location = this.extractLocation(context.user_message);
      
      // If no API key, return mock data
      if (!this.apiKey) {
        console.log('🌤️ Using mock weather data (no API key provided)');
        return this.getMockWeatherData(location);
      }

      // Call actual weather API
      const weatherData = await this.fetchWeatherData(location);
      
      return {
        plugin_name: 'weather',
        result: weatherData,
        success: true
      };
      
    } catch (error) {
      console.error('Weather plugin error:', error);
      
      // Return mock data as fallback
      const location = this.extractLocation(context.user_message);
      return this.getMockWeatherData(location);
    }
  }

  /**
   * Fetch real weather data from API
   */
  private async fetchWeatherData(location: string): Promise<WeatherData> {
    const response = await axios.get(this.baseUrl, {
      params: {
        q: location,
        appid: this.apiKey,
        units: 'metric'
      }
    });

    const data = response.data;
    
    return {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 3.6) // Convert m/s to km/h
    };
  }

  /**
   * Return mock weather data for demo purposes
   */
  private getMockWeatherData(location: string): PluginResult {
    const mockData: WeatherData = {
      location: location,
      temperature: Math.floor(Math.random() * 30) + 5, // 5-35°C
      description: ['sunny', 'cloudy', 'partly cloudy', 'rainy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      wind_speed: Math.floor(Math.random() * 20) + 5 // 5-25 km/h
    };

    return {
      plugin_name: 'weather',
      result: mockData,
      success: true
    };
  }

  /**
   * Format weather data for LLM consumption
   */
  public formatForLLM(weatherData: WeatherData): string {
    return `Current weather in ${weatherData.location}:
- Temperature: ${weatherData.temperature}°C
- Conditions: ${weatherData.description}
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.wind_speed} km/h`;
  }
}
