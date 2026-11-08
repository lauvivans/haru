// Joins class names, skipping the ones turned off
export const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
