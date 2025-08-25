/**
 * Formats a date (either Date object or string) to a readable format
 * @param date - Date object or date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Formats a date to show time as well
 * @param date - Date object or date string
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Checks if a date is in the past
 * @param date - Date object or date string
 * @returns True if the date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Checks if a date is today
 * @param date - Date object or date string
 * @returns True if the date is today
 */
export const isDateToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}; 