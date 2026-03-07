import { GoogleGenAI } from "@google/genai";
import type { ZoneId, LEDSettings, MediaItem } from '../types';
import { addMedia } from './mediaService';

// Lazy initialize Gemini AI to avoid errors when API key is not set
let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. AI code generation is unavailable.');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

const SYSTEM_INSTRUCTION = `
You are an expert frontend engineer specializing in Telly, a dual-screen smart TV device.
Your task is to generate single-file HTML/CSS/JS prototypes for specific "Zones" on the Telly device.

The Telly device has the following Zones:
- Zone A (Main Screen): 1920px width x 1080px height.
- Zone B (Full Bottom Screen): 1920px width x 360px height. Use Zone B when you want a unified bottom experience. Zone B replaces C+D+E+F when active.
- Zone C (Bottom Left Widget): 1280px width x 300px height.
- Zone D (Bottom Right Ad/Widget): 640px width x 300px height.
- Zone E (News Ticker): 1920px width x 60px height.
- Zone F (Combined C+D Area): 1920px width x 300px height. Use Zone F for a unified bottom widget area. Zone F replaces C+D but keeps E visible.

Constraints & Requirements:
1. **Strict Dimensions**: The content MUST fit exactly within the dimensions of the requested Zone. Use 'width: 100%; height: 100%;' and 'overflow: hidden' to prevent scrollbars unless intended.
2. **Styling**: Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) for styling. You can also add custom CSS in a <style> tag.
3. **Interactivity**: The code should be interactive.
4. **Communication**: The Telly system uses a global event bus. To send messages to other zones, use \`window.parent.postMessage({ type: 'TELLY_EVENT', payload: { ... } }, '*')\`. To receive messages, listen for \`message\` events.
5. **Output Format**: Return ONLY the raw HTML code (which includes <style> and <script> tags). Do not wrap it in markdown code blocks (like \`\`\`html). Just the raw string.
6. **Design System**: Telly's UI is modern, sleek, and often uses dark modes (black backgrounds, white text) to blend with the hardware bezel.

When the user asks for a feature, generate the complete HTML file content for the specified Zone.
`;

const ZONE_DIMENSIONS: Record<ZoneId, { width: number; height: number; description: string }> = {
  A: { width: 1920, height: 1080, description: 'Main Screen' },
  B: { width: 1920, height: 360, description: 'Full Bottom Screen' },
  C: { width: 1280, height: 300, description: 'Bottom Left Widget' },
  D: { width: 640, height: 300, description: 'Bottom Right Ad Block' },
  E: { width: 1920, height: 60, description: 'News Ticker' },
  F: { width: 1920, height: 300, description: 'Combined C+D Area' },
};

export async function generateZoneCode(zone: ZoneId, prompt: string, currentCode?: string): Promise<string> {
  const model = "gemini-2.5-flash"; // Fast model for rapid prototyping
  const dim = ZONE_DIMENSIONS[zone];

  const fullPrompt = `
    Target Zone: ${zone} (${dim.description})
    Dimensions: ${dim.width}px x ${dim.height}px
    User Request: ${prompt}

    ${currentCode ? `Current Code (for context/modification):\n${currentCode}` : ''}

    Generate the full HTML code for this zone.
  `;

  try {
    const client = getAI();
    const response = await client.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    let code = response.text || "";

    // Cleanup if the model still wraps in markdown
    code = code.replace(/```html/g, '').replace(/```/g, '').trim();

    return code;
  } catch (error) {
    console.error("Error generating code:", error);
    throw error;
  }
}

const LED_SYSTEM_INSTRUCTION = `
You are an expert at creating CSS animations for LED lighting effects.
The Telly device has backlit LEDs that create an ambient glow effect behind the TV.

Your task is to generate creative CSS animation values that can be used for the LED glow effect.
The animation should be smooth, visually appealing, and create an immersive ambient lighting experience.

Output format: Return ONLY a valid CSS animation shorthand value (e.g., "myAnimation 2s ease-in-out infinite").
Also include the @keyframes definition on a separate line prefixed with "KEYFRAMES:".

Example output:
glowPulse 3s ease-in-out infinite
KEYFRAMES: @keyframes glowPulse { 0%, 100% { opacity: 0.5; filter: blur(20px); } 50% { opacity: 1; filter: blur(40px); } }
`;

export async function generateLEDPattern(prompt: string, currentSettings: LEDSettings): Promise<{ animation: string; keyframes: string }> {
  const client = getAI();

  const fullPrompt = `
    Current LED settings:
    - Color: ${currentSettings.color}
    - Brightness: ${currentSettings.brightness}%
    - Speed preference: ${currentSettings.speed}/10

    User request: ${prompt}

    Generate a creative LED animation effect based on this request.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        systemInstruction: LED_SYSTEM_INSTRUCTION,
        temperature: 0.8,
      }
    });

    const text = response.text || "";
    const lines = text.trim().split('\n');

    let animation = lines[0]?.replace(/```/g, '').trim() || 'ledCustom 2s ease-in-out infinite';
    let keyframes = '';

    const keyframesLine = lines.find(l => l.startsWith('KEYFRAMES:'));
    if (keyframesLine) {
      keyframes = keyframesLine.replace('KEYFRAMES:', '').trim();
    }

    return { animation, keyframes };
  } catch (error) {
    console.error("Error generating LED pattern:", error);
    throw error;
  }
}

