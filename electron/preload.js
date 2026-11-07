const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronPrinter', {
  listPrinters: () => ipcRenderer.invoke('printers:list'),
  printRaw: (printerName, base64) => ipcRenderer.invoke('print:raw', printerName, base64),
  printLan: (host, port, base64) => ipcRenderer.invoke('print:lan', host, port, base64),
});
