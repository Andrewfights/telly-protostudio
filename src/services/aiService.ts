import { GoogleGenAI } from "@google/genai";
import type { ZoneId, LEDSettings, MediaItem } from '../types';
import { addMedia } from './mediaService';

// Storage keys
const API_KEY_STORAGE_KEY = 'telly-gemini-api-key';
const STORAGE_MODE_KEY = 'telly-api-key-storage-mode';

// Storage modes
export type ApiKeyStorageMode = 'session' | 'persistent';

// Lazy initialize Gemini AI to avoid errors when API key is not set
let ai: GoogleGenAI | null = null;
let currentApiKey: string | null = null;

/**
 * Get the current storage mode preference
 * Defaults to 'session' for better security
 */
export function getStorageMode(): ApiKeyStorageMode {
  return (localStorage.getItem(STORAGE_MODE_KEY) as ApiKeyStorageMode) || 'session';
}

/**
 * Set storage mode preference
 */
export function setStorageMode(mode: ApiKeyStorageMode): void {
  localStorage.setItem(STORAGE_MODE_KEY, mode);

  // If switching to session mode, migrate key from localStorage to sessionStorage
  if (mode === 'session') {
    const persistentKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (persistentKey) {
      sessionStorage.setItem(API_KEY_STORAGE_KEY, persistentKey);
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }
  // If switching to persistent, migrate from sessionStorage to localStorage
  else if (mode === 'persistent') {
    const sessionKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
    if (sessionKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, sessionKey);
      sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }
}

/**
 * Get API key from storage (session or persistent based on mode)
 * Priority: sessionStorage -> localStorage -> env variable
 */
export function getStoredApiKey(): string | null {
  // Check sessionStorage first (most secure, per-session)
  const sessionKey = sessionStorage.getItem(API_KEY_STORAGE_KEY);
  if (sessionKey) {
    return sessionKey;
  }

  // Check localStorage (persistent across sessions)
  const persistentKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (persistentKey) {
    return persistentKey;
  }

  // No fallback to env variable - users must provide their own key
  return null;
}

/**
 * Save API key using the current storage mode
 */
export function saveApiKey(apiKey: string, mode?: ApiKeyStorageMode): void {
  const storageMode = mode || getStorageMode();

  // Clear from both storages first
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);

  // Save to appropriate storage
  if (storageMode === 'session') {
    sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } else {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  }

  // Update mode preference
  setStorageMode(storageMode);

  // Reset AI instance to use new key
  ai = null;
  currentApiKey = null;
}

/**
 * Remove API key from all storages
 */
export function clearApiKey(): void {
  sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  ai = null;
  currentApiKey = null;
}

/**
 * Check if API key is configured
 */
export function hasApiKey(): boolean {
  return !!getStoredApiKey();
}

function getAI(): GoogleGenAI {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Go to Settings to add your API key.');
  }

  // Reinitialize if key changed
  if (!ai || currentApiKey !== apiKey) {
    ai = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
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

**CRITICAL - REMOTE CONTROL SUPPORT (MANDATORY)**:
All interactive content MUST be fully controllable via D-pad remote control. Include this in EVERY app/game/experience:

1. **Keyboard Event Handling**: Always add this remote control handler:
\`\`\`javascript
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': /* handle up navigation */ break;
    case 'ArrowDown': /* handle down navigation */ break;
    case 'ArrowLeft': /* handle left navigation */ break;
    case 'ArrowRight': /* handle right navigation */ break;
    case 'Enter': case ' ': /* handle select/action */ break;
    case 'Escape': case 'Backspace': /* handle back/cancel */ break;
  }
  e.preventDefault();
});
\`\`\`

2. **Focus Management**:
   - Track focused element index
   - Show visible focus indicator (cyan border: border-2 border-cyan-500)
   - Support wrapping navigation (last item -> first item)

3. **Visual Focus States**:
   - Focused: cyan border + slight scale (transform: scale(1.02))
   - Selected: purple/indigo background
   - Minimum button size: 48px height for TV

4. **PostMessage for Parent Communication**:
   - Listen for: window.addEventListener('message', (e) => { if(e.data.type === 'TELLY_REMOTE_KEY') handleKey(e.data.key); })
   - This allows the parent frame to forward remote events

When the user asks for a feature, generate the complete HTML file content for the specified Zone.
`;

// Analyze prompt to determine if clarification is needed
const ANALYZE_PROMPT_INSTRUCTION = `
You are an AI assistant helping users build TV prototypes.
Analyze the user's request and determine if you need clarification before building.

Respond in JSON format:
{
  "needsClarification": boolean,
  "questions": ["question1", "question2"], // if clarification needed
  "thinking": ["thought1", "thought2", "thought3"], // your reasoning steps
  "plan": ["step1", "step2", "step3"], // implementation plan if clear enough
  "confidence": number // 0-100
}

Ask clarification questions for:
- Ambiguous features ("make it cool" - what does cool mean?)
- Missing game mechanics (game without rules specified)
- Unclear data sources (weather app - which location?)
- Design preferences when multiple valid options exist

Do NOT ask for clarification when:
- Request is clear and specific
- Standard implementation is obvious
- Technical details you can decide as the expert
`;

export interface PromptAnalysis {
  needsClarification: boolean;
  questions: string[];
  thinking: string[];
  plan: string[];
  confidence: number;
}

export interface GenerationProgress {
  phase: 'analyzing' | 'planning' | 'generating' | 'complete';
  thinking: string[];
  currentStep: string;
  progress: number;
}

/**
 * Analyze a prompt to determine if clarification is needed
 */
export async function analyzePrompt(prompt: string, zone: ZoneId): Promise<PromptAnalysis> {
  const client = getAI();
  const dim = ZONE_DIMENSIONS[zone];

  const fullPrompt = `
User wants to build for Zone ${zone} (${dim.width}x${dim.height} - ${dim.description}):
"${prompt}"

Analyze this request and respond with JSON.
`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: {
        systemInstruction: ANALYZE_PROMPT_INSTRUCTION,
        temperature: 0.3,
      }
    });

    const text = response.text || "{}";
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return {
      needsClarification: false,
      questions: [],
      thinking: ["Processing request..."],
      plan: ["Generate code based on request"],
      confidence: 70
    };
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return {
      needsClarification: false,
      questions: [],
      thinking: ["Unable to analyze, proceeding with generation"],
      plan: ["Generate code"],
      confidence: 50
    };
  }
}

