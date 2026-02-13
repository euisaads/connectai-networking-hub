export interface Profile {
  id: string;
  name: string;
  role: string; // role_title in DB
  area: string;
  city: string;
  state: string;
  location: string; // Computed: City - UF
  linkedinUrl: string;
  bio?: string;
  avatarUrl: string; // photo_url in DB
  tags: string[]; // AI Generated tags
  createdAt: string;
  updatedAt: string;
}

export interface ProfileAction {
  id: string;
  profileId: string;
  actionType: 'open_linkedin' | 'assumed_follow';
  timestamp: number;
}

export interface IcebreakerRequest {
  myProfile: Profile;
  targetProfile: Profile;
}

export enum NetworkingMode {
  VIEW = 'VIEW',
  REGISTER = 'REGISTER',
  EDIT = 'EDIT',
}
