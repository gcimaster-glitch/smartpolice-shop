/**
 * Alibaba商品スクレイピングとAI分析サービス
 */

/**
 * Alibaba商品ページから情報を抽出
 */
export async function scrapeAlibabaProduct(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // 商品名を抽出
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                      html.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // 価格を抽出
    const priceMatch = html.match(/\$(\d+(?:\.\d+)?)\s*-\s*\$(\d+(?:\.\d+)?)/i) ||
                      html.match(/US\s*\$(\d+(?:\.\d+)?)/i);
    const minPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const maxPrice = priceMatch && priceMatch[2] ? parseFloat(priceMatch[2]) : minPrice;
    
    // 商品説明を抽出
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // 画像URLを抽出
    const imageMatches = html.matchAll(/https:\/\/[^"'\s]+\.jpg/gi);
    const images = [...new Set([...imageMatches].map(m => m[0]))]
      .filter(url => url.includes('img.alibaba.com') || url.includes('ae01.alicdn.com'))
      .slice(0, 5);
    
    // 仕様・スペックを抽出（JSON-LDから）
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/i);
    let specifications = {};
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1]);
        if (jsonData.offers) {
          specifications.price_range = `$${jsonData.offers.lowPrice} - $${jsonData.offers.highPrice}`;
        }
      } catch (e) {
        // JSON parse error
      }
    }
    
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
    throw new Error('商品情報の取得に失敗しました');
  }
}

/**
 * OpenAI APIで商品情報を分析・最適化
 */
export async function analyzeProductWithAI(productData, marginRate, apiKey) {
  try {
    const prompt = `
あなたはECサイトの商品登録アシスタントです。以下のAlibaba商品情報を分析し、日本のECサイト用に最適化してください。

【元の商品情報】
商品名: ${productData.title}
商品説明: ${productData.description}
価格範囲: $${productData.minPrice} - $${productData.maxPrice}
マージン率: ${marginRate}%

【出力形式】
以下のJSON形式で出力してください：

{
  "name": "日本語の商品名（30文字以内、魅力的に）",
  "description": "日本語の商品説明（100-200文字、SEO対策済み、ベネフィット重視）",
  "category": "個人向け、スマートホーム、車両・バイク のいずれか",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "price": 販売価格（円、整数）,
  "specifications": {
    "主要スペック1": "値1",
    "主要スペック2": "値2"
  }
}

【価格計算ルール】
- 元の価格（ドル）を円に換算（1ドル=150円）
- マージン率を適用: 販売価格 = 仕入れ価格 × (1 + マージン率/100)
- 最終価格は100円単位で丸める

【注意事項】
- 商品名は日本人にとって魅力的で分かりやすく
- 商品説明はベネフィット（利点）を強調
- カテゴリは商品の特性から最適なものを選択
- タグはSEO対策とユーザー検索を考慮
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
            content: 'あなたは日本のECサイト向けの商品情報最適化の専門家です。正確なJSON形式で応答してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // JSONを抽出（```json ... ``` のような形式にも対応）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI応答からJSONを抽出できませんでした');
    }
    
    const aiResult = JSON.parse(jsonMatch[0]);
    
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
