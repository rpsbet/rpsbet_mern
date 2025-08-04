// helper/util/codeExtraction.js - Code analysis and information extraction utilities
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function extractRoomInfoFromCode(gameCode) {

  try {

    const systemPrompt = `You are an expert at analyzing React game code and extracting metadata. 

Your task is to analyze the provided React game code (which may be JSX or transpiled) and extract:
1. Game Title/Name - Look for the main title displayed in the game
2. Game Type/Theme - What kind of game is this?
3. Game Description - Brief description of how to play

IMPORTANT CONTEXT:
- Look for elements with id="game-title" or similar title indicators first
- The game title is usually the most prominent text element
- Look for Typography components with h1-h6 variants or similar title styling
- Pay attention to text that appears to be the main game name/title
- Look for emoji indicators (🎮🌆🎯🏆🚀⚡🌟💎🔥🎲) that often accompany game titles
- Common game title patterns: "NEON NEXUS", "POKER MASTER", "CRASH GAME", etc.

Return ONLY a valid JSON object with:
{
  "name": "extracted game title (3-50 characters)",
  "gameType": "type of game (e.g., poker, puzzle, racing, casino, card)",
  "description": "brief description of gameplay (20-300 characters)",
  "confidence": number between 0-1 indicating confidence in extraction
}

If you cannot find a clear game title, return null for name and set confidence to 0.`;

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Analyze this React game code and extract the game title and information:\n\n${gameCode.substring(0, 8000)}`
        }
      ]
    });

    let extractedData;
    try {
      const responseText = aiResponse.choices[0].message.content.trim();
      
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the entire response as JSON
        extractedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', aiResponse.choices[0].message.content);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('🤖 OpenAI extracted data:', extractedData);

    // Validate and process AI extraction
    let name = '';
    let confidence = 0;

    if (extractedData.name && extractedData.confidence >= 0.3) {
      // Clean the extracted name
      name = extractedData.name
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      confidence = extractedData.confidence;
      console.log('✅ AI EXTRACTION successful:', name, 'confidence:', confidence);
    } else {
      console.log('⚠️ AI extraction failed or low confidence, using fallback');
      
      // Simple fallback based on game type
      const gameType = extractedData.gameType || 'interactive';
      name = gameType.charAt(0).toUpperCase() + gameType.slice(1) + ' Master';
      confidence = 0.3;
    }

    // Generate ticker from name - much simpler approach
    let ticker = '';
    if (name && name !== 'Generated Game') {
      // Remove all non-letter characters and take first letters of words
      const letters = name
        .replace(/[^\p{L}\s]/gu, '') // Remove everything except letters and spaces
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('')
        .substring(0, 6);

      ticker = letters.length >= 2 ? letters : 'GAME';
    } else {
      ticker = 'GAME';
    }

    // Use AI-extracted description or create fallback
    let description = '';
    if (extractedData.description && extractedData.description.length > 20) {
      description = extractedData.description
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300);
    } else {
      // Fallback description
      description = name && name !== 'Generated Game'
        ? `Experience ${name} with exciting gameplay and multiplier rewards.`
        : 'An engaging game experience with exciting gameplay mechanics.';
    }

    // Use AI-detected theme or simple detection
    let gameTheme = extractedData.gameType || 'interactive game';
    
    // Add "game" suffix if not present
    if (!gameTheme.includes('game')) {
      gameTheme += ' game';
    }

    const result = {
      name,
      ticker,
      description,
      gameTheme,
      confidence
    };

    console.log('✅ Final AI extraction result:', result);
    return result;

  } catch (error) {
    console.error('❌ Error with OpenAI extraction:', error);
    
    // Fallback to basic regex extraction if OpenAI fails
    console.log('🔄 Falling back to basic regex extraction...');
    return fallbackRegexExtraction(gameCode);
  }
}

// Fallback function in case OpenAI fails
function fallbackRegexExtraction(gameCode) {
  console.log('🔍 Using fallback regex extraction');
  
  try {
    let name = '';
    let confidence = 0;

    // Simple pattern for game-title id
    const gameTitlePattern = /<Typography(?=\s)[^>]*\bid="game-title"[^>]*>\s*([\s\S]*?)\s*<\/Typography>/gi;
    const gameTitleMatch = gameTitlePattern.exec(gameCode);

    if (gameTitleMatch && gameTitleMatch[1]) {
      let rawTitle = gameTitleMatch[1];
      console.log('Raw title found:', JSON.stringify(rawTitle));

      // Clean the title
      let cleanTitle = rawTitle;
      const ternaryMatch = cleanTitle.match(/\{\s*isMobile\s*\?\s*["']([^"']+)["']\s*:\s*["']([^"']+)["']\s*\}/);
      if (ternaryMatch) {
        cleanTitle = ternaryMatch[2]; // Use the full name (second option)
      } else {
        const literalMatch = cleanTitle.match(/\{\s*["']([^"']+)["']\s*\}/);
        if (literalMatch) {
          cleanTitle = literalMatch[1];
        } else {
          cleanTitle = cleanTitle.replace(/\{[^}]*\}/g, '');
        }
      }

      if (cleanTitle && cleanTitle.length >= 3 && cleanTitle.length <= 200) {
        name = cleanTitle;
        confidence = 0.6;
        console.log('✅ REGEX title found:', name);
      }
    }

    // Generate ticker
    let ticker = '';
    if (name) {
      const letters = name
        .replace(/[^\p{L}\s]/gu, '')
        .split(/\s+/)
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase())
        .join('')
        .substring(0, 6);
      ticker = letters.length >= 2 ? letters : 'GAME';
    } else {
      name = 'Generated Game';
      ticker = 'GAME';
      confidence = 0.3;
    }

    // Simple description
    const description = name !== 'Generated Game'
      ? `Experience ${name} with exciting gameplay and multiplier rewards.`
      : 'An engaging game experience with exciting gameplay mechanics.';

    // Simple theme detection
    const lowerText = (name + ' ' + gameCode).toLowerCase();
    let gameTheme = 'interactive game';

    if (lowerText.includes('poker') || lowerText.includes('texas') || lowerText.includes('hold')) {
      gameTheme = 'poker game';
    } else if (lowerText.includes('card') || lowerText.includes('deck')) {
      gameTheme = 'card game';
    } else if (lowerText.includes('casino') || lowerText.includes('multiplier')) {
      gameTheme = 'casino game';
    }

    return {
      name,
      ticker,
      description,
      gameTheme,
      confidence
    };

  } catch (error) {
    console.error('❌ Fallback extraction also failed:', error);
    return {
      name: 'Generated Game',
      ticker: 'GAME',
      description: 'A fun and engaging game experience.',
      gameTheme: 'interactive game',
      confidence: 0.3
    };
  }
}

module.exports = {
  extractRoomInfoFromCode,
  fallbackRegexExtraction
};