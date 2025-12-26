
export const saveToCache = (key: string, data: string) => {
  try {
    const cache = JSON.parse(localStorage.getItem('grameen_cache') || '{}');
    cache[key] = {
      content: data,
      timestamp: Date.now()
    };
    localStorage.setItem('grameen_cache', JSON.stringify(cache));
  } catch (e) {
    console.error("Cache save error:", e);
  }
};

export const getFromCache = (key: string): string | null => {
  try {
    const cache = JSON.parse(localStorage.getItem('grameen_cache') || '{}');
    return cache[key]?.content || null;
  } catch (e) {
    return null;
  }
};

export const getAllCachedItems = () => {
  try {
    return JSON.parse(localStorage.getItem('grameen_cache') || '{}');
  } catch (e) {
    return {};
  }
};

export const clearCache = () => {
  localStorage.removeItem('grameen_cache');
};
