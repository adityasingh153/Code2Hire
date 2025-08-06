/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =================================================================================
// IMPORTANT: SET YOUR API KEY HERE
// =================================================================================
// 1. Get your API key from Google AI Studio: https://aistudio.google.com/app/apikey
// 2. Replace "YOUR_API_KEY_HERE" with your actual key.
//
// WARNING: For local testing only. For production, use a server-side proxy
// to protect your key. Do not expose your API key in a public website.
const API_KEY = "AIzaSyBTPTF9o-2GoFFumOk5Ei9Yr0diJ-1xPcg";
// =================================================================================


// This module is resolved by the `importmap` in the HTML file.
import { GoogleGenAI } from '@google/genai';


const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const messageList = document.getElementById('message-list');

// Graceful exit if core elements are missing.
if (!chatForm || !chatInput || !messageList) {
  console.error('Core chat elements could not be found. Aborting initialization.');
  // Use a simple alert for critical failures where the chat UI can't be used.
  alert('Error: Could not initialize the chat window components.');
} else {
  const sendButton = chatForm.querySelector('button');


  const SYSTEM_INSTRUCTION = `You are a very well-mannered but smart AI assistant for Code2Hire. Code2Hire is a career preparation platform that helps people learn Data Structures & Algorithms, core computer science subjects, and various programming languages. It also helps users create ATS-friendly resumes. Your goal is to help users with their problems in academics or coding by providing easy and accurate answers.`;

  let chat = null;

  function initializeChat() {
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      addMessage('error', 'API Key not set. Please open index.js, find the API_KEY constant, and add your Google AI API key to get started.');
      chatInput.placeholder = "API Key not set";
      chatInput.disabled = true;
      sendButton.disabled = true;
      return;
    }
    
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });
      addMessage('assistant', 'Welcome to Code2Hire! How can I help you with your career preparation today?');
    } catch (error) {
      console.error("Failed to initialize the chat:", error);
      addMessage('error', 'There was an error starting the chat. Please check if your API key is valid and refresh the page.');
      chatInput.placeholder = "Error during initialization";
      chatInput.disabled = true;
      sendButton.disabled = true;
    }
  }

  function addMessage(sender, message, isStreaming = false) {
    const messageId = `msg-${Date.now()}`;
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    if (isStreaming) {
      messageElement.id = messageId;
    }
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = message;
    
    messageElement.appendChild(contentElement);
    messageList.appendChild(messageElement);
    messageList.scrollTop = messageList.scrollHeight;
    return messageId;
  }

  function addTypingIndicator() {
    const indicatorId = 'typing-indicator';
    if (document.getElementById(indicatorId)) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'assistant-message');
    messageElement.id = indicatorId;
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content', 'typing-indicator');
    contentElement.innerHTML = '<span></span><span></span><span></span>';
    
    messageElement.appendChild(contentElement);
    messageList.appendChild(messageElement);
    messageList.scrollTop = messageList.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userMessage = chatInput.value.trim();
    if (!userMessage || !chat) return;

    addMessage('user', userMessage);
    chatInput.value = '';
    chatInput.focus();

    addTypingIndicator();

    try {
      const stream = await chat.sendMessageStream({ message: userMessage });

      removeTypingIndicator();
      let assistantResponse = '';
      let messageId = null;
      
      for await (const chunk of stream) {
        assistantResponse += chunk.text;
        if (!messageId) {
          messageId = addMessage('assistant', assistantResponse, true);
        } else {
          const messageContent = document.querySelector(`#${messageId} .message-content`);
          if (messageContent) {
            messageContent.textContent = assistantResponse;
          }
        }
        messageList.scrollTop = messageList.scrollHeight;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      removeTypingIndicator();
      addMessage('error', 'Sorry, I encountered an error. Please try again.');
    }
  });

  initializeChat();
}