import { GoogleGenAI } from "@google/genai";
import type { ZoneId } from '../types';

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
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
