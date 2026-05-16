export const getStorage = async (key) => {
  const value = localStorage.getItem(key);
  try { return JSON.parse(value); } catch { return value; }
};

export const setStorage = async (key, value) => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
  localStorage.setItem(key, stringValue);
};

export const clearStorage = async () => localStorage.clear();