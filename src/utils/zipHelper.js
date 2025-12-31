import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function createZipFromFiles(files) {
  const zip = new JSZip();
  
  for (const file of files) {
    if (file.isText) {
      // Ajouter les notes texte
      zip.file(`${file.name || 'note'}.txt`, file.content);
    } else if (file.isLink) {
      // Ajouter les liens comme fichiers texte
      zip.file(`${file.name}.url`, `[InternetShortcut]\nURL=${file.url}`);
    } else if (file.dataUrl) {
      // Ajouter les images depuis dataUrl
      const base64Data = file.dataUrl.split(',')[1];
      zip.file(file.name, base64Data, { base64: true });
    } else if (file.file) {
      // Ajouter les fichiers réels
      zip.file(file.name, file.file);
    }
  }

  // Générer et télécharger le ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `DropManager-Archive-${new Date().toISOString().slice(0, 10)}.zip`);
  
  return true;
}