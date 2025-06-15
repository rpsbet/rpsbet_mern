// Frontend AI Service Hook
import { useCallback } from 'react';
import axios from '../util/Api';

export const useAIService = () => {
  const callAIService = useCallback(async (serviceType, data, options = {}) => {
    const { timeout = 30000, retries = 1 } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post('/game/ai-service', {
          serviceType,
          data,
          roomId: options.roomId,
          userId: options.userId
        }, { timeout });

        if (response.data.success) {
          return response.data.result;
        } else {
          throw new Error(response.data.error || 'AI service failed');
        }
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }, []);

  // Convenience methods for common AI services
  const generateText = useCallback((prompt, options = {}) => {
    return callAIService('text_generation', { prompt, ...options });
  }, [callAIService]);

  const analyzeText = useCallback((text, analysisType = 'sentiment') => {
    return callAIService('text_analysis', { text, analysisType });
  }, [callAIService]);

  const checkSimilarity = useCallback((items, comparisonType = 'semantic') => {
    return callAIService('similarity_check', { items, comparisonType });
  }, [callAIService]);

  const analyzeImage = useCallback((imageData, analysisType = 'description', context = '') => {
    return callAIService('image_analysis', { imageData, analysisType, context });
  }, [callAIService]);

  const generateQuiz = useCallback((topic, options = {}) => {
    return callAIService('quiz_generation', { topic, ...options });
  }, [callAIService]);

  const evaluateDrawing = useCallback((imageData, targetWord, criteria = ['accuracy', 'creativity']) => {
    return callAIService('drawing_evaluation', { imageData, targetWord, criteria });
  }, [callAIService]);

  const captureScreenshot = useCallback(async (element) => {
    try {
      // Use html2canvas to capture screenshot
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(element, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw new Error('Failed to capture screenshot');
    }
  }, []);

  return {
    callAIService,
    generateText,
    analyzeText,
    checkSimilarity,
    analyzeImage,
    generateQuiz,
    evaluateDrawing,
    captureScreenshot
  };
};
