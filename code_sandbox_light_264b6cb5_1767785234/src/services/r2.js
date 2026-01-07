/**
 * R2画像管理サービス
 * Cloudflare R2バケットとの連携処理
 */

/**
 * R2に画像をアップロード
 * @param {File|Blob} file - アップロードするファイル
 * @param {string} filename - ファイル名
 * @param {R2Bucket} bucket - R2バケット
 * @returns {Promise<string>} - アップロードされた画像のURL
 */
export async function uploadImage(file, filename, bucket) {
  try {
    // ファイル名をサニタイズ
    const sanitizedFilename = sanitizeFilename(filename);
    
    // タイムスタンプを追加してユニークなファイル名を生成
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    
    // R2にアップロード
    await bucket.put(uniqueFilename, file, {
      httpMetadata: {
        contentType: file.type || 'image/jpeg'
      }
    });
    
    return uniqueFilename;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * R2から画像を取得
 * @param {string} filename - ファイル名
 * @param {R2Bucket} bucket - R2バケット
 * @returns {Promise<Response>}
 */
export async function getImage(filename, bucket) {
  try {
    const object = await bucket.get(filename);
    
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=31536000');
    
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('Image retrieval error:', error);
    return new Response('Error retrieving image', { status: 500 });
  }
}

/**
 * R2から画像を削除
 * @param {string} filename - ファイル名
 * @param {R2Bucket} bucket - R2バケット
 * @returns {Promise<boolean>}
 */
export async function deleteImage(filename, bucket) {
  try {
    await bucket.delete(filename);
    return true;
  } catch (error) {
    console.error('Image deletion error:', error);
    return false;
  }
}

/**
 * R2の画像一覧を取得
 * @param {R2Bucket} bucket - R2バケット
 * @param {string} prefix - プレフィックス（オプション）
 * @param {number} limit - 取得件数（デフォルト: 100）
 * @returns {Promise<Array>}
 */
export async function listImages(bucket, prefix = '', limit = 100) {
  try {
    const listed = await bucket.list({
      prefix,
      limit
    });
    
    return listed.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded
    }));
  } catch (error) {
    console.error('Image listing error:', error);
    return [];
  }
}

/**
 * ファイル名のサニタイズ
 * @param {string} filename - 元のファイル名
 * @returns {string} - サニタイズされたファイル名
 */
function sanitizeFilename(filename) {
  // 危険な文字を削除し、安全なファイル名に変換
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * 画像ファイルかどうかを検証
 * @param {string} contentType - Content-Type
 * @returns {boolean}
 */
export function isValidImageType(contentType) {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  return validTypes.includes(contentType);
}

/**
 * 画像サイズを検証
 * @param {number} size - ファイルサイズ（バイト）
 * @param {number} maxSize - 最大サイズ（バイト、デフォルト: 5MB）
 * @returns {boolean}
 */
export function isValidImageSize(size, maxSize = 5 * 1024 * 1024) {
  return size > 0 && size <= maxSize;
}
