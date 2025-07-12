// Mock verification service for testing without API keys
export const verifyClothingImage = async (imagePath, userDescription, category) => {
  try {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple keyword matching logic
    const description = userDescription.toLowerCase();
    const categoryLower = category.toLowerCase();
    
    // Define clothing keywords for each category
    const categoryKeywords = {
      'tops': ['shirt', 't-shirt', 'blouse', 'sweater', 'top', 'tank', 'polo', 'sweatshirt'],
      'bottoms': ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'bottom'],
      'dresses': ['dress', 'gown', 'frock'],
      'outerwear': ['coat', 'jacket', 'blazer', 'hoodie', 'cardigan', 'sweater'],
      'shoes': ['shoes', 'boots', 'sneakers', 'sandals', 'heels', 'flats'],
      'accessories': ['hat', 'scarf', 'belt', 'bag', 'jewelry', 'watch', 'sunglasses']
    };
    
    // Check if description contains keywords for the selected category
    const keywords = categoryKeywords[categoryLower] || [];
    const hasMatchingKeywords = keywords.some(keyword => description.includes(keyword));
    
    // Generate a realistic confidence score
    const confidence = hasMatchingKeywords ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 40) + 20;
    
    // Determine if it matches
    const matches = hasMatchingKeywords && confidence > 50;
    
    // Generate realistic response
    const responses = {
      matches: {
        tops: "The image appears to show a top/shirt which matches your description.",
        bottoms: "The image appears to show pants/bottoms which matches your description.",
        dresses: "The image appears to show a dress which matches your description.",
        outerwear: "The image appears to show outerwear which matches your description.",
        shoes: "The image appears to show shoes which matches your description.",
        accessories: "The image appears to show accessories which matches your description."
      },
      noMatch: {
        tops: "The image doesn't appear to show a top/shirt as described.",
        bottoms: "The image doesn't appear to show pants/bottoms as described.",
        dresses: "The image doesn't appear to show a dress as described.",
        outerwear: "The image doesn't appear to show outerwear as described.",
        shoes: "The image doesn't appear to show shoes as described.",
        accessories: "The image doesn't appear to show accessories as described."
      }
    };
    
    const detectedItem = hasMatchingKeywords 
      ? `Detected ${categoryLower} item matching your description`
      : `Detected item that may not match your ${categoryLower} description`;
    
    const reasoning = matches 
      ? responses.matches[categoryLower] || "The image matches your description."
      : responses.noMatch[categoryLower] || "The image doesn't match your description.";
    
    return {
      success: true,
      matches: matches,
      detectedItem: detectedItem,
      confidence: confidence,
      reasoning: reasoning,
      categoryMatch: hasMatchingKeywords,
      isMock: true // Flag to indicate this is a mock response
    };
    
  } catch (error) {
    console.error('Mock verification error:', error);
    return {
      success: false,
      error: error.message,
      matches: false,
      detectedItem: 'Error in mock verification',
      confidence: 0,
      reasoning: 'Mock verification failed',
      categoryMatch: false,
      isMock: true
    };
  }
}; 