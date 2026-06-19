'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Settings, User, FileText, Paperclip, MoreHorizontal } from 'lucide-react';

export default function ChatInterfacePage() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: "Hello! I'm your TaskMind agent. I'm connected to your workspace. What can I help you with today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Mock response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'assistant', 
        content: `I've received your request: "${userMsg.content}". Since I'm currently running in preview mode, I can't execute real backend actions yet. However, I'm ready to help you orchestrate your tasks once fully connected!` 
      }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center border border-border">
            <Bot className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm">General Assistant</h2>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border ${msg.role === 'user' ? 'bg-secondary' : 'bg-background'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{msg.role === 'user' ? 'You' : 'TaskMind'}</span>
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-foreground text-background rounded-tr-sm border-transparent' 
                  : 'bg-card text-foreground rounded-tl-sm border-border'
              }`}>
                {msg.content}
              </div>
            </div>

          </div>
        ))}

        {loading && (
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border px-4 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-background shrink-0">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-card border border-border rounded-xl shadow-sm p-2 focus-within:ring-2 focus-within:ring-foreground/20 focus-within:border-foreground/50 transition-all">
            
            <button type="button" className="p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Ask TaskMind to do anything..."
              className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none py-3 text-sm focus:outline-none placeholder:text-muted-foreground"
              rows={1}
            />

            <button 
              type="submit" 
              disabled={!input.trim() || loading}
              className="p-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5 mr-0.5"
            >
              <Send className="w-4 h-4" />
            </button>

          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-muted-foreground">TaskMind can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
