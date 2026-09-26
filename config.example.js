/*
  Rename this file to `config.js` (which is gitignored) and paste the real API
  keys between the empty quotes. 
  
  DON'T COMMIT REAL KEYS TO GITHUB.
*/
const CONFIG = {
  GEMINI_API_KEY: "",
  // Optional extra Google keys, from other accounts, for the Stage 3 batch only. Google's free tier
  // allows ~20 requests/day per model per project, so the 120-response run needed several. Select one
  // with: node stage3/run_headless.mjs --gemini-key=GEMINI_API_KEY_PREVIOUS  (any field name works;
  // only the NAME is recorded in the exports, never the key). Leave blank if unused.
  GEMINI_API_KEY_PREVIOUS: "",
  GEMINI_API_KEY_3: "",
  GEMINI_API_KEY_4: "",
  GROQ_API_KEY: "",
  OPENROUTER_API_KEY: "",
  // Not used by any current MODELS entry this round — both Nemotron cards
  // route through OpenRouter's :free tag instead (OPENROUTER_API_KEY).
  // Kept here in case a future round routes a candidate back through NIM.
  NVIDIA_API_KEY: "",
  // Not used by any current MODELS entry this round — Cohere's slot is
  // north-mini-code via OpenRouter (OPENROUTER_API_KEY), not a direct
  // Cohere card. Kept here in case Command A+ (or similar) re-enters a
  // future round's list.
  COHERE_API_KEY: "",
  // Not used by any current MODELS entry. Kept here in case a use for it
  // comes up again later.
  MISTRAL_API_KEY: "",
  // Not used by any current MODELS entry. Kept here in case native
  // DeepSeek billing gets funded later and a future round routes a
  // DeepSeek candidate through callDeepSeek() directly.
  DEEPSEEK_API_KEY: ""
};
