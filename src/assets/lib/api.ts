export interface StreamConfig {
  useLocal: boolean;
  localUrl: string;
}

export async function streamAgentTask(
  endpoint: string,
  payload: any,
  config: StreamConfig,
  onUpdate: (fullText: string) => void,
  onComplete: () => void
) {
  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...config })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error("No response body from server");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let buffer = '';
    let fullText = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing chunk in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') {
            onComplete();
            return;
          }
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) throw new Error(data.error);
            if (data.text) {
              fullText += data.text;
              onUpdate(fullText);
            }
          } catch (e) {
            // ignore broken JSON or partial streams from Ollama
          }
        }
      }
    }
    onComplete(); // Failsafe if stream ends without [DONE]
  } catch (err: any) {
    onUpdate(`\n[SYSTEM ERROR]: ${err.message}`);
    onComplete();
  }
}

// SSE consumer for the production pipeline
export async function streamProductionPipeline(
  script: string,
  prompt: string,
  onStatus: (message: string) => void,
  onScenes: (scenes: any[]) => void,
  onComplete: (videoUrl: string, videoId: string) => void,
  onError: (message: string) => void
) {
  try {
    const response = await fetch('http://localhost:3000/api/production/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script, prompt })
    });

    if (!response.ok || !response.body) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            switch (data.type) {
              case 'status':
                onStatus(data.message);
                break;
              case 'scenes':
                onScenes(data.scenes);
                onStatus(data.message);
                break;
              case 'complete':
                onComplete(`http://localhost:3000${data.url}`, data.videoId);
                return;
              case 'error':
                onError(data.message);
                return;
            }
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
  } catch (err: any) {
    onError(err.message);
  }
}
