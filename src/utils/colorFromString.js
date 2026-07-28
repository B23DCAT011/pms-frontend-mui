const PALETTE = ["#f27a18", "#1976d2", "#2e7d32", "#7b1fa2", "#c2185b", "#00838f"];

export function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
