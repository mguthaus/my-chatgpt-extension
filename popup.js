//******************************************************
 * popup.js
 *  - Dynamically loads the OpenAI API key from apiKey.json
 *  - Retrieves selected text from session storage
 *  - Remembers the last used prompt in local storage
 *  - Offers two shortcut prompt buttons
 *  - Calls the OpenAI API and displays the result
 ******************************************************/

let OPENAI_API_KEY = null; // Will be loaded from apiKey.json

// --- DOM Elements ---
const selectedTextEl = document.getElementById("selectedText");
const promptEl = document.getElementById("prompt");
const responseEl = document.getElementById("response");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyBtn");
const btnSummarize = document.getElementById("btnSummarize");
const btnCopyEdit = document.getElementById("btnCopyEdit");

// 1) Load the API key from apiKey.json asynchronously
async function loadApiKey() {
  try {
    const response = await fetch(chrome.runtime.getURL("apiKey.json"));
    if (!response.ok) {
      throw new Error("Failed to load apiKey.json");
    }
    const data = await response.json();
    OPENAI_API_KEY = data.openaiApiKey;
    if (!OPENAI_API_KEY) {
      console.warn("No API key found in apiKey.json");
    }
  } catch (error) {
    console.error("Error loading API key:", error);
  }
}

// 2) On popup load, do two things:
//    a) load the API key
//    b) retrieve selected text (session storage)
//    c) retrieve the last used prompt (local storage)
document.addEventListener("DOMContentLoaded", async () => {
  await loadApiKey();

  try {
    const { selectedText } = await chrome.storage.session.get(["selectedText"]);
    if (selectedText) {
      selectedTextEl.value = selectedText;
    } else {
      selectedTextEl.value =
        "No selected text available.\n\n(Please highlight text, right-click, and choose 'Send selected text to OpenAI' first.)";
    }
  } catch (err) {
    console.error("Error retrieving session data:", err);
    selectedTextEl.value = "Error: Could not retrieve selected text.";
  }

  // Retrieve last used prompt
  chrome.storage.local.get("lastPrompt", (data) => {
    if (data.lastPrompt) {
      promptEl.value = data.lastPrompt;
    }
  });
});

// --- Generic prompt buttons ---
btnSummarize.addEventListener("click", () => {
  promptEl.value = "Summarize the selected text without omitting key details.";
});

btnCopyEdit.addEventListener("click", () => {
  promptEl.value = "Copy edit the selected text to be direct and to the point.";
});

// --- Send to ChatGPT ---
sendBtn.addEventListener("click", async () => {
  // 1) Gather user input
  const userPrompt = promptEl.value.trim();
  const textToUse = selectedTextEl.value.trim();

  if (!OPENAI_API_KEY) {
    responseEl.value = "No API key loaded. Check apiKey.json or network errors.";
    return;
  }

  if (!userPrompt) {
    responseEl.value = "Please enter a prompt or use a generic prompt.";
    return;
  }

  if (!textToUse || textToUse.startsWith("No selected text available")) {
    responseEl.value = "No valid text available. Right-click text → 'Send selected text to OpenAI' first.";
    return;
  }

  // 2) Save the user's prompt for next time
  chrome.storage.local.set({ lastPrompt: userPrompt });

  // 3) Prepare messages for the ChatGPT API
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    {
      role: "user",
      content: `Prompt: ${userPrompt}\n\nSelected Text: ${textToUse}`
    }
  ];

  try {
    responseEl.value = "Loading...";

    // 4) Call the OpenAI Chat Completion endpoint
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
    responseEl.value = assistantMessage;
  } catch (err) {
    console.error("OpenAI request error:", err);
    responseEl.value = `Error: ${err.message}`;
  }
});

// --- Copy the response to the clipboard ---
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

