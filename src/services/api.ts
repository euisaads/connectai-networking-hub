import { Profile, ProfileAction } from '../types';
import { enhanceProfileData } from './geminiService';

/**
 * --- SQL SCHEMA FOR SUPABASE / POSTGRESQL ---
 * 
 * -- 1. Profiles Table
 * CREATE TABLE profiles (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name VARCHAR(255) NOT NULL,
 *   role_title VARCHAR(255) NOT NULL,
 *   area VARCHAR(100) NOT NULL,
 *   city VARCHAR(100) NOT NULL,
 *   state VARCHAR(2) NOT NULL,
 *   linkedin_url VARCHAR(255) UNIQUE NOT NULL,
 *   avatar_url TEXT,
 *   bio TEXT,
 *   tags TEXT[],
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Actions Table
 * CREATE TABLE actions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
 *   action_type VARCHAR(50) CHECK (action_type IN ('open_linkedin', 'assumed_follow')),
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 3. Indexes for Search Performance
 * CREATE INDEX idx_profiles_area ON profiles(area);
 * CREATE INDEX idx_profiles_city ON profiles(city);
 * CREATE INDEX idx_profiles_role ON profiles(role_title);
 */

const DB_KEY_PROFILES = 'connectai_db_profiles_v2'; // Changed key to clear old mock data
const DB_KEY_ACTIONS = 'connectai_db_actions_v2';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- READ ---
  getProfiles: async (filters?: { search?: string, area?: string, city?: string }): Promise<Profile[]> => {
    await delay(400); // Simulate API latency
    
    const raw = localStorage.getItem(DB_KEY_PROFILES);
    let profiles: Profile[] = raw ? JSON.parse(raw) : [];

    // Filter Logic (Server-side simulation)
    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        profiles = profiles.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.role.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      if (filters.area && filters.area !== 'Todas') {
        profiles = profiles.filter(p => p.area === filters.area);
      }
      if (filters.city && filters.city !== 'Todas') {
        profiles = profiles.filter(p => p.city === filters.city);
      }
    }

    // Sort by newest
    return profiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // --- CREATE ---
  createProfile: async (rawData: any): Promise<Profile> => {
    // 1. Check for duplicates (Unique Constraint Simulation)
    const raw = localStorage.getItem(DB_KEY_PROFILES);
    const profiles: Profile[] = raw ? JSON.parse(raw) : [];
    
    if (profiles.some(p => p.linkedinUrl.toLowerCase() === rawData.linkedinUrl.toLowerCase())) {
      throw new Error("Este LinkedIn já está cadastrado no diretório.");
    }

    // 2. AI Enrichment (handled in UI or here, assuming rawData has role/area)
    // Note: We expect the UI to pass the already enriched data OR we call it here.
    // For this architecture, we assume the UI calls the AI Service and passes the results to createProfile.
    
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: rawData.name,
      role: rawData.role,
      area: rawData.area,
      city: rawData.city,
      state: rawData.state,
      location: `${rawData.city} - ${rawData.state}`,
      linkedinUrl: rawData.linkedinUrl,
      avatarUrl: rawData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(rawData.name)}&background=0b8de5&color=fff`,
      bio: rawData.bio,
      tags: rawData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    profiles.unshift(newProfile);
    localStorage.setItem(DB_KEY_PROFILES, JSON.stringify(profiles));
    return newProfile;
  },

  // --- UPDATE ---
  updateProfile: async (id: string, updates: Partial<Profile>): Promise<Profile> => {
    await delay(500);
    const raw = localStorage.getItem(DB_KEY_PROFILES);
    let profiles: Profile[] = raw ? JSON.parse(raw) : [];
    
    const index = profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Perfil não encontrado.");

    const updatedProfile = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    profiles[index] = updatedProfile;
    localStorage.setItem(DB_KEY_PROFILES, JSON.stringify(profiles));
    return updatedProfile;
  },

  // --- DELETE ---
  deleteProfile: async (id: string): Promise<void> => {
    await delay(300);
    const raw = localStorage.getItem(DB_KEY_PROFILES);
    let profiles: Profile[] = raw ? JSON.parse(raw) : [];
    
    const filtered = profiles.filter(p => p.id !== id);
    localStorage.setItem(DB_KEY_PROFILES, JSON.stringify(filtered));
  },

  // --- UPLOAD (Simulation) ---
  uploadPhoto: async (file: File): Promise<string> => {
    // In a real app: await supabase.storage.from('avatars').upload(...)
    // Here: Convert to Base64 to store in localStorage (Size limit applied in UI)
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },

  // --- ACTIONS ---
  trackAction: async (profileId: string, actionType: 'open_linkedin' | 'assumed_follow'): Promise<void> => {
    const raw = localStorage.getItem(DB_KEY_ACTIONS);
    const actions = raw ? JSON.parse(raw) : [];
    
    const newAction: ProfileAction = {
      id: crypto.randomUUID(),
      profileId,
      actionType,
      timestamp: Date.now()
    };
    
    actions.push(newAction);
    localStorage.setItem(DB_KEY_ACTIONS, JSON.stringify(actions));
  },

  getMyActions: (): Set<string> => {
    const raw = localStorage.getItem(DB_KEY_ACTIONS);
    if (!raw) return new Set();
    const actions: ProfileAction[] = JSON.parse(raw);
    return new Set(actions.filter(a => a.actionType === 'assumed_follow').map(a => a.profileId));
  }
};