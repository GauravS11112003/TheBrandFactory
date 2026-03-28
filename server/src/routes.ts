import { Router, Express, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
import { execSync, spawnSync } from 'child_process';
import multer from 'multer';

const router = Router();

// ── Multer setup for video uploads ──
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB max

// Helper to get Google API
const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in .env");
  return new GoogleGenerativeAI(key);
};

async function streamOllama(res: Response, localUrl: string, systemPrompt: string, userPrompt: string) {
  try {
    const fetchResponse = await fetch(`${localUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // Default local model
        system: systemPrompt,
        prompt: userPrompt,
        stream: true
      })
    });

    if (!fetchResponse.ok || !fetchResponse.body) {
      throw new Error(`Ollama fetch failed: ${fetchResponse.statusText}`);
    }

    const reader = fetchResponse.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunkStr = decoder.decode(value, { stream: true });
      // Ollama returns streams of NDJSON: {"model":"llama3","response":"hello","done":false}
      const lines = chunkStr.split('\n').filter(l => l.trim() !== '');
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            res.write(`data: ${JSON.stringify({ text: parsed.response })}\n\n`);
          }
        } catch (e) {
          // ignore parse errors for broken chunks
        }
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error("Local stream error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

async function streamGemini(res: Response, systemPrompt: string, userPrompt: string) {
  try {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });

    const result = await model.generateContentStream(userPrompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        await new Promise(r => setTimeout(r, 100)); // Artificial lag for UI effect
      }
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error("Gemini stream error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

// Common streaming handler
async function handleLLMStream(req: Request, res: Response, systemPrompt: string, userPrompt: string) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { useLocal, localUrl } = req.body;

  if (useLocal && localUrl) {
    await streamOllama(res, localUrl, systemPrompt, userPrompt);
  } else {
    await streamGemini(res, systemPrompt, userPrompt);
  }
}

router.post('/ideation/stream', async (req, res) => {
  const { prompt } = req.body;
  const sys = "You are an expert Ad Ideation Agent. Your job is to analyze the user's prompt and generate 3 compelling short-form video hooks/concepts. Output only the final hooks clearly.";
  await handleLLMStream(req, res, sys, prompt);
});

router.post('/scripting/stream', async (req, res) => {
  const { prompt, ideationOutput } = req.body;
  const sys = `You are an expert Scripting Agent. Based on the selected idea, write a punchy, fast-paced 30-second script. 
CRITICAL RULES:
- Write ONLY the spoken voiceover text.
- DO NOT include any stage directions, visual cues, audio cues, or speaker names.
- The script MUST be exactly 60-70 words to fit perfectly in 30 seconds.
- Output ONLY the exact words to be spoken.`;
  await handleLLMStream(req, res, sys, `Context ideas:\n${ideationOutput || ''}\n\nUser Request:\n${prompt}`);
});

router.post('/editing/stream', async (req, res) => {
  const { prompt, scriptOutput } = req.body;
  const sys = `You are the Lead Video Editor. Given the script, provide 3 specific editing technique suggestions (cuts, pacing, effects). Output only the editing rules.`;
  await handleLLMStream(req, res, sys, `Script:\n${scriptOutput || ''}\n\nUser Request/Feedback:\n${prompt}`);
});

// ═══════════════════════════════════════════════════════
// ── Editor Routes ─────────────────────────────────────
// ═══════════════════════════════════════════════════════
const editorRouter = Router();

// Upload a video
editorRouter.post('/upload', upload.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }
  const filename = req.file.filename;
  res.json({ 
    videoId: filename,
    url: `/api/editor/video/${filename}`,
    originalName: req.file.originalname
  });
});

// Apply an NL edit via Gemini → FFmpeg
editorRouter.post('/apply', async (req: Request, res: Response) => {
  const { videoId, command } = req.body;
  
  if (!videoId || !command) {
    res.status(400).json({ error: 'Missing videoId or command' });
    return;
  }

  const inputPath = path.join(uploadsDir, videoId);
  if (!fs.existsSync(inputPath)) {
    res.status(404).json({ error: 'Video file not found' });
    return;
  }

  try {
    // Ask Gemini to translate NL → FFmpeg args
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are an FFmpeg command-line expert. Given a natural language video editing instruction, output ONLY a valid JSON object with this exact schema:
{
  "ffmpegArgs": ["-y", "-i", "INPUT", ...other_args..., "OUTPUT"],
  "description": "One-line human-readable summary of the edit"
}

RULES:
- Always use "INPUT" as the input file placeholder and "OUTPUT" as the output file placeholder.
- Always include "-y" flag to overwrite without asking.
- Keep commands simple and correct. Prefer simple filters over complex filter graphs.
- For speed changes, remember to also handle audio with -filter:a if needed, or use -an to drop audio.
- Output ONLY the raw JSON. No markdown, no code fences, no explanations.`
    });

    const result = await model.generateContent(command);
    const responseText = result.response.text().trim();
    
    // Parse the JSON from Gemini
    // Sometimes Gemini wraps in code fences, strip them
    const jsonStr = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    let parsed: { ffmpegArgs: string[]; description: string };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Gemini returned invalid JSON:', responseText);
      res.status(500).json({ error: 'AI returned invalid FFmpeg instructions', raw: responseText });
      return;
    }

    if (!parsed.ffmpegArgs || !Array.isArray(parsed.ffmpegArgs)) {
      res.status(500).json({ error: 'AI response missing ffmpegArgs array', raw: responseText });
      return;
    }

    // Generate output filename
    const ext = path.extname(videoId) || '.mp4';
    const outputFilename = `${Date.now()}-edited${ext}`;
    const outputPath = path.join(uploadsDir, outputFilename);

    // Replace INPUT/OUTPUT placeholders with real paths
    // Be more robust: check if Gemini put quotes around them or used different case
    const finalArgs = parsed.ffmpegArgs.map(arg => {
      let processed = arg;
      if (processed.toUpperCase() === 'INPUT' || processed === '"INPUT"' || processed === "'INPUT'") return inputPath;
      if (processed.toUpperCase() === 'OUTPUT' || processed === '"OUTPUT"' || processed === "'OUTPUT'") return outputPath;
      // Handle cases like "-i INPUT" if Gemini ignored instructions
      processed = processed.replace(/INPUT/gi, inputPath).replace(/OUTPUT/gi, outputPath);
      return processed;
    });

    console.log(`[Editor] Executing: ffmpeg ${finalArgs.join(' ')}`);

    // Execute FFmpeg using spawnSync to avoid shell quoting hell
    try {
      const result = spawnSync('ffmpeg', finalArgs, { 
        timeout: 120000,
        encoding: 'utf-8'
      });

      if (result.status !== 0) {
        throw new Error(result.stderr || 'FFmpeg process exited with non-zero code');
      }
    } catch (ffmpegErr: any) {
      console.error('FFmpeg error:', ffmpegErr.message);
      res.status(500).json({ 
        error: 'FFmpeg execution failed', 
        details: ffmpegErr.message?.slice(0, 500),
        command: `ffmpeg ${finalArgs.join(' ')}`
      });
      return;
    }

    // Verify output file was created
    if (!fs.existsSync(outputPath)) {
      res.status(500).json({ error: 'FFmpeg completed but output file was not created' });
      return;
    }

    res.json({
      videoId: outputFilename,
      url: `/api/editor/video/${outputFilename}`,
      description: parsed.description,
      ffmpegCommand: `ffmpeg ${parsed.ffmpegArgs.join(' ')}`
    });

  } catch (err: any) {
    console.error('Editor apply error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Serve video files
editorRouter.get('/video/:filename', (req: Request, res: Response) => {
  const filePath = path.join(uploadsDir, req.params.filename as string);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.sendFile(filePath);
});

// Generate TTS audio using ElevenLabs
async function generateElevenLabsAudio(text: string, outputPath: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  // Adam voice by default
  const voiceId = "pNInz6obpgDQGcFmaJgB"; 
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs api error: ${response.status} ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
}

// --------------------------------------------------------------------------------
// 3. Production Pipeline (Automated Compilation)
// --------------------------------------------------------------------------------
const productionRouter = Router();

// Search Pexels for stock videos
async function searchPexelsVideos(query: string, perPage = 3): Promise<{ url: string; width: number; height: number }[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) throw new Error('PEXELS_API_KEY not set');

  const searchUrl = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  console.log(`[Pexels] Searching: ${query}`);

  const res = await fetch(searchUrl, {
    headers: { Authorization: apiKey }
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[Pexels] API error ${res.status}: ${body}`);
    throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const videos = data.videos || [];
  console.log(`[Pexels] Found ${videos.length} results for "${query}"`);

  const results: { url: string; width: number; height: number }[] = [];

  for (const video of videos) {
    const files = video.video_files || [];
    // Prefer HD, then SD, then anything
    const bestFile = files.find((f: any) => f.quality === 'hd' && f.width >= 1280)
                  || files.find((f: any) => f.quality === 'hd')
                  || files.find((f: any) => f.quality === 'sd')
                  || files[0];
    if (bestFile && bestFile.link) {
      results.push({ url: bestFile.link, width: bestFile.width || 1920, height: bestFile.height || 1080 });
    }
  }

  return results;
}

// Download a video file from URL
async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

// SSE endpoint for production pipeline
productionRouter.post('/generate', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (type: string, data: any) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  const { script, prompt } = req.body;
  if (!script && !prompt) {
    sendEvent('error', { message: 'Missing script or prompt' });
    res.end();
    return;
  }

  try {
    // Start generating audio in parallel
    const audioFilename = `voiceover-${Date.now()}.mp3`;
    const audioPath = path.join(uploadsDir, audioFilename);
    const audioPromise = generateElevenLabsAudio(script, audioPath)
      .then(() => {
        sendEvent('status', { message: '🎙️ Voiceover generated successfully.' });
        return true;
      })
      .catch((err: any) => {
        console.error("Audio generation failed:", err.message);
        sendEvent('status', { message: `Warning: Voiceover failed (${err.message})` });
        return false;
      });

    // Step 1: Ask Gemini to break the script into scenes with search keywords
    sendEvent('status', { message: 'Breaking script into scenes...' });

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `You are an elite video ad director. Given a script and user request, extract the brand/product name and break the script into 6-8 premium visual scenes. 
Output ONLY a valid JSON object matching this schema:
{
  "brandName": "The detected brand or product name (Max 2 words)",
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 4,
      "searchQuery": "server room lights",
      "textOverlay": "Deploy Autonomous Software",
      "description": "Hook showcasing infrastructure"
    }
  ]
}

RULES:
- Total duration MUST sum to exactly 30 seconds.
- Each scene should be 3-6 seconds long.
- Structure: Hook -> Problem -> Solution -> Features -> Call to Action.
- searchQuery MUST be simple, 2-3 words max that exist in Pexels (e.g. "data center", "programmer terminal", "smiling business").
- textOverlay MUST be short, punchy, high-converting marketing copy (max 6 words).
- Make sure the brandName is explicitly promoted in the text overlays for the Solution and CTA scenes.
- Output ONLY the raw JSON object. No markdown, no code fences.`
    });

    const sceneResult = await model.generateContent(script || prompt);
    const sceneText = sceneResult.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let scenes: { sceneNumber: number; duration: number; searchQuery: string; textOverlay: string; description: string }[];
    let brandName: string = "Brand";
    try {
      const parsedRoot = JSON.parse(sceneText);
      brandName = parsedRoot.brandName || "Brand";
      scenes = parsedRoot.scenes;
      
      if (!Array.isArray(scenes)) {
        throw new Error("No scenes array found in root object");
      }
    } catch (e) {
      console.error('Scene parse error:', sceneText);
      sendEvent('error', { message: 'Failed to parse scene breakdown', raw: sceneText });
      res.end();
      return;
    }

    sendEvent('scenes', { scenes, message: `Generated ${scenes.length} scenes` });

    sendEvent('status', { message: '🎙️ Waiting for voiceover to finish...' });
    const hasAudio = await audioPromise;
    let durationPerScene: number | null = null;

    if (hasAudio && fs.existsSync(audioPath)) {
      try {
        const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
        const audioDuration = parseFloat(probe.toString().trim());
        if (!isNaN(audioDuration) && audioDuration > 0) {
          durationPerScene = audioDuration / scenes.length;
          sendEvent('status', { message: `Audio is ${audioDuration.toFixed(1)}s. Auto-adjusting ${scenes.length} scenes to ${durationPerScene.toFixed(1)}s each for perfect sync.` });
        }
      } catch (e: any) {
        console.warn("Could not probe audio length:", e.message);
      }
    }

    // Step 2: Search and download Pexels videos for each scene
    const clipPaths: { path: string; duration: number; textOverlay: string }[] = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const finalDuration = durationPerScene || scene.duration;
      try {
        const isBrandScene = i === scenes.length - 1;
        const clipFilename = `clip-${Date.now()}-scene${scene.sceneNumber}.mp4`;
        const clipPath = path.join(uploadsDir, clipFilename);
        const trimmedFilename = `trimmed-${clipFilename}`;
        const trimmedPath = path.join(uploadsDir, trimmedFilename);

        if (isBrandScene) {
          sendEvent('status', { message: `Generating ${brandName} branding scene...` });
          const brandImagePath = path.join(uploadsDir, 'nexlayer-brand.png');
          
          if (brandName.toLowerCase().includes('nexlayer') && fs.existsSync(brandImagePath)) {
            execSync(`ffmpeg -y -loop 1 -framerate 24 -i "${brandImagePath}" -t ${finalDuration} -vf "scale=1280:720,format=yuv420p" -c:v libx264 -preset fast -crf 23 "${trimmedPath}"`, {
              timeout: 60000,
              stdio: 'pipe'
            });
          } else {
            // Dynamically generate a text-based branding slide
            sendEvent('status', { message: `Rendering custom ${brandName} branding Title Card...` });
            const safeBrand = brandName.replace(/'/g, "\\'").replace(/:/g, "\\:");
            execSync(`ffmpeg -y -f lavfi -i color=c=black:s=1280x720:d=${finalDuration} -vf "drawtext=text='${safeBrand}':fontsize=120:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2,format=yuv420p" -c:v libx264 -preset fast -crf 23 "${trimmedPath}"`, {
              timeout: 60000,
              stdio: 'pipe'
            });
          }
          clipPaths.push({ path: trimmedPath, duration: finalDuration, textOverlay: scene.textOverlay });
          continue; // Skip Pexels logic for the final branding scene
        }

        sendEvent('status', { message: `Searching footage for scene ${scene.sceneNumber}: "${scene.searchQuery}"...` });
        const videos = await searchPexelsVideos(scene.searchQuery, 1);
        if (videos.length === 0) {
          // Fallback: try a simpler search
          const fallbackQuery = scene.searchQuery.split(' ').slice(0, 2).join(' ');
          sendEvent('status', { message: `No results, trying: "${fallbackQuery}"...` });
          const fallbackVideos = await searchPexelsVideos(fallbackQuery, 1);
          if (fallbackVideos.length === 0) {
            sendEvent('status', { message: `Skipping scene ${scene.sceneNumber} - no footage found` });
            continue;
          }
          videos.push(fallbackVideos[0]);
        }
        
        sendEvent('status', { message: `Downloading clip for scene ${scene.sceneNumber}...` });
        await downloadFile(videos[0].url, clipPath);

        // Trim clip to scene duration using FFmpeg
        try {
          execSync(`ffmpeg -y -i "${clipPath}" -t ${finalDuration} -c:v libx264 -preset fast -crf 23 -an -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" "${trimmedPath}"`, {
            timeout: 60000,
            stdio: 'pipe'
          });
          clipPaths.push({ path: trimmedPath, duration: finalDuration, textOverlay: scene.textOverlay });
          // Clean up raw clip
          if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
        } catch (trimErr: any) {
          console.error(`Trim error scene ${scene.sceneNumber}:`, trimErr.stderr?.toString()?.slice(0, 200));
          sendEvent('status', { message: `Warning: Could not process scene ${scene.sceneNumber}` });
        }
      } catch (searchErr: any) {
        console.error(`Pexels search error for scene ${scene.sceneNumber}:`, searchErr.message, searchErr.stack);
        sendEvent('status', { message: `Warning: Pexels search failed for scene ${scene.sceneNumber}: ${searchErr.message}` });
      }
    }

    if (clipPaths.length === 0) {
      sendEvent('error', { message: 'No clips were successfully downloaded' });
      res.end();
      return;
    }

    // Step 3: Concatenate clips with FFmpeg concat
    sendEvent('status', { message: `Compositing ${clipPaths.length} clips into final video...` });

    const concatListPath = path.join(uploadsDir, `concat-${Date.now()}.txt`);
    const concatContent = clipPaths.map(c => `file '${c.path.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    const finalFilename = `ad-final-${Date.now()}.mp4`;
    const finalPath = path.join(uploadsDir, finalFilename);

    // Build text overlay filter for each clip
    // Simple concat without text overlays first, then add overlays
    try {
      // Step 3a: Simple concat
      const concatTempFilename = `concat-temp-${Date.now()}.mp4`;
      const concatTempPath = path.join(uploadsDir, concatTempFilename);
      
      execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 "${concatTempPath}"`, {
        timeout: 120000,
        stdio: 'pipe'
      });

      // Step 3b: Add text overlays
      // Step 3b: Add text overlays with premium styling and persistent branding
      let currentTime = 0;
      const textFilters: string[] = [];
      
      // Persistent Watermark top right
      const safeBrandWatermark = (brandName || "Brand").replace(/'/g, "\\'").replace(/:/g, "\\:");
      textFilters.push(`drawtext=text='${safeBrandWatermark}':fontsize=28:fontcolor=white@0.8:x=w-tw-30:y=30`);

      for (const clip of clipPaths) {
        const safeText = clip.textOverlay.replace(/'/g, "\\'").replace(/:/g, "\\:");
        const startT = currentTime;
        const endT = currentTime + clip.duration;
        // Premium semi-transparent box behind text
        textFilters.push(
          `drawtext=text='${safeText}':fontsize=48:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=15:x=(w-text_w)/2:y=h-(h/4):enable='between(t,${startT},${endT})'`
        );
        currentTime += clip.duration;
      }

      const filterStr = textFilters.join(',');

      // Wait for audio to finish if it hasn't already (already awaited above, this just ensures order)
      sendEvent('status', { message: 'Finalizing audio mix...' });

      let ffmpegCmd = `ffmpeg -y -i "${concatTempPath}" -vf "${filterStr}" -c:v libx264 -preset fast -crf 23 "${finalPath}"`;
      
      if (hasAudio && fs.existsSync(audioPath)) {
        // We omit -shortest so that both the entire audio and the entire video play out.
        // If audio is shorter, it will be silent at the end. If video is shorter, the final frame will hold.
        ffmpegCmd = `ffmpeg -y -i "${concatTempPath}" -i "${audioPath}" -vf "${filterStr}" -map 0:v:0 -map 1:a:0 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k "${finalPath}"`;
      }

      execSync(ffmpegCmd, {
        timeout: 120000,
        stdio: 'pipe'
      });

      // Cleanup temp files
      if (fs.existsSync(concatTempPath)) fs.unlinkSync(concatTempPath);
      if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
      clipPaths.forEach(c => { if (fs.existsSync(c.path)) fs.unlinkSync(c.path); });

    } catch (ffmpegErr: any) {
      console.error('FFmpeg final compose error:', ffmpegErr.stderr?.toString()?.slice(0, 500));
      // Try without text overlays as fallback
      try {
        execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset fast -crf 23 "${finalPath}"`, {
          timeout: 120000,
          stdio: 'pipe'
        });
        if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
        clipPaths.forEach(c => { if (fs.existsSync(c.path)) fs.unlinkSync(c.path); });
      } catch (fallbackErr: any) {
        sendEvent('error', { message: 'FFmpeg composition failed', details: fallbackErr.stderr?.toString()?.slice(0, 300) });
        res.end();
        return;
      }
    }

    // Success!
    try {
      const desktopDir = "C:\\Users\\gg283\\OneDrive\\Desktop\\TBFVideos";
      if (!fs.existsSync(desktopDir)) {
        fs.mkdirSync(desktopDir, { recursive: true });
      }
      const exportPath = path.join(desktopDir, 'videotbf101.mp4');
      fs.copyFileSync(finalPath, exportPath);
      sendEvent('status', { message: `✅ Auto-exported to Desktop/TBFVideos/videotbf101.mp4` });
    } catch (err: any) {
      console.error("Failed to export to Desktop", err);
      sendEvent('status', { message: `Warning: Failed to export to Desktop (${err.message})` });
    }

    sendEvent('complete', { 
      videoId: finalFilename,
      url: `/api/editor/video/${finalFilename}`,
      message: 'Ad video generated successfully!'
    });
    res.end();

  } catch (err: any) {
    console.error('Production pipeline error:', err);
    sendEvent('error', { message: err.message });
    res.end();
  }
});

export function setupRoutes(app: Express) {
  app.use('/api/agents', router);
  app.use('/api/editor', editorRouter);
  app.use('/api/production', productionRouter);
}
