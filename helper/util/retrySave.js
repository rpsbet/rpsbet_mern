const documentLocks = new Map();

async function saveDocumentWithRetry(document, retryCount = 30, delayMs = 800) {

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
                console.log("Retrying... Retry count:", retryCount);
                retryCount--; // Decrement retryCount here
                console.log("After decrementing, Retry count:", retryCount);
            }
        }
        console.log("retryCount", retryCount)
        throw new Error(`Exceeded maximum retry count. Unable to save document with ID: ${document}`);
    } finally {
        documentLocks.delete(documentId);
    }
}

async function updateDocumentWithRetry(document, retryCount, delayMs) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return await saveDocumentWithRetry(document, retryCount, delayMs);
}

module.exports = saveDocumentWithRetry;
