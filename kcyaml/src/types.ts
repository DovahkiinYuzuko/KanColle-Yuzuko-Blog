export interface MasterShip {
  name: string;
  type?: number;
  stype?: number;
  shipClass?: number; // ctype / 艦型ID (夕雲型=38等)
  saku?: [number, number]; // [min, max]
  minScout?: number;
  maxScout?: number;
  minAvoid?: number;
  maxAvoid?: number;
  minAsw?: number;
  maxAsw?: number;
  firepower?: number; // Modernization MAX
  torpedo?: number;   // Modernization MAX
  antiAir?: number;   // Modernization MAX
  armor?: number;     // Modernization MAX
  hp?: number;
  luck?: number;      // Base Luck
  maxeq?: number[];
}

export interface MasterItem {
  name: string;
  taiku?: number;
  saku?: number;
  firepower?: number;
  torpedo?: number;
  armor?: number;
  asw?: number;
  evasion?: number;
  typeId?: number; // apiTypeId (type)
  itype?: number;  // iconTypeId
  type?: number[];
}

export interface FitBonusStat {
  firepower?: number;
  torpedo?: number;
  antiAir?: number;
  armor?: number;
  evasion?: number;
  asw?: number;
  saku?: number;
}

export type FitBonusData = Record<string, any>;

export interface MasterData {
  ships: Record<string, MasterShip>;
  items: Record<string, MasterItem>;
  fitBonus?: FitBonusData;
}

export interface DeckBuilderItem {
  id?: number;
  rf?: number;
  mas?: number;
}

export interface DeckBuilderShip {
  id?: number;
  lv?: number;
  hp?: number;
  asw?: number;
  luck?: number;
  fp?: number;
  tp?: number;
  aa?: number;
  ar?: number;
  ev?: number;
  los?: number;
  items?: Record<string, DeckBuilderItem>;
}

export interface DeckBuilderAirBase {
  mode?: number;
  items?: Record<string, DeckBuilderItem>;
}

export interface DeckBuilderData {
  version?: number;
  hqlv?: number;
  [key: string]: any;
}

export interface ParsedShip {
  name: string;
  level: number;
  equipments: string[];
  id?: number;
  rawShipObj?: DeckBuilderShip;
}

export interface ParsedFleet {
  number: number;
  ships: ParsedShip[];
  fighterPower?: number;
  saku33?: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
  };
}

export interface ParsedAirBase {
  number: number;
  mode: string;
  squadrons: string[];
}

export interface ParsedData {
  fleets: ParsedFleet[];
  airBases: ParsedAirBase[];
  combinedFighterPower?: number;
  combinedSaku33?: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
  };
}

export interface KcYamlConfig {
  urls: {
    start2Url: string;
    masterJsonUrl?: string;
    shipUrl: string;
    masterUrl: string;
  };
  logging: {
    debug: boolean;
    showBrowserLogs: boolean;
  };
  dialog: {
    enabled: boolean;
  };
  image: {
    defaultTheme: string;
    quality: number;
    palette: boolean;
  };
  output: {
    defaultDir: string;
  };
}

export interface CliOptions {
  fleet?: number[];
  air?: number[];
  title?: string;
  fleetTitle?: string;
  airTitle?: string;
  input?: string;
  output?: string | boolean;
  dryRun?: boolean;
  refresh?: boolean;
  validate?: boolean;
  image?: boolean;
  imageTheme?: string;
  imageOutput?: string;
  noDialog?: boolean;
  initConfig?: boolean;
  configFile?: string;
  exactMas?: boolean;
  rengo?: boolean;
}



export interface ValidationIssue {
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}
