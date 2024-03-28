
const { ParallelSaveError } = require('mongoose');

async function saveDocumentWithRetry(document, retryCount = 3, delayMs = 1000) {
    while (retryCount > 0) {
        try {
            await document.save();
            return; // Save successful, exit loop
        } catch (error) {
            if (error instanceof ParallelSaveError) {
                console.log("Document is already being saved, retrying...");
                await new Promise(resolve => setTimeout(resolve, delayMs)); // Wait before retrying
                retryCount--; // Decrement retry count
            } else {
                throw error; // Re-throw error if it's not ParallelSaveError
            }
        }
    }
    throw new Error("Exceeded maximum retry count. Unable to save document.");
}

module.exports = saveDocumentWithRetry;