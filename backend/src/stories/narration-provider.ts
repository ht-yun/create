import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface NarrationSynthesisInput {
  text: string;
  voiceId: string;
  speed: number;
}

export interface NarrationSynthesisResult {
  audio: Uint8Array;
  mimeType: string;
  durationMs?: number;
}

export interface NarrationProvider {
  readonly name: string;
  isConfigured(): boolean;
  synthesize(input: NarrationSynthesisInput): Promise<NarrationSynthesisResult>;
}

@Injectable()
export class OpenAiCompatibleNarrationProvider implements NarrationProvider {
  readonly name = "openai-compatible";

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.config.get<string>("TTS_API_KEY"));
  }

  async synthesize(input: NarrationSynthesisInput): Promise<NarrationSynthesisResult> {
    const apiKey = this.config.get<string>("TTS_API_KEY");
    if (!apiKey) throw new ServiceUnavailableException("AI 旁白服务尚未配置");

    const endpoint = this.config.get("TTS_BASE_URL", "https://api.openai.com/v1/audio/speech");
    const model = this.config.get("TTS_MODEL", "tts-1");
    const maxCharacters = Math.max(500, Number(this.config.get("TTS_MAX_CHARACTERS", "3800")));
    const chunks = splitNarration(input.text, maxCharacters);
    const audioParts: Uint8Array[] = [];

    for (const text of chunks) {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          voice: input.voiceId,
          input: text,
          speed: input.speed,
          response_format: "mp3",
        }),
      });
      if (!response.ok) {
        const message = (await response.text()).slice(0, 500);
        throw new ServiceUnavailableException(`AI 旁白生成失败：${response.status} ${message}`);
      }
      audioParts.push(new Uint8Array(await response.arrayBuffer()));
    }

    const size = audioParts.reduce((total, part) => total + part.byteLength, 0);
    const audio = new Uint8Array(size);
    let offset = 0;
    for (const part of audioParts) {
      audio.set(part, offset);
      offset += part.byteLength;
    }
    return { audio, mimeType: "audio/mpeg" };
  }
}

function splitNarration(text: string, maxCharacters: number) {
  const normalized = text.trim();
  if (normalized.length <= maxCharacters) return [normalized];
  const paragraphs = normalized.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > maxCharacters) {
      if (current) chunks.push(current);
      current = "";
      for (let start = 0; start < paragraph.length; start += maxCharacters) {
        chunks.push(paragraph.slice(start, start + maxCharacters));
      }
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxCharacters) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
