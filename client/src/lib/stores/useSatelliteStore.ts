import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface SatelliteInfo {
  name: string;
  noradId: string;
  line1: string;
  line2: string;
  category?: string;
  operator?: string;
  launchDate?: string;
}

export interface SatellitePosition {
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  alt: number;
  velocity: number;
}

interface SatelliteStore {
  satellites: SatelliteInfo[];
  satellitePositions: Map<string, SatellitePosition>;
  selectedSatellite: string | null;
  hoveredSatellite: string | null;
  followedSatellite: string | null;
  
  currentTime: Date;
  timeSpeed: number;
  isPaused: boolean;
  
  searchQuery: string;
  filterCategory: string | null;
  filterOperator: string | null;
  
  showTrails: boolean;
  showLabels: boolean;
  trailLength: number;
  
  realtimePositionGetter: (() => Map<string, SatellitePosition>) | null;
  
  setSatellites: (satellites: SatelliteInfo[]) => void;
  setSatellitePosition: (noradId: string, position: SatellitePosition) => void;
  setSelectedSatellite: (noradId: string | null) => void;
  setHoveredSatellite: (noradId: string | null) => void;
  setFollowedSatellite: (noradId: string | null) => void;
  
  setCurrentTime: (time: Date) => void;
  setTimeSpeed: (speed: number) => void;
  togglePause: () => void;
  setPaused: (paused: boolean) => void;
  
  setSearchQuery: (query: string) => void;
  setFilterCategory: (category: string | null) => void;
  setFilterOperator: (operator: string | null) => void;
  
  toggleTrails: () => void;
  toggleLabels: () => void;
  setTrailLength: (length: number) => void;
  
  setRealtimePositionGetter: (getter: (() => Map<string, SatellitePosition>) | null) => void;
  getRealtimePosition: (noradId: string) => SatellitePosition | null;
  
  getFilteredSatellites: () => SatelliteInfo[];
}

export const useSatelliteStore = create<SatelliteStore>()(
  subscribeWithSelector((set, get) => ({
    satellites: [],
    satellitePositions: new Map(),
    selectedSatellite: null,
    hoveredSatellite: null,
    followedSatellite: null,
    
    currentTime: new Date(),
    timeSpeed: 1,
    isPaused: false,
    
    searchQuery: '',
    filterCategory: null,
    filterOperator: null,
    
    showTrails: true,
    showLabels: false,
    trailLength: 100,
    
    realtimePositionGetter: null,
    
    setSatellites: (satellites) => set({ satellites }),
    
    setSatellitePosition: (noradId, position) => set((state) => {
      const newPositions = new Map(state.satellitePositions);
      newPositions.set(noradId, position);
      return { satellitePositions: newPositions };
    }),
    
    setSelectedSatellite: (noradId) => set({ selectedSatellite: noradId }),
    setHoveredSatellite: (noradId) => set({ hoveredSatellite: noradId }),
    setFollowedSatellite: (noradId) => set({ followedSatellite: noradId }),
    
    setCurrentTime: (time) => set({ currentTime: time }),
    setTimeSpeed: (speed) => set({ timeSpeed: speed }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setPaused: (paused) => set({ isPaused: paused }),
    
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilterCategory: (category) => set({ filterCategory: category }),
    setFilterOperator: (operator) => set({ filterOperator: operator }),
    
    toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),
    toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
    setTrailLength: (length) => set({ trailLength: length }),
    
    setRealtimePositionGetter: (getter) => set({ realtimePositionGetter: getter }),
    
    getRealtimePosition: (noradId) => {
      const state = get();
      if (state.realtimePositionGetter) {
        const realtimePositions = state.realtimePositionGetter();
        return realtimePositions.get(noradId) || null;
      }
      return state.satellitePositions.get(noradId) || null;
    },
    
    getFilteredSatellites: () => {
      const state = get();
      let filtered = state.satellites;
      
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(sat => 
          sat.name.toLowerCase().includes(query) ||
          sat.noradId.includes(query)
        );
      }
      
      if (state.filterCategory) {
        filtered = filtered.filter(sat => sat.category === state.filterCategory);
      }
      
      if (state.filterOperator) {
        filtered = filtered.filter(sat => sat.operator === state.filterOperator);
      }
      
      return filtered;
    }
  }))
);