/**
 * Generate code with step-by-step thinking updates
 */
export async function generateWithThinking(
  zone: ZoneId,
  prompt: string,
  onProgress: (progress: GenerationProgress) => void,
  currentCode?: string
): Promise<string> {
  const dim = ZONE_DIMENSIONS[zone];
  let thinkingLog: string[] = [];

  try {
    // Phase 1: Analyzing
    thinkingLog = ['Understanding the request...', `Target: Zone ${zone} (${dim.width}x${dim.height})`];
    onProgress({
      phase: 'analyzing',
      thinking: [...thinkingLog],
      currentStep: 'Analyzing requirements',
      progress: 15
    });

    // Quick analysis (with timeout protection)
    let analysis: PromptAnalysis;
    try {
      const analysisPromise = analyzePrompt(prompt, zone);
      const timeoutPromise = new Promise<PromptAnalysis>((_, reject) =>
        setTimeout(() => reject(new Error('Analysis timeout')), 8000)
      );
      analysis = await Promise.race([analysisPromise, timeoutPromise]);
    } catch {
      // If analysis fails or times out, use defaults
      analysis = {
        needsClarification: false,
        questions: [],
        thinking: ['Planning implementation...'],
        plan: ['Generate UI components', 'Add interactivity', 'Style for TV display'],
        confidence: 80
      };
    }

    // Phase 2: Planning
    thinkingLog = [...thinkingLog, '---', ...analysis.thinking];
    onProgress({
      phase: 'planning',
      thinking: [...thinkingLog],
      currentStep: 'Creating implementation plan',
      progress: 35
    });

    // Show plan
    thinkingLog = [...thinkingLog, '---', 'Plan:', ...analysis.plan];
    onProgress({
      phase: 'planning',
      thinking: [...thinkingLog],
      currentStep: 'Plan ready',
      progress: 50
    });

    // Phase 3: Generating
    thinkingLog = [...thinkingLog, '---', 'Generating code...'];
    onProgress({
      phase: 'generating',
      thinking: [...thinkingLog],
      currentStep: 'Writing HTML/CSS/JS',
      progress: 65
    });

    // Generate the code (this is the main work)
    const code = await generateZoneCode(zone, prompt, currentCode);

    // Update progress as code is being finalized
    onProgress({
      phase: 'generating',
      thinking: [...thinkingLog, 'Finalizing code...'],
      currentStep: 'Adding remote control support',
      progress: 90
    });

    // Phase 4: Complete
    onProgress({
      phase: 'complete',
      thinking: [...thinkingLog, 'Code generated successfully!'],
      currentStep: 'Complete',
      progress: 100
    });

    return code;
  } catch (error) {
    // On error, still update to complete state so UI doesn't hang
    onProgress({
      phase: 'complete',
      thinking: [...thinkingLog, `Error: ${error}`],
      currentStep: 'Error occurred',
      progress: 100
    });
    throw error;
  }
}

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

