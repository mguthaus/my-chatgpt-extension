/******************************************************
 * popup.js
 * - Retrieves selected text from session storage.
 * - Remembers the last used prompt in local storage.
 * - Offers two shortcut prompt buttons.
 * - Calls the OpenAI API and displays the result.
 ******************************************************/

// === DOM Elements ===
const selectedTextEl = document.getElementById("selectedText");
const promptEl = document.getElementById("prompt");
const responseEl = document.getElementById("response");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyBtn");
const btnSummarize = document.getElementById("btnSummarize");
const btnCopyEdit = document.getElementById("btnCopyEdit");

// === OpenAI API Key (Replace with your real key!) ===
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY_HERE";

// On popup load:
// 1) Retrieve selected text from session storage
// 2) Retrieve the last used prompt from local storage
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1) Get selected text from session storage
    const { selectedText } = await chrome.storage.session.get(["selectedText"]);
    if (selectedText) {
      selectedTextEl.value = selectedText;
    } else {
      selectedTextEl.value = "No selected text available.\n\nTip: Right-click on some text and choose 'Send selected text to OpenAI' before opening this popup.";
    }

    // 2) Retrieve the last used prompt from local storage
    chrome.storage.local.get("lastPrompt", (data) => {
      if (data.lastPrompt) {
        promptEl.value = data.lastPrompt;
      }
    });
  } catch (error) {
    console.error("Error retrieving session/local data:", error);
    selectedTextEl.value = "Error: Could not retrieve selected text.";
  }
});

// --- Generic prompt buttons ---

// 1) Summarize
btnSummarize.addEventListener("click", () => {
  promptEl.value = "Summarize the selected text without omitting key details.";
});

// 2) Copy Edit
btnCopyEdit.addEventListener("click", () => {
  promptEl.value = "Copy edit the selected text to be direct and to the point.";
});

// --- Send to ChatGPT ---
sendBtn.addEventListener("click", async () => {
  // Get user prompt and selected text
  const userPrompt = promptEl.value.trim();
  const textToUse = selectedTextEl.value.trim();

  if (!userPrompt) {
    responseEl.value = "Please enter a prompt or select a generic prompt.";
    return;
  }

  // If there's a placeholder message in the selected text, it likely means none was stored
  if (!textToUse || textToUse.startsWith("No selected text available.")) {
    responseEl.value = "No valid text to send. Right-click text → 'Send...' first.";
    return;
  }

  // Save the user's prompt in local storage for next time
  chrome.storage.local.set({ lastPrompt: userPrompt });

  // Prepare the messages for OpenAI
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant."
    },
    {
      role: "user",
      content: `Prompt: ${userPrompt}\n\nSelected Text: ${textToUse}`
    }
  ];

  try {
    responseEl.value = "Loading...";

    // Make the request to OpenAI Chat Completion endpoint
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const responseData = await response.json();
    const assistantMessage = responseData.choices[0].message.content;

    // Display the result
    responseEl.value = assistantMessage;
  } catch (err) {
    console.error("OpenAI request error:", err);
    responseEl.value = `Error: ${err.message}`;
  }
});

// --- Copy Button ---
copyBtn.addEventListener("click", () => {
  const textToCopy = responseEl.value;
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        console.log("Response copied to clipboard");
      },
      (err) => {
        console.error("Failed to copy:", err);
      }
    );
  }
});


