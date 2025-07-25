/**
 * Greeting utility functions
 *
 * This file demonstrates a modular approach to organizing code,
 * and will be imported in the examples using path aliases.
 */

/**
 * Generate a greeting message for a given name
 * @param name - The name to greet
 * @param timeOfDay - Optional time of day for specific greeting
 * @returns A formatted greeting message
 */
export function greet(name: string, timeOfDay?: string): string {
  const greeting = getGreetingByTime(timeOfDay);
  return `${greeting}, ${name}!`;
}

/**
 * Get an appropriate greeting based on time of day
 * @param timeOfDay - Optional time specification (morning, afternoon, evening)
 * @returns The appropriate greeting
 */
function getGreetingByTime(timeOfDay?: string): string {
  if (timeOfDay) {
    switch (timeOfDay.toLowerCase()) {
      case "morning":
        return "Good morning";
      case "afternoon":
        return "Good afternoon";
      case "evening":
        return "Good evening";
      default:
        return "Hello";
    }
  }

  // Determine greeting based on current time if not specified
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Good morning";
  } else if (currentHour < 18) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

/**
 * Generate farewell message
 * @param name - The name to bid farewell to
 * @returns A formatted farewell message
 */
export function farewell(name: string): string {
  return `Goodbye, ${name}! Have a great day!`;
}

// Default export for the module
export default {
  greet,
  farewell,
};
