// Macht aus einem Pfad wie /bilder/harry.jpg eine Adresse, die auch unter einem Unterordner stimmt.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const pfad = (p = '') => {
  if (!p || /^https?:/.test(p)) return p;
  return `${base}/${p.replace(/^\//, '')}`;
};
