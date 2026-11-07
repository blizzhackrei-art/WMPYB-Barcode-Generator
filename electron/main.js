const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { execFile } = require('child_process');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    title: 'Barcode Generator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

// ---- List Windows printers (USB, LAN, any installed driver) ----
ipcMain.handle('printers:list', async () => {
  const list = await win.webContents.getPrintersAsync();
  return list.map((p) => ({ name: p.name, isDefault: !!p.isDefault }));
});

// ---- RAW print through Windows spooler (no Zadig, uses installed driver) ----
const PS_SCRIPT = String.raw`param([string]$PrinterName,[string]$FilePath)
$code = @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
  [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  public static bool Send(string printer, byte[] data) {
    IntPtr h;
    if (!OpenPrinter(printer, out h, IntPtr.Zero)) return false;
    DOCINFOA di = new DOCINFOA();
    di.pDocName = "Barcode Label";
    di.pDataType = "RAW";
    bool ok = false;
    if (StartDocPrinter(h, 1, di)) {
      if (StartPagePrinter(h)) {
        IntPtr p = Marshal.AllocCoTaskMem(data.Length);
        Marshal.Copy(data, 0, p, data.Length);
        int written;
        ok = WritePrinter(h, p, data.Length, out written);
        Marshal.FreeCoTaskMem(p);
        EndPagePrinter(h);
      }
      EndDocPrinter(h);
    }
    ClosePrinter(h);
    return ok;
  }
}
"@
Add-Type -TypeDefinition $code -Language CSharp
$bytes = [System.IO.File]::ReadAllBytes($FilePath)
if (-not [RawPrinter]::Send($PrinterName, $bytes)) { Write-Error "RAW print failed"; exit 1 }
`;

ipcMain.handle('print:raw', async (_e, printerName, base64) => {
  const tmpDir = os.tmpdir();
  const scriptPath = path.join(tmpDir, 'bg-rawprint.ps1');
  const dataPath = path.join(tmpDir, `bg-job-${Date.now()}.bin`);
  fs.writeFileSync(scriptPath, PS_SCRIPT, 'utf8');
  fs.writeFileSync(dataPath, Buffer.from(base64, 'base64'));
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-PrinterName', printerName, '-FilePath', dataPath],
      { windowsHide: true },
      (err, _stdout, stderr) => {
        try { fs.unlinkSync(dataPath); } catch (_) {}
        if (err) reject(new Error((stderr || err.message).toString().trim()));
        else resolve(true);
      }
    );
  });
});

// ---- RAW print over LAN (TCP 9100) ----
ipcMain.handle('print:lan', (_e, host, port, base64) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.once('timeout', () => { socket.destroy(); reject(new Error('LAN printer timeout')); });
    socket.once('error', (err) => reject(new Error('LAN print failed: ' + err.message)));
    socket.connect(Number(port) || 9100, host, () => {
      socket.write(Buffer.from(base64, 'base64'), () => {
        socket.end();
        resolve(true);
      });
    });
  });
});
