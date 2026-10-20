/**
 * Utility for handling image uploads and dimensions for speech bubbles.
 */

export interface ProcessedBubbleImage {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Calculates scaled dimensions ensuring max width is 400px while strictly preserving aspect ratio.
 */
export function getScaledImageDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = 400
): { width: number; height: number } {
  if (!naturalWidth || !naturalHeight) {
    return { width: maxWidth, height: maxWidth };
  }

  if (naturalWidth > maxWidth) {
    const scale = maxWidth / naturalWidth;
    return {
      width: maxWidth,
      height: Math.round(naturalHeight * scale),
    };
  }

  return {
    width: naturalWidth,
    height: naturalHeight,
  };
}

/**
 * Reads and processes an image file from the device:
 * - Computes scaled display dimensions (max-width: 400px, aspect-ratio preserved)
 * - Safely optimizes large phone/camera images (if width > 1200px) to prevent memory lag
 *   while preserving razor-sharp 3x retina quality for PDF/PNG export.
 */
export function processUploadedImageFile(file: File): Promise<ProcessedBubbleImage> {
  return new Promise((resolve, reject) => {
    // 1. Enforce strict file size limit (20MB) to prevent Denial of Service and browser memory crash
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('파일 용량이 20MB를 초과하여 업로드할 수 없습니다.'));
      return;
    }

    const isImageMime = Boolean(file.type && file.type.startsWith('image/'));
    const isImageExt = /\.(webp|png|jpe?g|gif|svg|bmp|avif)$/i.test(file.name || '');

    if (!isImageMime && !isImageExt) {
      reject(new Error('선택한 파일이 지원하는 이미지 형식(WebP, PNG, JPG, GIF 등)이 아닙니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = (e) => {
      let rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('이미지 데이터를 읽어오지 못했습니다.'));
        return;
      }

      // If browser/OS read WebP as generic octet-stream, correct MIME header so Image element parses it cleanly
      if (
        (rawDataUrl.startsWith('data:application/octet-stream') || rawDataUrl.startsWith('data:;base64')) &&
        /\.webp$/i.test(file.name || '')
      ) {
        rawDataUrl = rawDataUrl.replace(/^data:[^;]*/, 'data:image/webp');
      }

      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다. WebP 파일이 손상되지 않았는지 확인해주세요.'));
      img.onload = () => {
        const naturalW = img.naturalWidth || 400;
        const naturalH = img.naturalHeight || 300;

        // Calculate target display dimensions (max-width: 400px while strictly preserving aspect ratio)
        const { width: displayW, height: displayH } = getScaledImageDimensions(
          naturalW,
          naturalH,
          400
        );

        // Security: If the uploaded file is an SVG vector image, rasterize it onto canvas to convert
        // all XML/SVG markup and potential scripts into inert pixel data (prevents SVG XSS)
        const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name || '');
        if (isSvg) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(1200, naturalW);
            canvas.height = Math.round(naturalH * (canvas.width / naturalW));
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve({
                dataUrl: canvas.toDataURL('image/png'),
                width: displayW,
                height: displayH,
              });
              return;
            }
          } catch {
            reject(
              new Error(
                'SVG 이미지를 안전하게 변환하지 못했습니다. PNG 또는 WebP 형식으로 업로드해주세요.'
              )
            );
            return;
          }
        }

        // Optimization: if camera photo or large graphic is larger than 1200px (3x retina of 400px),
        // scale down the stored raster bitmap to 1200px to avoid memory lag while retaining ultra-sharp print quality
        const maxStorageW = 1200;
        if (naturalW > maxStorageW) {
          try {
            const canvas = document.createElement('canvas');
            const storageScale = maxStorageW / naturalW;
            canvas.width = maxStorageW;
            canvas.height = Math.round(naturalH * storageScale);

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              const isPng = file.type === 'image/png' || /\.png$/i.test(file.name || '');
              const isWebp = file.type === 'image/webp' || /\.webp$/i.test(file.name || '');

              let outputMime = 'image/jpeg';
              let quality: number | undefined = 0.92;

              if (isPng) {
                outputMime = 'image/png';
                quality = undefined;
              } else if (isWebp) {
                outputMime = 'image/webp';
                quality = 0.92;
              }

              let optimizedDataUrl = canvas.toDataURL(outputMime, quality);
              // Fallback if browser canvas does not support image/webp export
              if (isWebp && (!optimizedDataUrl || !optimizedDataUrl.startsWith('data:image/webp'))) {
                optimizedDataUrl = canvas.toDataURL('image/png');
              }

              resolve({
                dataUrl: optimizedDataUrl,
                width: displayW,
                height: displayH,
              });
              return;
            }
          } catch {
            // fallback to original if canvas manipulation fails
          }
        }

        resolve({
          dataUrl: rawDataUrl,
          width: displayW,
          height: displayH,
        });
      };
      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
