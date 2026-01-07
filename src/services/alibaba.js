/**
 * Alibaba商品スクレイピングとAI分析サービス
 */

/**
 * Alibaba商品ページから情報を抽出（jina.ai reader API使用）
 */
export async function scrapeAlibabaProduct(url) {
  try {
    console.log('Fetching Alibaba product page with jina.ai reader:', url);
    
    // jina.ai reader APIを使用（markdownでクリーンなコンテンツを取得）
    const readerUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(readerUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'text'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ページの取得に失敗しました`);
    }
    
    const content = await response.text();
    console.log('Page fetched, length:', content.length);
    
    // テキストコンテンツから情報を抽出
    let title = '';
    let description = '';
    let minPrice = 0;
    let maxPrice = 0;
    let images = [];
    let specifications = {};
    
    console.log('Starting data extraction from clean content...');
    
    // タイトルを抽出（最初の行を商品名として使用）
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      title = lines[0].trim()
                     .replace(/ - Alibaba\.com$/i, '')
                     .replace(/ \| Alibaba\.com$/i, '')
                     .replace(/Product on Alibaba\.com$/i, '');
      console.log('Title found:', title);
    }
    
    // 価格を抽出（テキストから）
    const pricePatterns = [
      /US\s*\$\s*(\d+(?:\.\d+)?)\s*-\s*US\s*\$\s*(\d+(?:\.\d+)?)/i,
      /\$\s*(\d+(?:\.\d+)?)\s*-\s*\$\s*(\d+(?:\.\d+)?)/i,
      /¥\s*(\d+(?:\.\d+)?)\s*-\s*¥\s*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)\s*USD/i,
      /(\d+(?:\.\d+)?)\s*pieces/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = content.match(pattern);
      if (match) {
        minPrice = parseFloat(match[1]);
        maxPrice = match[2] ? parseFloat(match[2]) : minPrice;
        // 人民元の場合は米ドルに換算（1元 ≈ 0.14ドル）
        if (pattern.toString().includes('¥')) {
          minPrice = minPrice * 0.14;
          maxPrice = maxPrice * 0.14;
        }
        if (minPrice > 0) {
          console.log('Price found:', minPrice, '-', maxPrice);
          break;
        }
      }
    }
    
    // 説明を生成（最初の数行から）
    description = lines.slice(0, 5).join(' ').substring(0, 500);
    
    // 仕様を抽出（key:value形式の行を探す）
    for (const line of lines) {
      const specMatch = line.match(/^([^:：]+)[：:]\s*(.+)$/);
      if (specMatch) {
        const key = specMatch[1].trim();
        const value = specMatch[2].trim();
        if (key.length > 1 && key.length < 50 && value.length > 0 && value.length < 200) {
          specifications[key] = value;
        }
      }
    }
    console.log('Specifications found:', Object.keys(specifications).length);
    
    // 画像URLを抽出（テキストモードでは取得不可、OpenAIに画像生成を依頼）
    // OpenAIのDALL-Eで商品画像を生成するか、手動でURLを入力してもらう
    images = [];
    
    // 仕様テーブルを抽出（削除済み：HTMLパースは不要）
    
    // データが不足している場合のフォールバック
    if (!title || title.length < 5) {
      // 最後の手段：URLから商品IDを抽出
      const urlMatch = url.match(/product-detail\/([^_/]+)/);
      title = urlMatch ? urlMatch[1].replace(/-/g, ' ') : 'Alibaba商品';
      console.warn('Title fallback used:', title);
    }
    
    if (!description || description.length < 10) {
      description = title;
    }
    
    if (minPrice === 0 || isNaN(minPrice)) {
      // デフォルト価格は設定しない（ユーザーに入力してもらう）
      console.warn('Price not found, will need manual input');
      minPrice = 0;
      maxPrice = 0;
    }
    
    if (images.length === 0) {
      console.warn('No images found');
    }
    
    console.log('Extraction complete:', {
      title: title.substring(0, 50),
      priceRange: `$${minPrice}-$${maxPrice}`,
      imageCount: images.length,
      specsCount: Object.keys(specifications).length
    });
    
    return {
      title,
      description,
      minPrice,
      maxPrice,
      images,
      specifications,
      sourceUrl: url
    };
    
  } catch (error) {
    console.error('Alibaba scraping error:', error);
    throw new Error('商品情報の取得に失敗しました: ' + error.message);
  }
}

/**
 * OpenAI APIで商品情報を分析・最適化
 */
export async function analyzeProductWithAI(productData, marginRate, apiKey) {
  try {
    const prompt = `
あなたは日本のECサイトの商品ページ作成の専門家です。
以下のAlibaba商品情報を、日本の消費者向けに最適化してください。

【元の商品情報】
商品名: ${productData.title}
商品説明: ${productData.description}
価格範囲: $${productData.minPrice} - $${productData.maxPrice}
仕様: ${JSON.stringify(productData.specifications)}

【要件】
1. 商品名は30文字以内で、日本語でわかりやすく
2. 商品説明は150-300文字で、具体的なメリットを記載
3. 仕様は重要な項目のみを日本語で
4. カテゴリは「個人向け」「スマートホーム」「車両・バイク」から最適なものを選択
5. SEO対策を考慮したタグを3-5個生成

【価格計算】
- 仕入れ価格: $${productData.minPrice}
- 為替レート: 1ドル=150円
- マージン率: ${marginRate}%
- 販売価格 = 仕入れ価格(円) × (1 + マージン率/100)
- 最終価格は100円単位で丸める

【出力形式（必ずこのJSON形式で）】
{
  "name": "日本語の商品名（30文字以内）",
  "description": "日本語の商品説明（150-300文字、改行は\\nで）",
  "category": "個人向け、スマートホーム、車両・バイクのいずれか",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "price": 販売価格（整数、100円単位）,
  "specifications": {
    "主要スペック1": "値1",
    "主要スペック2": "値2"
  }
}

重要：必ずJSON形式のみを出力してください。説明文は含めないでください。
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは日本のECサイト向けの商品情報最適化の専門家です。必ず正確なJSON形式で応答してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSONを抽出
    let aiResult;
    try {
      aiResult = JSON.parse(content);
    } catch (parseError) {
      // JSONパースに失敗した場合、```json ... ```を探す
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI応答からJSONを抽出できませんでした');
      }
      aiResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    
    // データの検証と補完
    if (!aiResult.name || aiResult.name.length === 0) {
      aiResult.name = productData.title.substring(0, 30);
    }
    
    if (!aiResult.description || aiResult.description.length === 0) {
      aiResult.description = productData.description;
    }
    
    if (!aiResult.price || aiResult.price <= 0) {
      // デフォルト価格計算
      const basePrice = productData.minPrice * 150; // ドル→円
      aiResult.price = Math.round((basePrice * (1 + marginRate / 100)) / 100) * 100;
    }
    
    if (!aiResult.category) {
      aiResult.category = '個人向け';
    }
    
    if (!aiResult.tags || aiResult.tags.length === 0) {
      aiResult.tags = ['セキュリティ', '防犯'];
    }
    
    if (!aiResult.specifications) {
      aiResult.specifications = productData.specifications;
    }
    
    return {
      ...aiResult,
      alibaba_url: productData.sourceUrl,
      alibaba_price: productData.minPrice,
      image_urls: productData.images
    };
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI分析に失敗しました: ' + error.message);
  }
}

/**
 * 画像をR2にダウンロード・アップロード
 */
export async function downloadAndUploadImages(imageUrls, r2Bucket) {
  const uploadedImages = [];
  
  for (let i = 0; i < Math.min(imageUrls.length, 5); i++) {
    try {
      const imageUrl = imageUrls[i];
      const response = await fetch(imageUrl);
      
      if (!response.ok) continue;
      
      const imageData = await response.arrayBuffer();
      const filename = `product-${Date.now()}-${i}.jpg`;
      
      await r2Bucket.put(filename, imageData, {
        httpMetadata: {
          contentType: 'image/jpeg'
        }
      });
      
      uploadedImages.push(filename);
    } catch (error) {
      console.error(`Image ${i} upload failed:`, error);
    }
  }
  
  return uploadedImages;
}
