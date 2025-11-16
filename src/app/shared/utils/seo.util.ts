/**
 * SEO Utilities for dynamic meta tag management
 *
 * FUNCIONES:
 * - truncateDescription(): Truncates text to specified length preserving words
 * - buildPageUrl(): Constructs absolute URL for og:url meta tag
 * - sanitizeMetaText(): Removes HTML entities and special chars for meta tags
 * - getMetaTagDescription(): Formats product description for meta tag
 */

/**
 * Truncate text to a maximum length while respecting word boundaries
 * Useful for meta descriptions (ideal 150-160 chars)
 *
 * @param text - Text to truncate (nullable)
 * @param maxLength - Maximum length (default: 160)
 * @returns Truncated text with ellipsis if needed, or empty string if text is null/undefined
 *
 * EXAMPLE:
 * truncateDescription("This is a very long description...", 20)
 * // Returns: "This is a very long..."
 */
export function truncateDescription(
  text: string | undefined | null,
  maxLength: number = 160
): string {
  if (!text) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space within the limit to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}

/**
 * Build absolute URL for current page (needed for og:url meta tag)
 *
 * @param path - Relative path (e.g., '/products/123')
 * @returns Absolute URL (e.g., 'https://example.com/products/123')
 *
 * NOTE: In development, use 'http://localhost:4200'
 * In production, read from environment config
 */
export function buildPageUrl(path: string): string {
  // In a real app, this would come from environment config
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://tudominio.com';

  return `${baseUrl}${path}`;
}

/**
 * Sanitize text for use in meta tags (remove HTML entities, etc.)
 *
 * @param text - Text to sanitize
 * @returns Sanitized text safe for meta tag attributes
 */
export function sanitizeMetaText(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Format product description for meta tag use
 * Combines truncation and sanitization
 *
 * @param description - Product description
 * @param maxLength - Max length (default: 160)
 * @returns Formatted description ready for meta tags
 */
export function getMetaTagDescription(
  description: string | undefined,
  maxLength: number = 160
): string {
  const truncated = truncateDescription(description, maxLength);
  return sanitizeMetaText(truncated);
}
