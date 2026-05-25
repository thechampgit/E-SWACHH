'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Map as MapIcon, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { chatWithAssistant } from '@/ai/flows/ai-assistant';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hi! I'm your CivicPulse Assistant. How can I help you improve our city today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await chatWithAssistant({
        message: userMsg,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'model', content: result.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {!isOpen ? (
        <Button 
          size="icon" 
          className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary text-primary-foreground" 
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-[380px] h-[520px] shadow-2xl border-none flex flex-col animate-in slide-in-from-bottom-5">
          <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-sm font-bold">Civic Assistant</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                      m.role === 'user' ? "bg-primary text-white rounded-br-none" : "bg-white text-slate-800 shadow-sm border rounded-bl-none"
                    )}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white text-slate-800 shadow-sm border p-3 rounded-2xl rounded-bl-none">
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t bg-white gap-2 shrink-0">
            <Input 
              placeholder="Ask a question..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="text-xs h-9 border-slate-200"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </CardFooter>
          <div className="px-4 py-2 bg-slate-50 border-t flex justify-around gap-2">
            <Link href="/report" className="flex flex-col items-center gap-1 group">
              <div className="p-1.5 bg-white rounded-full border group-hover:bg-primary/5 group-hover:border-primary transition-colors">
                <PlusCircle className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Report</span>
            </Link>
            <Link href="/map" className="flex flex-col items-center gap-1 group">
              <div className="p-1.5 bg-white rounded-full border group-hover:bg-primary/5 group-hover:border-primary transition-colors">
                <MapIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Map</span>
            </Link>
            <Link href="/track" className="flex flex-col items-center gap-1 group">
              <div className="p-1.5 bg-white rounded-full border group-hover:bg-primary/5 group-hover:border-primary transition-colors">
                <Search className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Track</span>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
