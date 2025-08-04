import { evaluate } from 'mathjs';
import { PluginResult, MathResult, PluginExecutionContext } from '../types';

export class MathPlugin {
  
  /**
   * Check if the user message contains math-related intent
   */
  public shouldExecute(userMessage: string): boolean {
    const mathKeywords = [
      'calculate', 'compute', 'solve', 'math', 'equation', 'add', 'subtract', 
      'multiply', 'divide', 'plus', 'minus', 'times', 'equals', 'sum', 'total'
    ];
    
    // Check for math operators
    const hasOperators = /[+\-*/^%=()]/.test(userMessage);
    
    // Check for math keywords
    const messageWords = userMessage.toLowerCase().split(/\s+/);
    const hasKeywords = mathKeywords.some(keyword => 
      messageWords.some(word => word.includes(keyword))
    );
    
    // Check for number patterns
    const hasNumbers = /\d/.test(userMessage);
    
    return (hasOperators && hasNumbers) || (hasKeywords && hasNumbers);
  }

  /**
   * Extract mathematical expression from user message
   */
  private extractExpression(userMessage: string): string | null {
    // Pattern 1: Direct mathematical expressions (including ** for exponentiation)
    const directMath = userMessage.match(/([0-9+\-*/^().\s*]+(?:[+\-*/^*][0-9+\-*/^().\s*]*)*)/);
    if (directMath && directMath[1].trim().length > 1) {
      return directMath[1].trim();
    }

    // Pattern 2: "what is X + Y" format
    const whatIsMatch = userMessage.match(/what\s+is\s+([0-9+\-*/^().\s]+)/i);
    if (whatIsMatch) {
      return whatIsMatch[1].trim();
    }

    // Pattern 3: "calculate X + Y" format
    const calculateMatch = userMessage.match(/calculate\s+([0-9+\-*/^().\s]+)/i);
    if (calculateMatch) {
      return calculateMatch[1].trim();
    }

    // Pattern 4: "X plus Y equals" format
    const plusMatch = userMessage.match(/(\d+(?:\.\d+)?)\s+plus\s+(\d+(?:\.\d+)?)/i);
    if (plusMatch) {
      return `${plusMatch[1]} + ${plusMatch[2]}`;
    }

    // Pattern 5: "X times Y" format
    const timesMatch = userMessage.match(/(\d+(?:\.\d+)?)\s+times\s+(\d+(?:\.\d+)?)/i);
    if (timesMatch) {
      return `${timesMatch[1]} * ${timesMatch[2]}`;
    }

    // Pattern 6: "X minus Y" format
    const minusMatch = userMessage.match(/(\d+(?:\.\d+)?)\s+minus\s+(\d+(?:\.\d+)?)/i);
    if (minusMatch) {
      return `${minusMatch[1]} - ${minusMatch[2]}`;
    }

    return null;
  }

  /**
   * Execute math plugin
   */
  public async execute(context: PluginExecutionContext): Promise<PluginResult> {
    try {
      const expression = this.extractExpression(context.user_message);
      
      if (!expression) {
        return {
          plugin_name: 'math',
          result: {
            expression: 'unknown',
            result: 0,
            success: false,
            error: 'Could not extract mathematical expression from the message'
          } as MathResult,
          success: false,
          error: 'No valid mathematical expression found'
        };
      }

      // Clean the expression
      const cleanExpression = this.cleanExpression(expression);
      
      // Evaluate the expression
      const result = evaluate(cleanExpression);
      
      const mathResult: MathResult = {
        expression: cleanExpression,
        result: typeof result === 'number' ? result : parseFloat(result.toString()),
        success: true
      };

      return {
        plugin_name: 'math',
        result: mathResult,
        success: true
      };
      
    } catch (error) {
      console.error('Math plugin error:', error);
      
      return {
        plugin_name: 'math',
        result: {
          expression: 'error',
          result: 0,
          success: false
        } as MathResult,
        success: false,
        error: `Mathematical evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean mathematical expression for evaluation
   */
  private cleanExpression(expression: string): string {
    return expression
      .replace(/\s+/g, '') // Remove spaces
      .replace(/\*\*/g, '^') // Convert ** to ^ for exponentiation
      .replace(/[^\d+\-*/^().]/g, '') // Keep only math characters
      .replace(/x/gi, '*') // Replace 'x' with '*'
      .replace(/÷/g, '/'); // Replace division symbol
  }

  /**
   * Format math result for LLM consumption
   */
  public formatForLLM(mathResult: MathResult): string {
    if (!mathResult.success) {
      return `Mathematical calculation failed: ${mathResult.expression}`;
    }

    return `Mathematical calculation:
Expression: ${mathResult.expression}
Result: ${mathResult.result}`;
  }

  /**
   * Generate example math problems for testing
   */
  public getExamples(): string[] {
    return [
      'What is 2 + 2?',
      'Calculate 15 * 8',
      'Solve 100 / 4',
      '2 + 2 * 5',
      'What is 2**5?',
      'Calculate 3^4',
      'What is the square root of 16?',
      '5 plus 3 equals?',
      '10 minus 4',
      '6 times 7'
    ];
  }
}
