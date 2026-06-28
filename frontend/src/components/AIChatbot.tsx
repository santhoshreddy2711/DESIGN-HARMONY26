import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, X, Sparkles, Bot, User } from 'lucide-react';

interface Message {
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

const AIChatbot: React.FC = () => {
  const { apiFetch } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I am your Design & Harmony ERP AI Assistant. How can I help you manage your business today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMsg: Message = { sender: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let botResponse = "I'm sorry, I didn't quite catch that. Try asking about 'inventory status', 'active projects', or 'sales summary'.";
      const normalizedText = text.toLowerCase();

      if (normalizedText.includes('project')) {
        // Fetch projects
        const projects = await apiFetch('/projects');
        if (projects && projects.length > 0) {
          const summary = projects.map((p: any) => 
            `• **${p.project_name}** - Status: *${p.status}* (${p.progress_percentage}% completed)`
          ).join('\n');
          botResponse = `Here is a summary of your active design projects:\n\n${summary}\n\nYou can click on the **Projects** tab in the sidebar to upload blueprints or manage milestone checklists.`;
        } else {
          botResponse = "I checked your system and there are no active design projects registered at the moment.";
        }
      } 
      else if (normalizedText.includes('stock') || normalizedText.includes('inventory') || normalizedText.includes('product')) {
        // Fetch products
        const products = await apiFetch('/products');
        if (products && products.length > 0) {
          const lowStock = products.filter((p: any) => p.quantity <= 5);
          const stockSummary = products.map((p: any) => 
            `• **${p.product_name}**: ${p.quantity} units left (${p.quantity <= 3 ? '⚠️ CRITICAL' : 'OK'})`
          ).join('\n');

          botResponse = `Here is your current inventory stock summary:\n\n${stockSummary}`;
          if (lowStock.length > 0) {
            botResponse += `\n\n⚠️ **Low Stock Alert**: The following items need restocking: ${lowStock.map((p: any) => p.product_name).join(', ')}.`;
          }
        } else {
          botResponse = "No products found in the database catalog.";
        }
      }
      else if (normalizedText.includes('sales') || normalizedText.includes('revenue') || normalizedText.includes('money') || normalizedText.includes('billing') || normalizedText.includes('invoice')) {
        // Fetch invoices
        const invoices = await apiFetch('/invoices');
        if (invoices && invoices.length > 0) {
          const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.grand_total), 0);
          const pending = invoices.filter((i: any) => i.payment_status === 'Pending' || i.payment_status === 'Partially Paid');
          const unpaidTotal = pending.reduce((sum: number, inv: any) => sum + (parseFloat(inv.grand_total) - (inv.payments?.reduce((s: number, p: any) => s + parseFloat(p.amount), 0) || 0)), 0);

          botResponse = `Here is the financial & billing summary:\n\n` +
            `• **Total Tax Invoices Raised**: ₹${totalInvoiced.toLocaleString('en-IN')}\n` +
            `• **Outstanding Balances**: ₹${unpaidTotal.toLocaleString('en-IN')}\n` +
            `• **Pending/Partial Invoices**: ${pending.length} invoices\n\n` +
            `You can view full tax breakdowns and record payments inside the **Invoices** module.`;
        } else {
          botResponse = "There are no invoices found in your ERP records.";
        }
      }
      else if (normalizedText.includes('gst') || normalizedText.includes('tax')) {
        botResponse = "Design & Harmony ERP is fully GST-compliant! It automatically calculates 18% GST (9% CGST + 9% SGST) on interior design items and services when generating Tax Invoices, and handles tax summary sheets in the Reports section.";
      }
      else if (normalizedText.includes('hello') || normalizedText.includes('hi') || normalizedText.includes('hey') || normalizedText.includes('help')) {
        botResponse = "Hello! I am your Design & Harmony ERP assistant. I can query live system data. Ask me: \n" +
          "1. *'Show active projects'* to list ongoing villa/home renovations.\n" +
          "2. *'Check stock levels'* to check inventory status.\n" +
          "3. *'What is our billing summary?'* to show invoice totals.\n" +
          "4. *'Is it GST compliant?'* to learn about taxes.";
      }

      // Simulate a small typing delay
      setTimeout(() => {
        const botMsg: Message = { sender: 'bot', text: botResponse, timestamp: new Date() };
        setMessages(prev => [...prev, botMsg]);
        setLoading(false);
      }, 550);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I had trouble retrieving live data from the ERP server.", timestamp: new Date() }]);
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-white rounded-full shadow-2xl flex items-center justify-center transition active:scale-95 group relative border border-gold-400/20 animate-bounce"
        style={{ animationDuration: '3s' }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-darkbg" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[480px] bg-white dark:bg-[#151515] border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-zinc-900 to-zinc-950 border-b border-zinc-800 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gold-600/20 border border-gold-500/30 flex items-center justify-center text-gold-500">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Harmony AI Assistant</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                  <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">Online • Connected to ERP</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                  msg.sender === 'bot' 
                    ? 'bg-gold-600/10 border border-gold-500/20 text-gold-500' 
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {msg.sender === 'bot' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-3 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                  msg.sender === 'bot'
                    ? 'bg-slate-50 dark:bg-zinc-900/60 dark:text-zinc-200 border border-slate-100 dark:border-zinc-800/80 whitespace-pre-line'
                    : 'bg-gold-600 text-white font-medium shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gold-600/10 border border-gold-500/20 text-gold-500 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl text-xs bg-slate-50 dark:bg-zinc-900/60 dark:text-zinc-400 border border-slate-100 dark:border-zinc-850 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-850 bg-slate-50/50 dark:bg-zinc-950/20 flex flex-wrap gap-1.5">
            {[
              { label: '📊 Analyze Projects', query: 'Show active projects' },
              { label: '📦 Check Low Stock', query: 'Check stock levels' },
              { label: '💰 Show Sales Summary', query: 'Show sales summary' }
            ].map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(s.query)}
                className="py-1 px-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-gold-500 dark:hover:border-gold-500 text-[10px] font-bold rounded-lg text-slate-600 dark:text-zinc-300 transition"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="p-3 border-t border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-950/40 flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Harmony AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-gold-500 text-slate-855 dark:text-white"
            />
            <button
              type="submit"
              className="p-2 bg-gold-600 hover:bg-gold-700 text-white rounded-xl shadow-sm flex items-center justify-center transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
