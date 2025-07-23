export const parseJson = (message) => {
  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
};
