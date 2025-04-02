"use client";

import { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';

interface TextWindowProps {
  id: string;
  content: string;
  systemPrompt: string;
  title: string;
  chatHistory: string;
  onContentChange: (id: string, content: string) => void;
  onPromptChange: (id: string, prompt: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onProcessWithAI: (id: string) => void;
  onChatHistoryChange: (id: string, history: string) => void;
}

const ASSISTANT_TEMPLATES = {
  styleEditor: "Focus on improving writing style, word choice, and flow. Suggest ways to make the prose more engaging while maintaining the author's voice.",
  grammarEditor: "Focus on grammar, punctuation, and technical writing accuracy. Ensure clarity and correctness while preserving meaning.",
  storyEditor: "Focus on narrative elements like plot, pacing, character development, and story structure. Suggest improvements while maintaining the story's core themes.",
  dialogueEditor: "Focus on making dialogue more natural and effective. Check for authenticity, character voice, and dramatic impact.",
  descriptionEditor: "Focus on descriptive language, sensory details, and scene-setting. Help make descriptions more vivid and immersive.",
  academicEditor: "Focus on academic writing conventions, argument structure, and scholarly tone. Ensure clarity and rigor in academic prose."
};

const TextWindow: React.FC<TextWindowProps> = ({ 
  id, 
  content, 
  systemPrompt, 
  title,
  chatHistory,
  onContentChange,
  onPromptChange,
  onTitleChange,
  onChatHistoryChange
}) => {
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [newMessage, setNewMessage] = useState('');
  const [originalContent, setOriginalContent] = useState('');

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleProcessWithAI = () => {
    setOriginalContent(content);
    setIsChatExpanded(true);
    const initialMessage = content;
    handleSendMessage(initialMessage, true);
  };

  const handleSaveChanges = () => {
    onContentChange(id, editedContent);
    setIsChatExpanded(false);
  };

  const handleSendMessage = async (message: string, isInitial: boolean = false) => {
    const messageToSend = isInitial ? message : newMessage;
    if (!messageToSend.trim()) return;

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageToSend,
          systemPrompt: systemPrompt + "\nPlease provide a brief analysis and then a revised version of the ORIGINAL text about machine learning. Keep the same topic and main points, but make the requested improvements. Separate your response with '---REVISED VERSION---'. Always refer back to the original content about machine learning when making revisions.",
          originalContent: originalContent
        })
      });

      const data = await response.json();
      
      const updatedHistory = chatHistory 
        ? `${chatHistory}\n\nUser: ${messageToSend}\nAI: ${data.response}`
        : `User: ${messageToSend}\nAI: ${data.response}`;

      if (data.response.includes('---REVISED VERSION---')) {
        const revisedVersion = data.response.split('---REVISED VERSION---')[1];
        setEditedContent(revisedVersion.trim());
      }

      onChatHistoryChange(id, updatedHistory);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 overflow-hidden hover:shadow-[0_0_40px_rgba(255,98,0,0.15)] transition-all duration-300">
      <div className="px-8 py-6 bg-zinc-800/50 border-b border-zinc-700 flex items-center justify-between">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(id, e.target.value)}
          placeholder="Enter window title..."
          className="text-xl font-light tracking-wide text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-zinc-500"
        />
        {chatHistory && (
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-800 via-orange-900 to-orange-950 text-zinc-200 hover:brightness-110 transition-colors border border-orange-900/20"
          >
            <span className="text-sm text-zinc-200">💬 View Chat</span>
            <span className="w-2 h-2 rounded-full bg-white/50"></span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-12 p-10">
        <div className="col-span-2 space-y-8">
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50 shadow-inner hover:border-orange-500/20 transition-colors">
            <Editor
              height="500px"
              defaultLanguage="markdown"
              value={content}
              onChange={(value) => onContentChange(id, value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                lineHeight: 1.8,
                padding: { top: 32, bottom: 32 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'off',
                folding: false,
                renderLineHighlight: 'none',
              }}
            />
          </div>
          <button
            onClick={handleProcessWithAI}
            className="w-full py-5 px-8 bg-gradient-to-r from-orange-800 via-orange-900 to-orange-950 text-zinc-200 rounded-xl hover:brightness-110 focus:ring-4 focus:ring-orange-900/20 transition-all duration-300 font-light tracking-wide text-sm flex items-center justify-center space-x-3 border border-orange-900/20"
          >
            <span>Process with AI</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-light tracking-wide text-zinc-300 block">AI Assistant Role</label>
              <p className="text-xs text-zinc-500">Be specific about what aspects of writing you want the assistant to focus on</p>
            </div>
            <select 
              className="w-full text-sm bg-zinc-800/50 border border-zinc-700 rounded-xl px-5 py-3 text-zinc-300 hover:border-white focus:border-white focus:ring-1 focus:ring-white/20 transition-colors"
              onChange={(e) => onPromptChange(id, ASSISTANT_TEMPLATES[e.target.value as keyof typeof ASSISTANT_TEMPLATES] || '')}
            >
              <option value="">Choose Template</option>
              <option value="styleEditor">Style Editor</option>
              <option value="grammarEditor">Grammar Editor</option>
              <option value="storyEditor">Story Editor</option>
              <option value="dialogueEditor">Dialogue Editor</option>
              <option value="descriptionEditor">Description Editor</option>
              <option value="academicEditor">Academic Editor</option>
            </select>
          </div>
          <textarea
            className="w-full p-6 border-2 border-zinc-600 rounded-xl bg-zinc-800/80 text-sm text-zinc-200 resize-none focus:ring-2 focus:ring-white/20 focus:border-white transition-all min-h-[220px] leading-relaxed"
            placeholder="Focus on grammar, punctuation, and technical writing accuracy. Ensure clarity and correctness while preserving meaning."
            value={systemPrompt}
            onChange={(e) => onPromptChange(id, e.target.value)}
            rows={8}
          />
        </div>
      </div>

      {isChatExpanded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-12">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-5xl border border-zinc-700 shadow-2xl flex flex-col h-[80vh]">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-light text-zinc-200">AI Conversation History</h3>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-gradient-to-r from-orange-800 via-orange-900 to-orange-950 text-zinc-200 rounded-lg hover:brightness-110 transition-all duration-300 text-sm border border-orange-900/20"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => setIsChatExpanded(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 p-6 flex-grow overflow-hidden">
              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-4">
                <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {chatHistory.split('User: ').map((exchange, index) => {
                    if (index === 0) return null;
                    const [userMessage, aiResponse] = exchange.split('AI: ');
                    return (
                      <div key={index} className="mb-8">
                        <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                          <span className="text-zinc-400 text-xs mb-2 block">You wrote:</span>
                          {userMessage}
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-4">
                          <span className="text-zinc-400 text-xs mb-2 block">AI Assistant:</span>
                          {aiResponse}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col h-full">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Edit Revised Version</span>
                  <button 
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-gradient-to-r from-orange-800 via-orange-900 to-orange-950 text-zinc-200 rounded-lg hover:brightness-110 transition-all duration-300 text-sm border border-orange-900/20"
                  >
                    Apply Changes
                  </button>
                </div>
                <div className="flex-grow border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/50">
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    value={editedContent}
                    onChange={(value) => setEditedContent(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineHeight: 1.8,
                      padding: { top: 20, bottom: 20 },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                      lineNumbers: 'off',
                      folding: false,
                      renderLineHighlight: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(newMessage)}
                  placeholder="Ask a question or request changes..."
                  className="flex-grow bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-white focus:ring-1 focus:ring-white/20 transition-colors"
                />
                <button
                  onClick={(e) => { e.preventDefault(); handleSendMessage(newMessage); }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-800 via-orange-900 to-orange-950 text-zinc-200 rounded-xl hover:brightness-110 transition-all duration-300 text-sm font-light flex items-center space-x-2 border border-orange-900/20"
                >
                  <span>Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface Window {
  id: string;
  title: string;
  content: string;
  systemPrompt: string;
  chatHistory: string;
}

export default function TextEditor() {
  const [windows, setWindows] = useState<Window[]>([
    { 
      id: '1', 
      title: 'Style & Flow',
      content: '', 
      systemPrompt: ASSISTANT_TEMPLATES.styleEditor,
      chatHistory: '' 
    },
    { 
      id: '2', 
      title: 'Grammar & Technical',
      content: '', 
      systemPrompt: ASSISTANT_TEMPLATES.grammarEditor,
      chatHistory: '' 
    },
    { 
      id: '3', 
      title: 'Story Structure',
      content: '', 
      systemPrompt: ASSISTANT_TEMPLATES.storyEditor,
      chatHistory: '' 
    },
    { 
      id: '4', 
      title: 'Custom Editor',
      content: '', 
      systemPrompt: 'Customize this editor for your specific needs...',
      chatHistory: '' 
    }
  ]);

  const handleContentChange = (id: string, newContent: string) => {
    setWindows(windows.map(window => 
      window.id === id ? { ...window, content: newContent } : window
    ));
  };

  const handlePromptChange = (id: string, newPrompt: string) => {
    setWindows(windows.map(window => 
      window.id === id ? { ...window, systemPrompt: newPrompt } : window
    ));
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setWindows(windows.map(window => 
      window.id === id ? { ...window, title: newTitle } : window
    ));
  };

  const processWithAI = async (windowId: string) => {
    const window = windows.find(w => w.id === windowId);
    if (!window) return;

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: window.content,
          systemPrompt: window.systemPrompt
        })
      });

      const data = await response.json();
      
      setWindows(windows.map(w => 
        w.id === windowId 
          ? { 
              ...w, 
              chatHistory: w.chatHistory 
                ? `${w.chatHistory}\n\nUser: ${w.content}\nAI: ${data.response}`
                : `User: ${w.content}\nAI: ${data.response}`
            } 
          : w
      ));
    } catch (error) {
      console.error('Error processing with AI:', error);
    }
  };

  const handleChatHistoryChange = (id: string, newHistory: string) => {
    setWindows(windows.map(window => 
      window.id === id ? { ...window, chatHistory: newHistory } : window
    ));
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[1800px] mx-auto p-12">
        <div className="mb-16">
          <h1 className="text-5xl font-light tracking-tight text-white mb-4">AI Writing Assistant</h1>
          <p className="text-lg text-zinc-400 font-light tracking-wide">Use multiple windows to edit and improve different aspects of your writing simultaneously.</p>
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-12">
          {windows.map((window) => (
            <div key={window.id} className="space-y-6">
              <TextWindow
                id={window.id}
                title={window.title}
                content={window.content}
                systemPrompt={window.systemPrompt}
                chatHistory={window.chatHistory}
                onContentChange={handleContentChange}
                onPromptChange={handlePromptChange}
                onTitleChange={handleTitleChange}
                onProcessWithAI={processWithAI}
                onChatHistoryChange={handleChatHistoryChange}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
