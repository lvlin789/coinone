'use client';

import { useState, useCallback, useEffect } from 'react';
import { coinoneClient, CURRENCY_PAIRS, type ApiCredentials, type OrderRequest } from '@/lib/coinone-client';

export interface ApiError {
  message: string;
  code?: string;
}

export function useCoinoneApi() {
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // 从localStorage加载API密钥
  useEffect(() => {
    try {
      const savedCredentials = localStorage.getItem('coinone-credentials');
      if (savedCredentials) {
        const creds = JSON.parse(savedCredentials) as ApiCredentials;
        setCredentials(creds);
        setIsConnected(true);
      }
    } catch (error) {
      console.warn('Failed to load saved credentials:', error);
    }
  }, []);

  // 设置API密钥
  const setApiCredentials = useCallback((accessToken: string, secretKey: string) => {
    const newCredentials = { accessToken, secretKey };
    
    try {
      // 保存到localStorage
      localStorage.setItem('coinone-credentials', JSON.stringify(newCredentials));
      
      // 更新状态
      setCredentials(newCredentials);
      setIsConnected(true);
      setError(null);
      
      return true;
    } catch (error) {
      setError({ message: 'Failed to save API key' });
      return false;
    }
  }, []);

  // 删除API密钥
  const clearApiCredentials = useCallback(() => {
    try {
      localStorage.removeItem('coinone-credentials');
      setCredentials(null);
      setIsConnected(false);
      setError(null);
      return true;
    } catch (error) {
      setError({ message: 'Failed to delete API key' });
      return false;
    }
  }, []);

  // 测试API连接
  const testConnection = useCallback(async (testCredentials?: ApiCredentials) => {
    const credsToUse = testCredentials || credentials;
    
    if (!credsToUse) {
      setError({ message: 'API key not configured' });
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await coinoneClient.testConnection(credsToUse);
      setError(null);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setError({ message: errorMessage });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // Public API 方法

  // 获取报价单位
  const getRangeUnits = useCallback(async (quoteCurrency: string, targetCurrency: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getRangeUnits(quoteCurrency, targetCurrency);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote units';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取订单簿
  const getOrderbook = useCallback(async (quoteCurrency: string, targetCurrency: string, size: number = 15) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getOrderbook(quoteCurrency, targetCurrency, size);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get orderbook';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取Ticker信息
  const getTicker = useCallback(async (quoteCurrency: string, targetCurrency: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getTicker(quoteCurrency, targetCurrency);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get ticker info';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Private API 方法（通过内部API路由）

  // 获取余额
  const getBalance = useCallback(async (currency?: string) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getBalance(credentials, currency);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 获取用户信息
  const getUserInfo = useCallback(async () => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coinone/user-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: credentials.accessToken,
          secretKey: credentials.secretKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get user info');
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user info';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 获取交易历史记录 (V2.1 API)
  const getTransactionHistory = useCallback(async (options: {
    currency?: string;      // 货币类型，如 'USDT'、'BTC' 等，不传则查询所有
    to_id?: string;        // 分页用的ID
    is_deposit?: boolean;  // true=仅存款，false=仅取款，null/undefined=全部
    size?: number;         // 返回数量 (1-100)
    days?: number;         // 查询天数 (1-90)，默认30天
  } = {}) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/coinone/transaction-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: credentials.accessToken,
          secretKey: credentials.secretKey,
          currency: options.currency,
          to_id: options.to_id,
          is_deposit: options.is_deposit,
          size: options.size || 50,
          days: options.days || 30,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get transaction history');
      }

      return {
        ...result.data,
        query_params: result.query_params // 返回查询参数信息
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get transaction history';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 获取存币地址 (V2 API)
  const getDepositAddress = useCallback(async () => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getDepositAddress(credentials);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get deposit address';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 获取提币地址列表 (V2.1 API)
  const getWithdrawalAddresses = useCallback(async (currency?: string) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getWithdrawalAddresses(credentials, currency);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get withdrawal addresses';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 执行提币操作 (V2.1 API)
  const withdrawCoin = useCallback(async (withdrawParams: {
    currency: string;
    amount: string;
    address: string;
    secondary_address?: string;
  }) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.withdrawCoin(credentials, withdrawParams);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal operation failed';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 创建交易订单 (V2.1 API)
  const createOrder = useCallback(async (orderParams: {
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
  }) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.createOrder(credentials, orderParams);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trade order';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  // 创建限价订单
  const createLimitOrder = useCallback(async (
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    postOnly = false,
    userOrderId?: string
  ) => {
    return createOrder({
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'LIMIT',
      side,
      price,
      qty,
      post_only: postOnly,
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }, [createOrder]);

  // 创建市价买入订单
  const createMarketBuyOrder = useCallback(async (
    quoteCurrency: string,
    targetCurrency: string,
    amount: string,
    limitPrice?: string,
    userOrderId?: string
  ) => {
    return createOrder({
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'BUY',
      amount,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }, [createOrder]);

  // 创建市价卖出订单
  const createMarketSellOrder = useCallback(async (
    quoteCurrency: string,
    targetCurrency: string,
    qty: string,
    limitPrice?: string,
    userOrderId?: string
  ) => {
    return createOrder({
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'MARKET',
      side: 'SELL',
      qty,
      ...(limitPrice && { limit_price: limitPrice }),
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }, [createOrder]);

  // 创建止损限价订单
  const createStopLimitOrder = useCallback(async (
    quoteCurrency: string,
    targetCurrency: string,
    side: 'BUY' | 'SELL',
    price: string,
    qty: string,
    triggerPrice: string,
    userOrderId?: string
  ) => {
    return createOrder({
      quote_currency: quoteCurrency,
      target_currency: targetCurrency,
      type: 'STOP_LIMIT',
      side,
      price,
      qty,
      trigger_price: triggerPrice,
      ...(userOrderId && { user_order_id: userOrderId })
    });
  }, [createOrder]);

  // 查询未成交订单 (V2.1 API)
  const getActiveOrders = useCallback(async (queryParams?: {
    quote_currency?: string;
    target_currency?: string;
    order_type?: string[];
  }) => {
    if (!credentials) {
      setError({ message: 'API key not configured' });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await coinoneClient.getActiveOrders(credentials, queryParams);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to query active orders';
      setError({ message: errorMessage });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [credentials]);

  return {
    // 状态
    credentials,
    isConnected,
    isLoading,
    error,

    // 配置方法
    setApiCredentials,
    clearApiCredentials,
    testConnection,

    // Public API 方法
    getRangeUnits,
    getOrderbook,
    getTicker,

    // Private API 方法
    getBalance,
    getUserInfo,
    getTransactionHistory,
    getDepositAddress,
    getWithdrawalAddresses,
    withdrawCoin,
    
    // 交易订单方法
    createOrder,
    createLimitOrder,
    createMarketBuyOrder,
    createMarketSellOrder,
    createStopLimitOrder,
    getActiveOrders,

    // 常用货币对
    currencyPairs: CURRENCY_PAIRS
  };
} 