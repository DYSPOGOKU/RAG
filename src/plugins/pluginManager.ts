import { PluginResult, PluginExecutionContext } from '../types';
import { WeatherPlugin } from './weatherPlugin';
import { MathPlugin } from './mathPlugin';

export class PluginManager {
  private static instance: PluginManager;
  private weatherPlugin: WeatherPlugin;
  private mathPlugin: MathPlugin;

  private constructor() {
    this.weatherPlugin = new WeatherPlugin();
    this.mathPlugin = new MathPlugin();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Analyze user message and execute relevant plugins
   */
  public async executePlugins(context: PluginExecutionContext): Promise<PluginResult[]> {
    const results: PluginResult[] = [];

    try {
      // Check weather plugin
      if (this.weatherPlugin.shouldExecute(context.user_message)) {
        console.log('🌤️ Executing weather plugin...');
        const weatherResult = await this.weatherPlugin.execute(context);
        results.push(weatherResult);
      }

      // Check math plugin
      if (this.mathPlugin.shouldExecute(context.user_message)) {
        console.log('🔢 Executing math plugin...');
        const mathResult = await this.mathPlugin.execute(context);
        results.push(mathResult);
      }

      return results;
    } catch (error) {
      console.error('Plugin execution error:', error);
      return [];
    }
  }

  /**
   * Format plugin results for LLM consumption
   */
  public formatPluginResults(results: PluginResult[]): string {
    if (results.length === 0) {
      return '';
    }

    let formatted = '\\n\\n--- Plugin Results ---\\n';
    
    for (const result of results) {
      if (result.success) {
        if (result.plugin_name === 'weather') {
          formatted += this.weatherPlugin.formatForLLM(result.result);
        } else if (result.plugin_name === 'math') {
          formatted += this.mathPlugin.formatForLLM(result.result);
        }
        formatted += '\\n\\n';
      } else {
        formatted += `${result.plugin_name} plugin failed: ${result.error}\\n\\n`;
      }
    }

    return formatted;
  }

  /**
   * Get list of available plugins
   */
  public getAvailablePlugins(): string[] {
    return ['weather', 'math'];
  }

  /**
   * Get plugin capabilities description
   */
  public getPluginCapabilities(): string {
    return `Available plugins:
1. Weather Plugin: Provides current weather information for any location
   - Triggers on: weather, temperature, forecast, climate-related queries
   - Example: "What's the weather in London?"

2. Math Plugin: Performs mathematical calculations and evaluations
   - Triggers on: mathematical expressions, calculation requests
   - Example: "What is 2 + 2 * 5?"

These plugins will automatically activate when relevant queries are detected.`;
  }

  /**
   * Test all plugins
   */
  public async testPlugins(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    try {
      // Test weather plugin
      const weatherContext: PluginExecutionContext = {
        query: 'weather in New York',
        user_message: 'What is the weather in New York?',
        session_id: 'test'
      };
      const weatherResult = await this.weatherPlugin.execute(weatherContext);
      results.weather = weatherResult.success;

      // Test math plugin
      const mathContext: PluginExecutionContext = {
        query: 'calculate 2 + 2',
        user_message: 'What is 2 + 2?',
        session_id: 'test'
      };
      const mathResult = await this.mathPlugin.execute(mathContext);
      results.math = mathResult.success;

    } catch (error) {
      console.error('Plugin testing error:', error);
    }

    return results;
  }
}
