export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000000; // Max 1 billion
};

export const validateDescription = (description: string): boolean => {
  return description.length >= 3 && description.length <= 100;
};

export const validateCategory = (category: string): boolean => {
  return category.length >= 2 && category.length <= 30;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};
