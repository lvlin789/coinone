'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';
import type { TransactionRecord, TransactionStatus } from '@/lib/coinone-server-client';

export default function History() {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [selectedDays, setSelectedDays] = useState(30);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queryInfo, setQueryInfo] = useState<{
    currency: string;
    is_deposit: boolean | null;
    size: number;
    days: number;
    from_date: string;
    to_date: string;
  } | null>(null);

  const { credentials, isConnected, getTransactionHistory, isLoading, error } = useCoinoneApi();

  // 格式化时间 - 更紧凑的格式
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // 获取交易状态信息 - 简化版本
  const getTransactionStatusInfo = (status: TransactionStatus) => {
    const statusMap = {
      'DEPOSIT_WAIT': { text: '存款中', class: 'badge-warning', icon: '⏳' },
      'DEPOSIT_SUCCESS': { text: '存款成功', class: 'badge-success', icon: '✅' },
      'DEPOSIT_FAIL': { text: '存款失败', class: 'badge-error', icon: '❌' },
      'DEPOSIT_REFUND': { text: '存款退款', class: 'badge-info', icon: '↩️' },
      'DEPOSIT_REJECT': { text: '存款拒绝', class: 'badge-error', icon: '🚫' },
      'WITHDRAWAL_REGISTER': { text: '取款中', class: 'badge-warning', icon: '📝' },
      'WITHDRAWAL_WAIT': { text: '取款中', class: 'badge-warning', icon: '⏳' },
      'WITHDRAWAL_SUCCESS': { text: '取款成功', class: 'badge-success', icon: '✅' },
      'WITHDRAWAL_FAIL': { text: '取款失败', class: 'badge-error', icon: '❌' },
      'WITHDRAWAL_REFUND': { text: '取款退款', class: 'badge-info', icon: '↩️' },
      'WITHDRAWAL_REFUND_FAIL': { text: '退款失败', class: 'badge-error', icon: '💥' }
    };
    
    return statusMap[status] || { text: status, class: 'badge-ghost', icon: '❓' };
  };

  // 获取交易类型信息
  const getTransactionTypeInfo = (type: 'WITHDRAWAL' | 'DEPOSIT') => {
    if (type === 'DEPOSIT') {
      return {
        text: '存',
        icon: '↓',
        class: 'text-success',
        sign: '+'
      };
    } else {
      return {
        text: '取',
        icon: '↑',
        class: 'text-error',
        sign: '-'
      };
    }
  };

  // 加载交易历史
  const loadTransactionHistory = useCallback(async () => {
    if (!credentials || !isConnected) {
      return;
    }

    try {
      setIsRefreshing(true);
      
      const options = {
        currency: selectedCurrency || undefined,
        is_deposit: selectedType === 'all' ? undefined : selectedType === 'deposit',
        size: 100, // 获取更多记录
        days: selectedDays
      };
      
      const result = await getTransactionHistory(options);
      
      if (result && result.transactions) {
        // 按创建时间降序排序（最新的在前面）
        const sortedTransactions = [...result.transactions].sort((a, b) => b.created_at - a.created_at);
        setTransactions(sortedTransactions);
        setQueryInfo(result.query_params);
      } else {
        setTransactions([]);
        setQueryInfo(null);
      }
    } catch (error) {
      console.error('加载交易历史失败:', error);
      setTransactions([]);
      setQueryInfo(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [credentials, isConnected, selectedCurrency, selectedType, selectedDays, getTransactionHistory]);

  // 初始加载和参数变化时重新加载
  useEffect(() => {
    loadTransactionHistory();
  }, [loadTransactionHistory]);

  // 货币选项
  const currencies = [
    { value: '', label: '全部' },
    { value: 'USDT', label: 'USDT' },
    { value: 'BTC', label: 'BTC' },
    { value: 'ETH', label: 'ETH' },
    { value: 'KRW', label: 'KRW' }
  ];

  // 天数选项
  const daysOptions = [
    { value: 1, label: '1天' },
    { value: 7, label: '7天' },
    { value: 30, label: '30天' },
    { value: 90, label: '90天' }
  ];

  // 类型选项
  const typeOptions = [
    { value: 'all', label: '全部' },
    { value: 'deposit', label: '存款' },
    { value: 'withdrawal', label: '取款' }
  ];

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* 紧凑的页面标题 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">交易历史</h1>
          {queryInfo && (
            <p className="text-xs text-base-content/60 mt-1">
              {queryInfo.currency} | {queryInfo.days}天 | {transactions.length}条记录
            </p>
          )}
        </div>
        
        {/* 紧凑的刷新按钮 */}
        <button
          className="btn btn-sm btn-outline gap-1"
          onClick={loadTransactionHistory}
          disabled={!isConnected || isLoading || isRefreshing}
        >
          {isRefreshing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          刷新
        </button>
      </div>
      
      {/* 紧凑的过滤器 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select 
          className="select select-bordered select-sm min-w-20"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          disabled={!isConnected || isLoading || isRefreshing}
        >
          {currencies.map(currency => (
            <option key={currency.value} value={currency.value}>
              {currency.label}
            </option>
          ))}
        </select>
        
        <select 
          className="select select-bordered select-sm min-w-20"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'all' | 'deposit' | 'withdrawal')}
          disabled={!isConnected || isLoading || isRefreshing}
        >
          {typeOptions.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        
        <select 
          className="select select-bordered select-sm min-w-20"
          value={selectedDays}
          onChange={(e) => setSelectedDays(Number(e.target.value))}
          disabled={!isConnected || isLoading || isRefreshing}
        >
          {daysOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 连接状态提示 - 更紧凑 */}
      {!isConnected && (
        <div className="alert alert-warning mb-4 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm">请先配置API密钥</span>
        </div>
      )}

      {/* 错误提示 - 更紧凑 */}
      {error && (
        <div className="alert alert-error mb-4 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">{error.message}</span>
        </div>
      )}

      {/* 加载状态 - 更紧凑 */}
      {(isLoading || isRefreshing) && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <span className="text-sm text-base-content/70">加载中...</span>
          </div>
        </div>
      )}

      {/* 交易记录列表 - 舒适的多行布局 */}
      {!isLoading && !isRefreshing && isConnected && (
        <>
          {transactions.length > 0 ? (
            <div className="space-y-6">
              {transactions.map((transaction, index) => {
                const typeInfo = getTransactionTypeInfo(transaction.type);
                const statusInfo = getTransactionStatusInfo(transaction.status);
                
                return (
                  <div key={`${transaction.id}-${index}`} className="card bg-base-100 shadow-sm border border-base-300/50">
                    <div className="card-body p-6">
                      {/* 头部：类型图标 + 基本信息 */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className={`text-3xl ${typeInfo.class} flex-shrink-0 mt-1`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-xl">
                              {transaction.currency}
                            </span>
                            <span className="text-lg text-base-content/80">
                              {typeInfo.text}款
                            </span>
                          </div>
                          <div className="text-base-content/60 text-sm">
                            {formatTime(transaction.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* 状态信息区域 */}
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className={`badge badge-lg ${statusInfo.class} gap-2`}>
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.text}</span>
                        </div>
                        {transaction.confirmations > 0 && (
                          <div className="badge badge-lg badge-outline">
                            {transaction.confirmations} 确认
                          </div>
                        )}
                      </div>

                      {/* 金额信息区域 - 更加突出 */}
                      <div className="bg-base-200/50 rounded-xl p-5 mb-5">
                        <div className="text-center">
                          <div className="text-base-content/60 text-sm mb-2">交易金额</div>
                          <div className={`font-bold text-2xl ${typeInfo.class} mb-3`}>
                            {typeInfo.sign}{transaction.amount}
                          </div>
                          <div className="text-base-content/70 text-lg">
                            {transaction.currency}
                          </div>
                        </div>
                        {parseFloat(transaction.fee) > 0 && (
                          <div className="border-t border-base-300/50 mt-4 pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-base-content/60">手续费</span>
                              <span className="text-base font-medium">
                                {transaction.fee} {transaction.currency}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 可展开的详细信息 */}
                      <details className="mt-4">
                        <summary className="cursor-pointer text-base text-base-content/60 hover:text-base-content py-3 px-2 rounded-lg hover:bg-base-200/50 transition-colors">
                          📋 查看详细信息
                        </summary>
                        <div className="mt-5 pt-5 border-t border-base-300/30">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <div className="text-base font-medium text-base-content/70 mb-3">交易标识</div>
                                <div className="font-mono text-sm bg-base-200 p-4 rounded-lg break-all">
                                  {transaction.id}
                                </div>
                              </div>
                              {transaction.txid && (
                                <div>
                                  <div className="text-base font-medium text-base-content/70 mb-3">区块链ID</div>
                                  <div className="font-mono text-sm bg-base-200 p-4 rounded-lg break-all">
                                    {transaction.txid}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              {transaction.from_address && (
                                <div>
                                  <div className="text-base font-medium text-base-content/70 mb-3">发送地址</div>
                                  <div className="font-mono text-sm bg-base-200 p-4 rounded-lg break-all">
                                    {transaction.from_address}
                                    {transaction.from_secondary_address && (
                                      <div className="text-info mt-3 font-normal">
                                        备注: {transaction.from_secondary_address}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {transaction.to_address && (
                                <div>
                                  <div className="text-base font-medium text-base-content/70 mb-3">接收地址</div>
                                  <div className="font-mono text-sm bg-base-200 p-4 rounded-lg break-all">
                                    {transaction.to_address}
                                    {transaction.to_secondary_address && (
                                      <div className="text-info mt-3 font-normal">
                                        备注: {transaction.to_secondary_address}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-lg font-semibold text-base-content/70 mb-1">
                暂无交易记录
              </h3>
              <p className="text-sm text-base-content/50">
                当前查询条件下没有找到交易记录
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}