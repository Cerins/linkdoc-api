/**
 * Returns a formatted output type string.
 * This is needed so the user knows the original reason for the response and response type.
 * @param route - The route string.
 * @param response - The response string.
 * @returns The formatted output type string.
 */
export default function outputType(route: string, response: string) {
    return `${route}.${response}`;
}