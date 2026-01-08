/**
 * Alibaba商品スクレイピングとAI分析サービス
 */

/**
 * Alibaba商品ページから情報を抽出（フォールバック戦略使用）
 * 戦略1: Crawler API（推奨）
 * 戦略2: 直接fetch
 */
export async function scrapeAlibabaProduct(url) {
  try {
    console.log('Fetching Alibaba product page:', url);
    
    // 戦略1: Crawler API（より高度なスクレイピング）
    let content = null;
    let method = 'unknown';
    
    try {
      console.log('Strategy 1: Crawler API...');
      const crawlerResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'text'
        }
      });
      
      if (crawlerResponse.ok) {
        content = await crawlerResponse.text();
        method = 'crawler-api';
        console.log('Crawler API successful, length:', content.length);
      } else {
        console.log('Crawler API failed:', crawlerResponse.status);
      }
    } catch (error) {
      console.log('Crawler API error:', error.message);
    }
    
    // 戦略2: 直接fetch（User-Agentを偽装）
    
    try {
      console.log('Strategy 1: Direct fetch with User-Agent...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        content = await response.text();
        method = 'direct-fetch';
        console.log('Direct fetch successful, length:', content.length);
      } else {
        console.log('Direct fetch failed:', response.status);
      }
    } catch (error) {
      console.log('Direct fetch error:', error.message);
    }
    
    // コンテンツが取得できなかった場合は、手動入力モードにフォールバック
    if (!content || content.length < 1000) {
      console.log('Automatic extraction failed, using manual input mode');
      // URLから基本情報を抽出
      const urlMatch = url.match(/product-detail\/([^_/]+)/);
      const titleFromUrl = urlMatch ? urlMatch[1].replace(/-/g, ' ') : 'Alibaba商品';
      
      return {
        title: titleFromUrl,
        description: 'Alibaba商品 - 詳細は手動で入力してください',
        minPrice: 0,  // ユーザーに入力してもらう
        maxPrice: 0,
        images: [],   // ユーザーに入力してもらう
        specifications: {},
        sourceUrl: url,
        manualInputRequired: true
      };
    }
    
    console.log('Content extraction method:', method);
    
    // HTMLまたはテキストから情報を抽出
    let title = '';
    let description = '';
    let minPrice = 0;
    let maxPrice = 0;
    let images = [];
    let specifications = {};
    
    console.log('Starting data extraction...');
    
    // Crawler API（テキスト形式）の場合の処理
    if (method === 'crawler-api') {
      console.log('Extracting from Crawler API text format...');
      
      // タイトルを抽出（最初の行または主要な製品名）
      const titleLines = content.split('\n').filter(line => line.trim());
      if (titleLines.length > 0) {
        // 最初の意味のある行をタイトルとする
        title = titleLines[0].trim().replace(/\s+on Alibaba\.com$/i, '');
        console.log('Title from crawler:', title.substring(0, 50));
      }
      
      // 仕様を抽出（「項目:値」形式を探す - 改善版）
      // 行ごとに処理して、より多くの仕様を抽出
      const specLines = content.split('\n');
      
      for (const line of specLines) {
        const trimmedLine = line.trim();
        
        // パターン1: 「項目:値」形式（中国語/日本語/英語）
        const colonMatch = trimmedLine.match(/^([^:：]+)[：:]\s*(.+)$/);
        if (colonMatch && colonMatch[1] && colonMatch[2]) {
          const key = colonMatch[1].trim();
          const value = colonMatch[2].trim();
          
          // キーと値が有効な長さの場合のみ追加
          if (key.length > 1 && key.length < 50 && 
              value.length > 0 && value.length < 200 &&
              !key.toLowerCase().includes('http') &&
              !value.toLowerCase().includes('http')) {
            
            // 日本語キーに変換（一般的な項目）
            const keyMap = {
              '型号': 'モデル',
              '品牌': 'ブランド',
              '频率范围': '周波数範囲',
              '頻率範囲': '周波数範囲',
              '检测灵敏度': '検出感度',
              '検出灵敏度': '検出感度',
              '连续工作时间': '連続動作時間',
              '連続工作時間': '連続動作時間',
              '电源': '電源',
              '電源': '電源',
              '防水': '防水性',
              '包装': '梱包',
              '检测动态范围': '検出ダイナミックレンジ',
              '倾斜测量范围': '測定範囲',
              '工作电流': '動作電流'
            };
            
            const japaneseKey = keyMap[key] || key;
            specifications[japaneseKey] = value;
          }
        }
      }
      
      console.log('Specifications found:', Object.keys(specifications).length);
      
      // 説明を生成（仕様から）
      if (Object.keys(specifications).length > 0) {
        description = Object.entries(specifications)
          .slice(0, 5)
          .map(([key, value]) => `${key}: ${value}`)
          .join('。');
      } else {
        description = title;
      }
    }
    
    // HTML形式（direct-fetch）の場合の処理
    if (method === 'direct-fetch') {
      console.log('Extracting from HTML format...');
      
      // タイトルを抽出（複数のパターンを試す）
      const titlePatterns = [
        /<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
        /<title>([^<|]+)(?:\||<)/i,
        /"productName"\s*:\s*"([^"]+)"/i,
        /"title"\s*:\s*"([^"]+)"/i,
        /<h1[^>]*>([^<]+)<\/h1>/i,
        /data-title="([^"]{10,100})"/i
      ];
      
      for (const pattern of titlePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          title = match[1].trim();
          // HTMLエンティティをデコード
          title = title.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'")
                       .replace(/ - Alibaba\.com$/i, '')
                       .replace(/ \| Alibaba\.com$/i, '')
                       .replace(/ - .*? on Alibaba\.com$/i, '');
          if (title.length > 5) {
            console.log('Title found:', title.substring(0, 50));
            break;
          }
        }
      }
    }
    
    // 共通の価格抽出処理（両方のメソッドで使用）
    const pricePatterns = [
      /US\s*\$\s*(\d+(?:\.\d+)?)\s*-\s*US\s*\$\s*(\d+(?:\.\d+)?)/i,
      /\$\s*(\d+(?:\.\d+)?)\s*-\s*\$\s*(\d+(?:\.\d+)?)/i,
      /"minPrice"\s*:\s*"?(\d+(?:\.\d+)?)"?/i,
      /"price"\s*:\s*"?(\d+(?:\.\d+)?)"?/i,
      /¥\s*(\d+(?:\.\d+)?)\s*-\s*¥\s*(\d+(?:\.\d+)?)/i
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
    
    // 画像URLを抽出（alicdn.comから、両メソッド共通）
    const imagePattern = /https?:\/\/[^"'\s)]+?\.alicdn\.com[^"'\s)]+?\.(?:jpg|jpeg|png|webp)/gi;
    const allImages = [...content.matchAll(imagePattern)];
    images = [...new Set(allImages.map(m => m[0]))]
      .filter(url => 
        !url.includes('logo') &&
        !url.includes('icon') &&
        !url.includes('avatar') &&
        url.length < 300
      )
      .slice(0, 5);
    
    console.log('Images found:', images.length);
    
    // 仕様を抽出（HTML形式の場合のみ、テーブルから）
    if (method === 'direct-fetch' && Object.keys(specifications).length === 0) {
      const specsPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<\/tr>/gi;
      const specsMatches = [...content.matchAll(specsPattern)];
      
      specsMatches.forEach(match => {
        if (match[1] && match[2]) {
          const key = match[1].trim().replace(/<[^>]*>/g, '');
          const value = match[2].trim().replace(/<[^>]*>/g, '');
          if (key && value && key.length < 50 && value.length < 200) {
            specifications[key] = value;
          }
        }
      });
    }
    
    // 説明文の抽出（HTML形式の場合のみ、Crawler APIの場合は既に生成済み）
    if (method === 'direct-fetch' && !description) {
      const descPatterns = [
        /<meta[^>]+name="description"[^>]+content="([^"]+)"/i,
        /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
        /"description"\s*:\s*"([^"]+)"/i
      ];
      
      for (const pattern of descPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          description = match[1].trim().substring(0, 500);
          break;
        }
      }
      
      if (!description && title) {
        description = title;
      }
    }
    
    console.log('Specifications found:', Object.keys(specifications).length);
    
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
