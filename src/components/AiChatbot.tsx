
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Map as MapIcon, PlusCircle, Search, Zap } from 'lucide-react';
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
    { role: 'model', content: "Protocol initialized. I am your CivicPulse AI. How shall we optimize the city today?" }
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
      setMessages(prev => [...prev, { role: 'model', content: "Neural link interrupted. Please restablish connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
          >
            <Button 
              size="icon" 
              className="h-16 w-16 rounded-[2rem] shadow-[0_20px_40px_rgba(6,182,212,0.4)] bg-gradient-to-tr from-primary to-cyan-400 text-primary-foreground border-none" 
              onClick={() => setIsOpen(true)}
            >
              <Zap className="h-8 w-8 fill-primary-foreground" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(10px)' }}
          >
            <Card className="w-[420px] h-[600px] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col rounded-[3rem] overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/80 to-cyan-600/80 backdrop-blur-xl p-6 flex flex-row items-center justify-between shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><Zap className="h-6 w-6 text-white" /></div>
                  <CardTitle className="text-xl font-black text-white tracking-tight">Civic AI</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10 rounded-2xl" onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-transparent">
                <ScrollArea className="h-full p-6" ref={scrollRef}>
                  <div className="space-y-6">
                    {messages.map((m, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}
                      >
                        <div className={cn(
                          "max-w-[90%] p-5 rounded-[2rem] text-sm leading-relaxed font-medium shadow-2xl",
                          m.role === 'user' 
                            ? "bg-primary text-white rounded-br-none" 
                            : "bg-white/10 text-white/90 backdrop-blur-md border border-white/5 rounded-bl-none"
                        )}>
                          {m.content}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-2">
                        <div className="bg-white/5 backdrop-blur-md text-primary p-4 rounded-3xl rounded-bl-none border border-white/5">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-6 border-t border-white/10 bg-black/20 gap-3 shrink-0">
                <Input 
                  placeholder="Ask the pulse..." 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="text-sm h-14 border-white/10 bg-white/5 rounded-2xl focus:ring-primary/20 placeholder:text-white/20"
                />
                <Button size="icon" className="h-14 w-14 shrink-0 rounded-2xl bg-primary hover:bg-primary/90" onClick={handleSend} disabled={isLoading}>
                  <Send className="h-6 w-6" />
                </Button>
              </CardFooter>
              <div className="px-6 pb-6 bg-transparent flex justify-around gap-4">
                <QuickAction icon={<PlusCircle size={16} />} label="Report" href="/report" />
                <QuickAction icon={<MapIcon size={16} />} label="Grid" href="/map" />
                <QuickAction icon={<Search size={16} />} label="Sync" href="/track" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAction({ icon, label, href }: { icon: any, label: string, href: string }) {
  return (
    <Link href={href} className="flex-1 flex flex-col items-center gap-2 group">
      <div className="w-full py-3 bg-white/5 rounded-2xl border border-white/5 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all flex items-center justify-center">
        <div className="text-white/40 group-hover:text-primary transition-colors">{icon}</div>
      </div>
      <span className="text-[10px] font-black text-white/20 group-hover:text-primary uppercase tracking-widest">{label}</span>
    </Link>
  );
}
