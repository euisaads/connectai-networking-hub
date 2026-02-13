import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { enhanceProfileData } from '../services/geminiService';
import { Loader2, Linkedin, Sparkles, MapPin, Briefcase, User, AlertCircle, Upload, Camera } from 'lucide-react';
import { Profile } from '../types';

interface RegistrationFormProps {
  initialData?: Profile;
  onSave: (profile: Profile) => void;
  onCancel: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    area: '',
    city: '',
    state: '',
    linkedinUrl: '',
    avatarUrl: ''
  });
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Load initial data for Editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        role: initialData.role,
        area: initialData.area,
        city: initialData.city,
        state: initialData.state,
        linkedinUrl: initialData.linkedinUrl,
        avatarUrl: initialData.avatarUrl
      });
      setImagePreview(initialData.avatarUrl);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validation: 2MB limit
      if (file.size > 2 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 2MB.");
        return;
      }

      setSelectedImage(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const validateLinkedIn = (url: string) => {
    const regex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_%]+\/?$/;
    return regex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateLinkedIn(formData.linkedinUrl)) {
      setError('URL do LinkedIn inválida. Use o formato: https://linkedin.com/in/seu-perfil');
      return;
    }

    setIsSubmitting(true);
    setAiStatus('loading');

    try {
      // 1. Upload Image if changed
      let finalAvatarUrl = formData.avatarUrl;
      if (selectedImage) {
        finalAvatarUrl = await api.uploadPhoto(selectedImage);
      }

      // 2. Run AI Enhancement (with timeout protection in service)
      const enriched = await enhanceProfileData(formData.role, formData.area);
      
      // 3. Prepare Payload
      const payload = {
        ...formData,
        role: enriched.normalizedRole,
        area: enriched.normalizedArea,
        bio: enriched.bio,
        tags: enriched.tags,
        avatarUrl: finalAvatarUrl
      };

      let resultProfile: Profile;
      
      if (initialData) {
        // Update Mode
        resultProfile = await api.updateProfile(initialData.id, payload);
      } else {
        // Create Mode
        resultProfile = await api.createProfile(payload);
      }
      
      setAiStatus('success');
      onSave(resultProfile);
    } catch (err: any) {
      console.error(err);
      setAiStatus('error');
      setError(err.message || 'Erro ao processar. Tente novamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-linkedin-600 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6" />
          {initialData ? 'Editar Perfil' : 'Junte-se ao Diretório'}
        </h2>
        <p className="text-linkedin-100 mt-2">
          {initialData ? 'Atualize suas informações profissionais.' : 'Cadastro gratuito para profissionais.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-300" />
              )}
            </div>
            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              <Camera className="w-8 h-8" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg" 
                onChange={handleImageChange}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">Clique para alterar foto (Max 2MB)</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
              placeholder="Ex: João Silva"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo Atual</label>
               <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                    placeholder="Ex: Ger Prod (A IA padroniza)"
                  />
               </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Área de Atuação</label>
              <input
                type="text"
                name="area"
                required
                value={formData.area}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                placeholder="Ex: Marketing"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                    placeholder="Ex: São Paulo"
                  />
                </div>
             </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                <select 
                  name="state" 
                  required 
                  value={formData.state}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                >
                  <option value="">UF</option>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Link do LinkedIn</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Linkedin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                name="linkedinUrl"
                required
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg flex gap-3 border border-amber-100">
           <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
           <div className="text-sm text-amber-800 space-y-1">
             <p className="font-semibold">Recursos IA:</p>
             <ul className="list-disc list-inside opacity-90">
                <li>Otimização de perfil e tags automáticas</li>
                <li>Normalização de cargos para melhor busca</li>
             </ul>
           </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-linkedin-600 text-white font-semibold rounded-lg hover:bg-linkedin-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-linkedin-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {initialData ? 'Salvando...' : 'Criar Perfil'}
              </>
            ) : (
              initialData ? 'Salvar Alterações' : 'Cadastrar no Diretório'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;