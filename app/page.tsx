'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

// 支持的交易对
const TRADING_PAIRS = [
  { quote: 'KRW', target: 'BTC', name: 'BTC/KRW' },
  { quote: 'KRW', target: 'ETH', name: 'ETH/KRW' },
  { quote: 'KRW', target: 'XRP', name: 'XRP/KRW' },
  { quote: 'KRW', target: 'ADA', name: 'ADA/KRW' },
  { quote: 'KRW', target: 'DOT', name: 'DOT/KRW' },
  { quote: 'KRW', target: 'USDT', name: 'USDT/KRW' },
];

// 订单类型
type OrderType = 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
type OrderSide = 'BUY' | 'SELL';

// 未成交订单类型
interface ActiveOrder {
  order_id: string;
  type: 'LIMIT' | 'STOP_LIMIT';
  side: 'BUY' | 'SELL';
  quote_currency: string;
  target_currency: string;
  price: string;
  original_qty: string;
  remain_qty: string;
  executed_qty: string;
  canceled_qty: string;
  fee: string;
  fee_rate: string;
  average_executed_price: string;
  ordered_at: number;
  is_triggered?: boolean;
  trigger_price?: string;
  triggered_at?: number;
}

export default function TradePage() {
  const { 
    isConnected, 
    isLoading, 
    error, 
    getBalance,
    createLimitOrder,
    createMarketBuyOrder,
    createMarketSellOrder,
    createStopLimitOrder,
    getActiveOrders
  } = useCoinoneApi();

  // 交易状态
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [amount, setAmount] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [postOnly, setPostOnly] = useState(false);

  // 数据状态
  const [marketPrice, setMarketPrice] = useState<string>('');
  const [balances, setBalances] = useState<{
    result?: string;
    error_code?: string;
    balances?: Array<{ currency: string; available: string; balance: string }>;
    currency?: string;
    available?: string;
    balance?: string;
  } | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取市场价格（简化处理）
  const loadMarketPrice = useCallback(async () => {
    const prices: { [key: string]: string } = {
      'BTC': '95000000',
      'ETH': '3500000', 
      'XRP': '2500',
      'ADA': '1000',
      'DOT': '15000',
      'USDT': '1360'
    };
    setMarketPrice(prices[selectedPair.target] || '0');
  }, [selectedPair.target]);

  // 加载余额数据
  const loadBalances = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoadingBalances(true);
    try {
      const result = await getBalance();
      if (result) {
        setBalances(result);
      }
    } catch (error) {
      console.error('加载余额失败:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [isConnected, getBalance]);

  // 加载未成交订单
  const loadActiveOrders = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoadingOrders(true);
    try {
      const result = await getActiveOrders({
        quote_currency: selectedPair.quote,
        target_currency: selectedPair.target
      });
      
      if (result?.result === 'success' && result.active_orders) {
        setActiveOrders(result.active_orders);
      } else {
        setActiveOrders([]);
      }
    } catch (error) {
      console.error('加载未成交订单失败:', error);
      setActiveOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isConnected, getActiveOrders, selectedPair]);

  // 获取当前余额
  const getCurrentBalance = (currency: string) => {
    if (!balances?.balances) return '0';
    const balance = balances.balances.find(b => b.currency.toUpperCase() === currency.toUpperCase());
    return balance?.available || '0';
  };

  // 页面加载时获取数据
  useEffect(() => {
    loadMarketPrice();
    loadBalances();
    loadActiveOrders();
  }, [loadMarketPrice, loadBalances, loadActiveOrders]);

  // 交易对变化时重新获取数据
  useEffect(() => {
    loadMarketPrice();
    loadActiveOrders();
    // 重置表单
    setPrice('');
    setQty('');
    setAmount('');
    setTriggerPrice('');
  }, [selectedPair, loadMarketPrice, loadActiveOrders]);

  // 计算总额（限价订单）
  useEffect(() => {
    if (orderType === 'LIMIT' && price && qty) {
      const total = (parseFloat(price) * parseFloat(qty)).toString();
      setAmount(total);
    }
  }, [price, qty, orderType]);

  // 表单验证
  const isFormValid = () => {
    if (!selectedPair || !orderType || !orderSide) return false;
    
    switch (orderType) {
      case 'LIMIT':
        return price && qty && (postOnly !== undefined);
      case 'MARKET':
        return orderSide === 'BUY' ? amount : qty;
      case 'STOP_LIMIT':
        return price && qty && triggerPrice;
      default:
        return false;
    }
  };

  // 提交订单
  const handleSubmitOrder = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);
    try {
      let result;
      
      switch (orderType) {
        case 'LIMIT':
          result = await createLimitOrder(
            selectedPair.quote,
            selectedPair.target,
            orderSide,
            price,
            qty,
            postOnly
          );
          break;
          
        case 'MARKET':
          if (orderSide === 'BUY') {
            result = await createMarketBuyOrder(
              selectedPair.quote,
              selectedPair.target,
              amount
            );
          } else {
            result = await createMarketSellOrder(
              selectedPair.quote,
              selectedPair.target,
              qty
            );
          }
          break;
          
        case 'STOP_LIMIT':
          result = await createStopLimitOrder(
            selectedPair.quote,
            selectedPair.target,
            orderSide,
            price,
            qty,
            triggerPrice
          );
          break;
      }

      if (result?.result === 'success') {
        // 订单创建成功，重置表单并刷新数据
        setPrice('');
        setQty('');
        setAmount('');
        setTriggerPrice('');
        setShowConfirmModal(false);
        loadBalances(); // 刷新余额
        loadActiveOrders(); // 刷新未成交订单列表
        
        console.log('订单创建成功:', result.order_id);
      }
    } catch (error) {
      console.error('订单创建失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化数字
  const formatNumber = (value: string, decimals = 8) => {
    const num = parseFloat(value);
    if (num === 0) return '0';
    return num.toLocaleString('zh-CN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals 
    });
  };

    return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold mb-4">数字货币交易</h1>
          
          {/* 连接状态提示 */}
          {!isConnected && (
            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>请先配置API密钥才能进行交易</span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 交易表单 */}
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <h2 className="card-title text-lg mb-3">创建订单</h2>
                  
                  {/* 交易对选择 */}
                  <div className="form-control mb-3">
                    <label className="label py-1">
                      <span className="label-text text-sm font-medium">交易对</span>
                      {marketPrice && (
                        <span className="label-text-alt text-xs">
                          当前价格: {formatNumber(marketPrice, 0)} KRW
                        </span>
                      )}
                    </label>
                    <select 
                      className="select select-bordered select-sm w-full"
                      value={`${selectedPair.quote}-${selectedPair.target}`}
                      onChange={(e) => {
                        const [quote, target] = e.target.value.split('-');
                        const pair = TRADING_PAIRS.find(p => p.quote === quote && p.target === target);
                        if (pair) setSelectedPair(pair);
                      }}
                      disabled={isLoading || isSubmitting}
                    >
                      {TRADING_PAIRS.map(pair => (
                        <option key={`${pair.quote}-${pair.target}`} value={`${pair.quote}-${pair.target}`}>
                          {pair.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 订单类型和方向 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-sm font-medium">订单类型</span>
                      </label>
                      <select 
                        className="select select-bordered select-sm"
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as OrderType)}
                        disabled={isLoading || isSubmitting}
                      >
                        <option value="LIMIT">限价订单</option>
                        <option value="MARKET">市价订单</option>
                        <option value="STOP_LIMIT">止损限价</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label py-1">
                        <span className="label-text text-sm font-medium">交易方向</span>
                      </label>
                      <div className="join w-full">
                        <button 
                          className={`btn btn-sm join-item flex-1 ${orderSide === 'BUY' ? 'btn-success' : 'btn-outline'}`}
                          onClick={() => setOrderSide('BUY')}
                          disabled={isLoading || isSubmitting}
                        >
                          买入
                        </button>
                        <button 
                          className={`btn btn-sm join-item flex-1 ${orderSide === 'SELL' ? 'btn-error' : 'btn-outline'}`}
                          onClick={() => setOrderSide('SELL')}
                          disabled={isLoading || isSubmitting}
                        >
                          卖出
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 订单参数 */}
                  <div className="space-y-3">
                    {/* 价格（限价和止损限价） */}
                    {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && (
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-sm">价格 (KRW)</span>
                          {marketPrice && (
                            <button 
                              className="label-text-alt text-xs link link-primary"
                              onClick={() => setPrice(marketPrice)}
                              type="button"
                            >
                              使用市价
                            </button>
                          )}
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="输入价格"
                          className="input input-bordered input-sm"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          disabled={isLoading || isSubmitting}
                        />
                      </div>
                    )}

                    {/* 数量（限价、止损限价、市价卖出） */}
                    {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT' || (orderType === 'MARKET' && orderSide === 'SELL')) && (
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-sm">数量 ({selectedPair.target})</span>
                          <span className="label-text-alt text-xs">
                            可用: {formatNumber(getCurrentBalance(selectedPair.target))} {selectedPair.target}
                          </span>
                        </label>
                        <input 
                          type="number"
                          step="0.00000001"
                          placeholder="输入数量"
                          className="input input-bordered input-sm"
                          value={qty}
                          onChange={(e) => setQty(e.target.value)}
                          disabled={isLoading || isSubmitting}
                        />
                      </div>
                    )}

                    {/* 总额（市价买入或限价显示） */}
                    {(orderType === 'MARKET' && orderSide === 'BUY') || orderType === 'LIMIT' ? (
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-sm">
                            总额 (KRW) {orderType === 'LIMIT' && '(计算值)'}
                          </span>
                          {orderType === 'MARKET' && orderSide === 'BUY' && (
                            <span className="label-text-alt text-xs">
                              可用: {formatNumber(getCurrentBalance(selectedPair.quote), 0)} KRW
                            </span>
                          )}
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="输入总额"
                          className="input input-bordered input-sm"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isLoading || isSubmitting || (orderType === 'LIMIT')}
                          readOnly={orderType === 'LIMIT'}
                        />
                      </div>
                    ) : null}

                    {/* 触发价格（止损限价） */}
                    {orderType === 'STOP_LIMIT' && (
                      <div className="form-control">
                        <label className="label py-1">
                          <span className="label-text text-sm">触发价格 (KRW)</span>
                        </label>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="输入触发价格"
                          className="input input-bordered input-sm"
                          value={triggerPrice}
                          onChange={(e) => setTriggerPrice(e.target.value)}
                          disabled={isLoading || isSubmitting}
                        />
                      </div>
                    )}



                    {/* Post Only（限价订单） */}
                    {orderType === 'LIMIT' && (
                      <div className="form-control">
                        <label className="label cursor-pointer py-1">
                          <span className="label-text text-sm">仅挂单 (Post Only)</span>
                          <input 
                            type="checkbox" 
                            className="checkbox checkbox-sm" 
                            checked={postOnly}
                            onChange={(e) => setPostOnly(e.target.checked)}
                            disabled={isLoading || isSubmitting}
                          />
                        </label>
                      </div>
                    )}


                  </div>

                  {/* 提交按钮 */}
                  <div className="mt-4">
                    <button 
                      className={`btn btn-sm w-full ${orderSide === 'BUY' ? 'btn-success' : 'btn-error'}`}
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!isConnected || !isFormValid() || isLoading || isSubmitting}
                    >
                      {isLoading || isSubmitting ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          处理中...
                        </>
                      ) : (
                        `${orderSide === 'BUY' ? '买入' : '卖出'} ${selectedPair.target}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 未成交订单列表 */}
            <div className="lg:col-span-3">
              <div className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="card-title text-lg">
                      未成交订单 ({selectedPair.name})
                    </h3>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={loadActiveOrders}
                      disabled={isLoadingOrders}
                    >
                      {isLoadingOrders ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {isConnected ? (
                    isLoadingOrders ? (
                      <div className="flex justify-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                      </div>
                    ) : activeOrders.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {activeOrders.map((order) => (
                          <div key={order.order_id} className="card bg-base-50 border border-base-300">
                            <div className="card-body p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`badge badge-sm ${order.side === 'BUY' ? 'badge-success' : 'badge-error'}`}>
                                    {order.side === 'BUY' ? '买入' : '卖出'}
                                  </span>
                                  <span className="badge badge-outline badge-sm">
                                    {order.type === 'LIMIT' ? '限价' : '止损限价'}
                                  </span>
                                </div>
                                <span className="text-xs text-base-content/60">
                                  {formatTime(order.ordered_at)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="flex justify-between">
                                    <span className="text-base-content/70">价格:</span>
                                    <span className="font-mono">{formatNumber(order.price, 0)} KRW</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-base-content/70">原始数量:</span>
                                    <span className="font-mono">{formatNumber(order.original_qty)} {selectedPair.target}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-base-content/70">剩余数量:</span>
                                    <span className="font-mono font-semibold">{formatNumber(order.remain_qty)} {selectedPair.target}</span>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between">
                                    <span className="text-base-content/70">已成交:</span>
                                    <span className="font-mono">{formatNumber(order.executed_qty)} {selectedPair.target}</span>
                                  </div>
                                  {order.trigger_price && (
                                    <div className="flex justify-between">
                                      <span className="text-base-content/70">触发价:</span>
                                      <span className="font-mono">{formatNumber(order.trigger_price, 0)} KRW</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-base-content/70">订单ID:</span>
                                    <span className="font-mono text-xs">{order.order_id.slice(-8)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {order.type === 'STOP_LIMIT' && (
                                <div className="mt-2 pt-2 border-t border-base-300">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-base-content/70">状态:</span>
                                    <span className={`badge badge-xs ${order.is_triggered ? 'badge-success' : 'badge-warning'}`}>
                                      {order.is_triggered ? '已触发' : '等待触发'}
                                    </span>
                                    {order.triggered_at && (
                                      <span className="text-base-content/60">
                                        触发时间: {formatTime(order.triggered_at)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-base-content/60">
                        <div className="text-4xl mb-2">📋</div>
                        <div>暂无未成交订单</div>
                        <div className="text-xs mt-1">创建新订单后将在此显示</div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-base-content/60">
                      <div className="text-4xl mb-2">🔐</div>
                      <div>请先连接API查看订单</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 确认弹窗 */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">确认订单信息</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-base-content/70">交易对:</span>
                <span className="font-medium">{selectedPair.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">订单类型:</span>
                <span className="font-medium">
                  {orderType === 'LIMIT' ? '限价订单' : 
                   orderType === 'MARKET' ? '市价订单' : '止损限价'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">交易方向:</span>
                <span className={`font-medium ${orderSide === 'BUY' ? 'text-success' : 'text-error'}`}>
                  {orderSide === 'BUY' ? '买入' : '卖出'}
                </span>
              </div>
              
              {(orderType === 'LIMIT' || orderType === 'STOP_LIMIT') && price && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">价格:</span>
                  <span className="font-medium">{formatNumber(price, 0)} KRW</span>
                </div>
              )}
              
              {qty && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">数量:</span>
                  <span className="font-medium">{qty} {selectedPair.target}</span>
                </div>
              )}
              
              {amount && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">总额:</span>
                  <span className="font-medium">{formatNumber(amount, 0)} KRW</span>
                </div>
              )}
              
              {triggerPrice && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">触发价格:</span>
                  <span className="font-medium">{formatNumber(triggerPrice, 0)} KRW</span>
                </div>
              )}
              

            </div>

            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">请确认订单信息无误后再提交</span>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button 
                className={`btn ${orderSide === 'BUY' ? 'btn-success' : 'btn-error'}`}
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    提交中...
                  </>
                ) : (
                  '确认提交'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
