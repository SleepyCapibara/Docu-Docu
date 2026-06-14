const https = require('https');

const LOCALE_NAMES = {
  uk: 'Ukrainian',
  es: 'Spanish',
  ko: 'Korean',
};

const DEFAULT_MODEL = 'gpt-4o-mini';

function loadEnvFile() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson({url, method, headers, body}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            reject(new Error(`Invalid JSON response (${res.statusCode}): ${data}`));
            return;
          }
          if (res.statusCode >= 400) {
            reject(
              new Error(
                json.error?.message ||
                  `HTTP ${res.statusCode}: ${JSON.stringify(json)}`,
              ),
            );
            return;
          }
          resolve(json);
        });
      },
    );
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function translateWithOpenAI({text, targetLocale, contentType, retries = 3}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add it to .env or your environment.',
    );
  }

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const language = LOCALE_NAMES[targetLocale] || targetLocale;

  const systemPrompt =
    contentType === 'mdx'
      ? `You are a professional technical translator for SOC Prime cybersecurity documentation.
Translate the following MDX content from English to ${language}.

Rules:
- Translate prose, frontmatter values (title, description, sidebar_label, display_date), and image alt text only.
- Do NOT change frontmatter keys, import lines, JSX component names, component props/attributes (except alt text in markdown images), code fences, URLs, file paths, or image paths (/img/...).
- Preserve all MDX/Markdown structure, headings, lists, links, and formatting exactly.
- Keep product names (SOC Prime, Threat Detection Marketplace, Uncoder AI, DetectFlow, Sigma, Lucene, MITRE ATT&CK) as-is unless a well-known localized form exists.
- Return ONLY the translated MDX with no commentary.`
      : `You are a professional UI translator for SOC Prime documentation.
Translate the following JSON string values from English to ${language}.

Rules:
- Input is a JSON object mapping keys to English message strings.
- Return a JSON object with the same keys and translated message strings only.
- Keep brand names (SOC Prime, Threat Detection Marketplace, GitHub, Discord, LinkedIn, YouTube, Facebook, Bluesky, X) unchanged unless standard localization applies.
- Return ONLY valid JSON with no markdown fences or commentary.`;

  const userPrompt =
    contentType === 'mdx'
      ? text
      : JSON.stringify(text, null, 2);

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await requestJson({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: userPrompt},
          ],
        }),
      });

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      if (contentType === 'mdx') {
        return content.replace(/^```(?:mdx|markdown)?\n?/i, '').replace(/\n?```$/i, '');
      }

      const parsed = JSON.parse(
        content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, ''),
      );
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError;
}

/**
 * @param {{ provider?: string }} [options]
 */
function createTranslator(options = {}) {
  const provider = options.provider || process.env.LLM_PROVIDER || 'openai';

  if (provider === 'openai') {
    return {
      provider: 'openai',
      translate: translateWithOpenAI,
    };
  }

  throw new Error(
    `Unknown LLM provider "${provider}". Supported: openai. Set LLM_PROVIDER=openai.`,
  );
}

module.exports = {
  createTranslator,
  LOCALE_NAMES,
  DEFAULT_MODEL,
};
