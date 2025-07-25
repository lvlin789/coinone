import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2 } from '@/lib/coinone-server-client';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, secretKey, currency } = await request.json();

    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const client = new CoinoneServerClientV2();
    client.setCredentials(accessToken, secretKey);

    try {
      const params = currency ? { currency } : {};
      const result = await client.getWithdrawalAddresses(params);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取提币地址失败:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '获取提币地址失败' 
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