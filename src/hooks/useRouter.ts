import { create } from 'zustand';

export type Route =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'analysis'
  | 'settings';

interface RouterStore {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

export const useRouter = create<RouterStore>((set) => ({
  currentRoute: 'dashboard',
  navigate: (route: Route) => set({ currentRoute: route }),
}));
