import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { join } from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const verifyClothingImage = async (imagePath, userDescription, category) => {
  try {

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return {
        success: false,
        error: 'API key not configured',
        matches: false,
        detectedItem: 'API key not configured',
        confidence: 0,
        reasoning: 'Gemini API key is not configured',
        categoryMatch: false
      };
    }

    const imageBuffer = readFileSync(imagePath);
    
    const base64Image = imageBuffer.toString('base64');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an expert clothing classifier. Analyze this clothing image and determine if it matches the user's description.

    USER INPUT:
    - Description: "${userDescription}"
    - Category: "${category}"

    TASK:
    1. Identify what clothing item is shown in the image
    2. Compare it with the user's description and category
    3. Determine if they match
    4. Provide a confidence score (0-100)

    CATEGORY MAPPING:
    - tops: shirts, t-shirts, blouses, sweaters, tank tops, polos
    - bottoms: pants, jeans, trousers, shorts, skirts, leggings
    - dresses: dresses, gowns, frocks
    - outerwear: coats, jackets, blazers, hoodies, cardigans
    - shoes: shoes, boots, sneakers, sandals, heels, flats
    - accessories: hats, scarves, belts, bags, jewelry, watches, sunglasses

    IMPORTANT: Be reasonable in your analysis. If the user describes a "blue cotton t-shirt" and the image shows a blue cotton t-shirt, it should match. Only mark as not matching if there's a clear discrepancy (e.g., user says "shirt" but image shows "pants").

    Respond ONLY with valid JSON in this exact format:
    {
      "matches": true,
      "detectedItem": "blue cotton t-shirt",
      "confidence": 95,
      "reasoning": "The image shows a blue cotton t-shirt which matches the user's description perfectly",
      "categoryMatch": true
    }
    `;
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      }
    };
    
    console.log('Sending request to Gemini API...');
    console.log('User Description:', userDescription);
    console.log('User Category:', category);
    
    let result, response, text;
    
    try {
      result = await model.generateContent([prompt, imagePart]);
      response = await result.response;
      text = response.text();
    } catch (imageError) {
      console.error('Image analysis failed, trying text-only approach:', imageError.message);
      
      const textPrompt = `
      Analyze this clothing description and determine if it matches the category.
      
      Description: "${userDescription}"
      Category: "${category}"
      
      Respond in JSON format:
      {
        "matches": true/false,
        "detectedItem": "description analysis",
        "confidence": 75,
        "reasoning": "explanation",
        "categoryMatch": true/false
      }
      `;
      
      result = await model.generateContent(textPrompt);
      response = await result.response;
      text = response.text();
    }
    
    console.log('Gemini API Response:', text);
    
    try {
      const parsedResponse = JSON.parse(text);
      
      if (typeof parsedResponse.matches !== 'boolean') {
        throw new Error('Invalid matches field');
      }
      if (typeof parsedResponse.confidence !== 'number') {
        throw new Error('Invalid confidence field');
      }
      
      return {
        success: true,
        ...parsedResponse
      };
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', text);
      
      const lowerText = text.toLowerCase();
      const matches = lowerText.includes('match') || lowerText.includes('correct') || lowerText.includes('yes');
      const confidence = lowerText.includes('high') ? 80 : lowerText.includes('low') ? 30 : 50;
      
      return {
        success: true,
        matches: matches,
        detectedItem: 'Response parsing failed - see reasoning',
        confidence: confidence,
        reasoning: `Raw API response: ${text}`,
        categoryMatch: lowerText.includes('category') && lowerText.includes('match')
      };
    }
    
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message,
      matches: false,
      detectedItem: 'Error processing image',
      confidence: 0,
      reasoning: `Failed to process image with AI: ${error.message}`,
      categoryMatch: false
    };
  }
};

export const getClothingCategory = (category) => {
  const categoryMap = {
    'tops': ['shirt', 't-shirt', 'blouse', 'sweater', 'jacket', 'top', 'tank top', 'polo'],
    'bottoms': ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'bottom'],
    'dresses': ['dress', 'gown', 'frock'],
    'outerwear': ['coat', 'jacket', 'blazer', 'sweater', 'hoodie', 'cardigan'],
    'shoes': ['shoes', 'boots', 'sneakers', 'sandals', 'heels', 'flats'],
    'accessories': ['hat', 'scarf', 'belt', 'bag', 'jewelry', 'watch', 'sunglasses']
  };
  
  return categoryMap[category] || [];
}; 