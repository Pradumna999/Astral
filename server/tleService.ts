import cron from 'node-cron';
import { log } from './vite';

export interface TLEData {
  name: string;
  line1: string;
  line2: string;
  noradId: string;
}

export interface SatelliteInfo extends TLEData {
  category?: string;
  operator?: string;
  launchDate?: string;
}

class TLEService {
  private tleCache: Map<string, SatelliteInfo> = new Map();
  private lastUpdate: Date | null = null;
  private updateInProgress = false;

  constructor() {
    this.initializeWithSampleData();
    this.scheduleTLEUpdates();
    this.fetchLatestTLEs().catch(error => {
      log(`Initial TLE fetch failed: ${error}`);
    });
  }

  private initializeWithSampleData() {
    const sampleSatellites: SatelliteInfo[] = [
      {
        name: 'ISS (ZARYA)',
        noradId: '25544',
        line1: '1 25544U 98067A   24311.50000000  .00012345  00000-0  12345-3 0  9999',
        line2: '2 25544  51.6400 208.9163 0006317  73.1467  99.8173 15.54225995123456',
        category: 'Space Station',
        operator: 'International',
        launchDate: '1998-11-20'
      },
      {
        name: 'STARLINK-1007',
        noradId: '44713',
        line1: '1 44713U 19074A   24311.50000000  .00001234  00000-0  12345-4 0  9999',
        line2: '2 44713  53.0534 123.4567 0001234  90.1234 269.9876 15.06123456789012',
        category: 'Communications',
        operator: 'SpaceX',
        launchDate: '2019-11-11'
      },
      {
        name: 'NOAA 18',
        noradId: '28654',
        line1: '1 28654U 05018A   24311.50000000  .00000234  00000-0  12345-4 0  9999',
        line2: '2 28654  99.0534 123.4567 0012345  90.1234 270.0123 14.12345678901234',
        category: 'Weather',
        operator: 'NOAA',
        launchDate: '2005-05-20'
      },
      {
        name: 'HUBBLE SPACE TELESCOPE',
        noradId: '20580',
        line1: '1 20580U 90037B   24311.50000000  .00001234  00000-0  12345-4 0  9999',
        line2: '2 20580  28.4698 123.4567 0002345  90.1234 269.9876 15.09123456789012',
        category: 'Space Telescope',
        operator: 'NASA/ESA',
        launchDate: '1990-04-24'
      },
      {
        name: 'GPS BIIA-10 (PRN 32)',
        noradId: '20959',
        line1: '1 20959U 90103A   24311.50000000 -.00000012  00000-0  00000-0 0  9999',
        line2: '2 20959  54.9876 123.4567 0123456  90.1234 269.9876  2.00561234567890',
        category: 'Navigation',
        operator: 'US Air Force',
        launchDate: '1990-11-26'
      }
    ];

    sampleSatellites.forEach(sat => {
      this.tleCache.set(sat.noradId, sat);
    });

    this.lastUpdate = new Date();
    log('TLE Service initialized with sample data');
  }

  private scheduleTLEUpdates() {
    cron.schedule('0 */6 * * *', async () => {
      log('Running scheduled TLE update');
      await this.fetchLatestTLEs();
    });
  }

  async fetchLatestTLEs(): Promise<void> {
    if (this.updateInProgress) {
      log('TLE update already in progress, skipping');
      return;
    }

    this.updateInProgress = true;
    let fetchSuccessful = false;
    
    try {
      log('Fetching latest TLE data from CelesTrak...');
      
      const categories = [
        { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', category: 'Space Station' },
        { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle', category: 'Weather' },
        { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle', category: 'Communications' },
        { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle', category: 'Navigation' }
      ];

      for (const { url, category } of categories) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.text();
            this.parseTLEData(data, category);
            fetchSuccessful = true;
          } else {
            log(`Failed to fetch TLE data for ${category}: HTTP ${response.status}`);
          }
        } catch (error) {
          log(`Failed to fetch TLE data for ${category}: ${error}`);
        }
      }

      if (fetchSuccessful) {
        this.lastUpdate = new Date();
        log(`TLE update successful! Cache now contains ${this.tleCache.size} satellites`);
      } else {
        log('TLE update failed: No data fetched from any category');
      }
    } catch (error) {
      log(`Error during TLE update: ${error}`);
      throw error;
    } finally {
      this.updateInProgress = false;
    }
  }

  private parseTLEData(data: string, category: string): void {
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;
      
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      
      if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
        const noradId = line1.substring(2, 7).trim();
        
        this.tleCache.set(noradId, {
          name,
          noradId,
          line1,
          line2,
          category,
          operator: this.guessOperator(name),
          launchDate: this.extractLaunchDate(line1)
        });
      }
    }
  }

  private guessOperator(name: string): string {
    const upperName = name.toUpperCase();
    if (upperName.includes('STARLINK')) return 'SpaceX';
    if (upperName.includes('ISS') || upperName.includes('ZARYA')) return 'International';
    if (upperName.includes('NOAA')) return 'NOAA';
    if (upperName.includes('GPS')) return 'US Air Force';
    if (upperName.includes('HUBBLE')) return 'NASA/ESA';
    if (upperName.includes('IRIDIUM')) return 'Iridium';
    if (upperName.includes('ONEWEB')) return 'OneWeb';
    return 'Unknown';
  }

  private extractLaunchDate(line1: string): string {
    try {
      const epochYearStr = line1.substring(18, 20);
      const epochYear = parseInt(epochYearStr) < 57 ? 2000 + parseInt(epochYearStr) : 1900 + parseInt(epochYearStr);
      const epochDay = parseFloat(line1.substring(20, 32));
      
      const date = new Date(epochYear, 0, 1);
      date.setDate(date.getDate() + Math.floor(epochDay) - 1);
      
      return date.toISOString().split('T')[0];
    } catch {
      return 'Unknown';
    }
  }

  getAllSatellites(): SatelliteInfo[] {
    return Array.from(this.tleCache.values());
  }

  getSatellite(noradId: string): SatelliteInfo | undefined {
    return this.tleCache.get(noradId);
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  getCacheSize(): number {
    return this.tleCache.size;
  }
}

export const tleService = new TLEService();
