import fs from 'fs';
import path from 'path';
export const DEFAULT_CONFIG = {
    urls: {
        start2Url: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master/static/START2.json',
        shipUrl: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master',
        masterUrl: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master',
    },
    logging: {
        debug: true,
        showBrowserLogs: true,
    },
    dialog: {
        enabled: true,
    },
    image: {
        defaultTheme: 'official',
        quality: 80,
        palette: true,
    },
    output: {
        defaultDir: 'kcdata-output',
    },
};
/**
 * Reads config.json if it exists and merges it with default configuration.
 */
export function loadAppConfig(customConfigPath) {
    const configPath = customConfigPath || path.join(process.cwd(), 'config.json');
    if (!fs.existsSync(configPath)) {
        return { ...DEFAULT_CONFIG };
    }
    try {
        const rawContent = fs.readFileSync(configPath, 'utf-8');
        const userConfig = JSON.parse(rawContent);
        return {
            urls: { ...DEFAULT_CONFIG.urls, ...(userConfig.urls || {}) },
            logging: { ...DEFAULT_CONFIG.logging, ...(userConfig.logging || {}) },
            dialog: { ...DEFAULT_CONFIG.dialog, ...(userConfig.dialog || {}) },
            image: { ...DEFAULT_CONFIG.image, ...(userConfig.image || {}) },
            output: { ...DEFAULT_CONFIG.output, ...(userConfig.output || {}) },
        };
    }
    catch (err) {
        console.error(`[kcyaml:WARNING] config.json の読み込み・パースに失敗しました。デフォルト設定を使用します: ${err.message}`);
        return { ...DEFAULT_CONFIG };
    }
}
/**
 * Initializes a new default config.json file in project root.
 */
export function initConfigFile() {
    const configPath = path.join(process.cwd(), 'config.json');
    const formattedJson = JSON.stringify(DEFAULT_CONFIG, null, 2);
    fs.writeFileSync(configPath, formattedJson, 'utf-8');
    return configPath;
}
