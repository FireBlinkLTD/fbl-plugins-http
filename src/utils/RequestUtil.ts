/**
 * Get header from options
 * @param options
 * @param name
 */
export function getHeader(
    headers: { [key: string]: number | string | string[] },
    name: string,
): string | number | string[] | null {
    const names = Object.keys(headers);
    const idx = names.map(key => key.toLowerCase()).indexOf(name.toLowerCase());

    if (idx < 0) {
        return null;
    }

    return headers[names[idx]];
}

/**
 * Check if header exists
 * @param options
 * @param name
 */
export function isHeaderExists(headers: { [key: string]: number | string | string[] }, name: string): boolean {
    return getHeader(headers, name) !== null;
}
