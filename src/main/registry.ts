// D:/Accountiblity partner/src/main/registry.ts
import Registry from "winreg";

/**
 * Toggles auto-start behavior of the application by writing to/removing from the Windows Registry Run key.
 * @param enable True to enable auto-start, false to disable.
 */
export function setAutoStart(enable: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const regKey = new Registry({
      hive: Registry.HKCU,
      key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    });

    if (enable) {
      // In development, process.execPath is electron.exe. In production, it is curfew.exe.
      regKey.set("Curfew", Registry.REG_SZ, process.execPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } else {
      regKey.remove("Curfew", (err) => {
        // If it doesn't exist, we don't treat it as a failure
        resolve();
      });
    }
  });
}

/**
 * Enables or disables the Windows Task Manager policy for the current user.
 * Note: DisableTaskMgr toggling behavior can vary depending on the target Windows edition
 * and Group Policy configurations. This function operates on HKCU which usually does not
 * require administrator privileges.
 * @param disabled True to disable Task Manager, false to enable it.
 */
export function setTaskManagerDisabled(disabled: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const regKey = new Registry({
      hive: Registry.HKCU,
      key: "\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System"
    });

    if (disabled) {
      regKey.set("DisableTaskMgr", Registry.REG_DWORD, "1", (err) => {
        if (err) {
          console.error("Error setting registry DisableTaskMgr to 1:", err);
          reject(err);
        } else {
          console.log("Registry policy DisableTaskMgr set to 1 successfully.");
          resolve();
        }
      });
    } else {
      regKey.remove("DisableTaskMgr", (err) => {
        // If it doesn't exist or is already removed, resolve successfully.
        resolve();
      });
    }
  });
}
