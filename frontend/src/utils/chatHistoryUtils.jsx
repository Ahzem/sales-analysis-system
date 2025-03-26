// Get chat history for a specific file
export const getChatHistory = (fileId) => {
  try {
    const historyKey = `chat_history_${fileId}`;
    const storedHistory = localStorage.getItem(historyKey);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    return [];
  }
};

// Save chat history for a specific file
export const saveChatHistory = (fileId, messages) => {
  try {
    const historyKey = `chat_history_${fileId}`;
    localStorage.setItem(historyKey, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

// Clear chat history for a specific file
export const clearChatHistory = (fileId) => {
  try {
    const historyKey = `chat_history_${fileId}`;
    localStorage.removeItem(historyKey);
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
};

// Get all file IDs that have chat history
export const getFilesWithChatHistory = () => {
  try {
    const fileIds = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('chat_history_')) {
        const fileId = key.replace('chat_history_', '');
        fileIds.push(fileId);
      }
    }
    return fileIds;
  } catch (error) {
    console.error('Error getting files with chat history:', error);
    return [];
  }
};