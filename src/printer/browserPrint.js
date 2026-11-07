// Regular browser/OS print dialog. Sized to label via @page (mm).
export function browserPrintCanvas(canvas, widthMM, heightMM) {
  return new Promise((resolve, reject) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(
        `<html><head><style>
          @page { size: ${widthMM}mm ${heightMM}mm; margin: 0; }
          html, body { margin: 0; padding: 0; }
          img { width: ${widthMM}mm; height: ${heightMM}mm; display: block; }
        </style></head><body><img id="l" src="${dataUrl}" /></body></html>`
      );
      doc.close();
      const img = doc.getElementById('l');
      const go = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 1500);
      };
      if (img.complete) go();
      else img.onload = go;
    } catch (err) {
      reject(err);
    }
  });
}