// Content Generation Types
export type ContentGenerationType = 'image' | 'video' | 'music';

export interface GeneratedContent {
  type: ContentGenerationType;
  url: string;
  prompt: string;
  source: string;
}

/**
 * Generate an image using Nano Banana 2 (Google's image generation model)
 * Falls back to placeholder if API unavailable
 */
export async function generateImage(prompt: string): Promise<MediaItem> {
  const client = getAI();

  try {
    // Using Gemini's image generation capability
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseModalities: ["image", "text"],
      }
    });

    // Extract image from response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/'));

    if (imagePart?.inlineData) {
      const { mimeType, data } = imagePart.inlineData;
      const dataUrl = `data:${mimeType};base64,${data}`;

      return addMedia({
        type: 'image',
        name: `Generated: ${prompt.substring(0, 30)}...`,
        url: dataUrl,
        generatedWith: 'nanobanana2',
        prompt,
      });
    }

    throw new Error('No image generated');
  } catch (error) {
    console.error("Error generating image:", error);
    // Return placeholder for demo purposes
    return addMedia({
      type: 'image',
      name: `Generated: ${prompt.substring(0, 30)}...`,
      url: `https://placehold.co/1920x1080/1e293b/white?text=${encodeURIComponent(prompt.substring(0, 20))}`,
      generatedWith: 'nanobanana2',
      prompt,
    });
  }
}

/**
 * Generate a video using Veo 3 (Google's video generation model)
 * Falls back to placeholder if API unavailable
 */
export async function generateVideo(prompt: string): Promise<MediaItem> {
  const client = getAI();

  try {
    // Veo 3 video generation (when available)
    // Note: This is the intended API structure - actual implementation
    // depends on Google's Veo 3 API availability
    const response = await client.models.generateContent({
      model: "veo-002",
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate a video: ${prompt}` }]
        }
      ],
      config: {
        responseModalities: ["video"],
      }
    });

    // Extract video from response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const videoPart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('video/'));

    if (videoPart?.inlineData) {
      const { mimeType, data } = videoPart.inlineData;
      const dataUrl = `data:${mimeType};base64,${data}`;

      return addMedia({
        type: 'video',
        name: `Generated: ${prompt.substring(0, 30)}...`,
        url: dataUrl,
        generatedWith: 'veo3',
        prompt,
      });
    }

    throw new Error('No video generated');
  } catch (error) {
    console.error("Error generating video:", error);
    // Return a message about Veo 3 availability
    return addMedia({
      type: 'video',
      name: `Veo 3: ${prompt.substring(0, 30)}...`,
      url: '', // Video would be generated when API is available
      generatedWith: 'veo3',
      prompt,
    });
  }
}

/**
 * Generate music/audio using MusicFX
 * Falls back to placeholder if API unavailable
 */
export async function generateMusic(prompt: string): Promise<MediaItem> {
  const client = getAI();

  try {
    // MusicFX audio generation (when available)
    // Note: This is the intended API structure - actual implementation
    // depends on Google's MusicFX API availability through Gemini
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate music audio for: ${prompt}` }]
        }
      ],
      config: {
        responseModalities: ["audio"],
      }
    });

    // Extract audio from response
    const parts = response.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('audio/'));

    if (audioPart?.inlineData) {
      const { mimeType, data } = audioPart.inlineData;
      const dataUrl = `data:${mimeType};base64,${data}`;

      return addMedia({
        type: 'audio',
        name: `Generated: ${prompt.substring(0, 30)}...`,
        url: dataUrl,
        generatedWith: 'musicfx',
        prompt,
      });
    }

    throw new Error('No audio generated');
  } catch (error) {
    console.error("Error generating music:", error);
    // Return placeholder for demo purposes
    return addMedia({
      type: 'audio',
      name: `MusicFX: ${prompt.substring(0, 30)}...`,
      url: '', // Audio would be generated when API is available
      generatedWith: 'musicfx',
      prompt,
    });
  }
}

/**
 * Detect content type from prompt
 * Returns the type of content the user seems to be requesting
 */
export function detectContentType(prompt: string): ContentGenerationType | 'code' {
  const lowerPrompt = prompt.toLowerCase();

  // Video keywords
  if (
    lowerPrompt.includes('video') ||
    lowerPrompt.includes('veo') ||
    lowerPrompt.includes('animation') ||
    lowerPrompt.includes('clip') ||
    lowerPrompt.includes('movie')
  ) {
    return 'video';
  }

  // Image keywords
  if (
    lowerPrompt.includes('image') ||
    lowerPrompt.includes('picture') ||
    lowerPrompt.includes('photo') ||
    lowerPrompt.includes('nano banana') ||
    lowerPrompt.includes('generate an image') ||
    lowerPrompt.includes('create an image')
  ) {
    return 'image';
  }

  // Music keywords
  if (
    lowerPrompt.includes('music') ||
    lowerPrompt.includes('audio') ||
    lowerPrompt.includes('sound') ||
    lowerPrompt.includes('musicfx') ||
    lowerPrompt.includes('song') ||
    lowerPrompt.includes('melody')
  ) {
    return 'music';
  }

  // Default to code generation
  return 'code';
}
