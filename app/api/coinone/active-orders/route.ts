import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2 } from '@/lib/coinone-server-client';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, secretKey, ...queryParams } = await request.json();

    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = new CoinoneServerClientV2();
    client.setCredentials(accessToken, secretKey);

    try {
      const result = await client.getActiveOrders(queryParams);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('查询未成交订单失败:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '查询未成交订单失败' 
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