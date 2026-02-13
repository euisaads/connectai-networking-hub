import React from 'react';
import { Profile } from '../types';
import { Linkedin, MapPin, Briefcase, Sparkles, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
  isFollowed: boolean;
  onFollow: (id: string, url: string) => void;
  onGenerateIcebreaker: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
  isMe: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  isFollowed,
  onFollow,
  onGenerateIcebreaker,
  onEdit,
  onDelete,
  isMe 
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative"
    >
      {isMe && (
        <div className="absolute top-2 right-2 z-10">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 border border-gray-200 shadow-sm"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => { setShowMenu(false); onEdit(profile); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button 
                onClick={() => { setShowMenu(false); onDelete(profile.id); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex-1">
        <div className="flex items-start gap-4">
          <img 
            src={profile.avatarUrl} 
            alt={profile.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm flex-shrink-0 bg-gray-50"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-linkedin-600 transition-colors">
              {profile.name}
              {isMe && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Você</span>}
            </h3>
            <div className="flex items-center gap-1 text-linkedin-600 font-medium text-sm mt-0.5">
              <Briefcase className="w-3.5 h-3.5" />
              <p className="truncate">{profile.role}</p>
            </div>
            <p className="text-gray-500 text-xs mt-1 truncate uppercase tracking-wider font-semibold">{profile.area}</p>
          </div>
        </div>

        {/* AI Bio */}
        {profile.bio && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-gray-600 italic border border-slate-100 relative">
             <div className="absolute -top-2 left-3 bg-white px-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
             </div>
             "{profile.bio}"
          </div>
        )}

        {/* AI Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-gray-500 text-sm">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{profile.location}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-3 flex gap-2 border-t border-gray-100">
        <button
          onClick={() => onFollow(profile.id, profile.linkedinUrl)}
          disabled={isFollowed}
          className={`
            flex-1 flex items-center justify-center gap-2 font-medium py-2 px-3 rounded-lg text-sm transition-all
            ${isFollowed 
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-default' 
              : 'bg-white hover:bg-linkedin-50 text-linkedin-700 border border-gray-200 hover:border-linkedin-200 shadow-sm'
            }
          `}
        >
          <Linkedin className="w-4 h-4" />
          {isFollowed ? 'Seguindo' : 'Seguir no LinkedIn'}
          {isFollowed && <Check className="w-3 h-3 ml-1" />}
        </button>

        {!isMe && (
          <button 
            onClick={() => onGenerateIcebreaker(profile)}
            className="flex items-center justify-center p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors"
            title="Gerar sugestão de conexão com IA"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;