import crypto from 'crypto';

/**
 * Coinone 服务器端私有API客户端 - 重构版本
 * 
 * 重构原因和改进：
 * 1. 修复双重nonce生成bug - 确保签名和请求体数据一致
 * 2. 分离关注点 - 认证、签名、请求发送各自独立
 * 3. 严格按照官方示例 - 完全对齐官方API文档
 * 4. 提高可测试性 - 每个步骤可独立验证
 * 5. 更好的错误处理 - 详细的错误信息和调试支持
 */

// 类型定义
export interface ApiCredentials {
  accessToken: string;
  secretKey: string;
}

export interface AuthenticatedPayload {
  access_token: string;
  nonce: string;
  [key: string]: unknown;
}



export interface ApiResponse<T = unknown> {
  result: 'success' | 'error';
  error_code?: string;
  error_msg?: string;
  data?: T;
  [key: string]: unknown;
}

// 货币余额信息
export interface CurrencyBalance {
  currency: string;
  balance: string;
  locked: string;
}

export interface BalanceResponse {
  result: 'success';
  balances: CurrencyBalance[];
}

// 用户信息相关接口
export interface UserInfoResponse {
  result: 'success' | 'error';
  errorCode?: string;
  userInfo?: {
    virtualAccountInfo?: {
      depositor: string;
      accountNumber: string;
      bankName: string;
    };
    mobileInfo?: {
      userName: string;
      phoneNumber: string;
      phoneCorp: string;
      isAuthenticated: boolean;
    };
    bankInfo?: {
      depository: string;
      bankCode: string;
      accountNumber: string;
      isAuthenticated: boolean;
    };
    emailInfo?: {
      isAuthenticated: boolean;
      email: string;
    };
    securityLevel?: string;
    feeRate?: {
      [symbol: string]: {
        maker: string;
        taker: string;
      };
    };
  };
}

// 存币地址相关接口 (V2 API)
export interface DepositAddressResponse {
  result: 'success' | 'error';
  errorCode?: string;
  walletAddress?: {
    btc?: string;
    eth?: string;
    xrp?: string;
    xrp_tag?: string;
    eos?: string;
    eos_memo?: string;
    [symbol: string]: string | undefined; // 支持其他币种
  };
}

// 提币地址相关接口 (V2.1 API)
export interface WithdrawalAddress {
  currency: string;              // 币种
  address: string;               // 提币地址
  secondary_address?: string;    // 附加地址信息（memo或destination tag）
  nickname: string;              // 地址别名
  created_at: number;            // 创建时间戳
}

export interface WithdrawalAddressResponse {
  result: 'success' | 'error';
  error_code?: string;
  withdrawal_addresses?: WithdrawalAddress[];
}

export interface WithdrawalAddressParams {
  currency?: string;  // 可选，用于筛选特定币种
  [key: string]: unknown; // 添加索引签名
}

// 提币操作相关接口 (V2.1 API)
export interface WithdrawalRequest {
  currency: string;           // 提币币种
  amount: string;            // 提币数量
  address: string;           // 提币地址
  secondary_address?: string; // 可选的memo或tag
  [key: string]: unknown;    // 添加索引签名
}

export interface WithdrawalTransaction {
  id: string;                 // 交易ID
  currency: string;           // 币种
  address: string;            // 提币地址
  secondary_address?: string; // memo或tag
  amount: string;             // 提币数量
  status: string;             // 交易状态
}

export interface WithdrawalResponse {
  result: 'success' | 'error';
  error_code?: string;
  transaction?: WithdrawalTransaction;
}

// 交易订单相关接口 (V2.1 API)
export interface OrderRequest {
  quote_currency: string;      // 基准货币 (如: KRW)
  target_currency: string;     // 目标货币 (如: BTC)
  type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';  // 订单类型
  side: 'BUY' | 'SELL';       // 买入/卖出
  price?: string;              // 价格 (限价和止损限价必须)
  qty?: string;                // 数量 (限价、止损限价、市价卖出必须)
  amount?: string;             // 总额 (市价买入必须)
  post_only?: boolean;         // 仅挂单 (限价订单必须)
  limit_price?: string;        // 限制价格 (市价订单可选)
  trigger_price?: string;      // 触发价格 (止损限价必须)
  user_order_id?: string;      // 用户自定义订单ID
  [key: string]: unknown;     // 添加索引签名
}

