export interface MasterShip {
  name: string;
  type?: number;
  stype?: number;
  saku?: [number, number]; // [min, max]
  maxeq?: number[];
}

export interface MasterItem {
  name: string;
  taiku?: number;
  saku?: number;
  type?: number[]; // [api_type[0], api_type[1], api_type[2], api_type[3]]
}

export interface MasterData {
  ships: Record<string, MasterShip>;
  items: Record<string, MasterItem>;
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
}

export interface KcYamlConfig {
  urls: {
    start2Url: string;
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
}



export interface ValidationIssue {
  type: 'ERROR' | 'WARNING';
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}