// Plan Mode Types
export interface PlanStep {
  id: string;
  description: string;
  zone?: ZoneId;
  type: 'code' | 'design' | 'config' | 'info';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface PlanResponse {
  type: 'plan' | 'answer' | 'ascii' | 'clarification';
  content: string;
  steps?: PlanStep[];
  ascii?: string;
}

const PLAN_MODE_SYSTEM_INSTRUCTION = `
You are an expert UI/UX designer and developer assistant for Telly, a dual-screen smart TV device.
You help users plan and design prototypes before implementation.

The Telly device has these Zones:
- Zone A (Main Screen): 1920x1080 - Primary content area
- Zone B (Full Bottom): 1920x360 - Unified bottom experience (replaces C+D+E)
- Zone C (Bottom Left): 1280x300 - Left widget area
- Zone D (Bottom Right): 640x300 - Right widget/ad area
- Zone E (News Ticker): 1920x60 - Scrolling ticker
- Zone F (Combined C+D): 1920x300 - Unified bottom widget (keeps E visible)

Your capabilities:
1. **Planning**: Break down complex features into step-by-step implementation plans
2. **ASCII Art**: Create ASCII mockups and wireframes of UI layouts
3. **Design Advice**: Suggest layouts, colors, and UX patterns for TV interfaces
4. **Q&A**: Answer questions about Telly development, TV UI best practices, etc.
5. **Review**: Analyze existing designs and suggest improvements

Response Format:
- For PLANS: Start with "## Plan:" then list numbered steps. End with "Ready to implement?"
- For ASCII: Wrap ASCII art in triple backticks with "ascii" tag
- For ANSWERS: Provide clear, concise responses
- For CLARIFICATIONS: Ask specific questions to understand requirements

Always consider TV/remote optimization:
- Large touch targets (56px minimum)
- High contrast for readability at distance
- D-pad navigation friendly
- Focus states clearly visible
`;

/**
 * Plan Mode: Conversational AI for planning, questions, and ASCII designs
 */
export async function generatePlanResponse(
  prompt: string,
  conversationHistory: Array<{ role: 'user' | 'ai'; text: string }>,
  currentZoneContent?: ZoneContent
): Promise<PlanResponse> {
  const client = getAI();

  // Build conversation context
  const historyContext = conversationHistory
    .slice(-10) // Last 10 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
    .join('\n');

  const zoneContext = currentZoneContent
    ? `Current prototype state:
- Zone A: ${currentZoneContent.A ? 'Has content' : 'Empty'}
- Zone B: ${currentZoneContent.B ? 'Has content' : 'Empty'}
- Zone C: ${currentZoneContent.C ? 'Has content' : 'Empty'}
- Zone D: ${currentZoneContent.D ? 'Has content' : 'Empty'}
- Zone E: ${currentZoneContent.E ? 'Has content' : 'Empty'}
- Zone F: ${currentZoneContent.F ? 'Has content' : 'Empty'}`
    : '';

  const fullPrompt = `
${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}
${zoneContext ? `${zoneContext}\n\n` : ''}
User request: ${prompt}

Respond appropriately based on the request type (plan, ASCII design, question, etc.).
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
        systemInstruction: PLAN_MODE_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const text = response.text || "";

    // Detect response type
    let responseType: PlanResponse['type'] = 'answer';
    let ascii: string | undefined;
    let steps: PlanStep[] | undefined;

    // Check for ASCII art
    const asciiMatch = text.match(/```ascii([\s\S]*?)```/);
    if (asciiMatch) {
      responseType = 'ascii';
      ascii = asciiMatch[1].trim();
    }

    // Check for plan
    if (text.toLowerCase().includes('## plan:') || text.toLowerCase().includes('implementation plan')) {
      responseType = 'plan';
      // Extract steps from numbered list
      const stepMatches = text.match(/\d+\.\s+([^\n]+)/g);
      if (stepMatches) {
        steps = stepMatches.map((step, index) => ({
          id: `step-${index + 1}`,
          description: step.replace(/^\d+\.\s+/, ''),
          type: 'code' as const,
          status: 'pending' as const,
        }));
      }
    }

    // Check for clarification question
    if (text.includes('?') && (
      text.toLowerCase().includes('would you like') ||
      text.toLowerCase().includes('do you want') ||
      text.toLowerCase().includes('should i') ||
      text.toLowerCase().includes('can you clarify')
    )) {
      responseType = 'clarification';
    }

    return {
      type: responseType,
      content: text,
      steps,
      ascii,
    };
  } catch (error) {
    console.error("Error in plan mode:", error);
    throw error;
  }
}

/**
 * Execute a plan step - generates actual code for a specific step
 */
export async function executePlanStep(
  step: PlanStep,
  zone: ZoneId,
  context: string
): Promise<string> {
  return generateZoneCode(zone, `${step.description}\n\nContext: ${context}`);
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