export interface OrderResponse {
  result: 'success' | 'error';
  error_code?: string;
  order_id?: string;           // 订单ID
}

// 未成交订单相关接口 (V2.1 API)
export interface ActiveOrdersRequest {
  quote_currency?: string;     // 基准货币 (可选)
  target_currency?: string;    // 目标货币 (可选)
  order_type?: string[];       // 订单类型数组 (可选)
  [key: string]: unknown;     // 添加索引签名
}

export interface ActiveOrder {
  order_id: string;            // 订单ID
  type: 'LIMIT' | 'STOP_LIMIT'; // 订单类型
  side: 'BUY' | 'SELL';       // 买入/卖出
  quote_currency: string;      // 基准货币
  target_currency: string;     // 目标货币
  price: string;               // 订单价格
  original_qty: string;        // 最初订单数量
  remain_qty: string;          // 未成交数量
  executed_qty: string;        // 已成交数量
  canceled_qty: string;        // 已取消数量
  fee: string;                 // 手续费
  fee_rate: string;            // 手续费率
  average_executed_price: string; // 平均成交价
  ordered_at: number;          // 订单时间戳
  is_triggered?: boolean;      // 是否已触发 (止损限价订单)
  trigger_price?: string;      // 触发价格 (止损限价订单)
  triggered_at?: number;       // 触发时间戳 (止损限价订单)
}

export interface ActiveOrdersResponse {
  result: 'success' | 'error';
  error_code?: string;
  active_orders?: ActiveOrder[];
}

// 交易历史相关接口 (V2.1 API)
export interface TransactionRecord {
  id: string;                    // 交易识别ID
  currency: string;              // 货币符号
  txid: string;                  // 区块链交易ID
  type: 'WITHDRAWAL' | 'DEPOSIT'; // 交易类型：WITHDRAWAL=取款，DEPOSIT=存款
  from_address: string;          // 发送地址
  from_secondary_address?: string; // 发送二级地址（memo/tag）
  to_address: string;            // 接收地址
  to_secondary_address?: string; // 接收二级地址（memo/tag）
  confirmations: number;         // 确认数
  amount: string;               // 金额
  fee: string;                  // 手续费
  status: TransactionStatus;    // 交易状态
  created_at: number;           // 创建时间戳（毫秒）
}

export type TransactionStatus = 
  | 'DEPOSIT_WAIT'           // 入金大기 중
  | 'DEPOSIT_SUCCESS'        // 入金완료
  | 'DEPOSIT_FAIL'           // 入金실패
  | 'DEPOSIT_REFUND'         // 入金환급
  | 'DEPOSIT_REJECT'         // 入金거부
  | 'WITHDRAWAL_REGISTER'    // 출금등록
  | 'WITHDRAWAL_WAIT'        // 출금대기 중
  | 'WITHDRAWAL_SUCCESS'     // 출금완료
  | 'WITHDRAWAL_FAIL'        // 출금실패
  | 'WITHDRAWAL_REFUND'      // 출금환급
  | 'WITHDRAWAL_REFUND_FAIL'; // 출금환급실패

export interface TransactionHistoryResponse {
  result: 'success' | 'error';
  error_code?: string;
  transactions?: TransactionRecord[]; // 实际API返回的是transactions而不是transaction
}

export interface TransactionHistoryParams {
  currency?: string;      // 货币类型，默认查询所有
  to_id?: string;        // 分页用的ID
  is_deposit?: boolean;  // true=仅存款，false=仅取款，null=全部
  size?: number;         // 返回数量 (1-100)，默认50
  from_ts: number;       // 开始时间戳（毫秒）
  to_ts: number;         // 结束时间戳（毫秒）
}

/**
 * Coinone 私有API客户端 V2
 * 
 * 核心设计原则：
 * - 严格的数据流：参数准备 → 签名生成 → 请求发送
 * - 单一数据源：每个请求只生成一次完整的认证数据
 * - 清晰的职责分离：认证、加密、网络请求各自独立
 */
