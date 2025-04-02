"use client";

import { useState } from 'react';
import { Editor } from '@monaco-editor/react';

interface TextWindowProps {
  id: string;
  content: string;
  systemPrompt: string;
  title: string;
  onContentChange: (id: string, content: string) => void;
  onPromptChange: (id: string, prompt: string) => void;
  onTitleChange: (id: string, title: string) => void;
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
  onContentChange,
  onPromptChange,
  onTitleChange 
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(id, e.target.value)}
          placeholder="Enter window title..."
          className="text-xl font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-gray-400"
        />
      </div>
      <div className="p-6 space-y-6">
        <div className="border rounded-xl overflow-hidden bg-gray-50 shadow-inner">
          <Editor
            height="320px"
            defaultLanguage="markdown"
            value={content}
            onChange={(value) => onContentChange(id, value || '')}
            theme="light"
            options={{
              minimap: { enabled: false },
              fontSize: 15,
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
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">AI Assistant Role</label>
            <select 
              className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
            className="w-full p-4 border border-gray-200 rounded-xl bg-white text-sm resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            placeholder="Describe what you want the AI to focus on..."
            value={systemPrompt}
            onChange={(e) => onPromptChange(id, e.target.value)}
            rows={3}
          />
          <p className="text-xs text-gray-500 italic bg-blue-50 p-3 rounded-lg">
            💡 Tip: Be specific about what aspects of writing you want the assistant to focus on.
            You can use the templates above or write your own custom instructions.
          </p>
        </div>
      </div>
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

  return (
    <div className="max-w-[1800px] mx-auto p-8">
      <div className="grid grid-cols-2 gap-8">
        {windows.map((window) => (
          <div key={window.id} className="space-y-6">
            <TextWindow
              id={window.id}
              title={window.title}
              content={window.content}
              systemPrompt={window.systemPrompt}
              onContentChange={handleContentChange}
              onPromptChange={handlePromptChange}
              onTitleChange={handleTitleChange}
            />
            <div className="flex flex-col space-y-4">
              <button
                onClick={() => processWithAI(window.id)}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-medium text-sm shadow-sm"
              >
                Process with AI
              </button>
              {window.chatHistory && (
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">💬</span> Chat History
                  </h3>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[240px] overflow-y-auto custom-scrollbar">
                    {window.chatHistory}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
