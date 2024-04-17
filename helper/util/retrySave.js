const documentLocks = new Map();

async function saveDocumentWithRetry(document, retryCount = 6, delayMs = 1000) {
    const documentId = document._id.toString(); // Assuming _id is an ObjectId

    if (documentLocks.has(documentId)) {
        return await updateDocumentWithRetry(document, retryCount, delayMs);
    }

    documentLocks.set(documentId, true);

    try {
        while (retryCount > 0) {
            try {
                await document.save();
                documentLocks.delete(documentId);
                return;
            } catch (error) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
                retryCount--;
            }
        }
        throw new Error("Exceeded maximum retry count. Unable to save document.");
    } finally {
        documentLocks.delete(documentId);
    }
}

async function updateDocumentWithRetry(document, retryCount, delayMs) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return await saveDocumentWithRetry(document, retryCount, delayMs);
}

module.exports = saveDocumentWithRetry;
