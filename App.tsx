
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Sender } from './types';
import { initializeChat, sendMessageToAI } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';
import type { Chat } from '@google/genai';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const chatSession = initializeChat();
      setChat(chatSession);
      setMessages([
        {
          id: 'initial-ai-message',
          text: '안녕하세요! 저는 화재안전기술기준(NFTC) 전문가 AI입니다. 궁금한 점을 무엇이든 물어보세요.',
          sender: Sender.AI,
        },
      ]);
    } catch (e) {
        if (e instanceof Error) {
            setError(`초기화 중 오류가 발생했습니다: ${e.message}`);
        } else {
            setError('알 수 없는 오류가 발생했습니다.');
        }
    }
  }, []);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (inputText: string) => {
    if (isLoading || !inputText.trim() || !chat) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: inputText,
      sender: Sender.User,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const aiResponseText = await sendMessageToAI(chat, inputText);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponseText,
        sender: Sender.AI,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(`답변을 가져오는 중 오류가 발생했습니다: ${errorMessage}`);
      const errorMessageObject: Message = {
        id: `error-${Date.now()}`,
        text: `죄송합니다, 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (${errorMessage})`,
        sender: Sender.AI,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessageObject]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chat]);

  return (
    <div className="bg-gray-100 flex flex-col h-screen font-sans">
      <header className="bg-white shadow-md p-4 flex items-center border-b-2 border-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 1.001a9 9 0 100 18 9 9 0 000-18zM8.118 14.243a.75.75 0 01-1.06-1.06l1.373-1.374a.75.75 0 011.173.085 4.502 4.502 0 005.18 2.144.75.75 0 11.332 1.418 6.002 6.002 0 01-6.898-1.213L8.118 14.243zm2.932-9.486a.75.75 0 011.06 1.06l-1.373 1.374a.75.75 0 01-1.173-.085 4.502 4.502 0 00-5.18-2.144A.75.75 0 114.38 3.54a6.002 6.002 0 016.898 1.213l-1.228-1.228z" clipRule="evenodd" />
        </svg>
        <h1 className="text-xl font-bold text-gray-800">NFTC 화재안전기술기준 Q&A</h1>
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3 max-w-lg">
                <LoadingIndicator />
            </div>
          </div>
        )}
         {error && (
            <div className="flex justify-center">
                <p className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>
            </div>
        )}
      </main>

      <footer className="bg-white p-4 border-t">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
};

export default App;
