import { useState, useMemo } from 'react';
import { Search, Filter, Target, Navigation } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useSatelliteStore } from '@/lib/stores/useSatelliteStore';

export function SatelliteList() {
  const {
    satellites,
    selectedSatellite,
    setSelectedSatellite,
    setFollowedSatellite,
    followedSatellite,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    getFilteredSatellites,
    visitedObject,
    setVisitedObject
  } = useSatelliteStore();
  
  const [showFilters, setShowFilters] = useState(false);
  
  const filteredSatellites = getFilteredSatellites();
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    satellites.forEach(sat => {
      if (sat.category) cats.add(sat.category);
    });
    return Array.from(cats);
  }, [satellites]);
  
  return (
    <div className="fixed left-4 top-4 bottom-24 w-80 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg flex flex-col">
      <div className="p-4 border-b border-white/20">
        <h2 className="text-white text-lg font-bold mb-3">Satellites</h2>
        
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search satellites..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full text-white hover:bg-white/10 justify-start"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        
        {showFilters && (
          <div className="mt-2 space-y-2">
            <div>
              <label className="text-white text-xs mb-1 block">Category</label>
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        <div className="text-white/60 text-xs mt-2">
          {filteredSatellites.length} / {satellites.length} satellites
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSatellites.map(sat => {
            const isVisiting = visitedObject === sat.noradId;
            
            return (
              <div
                key={sat.noradId}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedSatellite === sat.noradId
                    ? 'bg-blue-600'
                    : isVisiting
                    ? 'bg-purple-600/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setSelectedSatellite(sat.noradId)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {sat.name}
                    </div>
                    <div className="text-white/60 text-xs">
                      NORAD: {sat.noradId}
                    </div>
                    {sat.category && (
                      <div className="text-white/40 text-xs mt-1">
                        {sat.category}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    {/* Visit Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isVisiting) {
                          setVisitedObject(null);
                        } else {
                          setVisitedObject(sat.noradId);
                          setSelectedSatellite(sat.noradId);
                        }
                      }}
                      className={`p-1 h-auto ${
                        isVisiting
                          ? 'text-purple-400 hover:text-purple-300'
                          : 'text-white/60 hover:text-white'
                      }`}
                      title={isVisiting ? 'Stop visiting' : 'Visit satellite'}
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                    
                    {/* Follow Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFollowedSatellite(
                          followedSatellite === sat.noradId ? null : sat.noradId
                        );
                      }}
                      className={`p-1 h-auto ${
                        followedSatellite === sat.noradId
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-white/60 hover:text-white'
                      }`}
                      title={followedSatellite === sat.noradId ? 'Unfollow' : 'Follow satellite'}
                    >
                      <Target className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
