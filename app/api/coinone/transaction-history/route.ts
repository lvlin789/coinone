import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2, TransactionHistoryParams } from '@/lib/coinone-server-client';

/**
 * 获取交易历史记录 (V2.1 API)
 * 
 * POST /api/coinone/transaction-history
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      accessToken, 
      secretKey, 
      currency,
      to_id,
      is_deposit,
      size = 50,
      days = 30  // 默认查询最近30天
    } = body;

    // 验证必需参数
    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必需的API凭证' },
        { status: 400 }
      );
    }

    // 计算时间范围（默认查询最近30天）
    const now = Date.now();
    const daysInMs = Math.min(Math.max(days, 1), 90) * 24 * 60 * 60 * 1000; // 限制在1-90天
    const from_ts = now - daysInMs;
    const to_ts = now;

    // 准备查询参数
    const params: TransactionHistoryParams = {
      currency: currency?.toUpperCase(),
      to_id,
      is_deposit,
      size: Math.min(Math.max(size, 1), 100), // 限制在1-100范围内
      from_ts,
      to_ts
    };

    // 创建客户端实例
    const client = new CoinoneServerClientV2();
    
    // 设置凭证
    client.setCredentials(accessToken, secretKey);
    
    // 获取交易历史记录
    const result = await client.getTransactionHistory(params);
    
    return NextResponse.json({
      success: true,
      data: result,
      query_params: {
        currency: params.currency || 'ALL',
        is_deposit: params.is_deposit,
        size: params.size,
        days: Math.floor(daysInMs / (24 * 60 * 60 * 1000)),
        from_date: new Date(from_ts).toISOString(),
        to_date: new Date(to_ts).toISOString()
      }
    });

  } catch (error) {
    console.error('交易历史查询失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '交易历史查询失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 