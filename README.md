## Models used

| Model | Provider | Architecture | API |
|-------|----------|--------------|-----|
| `gemini-2.5-flash` | Google | Dense Transformer | Google Generative AI REST |
| `llama-3.3-70b-versatile` | Groq | Dense Transformer | Groq (OpenAI-compatible) |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Groq | MoE | Groq (OpenAI-compatible) |
| `mistral-small-latest` | Mistral | Dense Transformer | Mistral chat completions |

To swap models, edit the `MODELS` array at the top of `script.js` — each entry defines its display name, architecture badge, and call function.

## How to configure

Open `config.js` and paste each key between the empty quotes:

```js
const CONFIG = {
  GEMINI_API_KEY: "your-gemini-key",
  GROQ_API_KEY: "your-groq-key",
  MISTRAL_API_KEY: "your-mistral-key"
};
```

`config.js` is gitignored. `config.example.js` is the template. Rename and remove "example."

## How to use

1. (Optional) Type a **System Prompt** — sets role/tone for all models, e.g. "You are a doctor."
2. Type a **User Prompt** — the actual question or task.
3. Click **Send to All**. All four models are queried in parallel; cards show a loading shimmer until each response arrives.
4. Each card displays the response, status (OK / Failed), and elapsed time in ms.
5. Click **Export JSON** to download the run (system prompt, user prompt, timestamp, all four responses) as a timestamped `.json` file.
6. Expand **Session History** at the bottom to see all runs from this browser session. Click any entry to restore that run into the grid.

> Note: session history lives only in browser memory. Refreshing the page clears it. Use Export to save anything you want to keep.

## File structure

- `index.html` - UI layout, loads config.js then script.js
- `style.css` - Dark theme, 2x2 responsive grid, skeleton animation
- `script.js` - Model registry, send logic, history, provider adapters
- `config.js` - Your API keys (gitignored)
- `config.example.js` - Safe template committed to the repo
- `.gitignore` - Ignores config.js
