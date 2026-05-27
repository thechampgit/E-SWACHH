'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, PlusCircle, Map as MapIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { chatWithAssistant } from '@/ai/flows/ai-assistant';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
    { role: 'model', content: "Hello! I'm your e-Swachh Assistant. How can I help you improve the city today?" }
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
      setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to the civic servers. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground border-none" 
              onClick={() => setIsOpen(true)}
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card className="w-[380px] h-[520px] shadow-2xl border flex flex-col rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-white p-4 flex flex-row items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">AI</div>
                  <CardTitle className="text-sm font-bold text-slate-900">Civic Assistant</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <div 
                        key={i} 
                        className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}
                      >
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-xl text-sm leading-relaxed",
                          m.role === 'user' 
                            ? "bg-primary text-white" 
                            : "bg-white text-slate-800 border shadow-sm"
                        )}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start">
                        <div className="bg-white border text-slate-400 p-2 rounded-xl shadow-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-3 border-t bg-white gap-2 flex-col">
                <div className="flex gap-2 w-full">
                  <Input 
                    placeholder="Ask a question..." 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="text-xs h-9 bg-slate-50 border-none"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0 rounded-md" onClick={handleSend} disabled={isLoading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-around gap-2 w-full pt-2 border-t mt-2">
                  <QuickButton icon={<PlusCircle size={12} />} label="Report" href="/report" />
                  <QuickButton icon={<MapIcon size={12} />} label="Map" href="/map" />
                  <QuickButton icon={<Search size={12} />} label="Track" href="/my-reports" />
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickButton({ icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 group text-[10px] text-slate-500 hover:text-primary transition-colors">
      <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
