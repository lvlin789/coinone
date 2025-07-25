import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2 } from '@/lib/coinone-server-client';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, secretKey, ...orderParams } = await request.json();

    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证必要的交易参数
    const { quote_currency, target_currency, type, side } = orderParams;
    if (!quote_currency || !target_currency || !type || !side) {
      return NextResponse.json(
        { success: false, error: '缺少交易参数' },
        { status: 400 }
      );
    }

    const client = new CoinoneServerClientV2();
    client.setCredentials(accessToken, secretKey);

    try {
      const result = await client.createOrder(orderParams);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '创建订单失败' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('请求解析失败:', error);
    return NextResponse.json(
      { success: false, error: '请求解析失败' },
      { status: 400 }
    );
  }
} 