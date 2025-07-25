'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

// 提币地址数据类型
interface WithdrawalAddress {
  currency: string;
  address: string;
  secondary_address?: string;
  nickname: string;
  created_at: number;
}

// Tab选项卡组件
interface TabButtonProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: (id: string) => void;
  icon: string;
}

function TabButton({ id, label, isActive, onClick, icon }: TabButtonProps) {
  return (
    <button
      className={`tab tab-lg flex-1 gap-2 ${isActive ? 'tab-active' : ''}`}
      onClick={() => onClick(id)}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// Tab容器组件
interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs = [
    { id: 'deposit', label: '存币地址', icon: '📥' },
    { id: 'withdrawal', label: '提币地址', icon: '📤' },
    { id: 'withdraw', label: '提币', icon: '💸' },
  ];

  return (
    <div className="tabs tabs-boxed bg-base-200 p-1 mb-6">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={onTabChange}
        />
      ))}
    </div>
  );
}

// 存币地址列表页组件
function DepositAddressPage() {
  const { isConnected, isLoading, error, getDepositAddress } = useCoinoneApi();
  const [depositAddresses, setDepositAddresses] = useState<{
    btc?: string;
    eth?: string;
    xrp?: string;
    xrp_tag?: string;
    eos?: string;
    eos_memo?: string;
    [key: string]: string | undefined;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 加载存币地址
  const loadDepositAddresses = useCallback(async () => {
    if (!isConnected) return;
    
    setIsRefreshing(true);
    try {
      const result = await getDepositAddress();
      if (result?.result === 'success') {
        setDepositAddresses(result.walletAddress);
      }
    } catch (error) {
      console.error('加载存币地址失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected, getDepositAddress]);

  // 初始加载
  useEffect(() => {
    loadDepositAddresses();
  }, [loadDepositAddresses]);

  // 复制地址到剪贴板
  const copyToClipboard = async (address: string, currency: string) => {
    try {
      await navigator.clipboard.writeText(address);
      // 这里可以添加提示消息
      console.log(`已复制 ${currency} 地址: ${address}`);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 币种配置
  const currencyConfig = {
    btc: { name: 'Bitcoin', symbol: 'BTC', color: 'bg-orange-500', icon: '₿' },
    eth: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500', icon: 'Ξ' },
    xrp: { name: 'Ripple', symbol: 'XRP', color: 'bg-blue-600', icon: '◈' },
    eos: { name: 'EOS', symbol: 'EOS', color: 'bg-gray-800', icon: 'Ⓔ' },
  };

  // 渲染地址卡片
  const renderAddressCard = (currency: string, address: string, memo?: string) => {
    const config = currencyConfig[currency as keyof typeof currencyConfig];
    if (!config || !address) return null;

    return (
      <div key={currency} className="card bg-base-100 shadow border border-base-300/50">
        <div className="card-body p-5">
          <div className="flex items-start gap-4">
            <div className={`avatar placeholder flex-shrink-0`}>
              <div className={`${config.color} text-white rounded-full w-14 h-14 flex items-center justify-center`}>
                <span className="text-xl font-bold">{config.icon}</span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg">{config.name}</h3>
                <span className="badge badge-outline">{config.symbol}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-base-content/70 mb-1 block">存币地址</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={address}
                      readOnly
                      className="input input-bordered input-sm flex-1 font-mono text-sm bg-base-200/50"
                    />
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => copyToClipboard(address, config.symbol)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {memo && (
                  <div>
                    <label className="text-sm font-medium text-base-content/70 mb-1 block">
                      {currency === 'xrp' ? 'Destination Tag' : 'Memo'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={memo}
                        readOnly
                        className="input input-bordered input-sm flex-1 font-mono text-sm bg-base-200/50"
                      />
                      <button 
                        className="btn btn-ghost btn-sm"
                        onClick={() => copyToClipboard(memo, `${config.symbol} ${currency === 'xrp' ? 'Tag' : 'Memo'}`)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">存币地址列表</h2>
        <button 
          className="btn btn-outline btn-sm"
          onClick={loadDepositAddresses}
          disabled={!isConnected || isLoading || isRefreshing}
        >
          {isRefreshing ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          刷新
        </button>
      </div>
      
      {/* 连接状态提示 */}
      {!isConnected && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>请先配置API密钥以查看存币地址</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error.message}</span>
        </div>
      )}

      {/* 加载状态 */}
      {(isLoading || isRefreshing) && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <span className="text-sm text-base-content/70">加载中...</span>
          </div>
        </div>
      )}

      {/* 存币地址列表 */}
      {isConnected && !isLoading && !isRefreshing && (
        <div className="space-y-4">
          {depositAddresses ? (
            <>
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>请确认地址正确后再进行转账，错误的地址可能导致资产丢失</span>
              </div>

                             {depositAddresses.btc && renderAddressCard('btc', depositAddresses.btc)}
               {depositAddresses.eth && renderAddressCard('eth', depositAddresses.eth)}
               {depositAddresses.xrp && renderAddressCard('xrp', depositAddresses.xrp, depositAddresses.xrp_tag)}
               {depositAddresses.eos && renderAddressCard('eos', depositAddresses.eos, depositAddresses.eos_memo)}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <h3 className="text-lg font-semibold text-base-content/70 mb-1">
                暂无存币地址
              </h3>
              <p className="text-sm text-base-content/50">
                无法获取存币地址信息，请检查API配置
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 提币地址列表页组件
function WithdrawalAddressPage() {
  const { isConnected, isLoading, error, getWithdrawalAddresses } = useCoinoneApi();
  const [withdrawalAddresses, setWithdrawalAddresses] = useState<WithdrawalAddress[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');

  // 加载提币地址
  const loadWithdrawalAddresses = useCallback(async () => {
    if (!isConnected) return;
    
    setIsRefreshing(true);
    try {
      const result = await getWithdrawalAddresses(selectedCurrency || undefined);
      if (result?.result === 'success') {
        setWithdrawalAddresses(result.withdrawal_addresses || []);
      }
    } catch (error) {
      console.error('加载提币地址失败:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected, getWithdrawalAddresses, selectedCurrency]);

  // 初始加载和筛选条件变化时重新加载
  useEffect(() => {
    loadWithdrawalAddresses();
  }, [loadWithdrawalAddresses]);

  // 复制地址到剪贴板
  const copyToClipboard = async (address: string, label: string) => {
    try {
      await navigator.clipboard.writeText(address);
      console.log(`已复制 ${label}: ${address}`);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 币种配置
  const currencyConfig: Record<string, { name: string; color: string; icon: string }> = {
    BTC: { name: 'Bitcoin', color: 'bg-orange-500', icon: '₿' },
    ETH: { name: 'Ethereum', color: 'bg-blue-500', icon: 'Ξ' },
    XRP: { name: 'Ripple', color: 'bg-blue-600', icon: '◈' },
    EOS: { name: 'EOS', color: 'bg-gray-800', icon: 'Ⓔ' },
    USDT: { name: 'Tether', color: 'bg-green-500', icon: '₮' },
    ADA: { name: 'Cardano', color: 'bg-blue-700', icon: '₳' },
    DOT: { name: 'Polkadot', color: 'bg-pink-500', icon: '●' },
  };

  // 获取币种配置
  const getCurrencyConfig = (currency: string) => {
    return currencyConfig[currency.toUpperCase()] || { 
      name: currency.toUpperCase(), 
      color: 'bg-gray-500', 
      icon: currency.charAt(0).toUpperCase() 
    };
  };

  // 渲染地址卡片
  const renderAddressCard = (addr: WithdrawalAddress, index: number) => {
    const config = getCurrencyConfig(addr.currency);
    
    return (
      <div key={`${addr.currency}-${addr.address}-${index}`} className="card bg-base-100 shadow-sm border">
        <div className="card-body p-4">
          {/* 头部信息 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${config.color} text-white flex items-center justify-center font-bold`}>
                {config.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base">{addr.nickname}</h3>
                <span className="text-sm text-base-content/60">{addr.currency.toUpperCase()}</span>
              </div>
            </div>
            <span className="text-xs text-base-content/50">
              {formatTime(addr.created_at)}
            </span>
          </div>

          {/* 地址信息 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/70 w-16 flex-shrink-0">地址:</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-mono text-sm break-all flex-1">{addr.address}</span>
                <button 
                  className="btn btn-ghost btn-xs"
                  onClick={() => copyToClipboard(addr.address, `${addr.nickname} 地址`)}
                  title="复制地址"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {addr.secondary_address && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/70 w-16 flex-shrink-0">
                  {addr.currency.toUpperCase() === 'XRP' ? 'Tag:' : 'Memo:'}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-mono text-sm break-all flex-1">{addr.secondary_address}</span>
                  <button 
                    className="btn btn-ghost btn-xs"
                    onClick={() => copyToClipboard(addr.secondary_address!, `${addr.nickname} ${addr.currency.toUpperCase() === 'XRP' ? 'Tag' : 'Memo'}`)}
                    title={`复制${addr.currency.toUpperCase() === 'XRP' ? 'Tag' : 'Memo'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 货币选项
  const currencies = [
    { value: '', label: '全部币种' },
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'XRP', label: 'Ripple (XRP)' },
    { value: 'EOS', label: 'EOS (EOS)' },
    { value: 'USDT', label: 'Tether (USDT)' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">提币地址列表</h2>
        <div className="flex items-center gap-2">
          <select 
            className="select select-bordered select-sm min-w-32"
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
          <button 
            className="btn btn-outline btn-sm"
            onClick={loadWithdrawalAddresses}
            disabled={!isConnected || isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            刷新
          </button>
        </div>
      </div>
      
      {/* 连接状态提示 */}
      {!isConnected && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>请先配置API密钥以查看提币地址</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error.message}</span>
        </div>
      )}

      {/* 加载状态 */}
      {(isLoading || isRefreshing) && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-md"></span>
            <span className="text-sm text-base-content/70">加载中...</span>
          </div>
        </div>
      )}

      {/* 安全提醒 */}
      {isConnected && !isLoading && !isRefreshing && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>仅显示已完成2次认证及收取人信息注册的地址，只有这些地址才能用于API提币</span>
        </div>
      )}

      {/* 提币地址列表 */}
      {isConnected && !isLoading && !isRefreshing && (
        <div className="space-y-4">
          {withdrawalAddresses.length > 0 ? (
            withdrawalAddresses.map((addr, index) => renderAddressCard(addr, index))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <h3 className="text-lg font-semibold text-base-content/70 mb-1">
                暂无提币地址
              </h3>
              <p className="text-sm text-base-content/50">
                {selectedCurrency 
                  ? `没有找到 ${selectedCurrency} 的提币地址，请在官网添加` 
                  : '还没有添加任何提币地址，请先在官网完成地址认证'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 提币页组件
function WithdrawPage() {
  const { isConnected, isLoading, error, getBalance, getWithdrawalAddresses, withdrawCoin } = useCoinoneApi();
  
  // 状态管理
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [selectedSecondaryAddress, setSelectedSecondaryAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [balances, setBalances] = useState<{
    balance?: string;
    available?: string;
    currency?: string;
    result?: string;
    error_code?: string;
    balances?: Array<{ currency: string; available: string; balance: string; limit?: string; average_price?: string }>;
  } | null>(null);
  const [withdrawalAddresses, setWithdrawalAddresses] = useState<WithdrawalAddress[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 支持的币种列表
  const supportedCurrencies = [
    { value: 'BTC', label: 'Bitcoin (BTC)', minAmount: '0.00000001' },
    { value: 'ETH', label: 'Ethereum (ETH)', minAmount: '0.000001' },
    { value: 'USDT', label: 'Tether (USDT)', minAmount: '0.000001' },
    { value: 'XRP', label: 'Ripple (XRP)', minAmount: '0.000001' },
    { value: 'EOS', label: 'EOS (EOS)', minAmount: '0.0001' }
  ];

  // 加载余额和提币地址
  const loadData = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoadingData(true);
    try {
      // 并行加载余额和提币地址
      const [balanceResult, addressResult] = await Promise.all([
        getBalance(),
        selectedCurrency ? getWithdrawalAddresses(selectedCurrency) : Promise.resolve(null)
      ]);
      
      if (balanceResult) {
        setBalances(balanceResult);
      }
      
      if (addressResult?.result === 'success') {
        setWithdrawalAddresses(addressResult.withdrawal_addresses || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [isConnected, getBalance, getWithdrawalAddresses, selectedCurrency]);

  // 当连接状态或选择币种变化时重新加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 币种变化时重置表单
  useEffect(() => {
    setSelectedAddress('');
    setSelectedSecondaryAddress('');
    setAmount('');
    setWithdrawalAddresses([]);
  }, [selectedCurrency]);

  // 获取当前币种余额
  const getCurrentBalance = () => {
    if (!balances || !selectedCurrency) return '0';
    
    if (balances.balances) {
      // 如果是完整余额数据
      const balance = balances.balances.find((b) => b.currency.toUpperCase() === selectedCurrency.toUpperCase());
      return balance?.available || balance?.balance || '0';
    } else if (balances.available) {
      // 如果是单个币种余额（优先使用可用余额）
      return balances.available;
    } else if (balances.balance) {
      // 如果是单个币种余额
      return balances.balance;
    }
    
    return '0';
  };

  // 获取当前币种的最小提币金额
  const getMinAmount = () => {
    const currency = supportedCurrencies.find(c => c.value === selectedCurrency);
    return currency?.minAmount || '0.000001';
  };

  // 设置最小金额
  const setMinAmount = () => {
    setAmount(getMinAmount());
  };

  // 设置最大金额（全部余额）
  const setMaxAmount = () => {
    const balance = getCurrentBalance();
    setAmount(balance);
  };

  // 地址选择变化
  const handleAddressChange = (addressString: string) => {
    setSelectedAddress(addressString);
    
    // 查找对应的secondary_address
    const addr = withdrawalAddresses.find(a => a.address === addressString);
    setSelectedSecondaryAddress(addr?.secondary_address || '');
  };

  // 确认提币
  const handleConfirmWithdraw = async () => {
    if (!selectedCurrency || !selectedAddress || !amount) return;
    
    setIsSubmitting(true);
    try {
      const withdrawParams = {
        currency: selectedCurrency,
        amount,
        address: selectedAddress,
        ...(selectedSecondaryAddress && { secondary_address: selectedSecondaryAddress })
      };
      
      const result = await withdrawCoin(withdrawParams);
      
      if (result?.result === 'success') {
        // 提币成功，重置表单并刷新数据
        setSelectedCurrency('');
        setSelectedAddress('');
        setSelectedSecondaryAddress('');
        setAmount('');
        setShowConfirmModal(false);
        loadData();
        
        // 显示成功消息
        console.log('提币成功:', result.transaction);
      }
    } catch (error) {
      console.error('提币失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">提币</h2>
      
      {/* 安全提醒 */}
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>提币操作不可逆，请务必确认所有信息无误</span>
      </div>

      {/* 连接状态提示 */}
      {!isConnected && (
        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>请先配置API密钥</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error.message}</span>
        </div>
      )}

      {/* 提币表单 */}
      {isConnected && (
        <div className="card bg-base-100 shadow border border-base-300/50">
          <div className="card-body">
            <div className="grid gap-6">
              {/* 币种选择 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">选择币种</span>
                  {selectedCurrency && (
                    <span className="label-text-alt">
                      可用余额: {getCurrentBalance()} {selectedCurrency}
                    </span>
                  )}
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  disabled={isLoading || isLoadingData}
                >
                  <option value="">请选择要提币的币种</option>
                  {supportedCurrencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 提币地址选择 */}
              {selectedCurrency && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">提币地址</span>
                    <span className="label-text-alt">
                      {withdrawalAddresses.length} 个已认证地址
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    disabled={isLoading || isLoadingData || withdrawalAddresses.length === 0}
                  >
                    <option value="">请选择提币地址</option>
                    {withdrawalAddresses.map((addr, index) => (
                      <option key={`${addr.address}-${index}`} value={addr.address}>
                        {addr.nickname} - {addr.address.slice(0, 8)}...{addr.address.slice(-8)}
                      </option>
                    ))}
                  </select>
                  {withdrawalAddresses.length === 0 && selectedCurrency && (
                    <div className="label">
                      <span className="label-text-alt text-warning">
                        没有找到 {selectedCurrency} 的已认证提币地址，请先在官网添加
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 提币数量 */}
              {selectedCurrency && selectedAddress && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">提币数量</span>
                    <span className="label-text-alt">
                      最小: {getMinAmount()} {selectedCurrency}
                    </span>
                  </label>
                  <div className="join">
                    <input 
                      type="number"
                      step="any"
                      placeholder={`最小 ${getMinAmount()}`}
                      className="input input-bordered join-item flex-1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isLoading || isSubmitting}
                    />
                    <button 
                      className="btn btn-outline join-item"
                      onClick={setMinAmount}
                      disabled={isLoading || isSubmitting}
                    >
                      最小
                    </button>
                    <button 
                      className="btn btn-outline join-item"
                      onClick={setMaxAmount}
                      disabled={isLoading || isSubmitting}
                    >
                      全部
                    </button>
                  </div>
                </div>
              )}

              {/* 提币按钮 */}
              <button 
                className="btn btn-primary btn-lg w-full"
                onClick={() => setShowConfirmModal(true)}
                disabled={
                  !selectedCurrency || 
                  !selectedAddress || 
                  !amount || 
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > parseFloat(getCurrentBalance()) ||
                  isLoading || 
                  isSubmitting ||
                  withdrawalAddresses.length === 0
                }
              >
                {isLoading || isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    处理中...
                  </>
                ) : (
                  '确认提币'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">确认提币信息</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-base-content/70">币种:</span>
                <span className="font-medium">{selectedCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">数量:</span>
                <span className="font-medium">{amount} {selectedCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">提币地址:</span>
                <span className="font-mono text-sm break-all">
                  {selectedAddress}
                </span>
              </div>
              {selectedSecondaryAddress && (
                <div className="flex justify-between">
                  <span className="text-base-content/70">
                    {selectedCurrency === 'XRP' ? 'Destination Tag:' : 'Memo:'}
                  </span>
                  <span className="font-mono text-sm">{selectedSecondaryAddress}</span>
                </div>
              )}
            </div>

            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">提币操作不可撤销，请仔细核对所有信息</span>
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
                className="btn btn-primary"
                onClick={handleConfirmWithdraw}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    提币中...
                  </>
                ) : (
                  '确认提币'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 主页面组件
export default function WalletAddress() {
  const [activeTab, setActiveTab] = useState('deposit');

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'deposit':
        return <DepositAddressPage />;
      case 'withdrawal':
        return <WithdrawalAddressPage />;
      case 'withdraw':
        return <WithdrawPage />;
      default:
        return <DepositAddressPage />;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">钱包地址管理</h1>
        <p className="text-base-content/60 mt-1">管理您的存币地址、提币地址和进行提币操作</p>
      </div>

      {/* Tab选项卡 */}
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 动态内容区域 */}
      <div className="animate-in fade-in duration-200">
        {renderActiveContent()}
      </div>
    </div>
  );
}