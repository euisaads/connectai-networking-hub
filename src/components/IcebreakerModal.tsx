import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { generateIcebreaker } from '../services/geminiService';
import { X, Copy, Check, MessageSquare, Loader2, Wand2 } from 'lucide-react';

interface IcebreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile | null;
  myProfile: Profile | null;
}

const IcebreakerModal: React.FC<IcebreakerModalProps> = ({ 
  isOpen, 
  onClose, 
  targetProfile, 
  myProfile 
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && targetProfile && myProfile) {
      loadIcebreaker();
    } else {
      setMessage('');
      setCopied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetProfile]);

  const loadIcebreaker = async () => {
    if (!targetProfile || !myProfile) return;
    setIsLoading(true);
    const result = await generateIcebreaker({ myProfile, targetProfile });
    setMessage(result);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !targetProfile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-linkedin-600 to-linkedin-800 p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-amber-300" />
              AI Networking Assistant
            </h3>
            <p className="text-linkedin-100 text-sm mt-1">
              Gerando conexão com {targetProfile.name}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-linkedin-600" />
              <p className="animate-pulse font-medium">Analisando perfis e criando mensagem...</p>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800 mb-4">
                  Dica: Personalize a mensagem antes de enviar para torná-la ainda mais autêntica.
               </div>
              
              <label className="block text-sm font-semibold text-gray-700">Sugestão de Mensagem:</label>
              <div className="relative">
                <textarea
                  readOnly
                  className="w-full h-40 p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 resize-none focus:ring-2 focus:ring-linkedin-500 focus:outline-none"
                  value={message}
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-all text-gray-500"
                  title="Copiar texto"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <a
            href={targetProfile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-2 bg-linkedin-600 hover:bg-linkedin-700 text-white font-medium py-2.5 rounded-lg shadow-md transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <MessageSquare className="w-4 h-4" />
            Ir para LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};

export default IcebreakerModal;