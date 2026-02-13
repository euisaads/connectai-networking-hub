import React from 'react';
import { Network, PlusCircle, Users } from 'lucide-react';
import { NetworkingMode } from '../types';

interface HeaderProps {
  mode: NetworkingMode;
  setMode: (mode: NetworkingMode) => void;
  totalProfiles: number;
}

const Header: React.FC<HeaderProps> = ({ mode, setMode, totalProfiles }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(NetworkingMode.VIEW)}>
            <div className="bg-linkedin-600 p-2 rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">ConnectAI</h1>
              <span className="text-xs text-linkedin-600 font-medium tracking-wide">NETWORKING HUB</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <Users className="h-4 w-4" />
                <span className="font-semibold text-gray-700">{totalProfiles}</span>
                <span>profissionais conectados</span>
             </div>

            {mode === NetworkingMode.VIEW ? (
              <button
                onClick={() => setMode(NetworkingMode.REGISTER)}
                className="flex items-center gap-2 bg-linkedin-600 hover:bg-linkedin-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar Perfil</span>
                <span className="sm:hidden">Novo</span>
              </button>
            ) : (
               <button
                onClick={() => setMode(NetworkingMode.VIEW)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;