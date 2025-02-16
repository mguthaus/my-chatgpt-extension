/******************************************************
 * background.js
 * - Creates a context menu item.
 * - Stores selected text in session storage.
 * - Automatically opens the popup after the user clicks
 *   the context menu (using chrome.action.openPopup()).
 ******************************************************/

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendToOpenAI",
    title: "Send selected text to OpenAI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendToOpenAI") {
    const selectedText = info.selectionText || "";

    // Store the selected text in session storage
    chrome.storage.session.set({ selectedText: selectedText }, () => {
      console.log("Selected text stored in session:", selectedText);

      // Attempt to open the popup automatically
      // This should be allowed because the context menu click is a user gesture
      chrome.action.openPopup().catch((err) => {
        console.warn("Could not open popup automatically:", err);
      });
    });
  }
});

