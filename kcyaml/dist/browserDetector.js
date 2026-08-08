import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
/**
 * Detects the executable path of the system default or installed Chromium-based browser.
 */
export function detectSystemBrowserPath() {
    const platform = process.platform;
    if (platform === 'win32') {
        // 1. Try Windows registry query for default browser
        try {
            const regCmd = `powershell -NoProfile -Command "(Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice').ProgId"`;
            const progId = execSync(regCmd, { encoding: 'utf-8', timeout: 1500 }).trim();
            if (progId.includes('MSEdge') || progId.includes('AppX')) {
                const edgePaths = [
                    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                ];
                for (const p of edgePaths) {
                    if (fs.existsSync(p))
                        return p;
                }
            }
            else if (progId.includes('Chrome')) {
                const chromePaths = [
                    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
                ];
                for (const p of chromePaths) {
                    if (fs.existsSync(p))
                        return p;
                }
            }
        }
        catch (e) { }
        // 2. Windows Fallback search
        const winPaths = [
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
        ];
        for (const p of winPaths) {
            if (fs.existsSync(p))
                return p;
        }
    }
    else if (platform === 'darwin') {
        // macOS paths
        const macPaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
        ];
        for (const p of macPaths) {
            if (fs.existsSync(p))
                return p;
        }
    }
    else if (platform === 'linux') {
        // Linux search via which
        const linuxBinaries = [
            'google-chrome',
            'google-chrome-stable',
            'chromium-browser',
            'chromium',
            'microsoft-edge-stable',
        ];
        for (const bin of linuxBinaries) {
            try {
                const p = execSync(`which ${bin}`, { encoding: 'utf-8', timeout: 1000 }).trim();
                if (p && fs.existsSync(p))
                    return p;
            }
            catch (e) { }
        }
    }
    return null;
}
