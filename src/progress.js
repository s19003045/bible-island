const KEY = 'bible-island:progress:v1';

export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(KEY) || '{}');
    return { visited: Array.isArray(data.visited) ? data.visited.filter(x => typeof x === 'string') : [],
      stops: Array.isArray(data.stops) ? data.stops.filter(x => typeof x === 'string') : [],
      saved: Array.isArray(data.saved) ? data.saved.filter(x => typeof x === 'string') : [] };
  } catch { return { visited: [], stops: [], saved: [] }; }
}

export function writeProgress(storage, progress) {
  try { storage.setItem(KEY, JSON.stringify(progress)); return true; } catch { return false; }
}

export function markStop(progress, themeId, stopId) {
  return { ...progress, visited: [...new Set([...progress.visited, themeId])], stops: [...new Set([...progress.stops, `${themeId}/${stopId}`])] };
}

export function getTourStep(theme, current, direction) {
  return Math.max(0, Math.min(theme.stops.length - 1, current + direction));
}
