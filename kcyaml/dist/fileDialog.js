import { execSync } from 'child_process';
import path from 'path';
/**
 * Prompts user for a save file path using native OS dialogs.
 * Supports Windows (PowerShell), macOS (osascript), and Linux (zenity/kdialog).
 */
export async function promptSaveFilePath(defaultName = 'fleet_composition.png') {
    const platform = process.platform;
    const sanitizedDefault = path.basename(defaultName);
    try {
        if (platform === 'win32') {
            const psCommand = `
        Add-Type -AssemblyName System.Windows.Forms;
        $dialog = New-Object System.Windows.Forms.SaveFileDialog;
        $dialog.Filter = "PNG Image (*.png)|*.png|All Files (*.*)|*.*";
        $dialog.FileName = "${sanitizedDefault}";
        $dialog.Title = "Select output fleet image file path";
        if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
          Write-Output $dialog.FileName;
        }
      `.replace(/\r?\n\s*/g, ' ');
            const output = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, {
                encoding: 'utf-8',
                windowsHide: true,
            }).trim();
            return output || null;
        }
        if (platform === 'darwin') {
            const appleScript = `
        tell application "System Events"
          activate
          set filePath to choose file name with prompt "Select output fleet image file path:" default name "${sanitizedDefault}"
          return POSIX path of filePath
        end tell
      `.replace(/\r?\n\s*/g, ' ');
            const output = execSync(`osascript -e '${appleScript}'`, {
                encoding: 'utf-8',
            }).trim();
            return output || null;
        }
        if (platform === 'linux') {
            try {
                const output = execSync(`zenity --file-selection --save --confirm-overwrite --filename="${sanitizedDefault}" --file-filter="PNG images | *.png"`, {
                    encoding: 'utf-8',
                }).trim();
                return output || null;
            }
            catch (err) {
                // Fallback to kdialog if zenity fails or is unavailable
                const output = execSync(`kdialog --getsavefilename "${sanitizedDefault}" "*.png"`, {
                    encoding: 'utf-8',
                }).trim();
                return output || null;
            }
        }
    }
    catch (err) {
        // User canceled or command failed
        return null;
    }
    return null;
}
