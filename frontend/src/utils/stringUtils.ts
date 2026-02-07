/**
 * Formats a string to Title Case (e.g., "JOHN DOE" -> "John Doe").
 */
export function toTitleCase(str: string | undefined): string {
    if (!str) return 'N/A';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
