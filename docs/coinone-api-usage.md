# Coinone API 客户端使用指南

本项目采用客户端/服务端分离架构集成 Coinone API：
- **Public API**：直接在客户端调用（市场数据）
- **Private API**：通过 Next.js API 路由在服务端安全调用（账户操作）

## 架构说明

### 🔒 安全性设计
- API 密钥仅在服务端处理，不会暴露到浏览器
- 私有 API 请求通过内部 API 路由进行
- 避免 CORS 和浏览器兼容性问题

### 📁 文件结构
```
lib/
├── coinone-client.ts        # 客户端（Public API + 内部调用）
└── coinone-server-client.ts # 服务端（Private API）

app/api/coinone/
├── test-connection/route.ts # 测试连接
└── balance/route.ts         # 获取余额

hooks/
└── useCoinoneApi.ts         # React Hook
```

## 快速开始

### 1. 配置 API 密钥
在 `/apikeySetting` 页面中配置你的 Coinone API 密钥

### 2. 在组件中使用
```tsx
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

function TradingComponent() {
  const {
    isConnected,
    isLoading,
    error,
    getTicker,      // Public API
    getBalance,     // Private API (通过服务端)
    testConnection
  } = useCoinoneApi();
}
```

## API 功能

### Public API（客户端直接调用）

#### 获取价格信息
```tsx
const { getTicker } = useCoinoneApi();

// 获取 BTC/KRW 价格信息
const ticker = await getTicker('KRW', 'BTC');
console.log('当前价格:', ticker.last);
```

#### 获取订单簿
```tsx
const { getOrderbook } = useCoinoneApi();

// 获取 BTC/KRW 订单簿
const orderbook = await getOrderbook('KRW', 'BTC', 15);
console.log('买单:', orderbook.bid);
console.log('卖单:', orderbook.ask);
```

#### 获取报价单位
```tsx
const { getRangeUnits } = useCoinoneApi();

// 获取 BTC/KRW 报价单位
const rangeUnits = await getRangeUnits('KRW', 'BTC');
console.log('价格范围:', rangeUnits.range_price_units);
```

### Private API（通过服务端 API 路由）

#### 测试连接
```tsx
const { testConnection } = useCoinoneApi();

// 使用已保存的密钥测试
const success = await testConnection();

// 或使用临时密钥测试（不保存）
const testCreds = {
  accessToken: 'your-access-token',
  secretKey: 'your-secret-key'
};
const success = await testConnection(testCreds);
```

#### 获取账户余额
```tsx
const { getBalance } = useCoinoneApi();

// 获取所有余额
const allBalances = await getBalance();
console.log('所有余额:', allBalances.balances);

// 获取特定货币余额
const btcBalance = await getBalance('BTC');
console.log('BTC 余额:', btcBalance.available_balance);
```

## 服务端 API 路由

### POST /api/coinone/test-connection
测试 API 连接

**请求体：**
```json
{
  "accessToken": "your-access-token",
  "secretKey": "your-secret-key"
}
```

**响应：**
```json
{
  "success": true
}
```

### POST /api/coinone/balance
获取账户余额

**请求体：**
```json
{
  "accessToken": "your-access-token",
  "secretKey": "your-secret-key",
  "currency": "BTC"  // 可选，获取特定货币
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "result": "success",
    "balances": [...]
  }
}
```

## 错误处理

```tsx
const { error, isLoading } = useCoinoneApi();

// 检查连接状态
if (!isConnected) {
  return <div>请先配置 API 密钥</div>;
}

// 显示加载状态
if (isLoading) {
  return <div>加载中...</div>;
}

// 显示错误信息
if (error) {
  return <div>错误: {error.message}</div>;
}
```

## 扩展 API 路由

要添加新的私有 API 功能：

### 1. 在服务端客户端添加方法
```typescript
// lib/coinone-server-client.ts
async placeOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
  return this.sendPrivateRequest<OrderResponse>('/v2.1/order', orderRequest);
}
```

### 2. 创建 API 路由
```typescript
// app/api/coinone/orders/route.ts
import { CoinoneServerClient } from '@/lib/coinone-server-client';

export async function POST(request: NextRequest) {
  const { accessToken, secretKey, orderRequest } = await request.json();
  
  const client = new CoinoneServerClient();
  client.setCredentials(accessToken, secretKey);
  
  const result = await client.placeOrder(orderRequest);
  return NextResponse.json({ success: true, data: result });
}
```

### 3. 在客户端添加调用方法
```typescript
// lib/coinone-client.ts
async placeOrder(credentials: ApiCredentials, orderRequest: OrderRequest) {
  const response = await fetch('/api/coinone/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...credentials, orderRequest })
  });
  
  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}
```

### 4. 在 Hook 中封装
```typescript
// hooks/useCoinoneApi.ts
const placeOrder = useCallback(async (orderRequest: OrderRequest) => {
  if (!credentials) return null;
  
  try {
    return await coinoneClient.placeOrder(credentials, orderRequest);
  } catch (error) {
    setError({ message: '下单失败' });
    throw error;
  }
}, [credentials]);
```

## 完整示例

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

export default function TradingDashboard() {
  const [btcPrice, setBtcPrice] = useState<string>('');
  const [balance, setBalance] = useState<any>(null);
  
  const {
    isConnected,
    isLoading,
    error,
    getTicker,
    getBalance
  } = useCoinoneApi();

  // 获取BTC价格（Public API）
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const ticker = await getTicker('KRW', 'BTC');
        setBtcPrice(ticker.last);
      } catch (err) {
        console.error('获取价格失败:', err);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000);
    return () => clearInterval(interval);
  }, [getTicker]);

  // 获取余额（Private API）
  useEffect(() => {
    if (isConnected) {
      getBalance().then(setBalance).catch(console.error);
    }
  }, [isConnected, getBalance]);

  if (!isConnected) {
    return (
      <div className="alert alert-warning">
        <span>请先在设置页面配置 API 密钥</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">交易仪表板</h1>
      
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 价格信息 */}
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">BTC/KRW</div>
          <div className="stat-value">
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              `₩${Number(btcPrice).toLocaleString()}`
            )}
          </div>
        </div>

        {/* 余额信息 */}
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">账户余额</div>
          <div className="stat-value text-sm">
            {balance ? (
              <div>
                {balance.balances?.slice(0, 3).map((b: any) => (
                  <div key={b.currency}>
                    {b.currency}: {b.available_balance}
                  </div>
                ))}
              </div>
            ) : (
              '加载中...'
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 安全注意事项

1. **服务端处理**：所有私有 API 请求都在服务端处理，API 密钥不会暴露到客户端
2. **API 权限设置**：建议只开启必要的权限（余额查询、订单查询、交易权限）
3. **密钥管理**：API 密钥存储在浏览器本地，请定期更换
4. **出金权限**：强烈建议不要开启出金权限，降低安全风险
5. **HTTPS**：生产环境确保使用 HTTPS
6. **异常监控**：定期检查交易记录，发现异常立即删除 API 密钥

## 技术细节

### 认证机制
- 使用 HMAC SHA512 签名（服务端）
- 每次请求包含唯一 nonce (UUID v4)
- 自动处理 payload 编码和头部生成

### API 版本
- Public API: v2
- Private API: v2.1  
- 遵循 [Coinone API 文档](https://docs.coinone.co.kr) 规范

### 数据持久化
- API 密钥存储在 localStorage
- 服务端不存储任何用户凭据
- 支持一键清除配置 