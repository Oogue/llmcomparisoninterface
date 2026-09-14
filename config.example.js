/*
  Rename this file to `config.js` (which is gitignored) and paste the real API
  keys between the empty quotes. 
  
  DON'T COMMIT REAL KEYS TO GITHUB.
*/
const CONFIG = {
  GEMINI_API_KEY: "",
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
