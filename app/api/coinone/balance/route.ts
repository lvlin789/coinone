import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2 } from '@/lib/coinone-server-client';

/**
 * 获取账户余额
 * 
 * POST /api/coinone/balance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, secretKey, currency } = body;

    // 验证必需参数
    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必需的API凭证' },
        { status: 400 }
      );
    }

    // 创建客户端实例
    const client = new CoinoneServerClientV2();
    
    // 设置凭证
    client.setCredentials(accessToken, secretKey);
    
    // 获取余额
    let result;
    if (currency) {
      // 获取特定货币余额
      result = await client.getCurrencyBalance(currency);
    } else {
      // 获取所有余额
      result = await client.getBalance();
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('余额查询失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '余额查询失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 