
// Service to handle administrative division data
// Fetches from public CDN to ensure comprehensive coverage without bloating the app size.

const DATA_URL = 'https://unpkg.com/china-division@2.7.0/dist/pcas-code.json';

export interface AreaNode {
  code: string;
  name: string;
  children?: AreaNode[];
}

class LocationService {
  private flatLocations: string[] = [];
  private isLoading: boolean = false;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  // Initialize and fetch data
  async init() {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    
    this.loadPromise = fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: AreaNode[]) => {
        this.processData(data);
        this.isLoaded = true;
        this.isLoading = false;
        console.log(`[LocationService] Loaded ${this.flatLocations.length} locations.`);
      })
      .catch(err => {
        console.error('Failed to load location data:', err);
        this.isLoading = false;
        // Fallback to a minimal set if offline and cache is empty
        if (this.flatLocations.length === 0) {
            this.flatLocations = ["数据加载失败，请检查网络"];
        }
      });

    return this.loadPromise;
  }

  // Flatten the tree into searchable strings: "Province-City-District"
  private processData(nodes: AreaNode[]) {
    const result: string[] = [];

    const traverse = (node: AreaNode, path: string[]) => {
      const currentPath = [...path, node.name];
      // Only store leaf nodes (Districts) or nodes effectively acting as leaves
      // Format: "Province-City-District" or "Province-City"
      
      const fullPathStr = currentPath.join('-');
      result.push(fullPathStr);

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child, currentPath));
      }
    };

    nodes.forEach(node => traverse(node, []));
    this.flatLocations = result;
  }

  // Search function
  async search(query: string, limit: number = 50): Promise<string[]> {
    if (!query.trim()) return [];
    
    // Ensure data is loaded
    if (!this.isLoaded) {
        await this.init();
    }
    
    const term = query.toLowerCase();
    
    // Optimization: Filter logic
    const matches: string[] = [];
    for (const loc of this.flatLocations) {
        if (matches.length >= limit) break;
        if (loc.toLowerCase().includes(term)) {
            matches.push(loc);
        }
    }
    return matches;
  }

  isReady() {
    return this.isLoaded;
  }
}

export const locationService = new LocationService();
