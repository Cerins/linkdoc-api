/**
 * Generates a unique document room identifier based on the collection UUID and document name.
 * @param colUUID - The UUID of the collection.
 * @param docName - The name of the document.
 * @returns The generated document room identifier.
 */
export default function docRoom(
    colUUID: string,
    docName: string
) {
    return `${colUUID}:${docName}`;
}