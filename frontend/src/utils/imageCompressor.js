export const compressImage = (file, maxSizeMB = 0.15, maxWidth = 600) => {
  return new Promise((resolve, reject) => {
    // If the file is smaller than maxSizeMB, we can just return it as base64 without compression, 
    // or we can still compress it. To be safe and consistent, we'll process it.
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        
        // Resize if it exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Rough estimate of base64 string size in bytes
        const getByteSize = (base64String) => base64String.length * 0.75;
        const maxBytes = maxSizeMB * 1024 * 1024;

        // Reduce quality if still too large
        while (getByteSize(dataUrl) > maxBytes && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
