/******************************************************
 * background.js
 * Creates a context menu item and stores the
 * selected text in chrome.storage.session.
 ******************************************************/

// Create a context menu item whenever the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendToOpenAI",
    title: "Send selected text to OpenAI",
    contexts: ["selection"]
  });
});

// Listen for a context menu click and store the selected text
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToOpenAI") {
    const selectedText = info.selectionText || "";

    // Save the selected text in session storage
    chrome.storage.session.set({ selectedText: selectedText }, () => {
      console.log("Selected text stored in session:", selectedText);
    });
  }
});

