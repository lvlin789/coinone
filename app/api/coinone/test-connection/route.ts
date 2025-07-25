import { NextRequest, NextResponse } from 'next/server';
import { CoinoneServerClientV2 } from '@/lib/coinone-server-client';

/**
 * 测试Coinone API连接
 * 
 * POST /api/coinone/test-connection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, secretKey } = body;

    // 验证必需参数
    if (!accessToken || !secretKey) {
      return NextResponse.json(
        { success: false, error: '缺少必需的API凭证' },
        { status: 400 }
      );
    }

    // 创建客户端实例
    const client = new CoinoneServerClientV2();
    
    // 设置凭证（包含格式验证）
    client.setCredentials(accessToken, secretKey);
    
    // 测试连接
    const isConnected = await client.testConnection();
    
    if (isConnected) {
      return NextResponse.json({ 
        success: true, 
        message: 'API连接成功' 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'API连接失败' },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('连接测试失败:', error);
    
    const errorMessage = error instanceof Error ? error.message : '连接测试失败';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 