export class CoinoneServerClientV2 {
  private credentials: ApiCredentials | null = null;
  private readonly baseUrl = 'https://api.coinone.co.kr';

  constructor() {
    // 空构造函数 - 凭证通过setCredentials设置
  }

  /**
   * 带重试和超时的fetch方法
   */
  private async fetchWithRetry(url: string, options: RequestInit & { timeout?: number }, maxRetries = 3): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt} for request: ${url}`);
        
        // 创建AbortController处理超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log(`Request successful: ${response.status} ${response.statusText}`);
        return response;
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // 指数退避：1秒、2秒、4秒
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  /**
   * 设置API凭证
   */
  setCredentials(accessToken: string, secretKey: string): void {
    // 验证UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(accessToken)) {
      throw new Error('Access Token must be a valid UUID format');
    }
    
    if (!uuidRegex.test(secretKey)) {
      throw new Error('Secret Key must be a valid UUID format');
    }

    this.credentials = { accessToken, secretKey };
  }

  /**
   * 清除API凭证
   */
  clearCredentials(): void {
    this.credentials = null;
  }

  /**
   * 检查凭证是否已配置
   */
  private ensureCredentials(): ApiCredentials {
    if (!this.credentials) {
      throw new Error('API credentials not configured, please call setCredentials() first');
    }
    return this.credentials;
  }

  /**
   * 生成UUID v4 nonce
   * 
   * 注意：这是整个认证过程中唯一生成nonce的地方
   */
  private generateNonce(): string {
    return crypto.randomUUID();
  }

  /**
   * 准备认证后的请求负载
   * 
   * 这是关键方法：确保所有认证参数在这里一次性生成
   * 返回的数据将用于：1. 签名计算  2. 请求体
   */
  private prepareAuthenticatedPayload(additionalData: Record<string, unknown> = {}): AuthenticatedPayload {
    const credentials = this.ensureCredentials();
    
    // 按照官方示例的顺序和格式准备数据
    const payload: AuthenticatedPayload = {
      access_token: credentials.accessToken,
      nonce: this.generateNonce(),
      ...additionalData
    };

    return payload;
  }

  /**
   * 生成Base64编码的payload
   * 
   * 严格按照官方示例：JSON.stringify → Buffer → base64
   */
  private encodePayload(payload: AuthenticatedPayload): string {
    const jsonString = JSON.stringify(payload);
    return Buffer.from(jsonString, 'utf8').toString('base64');
  }

  /**
   * 生成HMAC SHA512签名
   * 
   * 严格按照官方示例：createHmac('sha512', secretKey).update(encodedPayload).digest('hex')
   */
  private generateSignature(encodedPayload: string): string {
    const credentials = this.ensureCredentials();
    
    return crypto
      .createHmac('sha512', credentials.secretKey)
      .update(encodedPayload)
      .digest('hex');
  }

  /**
   * 构建完整的请求头
   * 
   * 包含所有必需的认证头部
   */
  private buildRequestHeaders(payload: AuthenticatedPayload): Record<string, string> {
    const encodedPayload = this.encodePayload(payload);
    const signature = this.generateSignature(encodedPayload);
    const requestBody = JSON.stringify(payload);

    return {
      'Content-Type': 'application/json',
      'X-COINONE-PAYLOAD': encodedPayload,
      'X-COINONE-SIGNATURE': signature,
      'Content-Length': Buffer.byteLength(requestBody).toString()
    };
  }

  /**
   * 执行私有API请求
   * 
   * 核心请求方法：准备数据 → 生成认证 → 发送请求 → 处理响应
   */
  private async executeRequest<T = unknown>(
    endpoint: string, 
    additionalData: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      // 步骤1：准备完整的认证负载（包含nonce等所有认证信息）
      const authenticatedPayload = this.prepareAuthenticatedPayload(additionalData);
      
      // 步骤2：生成请求头（包含签名）
      const headers = this.buildRequestHeaders(authenticatedPayload);
      
      // 步骤3：准备请求体（使用相同的认证负载）
      const requestBody = JSON.stringify(authenticatedPayload);
      
      // 步骤4：构建完整URL
      const url = `${this.baseUrl}${endpoint}`;
      
      // 步骤5：发送请求（带超时和重试）
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          ...headers,
          'User-Agent': 'CoinoneApp/1.0',
          'Accept': 'application/json',
        },
        body: requestBody,
        timeout: 10000, // 10秒超时
      });

      // 步骤6：检查HTTP状态
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      // 步骤7：解析响应
      const result: ApiResponse<T> = await response.json();
      
      // 步骤8：检查API响应
      if (result.result === 'error') {
        // 检查是否是用户信息API的错误格式
        const errorCode = result.error_code || (result as unknown as { errorCode?: string }).errorCode;
        throw new Error(`API error: ${errorCode} - ${result.error_msg || 'Unknown error'}`);
      }

      return result as T;

    } catch (error) {
      // 增强错误信息，便于调试
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Coinone API request failed [${endpoint}]:`, {
        error: errorMessage,
        endpoint,
        additionalData: Object.keys(additionalData)
      });
      
      throw error;
    }
  }

  /**
   * 获取所有货币的账户余额
   * 
   * 使用官方文档中的正确端点：/v2.1/account/balance/all
   */
  async getBalance(): Promise<BalanceResponse> {
    return this.executeRequest<BalanceResponse>('/v2.1/account/balance/all');
  }

  /**
   * 获取特定货币的余额
   */
  async getCurrencyBalance(currency: string): Promise<CurrencyBalance> {
    const response = await this.executeRequest<BalanceResponse>('/v2.1/account/balance/all');
    
    const currencyBalance = response.balances.find(
      balance => balance.currency.toLowerCase() === currency.toLowerCase()
    );
    
    if (!currencyBalance) {
      throw new Error(`Balance information not found for currency ${currency}`);
    }
    
    return currencyBalance;
  }

  /**
   * 测试API连接
   * 
   * 简单的连接测试，验证凭证是否有效
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * 获取用户信息 (V2 API - 使用数字nonce)
   */
  async getUserInfo(): Promise<UserInfoResponse> {
    return this.executeV2Request<UserInfoResponse>('/v2/account/user_info');
  }

  /**
   * 获取存币地址 (V2 API - 使用数字nonce)
   */
  async getDepositAddress(): Promise<DepositAddressResponse> {
    return this.executeV2Request<DepositAddressResponse>('/v2/account/deposit_address');
  }

  /**
   * 获取提币地址列表 (V2.1 API - 使用UUID nonce)
   */
  async getWithdrawalAddresses(params: WithdrawalAddressParams = {}): Promise<WithdrawalAddressResponse> {
    return this.executeRequest<WithdrawalAddressResponse>('/v2.1/transaction/coin/withdrawal/address_book', params);
  }

  /**
   * 执行提币操作 (V2.1 API - 使用UUID nonce)
   */
  async withdrawCoin(params: WithdrawalRequest): Promise<WithdrawalResponse> {
    return this.executeRequest<WithdrawalResponse>('/v2.1/transaction/coin/withdrawal', params);
  }

  /**
   * 创建交易订单 (V2.1 API - 使用UUID nonce)
   */
  async createOrder(params: OrderRequest): Promise<OrderResponse> {
    return this.executeRequest<OrderResponse>('/v2.1/order', params);
  }

  /**
   * 创建限价订单
   */
  async createLimitOrder(
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    postOnly = false,
    userOrderId?: string
  ): Promise<OrderResponse> {
    const params: OrderRequest = {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'LIMIT',
      side,
      price,
      qty,
      post_only: postOnly,
      ...(userOrderId && { user_order_id: userOrderId })
    };
    return this.createOrder(params);
  }

  /**
   * 创建市价买入订单
   */
  async createMarketBuyOrder(
    quoteCurrency: string,
    targetCurrency: string,
    amount: string,
    limitPrice?: string,
    userOrderId?: string
  ): Promise<OrderResponse> {
    const params: OrderRequest = {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'BUY',
      amount,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    };
    return this.createOrder(params);
  }

  /**
   * 创建市价卖出订单
   */
  async createMarketSellOrder(
    quoteCurrency: string,
    targetCurrency: string,
    qty: string,
    limitPrice?: string,
    userOrderId?: string
  ): Promise<OrderResponse> {
    const params: OrderRequest = {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'SELL',
      qty,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    };
    return this.createOrder(params);
  }

  /**
   * 创建止损限价订单
   */
  async createStopLimitOrder(
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    triggerPrice: string,
    userOrderId?: string
  ): Promise<OrderResponse> {
    const params: OrderRequest = {
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'STOP_LIMIT',
      side,
      price,
      qty,
      trigger_price: triggerPrice,
      ...(userOrderId && { user_order_id: userOrderId })
    };
    return this.createOrder(params);
  }

  /**
   * 查询未成交订单 (V2.1 API - 使用UUID nonce)
   */
  async getActiveOrders(params: ActiveOrdersRequest = {}): Promise<ActiveOrdersResponse> {
    return this.executeRequest<ActiveOrdersResponse>('/v2.1/order/active_orders', params);
  }

  /**
   * 获取交易历史记录 (V2.1 API - 使用UUID nonce)
   * 
   * @param params 查询参数
   */
  async getTransactionHistory(params: TransactionHistoryParams): Promise<TransactionHistoryResponse> {
    // 验证时间范围：最大90天
    const maxRange = 90 * 24 * 60 * 60 * 1000; // 90天的毫秒数
    if (params.to_ts - params.from_ts > maxRange) {
      throw new Error('Time range cannot exceed 90 days');
    }
    
    if (params.from_ts >= params.to_ts) {
      throw new Error('Start time must be earlier than end time');
    }
    
    const now = Date.now();
    if (params.from_ts > now || params.to_ts > now) {
      throw new Error('Time cannot be later than current time');
    }
    
    // 准备请求参数
    const requestData = {
      currency: params.currency || undefined, // 不传则查询所有货币
      to_id: params.to_id || null,
      is_deposit: params.is_deposit ?? null, // 使用 ?? 来处理 false 值
      size: Math.min(Math.max(params.size || 50, 1), 100), // 限制在1-100范围内
      from_ts: params.from_ts,
      to_ts: params.to_ts
    };
    
    return this.executeRequest<TransactionHistoryResponse>('/v2.1/transaction/coin/history', requestData);
  }

  /**
   * 执行V2 API请求 (使用数字nonce)
   */
  private async executeV2Request<T = unknown>(
    endpoint: string, 
    additionalData: Record<string, unknown> = {}
  ): Promise<T> {
    try {
      const credentials = this.ensureCredentials();
      
      // V2 API使用数字nonce
      const requestPayload = {
        ...additionalData,
        access_token: credentials.accessToken,
        nonce: Date.now()
      };
      
      // 转换为JSON字符串并Base64编码
      const jsonPayload = JSON.stringify(requestPayload);
      const encodedPayload = Buffer.from(jsonPayload, 'utf8').toString('base64');
      
      // 生成HMAC SHA512签名
      const signature = crypto
        .createHmac('sha512', credentials.secretKey)
        .update(encodedPayload)
        .digest('hex');
      
      const headers = {
        'Content-Type': 'application/json',
        'X-COINONE-PAYLOAD': encodedPayload,
        'X-COINONE-SIGNATURE': signature,
        'Content-Length': Buffer.byteLength(JSON.stringify(requestPayload)).toString()
      };
      
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          ...headers,
          'User-Agent': 'CoinoneApp/1.0',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        timeout: 10000, // 10秒超时
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.result === 'error') {
        const errorCode = result.errorCode || result.error_code;
        throw new Error(`API error: ${errorCode} - ${result.error_msg || 'Unknown error'}`);
      }

      return result as T;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Coinone V2 API request failed [${endpoint}]:`, {
        error: errorMessage,
        endpoint,
        additionalData: Object.keys(additionalData)
      });
      
      throw error;
    }
  }

  /**
   * 获取当前配置状态
   */
  getStatus(): { 
    hasCredentials: boolean; 
    accessTokenValid: boolean; 
    secretKeyValid: boolean;
  } {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    return {
      hasCredentials: !!this.credentials,
      accessTokenValid: this.credentials ? uuidRegex.test(this.credentials.accessToken) : false,
      secretKeyValid: this.credentials ? uuidRegex.test(this.credentials.secretKey) : false
    };
  }
}

// 导出默认实例
export const coinoneServerClient = new CoinoneServerClientV2(); 