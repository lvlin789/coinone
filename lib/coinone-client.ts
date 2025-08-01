// 客户端专用的Coinone API客户端（只处理Public API和内部API调用）

// 类型定义
export interface RangePriceUnit {
  range_min: number;
  next_range_min: number;
  price_unit: number;
}

export interface RangeUnitsResponse {
  result: string;
  error_code: string;
  range_price_units: RangePriceUnit[];
}

export interface TickerInfo {
  currency: string;
  volume: string;
  yesterday_volume: string;
  yesterday_last: string;
  yesterday_low: string;
  yesterday_high: string;
  yesterday_first: string;
  last: string;
  high: string;
  low: string;
  first: string;
  timestamp: string;
}

export interface OrderbookEntry {
  price: string;
  qty: string;
}

export interface OrderbookResponse {
  result: string;
  error_code: string;
  timestamp: string;
  currency: string;
  bid: OrderbookEntry[];
  ask: OrderbookEntry[];
}

export interface BalanceInfo {
  currency: string;
  available: string;
  balance: string;
  limit?: string;
  average_price?: string;
}

export interface BalanceResponse {
  result: string;
  error_code: string;
  balances: BalanceInfo[];
}

export interface OrderRequest {
  quote_currency: string;
  target_currency: string;
  type: 'LIMIT' | 'MARKET';
  side: 'BUY' | 'SELL';
  qty: string;
  price?: string;
  post_only?: boolean;
}

export interface ApiCredentials {
  accessToken: string;
  secretKey: string;
}

export class CoinoneClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.coinone.co.kr') {
    this.baseUrl = baseUrl;
  }

  // Public API 方法

  /**
   * 获取个别报价单位信息
   * @param quoteCurrency 基准货币 (如 'KRW')
   * @param targetCurrency 目标货币 (如 'BTC')
   */
  async getRangeUnits(quoteCurrency: string, targetCurrency: string): Promise<RangeUnitsResponse> {
    const url = `${this.baseUrl}/public/v2/range_units/${quoteCurrency}/${targetCurrency}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get quote units:', error);
      throw error;
    }
  }

  /**
   * 获取订单簿信息
   * @param quoteCurrency 基准货币
   * @param targetCurrency 目标货币
   * @param size 返回数量 (默认15)
   */
  async getOrderbook(quoteCurrency: string, targetCurrency: string, size: number = 15): Promise<OrderbookResponse> {
    const url = `${this.baseUrl}/public/v2/orderbook/${quoteCurrency}/${targetCurrency}?size=${size}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get orderbook:', error);
      throw error;
    }
  }

  /**
   * 获取ticker信息
   * @param quoteCurrency 基准货币
   * @param targetCurrency 目标货币
   */
  async getTicker(quoteCurrency: string, targetCurrency: string): Promise<TickerInfo> {
    const url = `${this.baseUrl}/public/v2/ticker/${quoteCurrency}/${targetCurrency}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get ticker info:', error);
      throw error;
    }
  }

  // 通过内部API调用私有API的方法

  /**
   * 测试API连接
   * @param credentials API密钥
   */
  async testConnection(credentials: ApiCredentials): Promise<boolean> {
    try {
      const response = await fetch('/api/coinone/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  /**
   * 获取账户余额
   * @param credentials API密钥
   * @param currency 货币代码（可选）
   */
  async getBalance(credentials: ApiCredentials, currency?: string): Promise<BalanceResponse | BalanceInfo> {
    try {
      const response = await fetch('/api/coinone/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...credentials, currency })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * 获取存币地址
   * @param credentials API密钥
   */
  async getDepositAddress(credentials: ApiCredentials) {
    try {
      const response = await fetch('/api/coinone/deposit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to get deposit address:', error);
      throw error;
    }
  }

  /**
   * 获取提币地址列表
   * @param credentials API密钥
   * @param currency 可选的币种筛选
   */
  async getWithdrawalAddresses(credentials: ApiCredentials, currency?: string) {
    try {
      const response = await fetch('/api/coinone/withdrawal-addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...credentials, currency })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to get withdrawal addresses:', error);
      throw error;
    }
  }

  /**
   * 执行提币操作
   * @param credentials API密钥
   * @param withdrawParams 提币参数
   */
  async withdrawCoin(credentials: ApiCredentials, withdrawParams: {
    currency: string;
    amount: string;
    address: string;
    secondary_address?: string;
  }) {
    try {
      const response = await fetch('/api/coinone/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...credentials, ...withdrawParams })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Withdrawal operation failed:', error);
      throw error;
    }
  }

  /**
   * 创建交易订单
   * @param credentials API密钥
   * @param orderParams 订单参数
   */
  async createOrder(credentials: ApiCredentials, orderParams: {
    quote_currency: string;
    target_currency: string;
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
    side: 'BUY' | 'SELL';
    price?: string;
    qty?: string;
    amount?: string;
    post_only?: boolean;
    limit_price?: string;
    trigger_price?: string;
    user_order_id?: string;
  }) {
    try {
      const response = await fetch('/api/coinone/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...credentials, ...orderParams })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * 创建限价订单
   */
  async createLimitOrder(
    credentials: ApiCredentials,
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    postOnly = false,
    userOrderId?: string
  ) {
    return this.createOrder(credentials, {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'LIMIT',
      side,
      price,
      qty,
      post_only: postOnly,
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }

  /**
   * 创建市价买入订单
   */
  async createMarketBuyOrder(
    credentials: ApiCredentials,
    quoteCurrency: string,
    targetCurrency: string,
    amount: string,
    limitPrice?: string,
    userOrderId?: string
  ) {
    return this.createOrder(credentials, {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'BUY',
      amount,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }

  /**
   * 创建市价卖出订单
   */
  async createMarketSellOrder(
    credentials: ApiCredentials,
    quoteCurrency: string,
    targetCurrency: string,
    qty: string,
    limitPrice?: string,
    userOrderId?: string
  ) {
    return this.createOrder(credentials, {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'SELL',
      qty,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }

  /**
   * 创建止损限价订单
   */
  async createStopLimitOrder(
    credentials: ApiCredentials,
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    triggerPrice: string,
    userOrderId?: string
  ) {
    return this.createOrder(credentials, {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'STOP_LIMIT',
      side,
      price,
      qty,
      trigger_price: triggerPrice,
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }

  /**
   * 查询未成交订单
   * @param credentials API密钥
   * @param queryParams 查询参数
   */
  async getActiveOrders(credentials: ApiCredentials, queryParams?: {
    quote_currency?: string;
    target_currency?: string;
    order_type?: string[];
  }) {
    try {
      const response = await fetch('/api/coinone/active-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...credentials, ...queryParams })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    } catch (error) {
      console.error('Failed to query active orders:', error);
      throw error;
    }
  }
}

// 创建默认实例
export const coinoneClient = new CoinoneClient();

// 导出常用货币对
export const CURRENCY_PAIRS = {
  BTC_KRW: { quote: 'KRW', target: 'BTC' },
  ETH_KRW: { quote: 'KRW', target: 'ETH' },
  XRP_KRW: { quote: 'KRW', target: 'XRP' },
  ADA_KRW: { quote: 'KRW', target: 'ADA' },
  DOT_KRW: { quote: 'KRW', target: 'DOT' }
} as const; 