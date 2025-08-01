'use client';

import { useState, useEffect } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

export default function ApiKeySetting() {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const {
    credentials,
    isConnected,
    isLoading,
    error,
    setApiCredentials,
    clearApiCredentials,
    testConnection
  } = useCoinoneApi();

  // 加载已保存的API密钥到输入框
  useEffect(() => {
    if (credentials) {
      setAccessKey(credentials.accessToken);
      setSecretKey(credentials.secretKey);
    }
  }, [credentials]);

  // 自动隐藏成功提示
  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  // 自动隐藏错误提示
  useEffect(() => {
    if (showErrorAlert) {
      const timer = setTimeout(() => setShowErrorAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showErrorAlert]);

  const handleSave = async () => {
    if (!accessKey.trim() || !secretKey.trim()) {
      setShowErrorAlert(true);
      return;
    }

    const success = setApiCredentials(accessKey.trim(), secretKey.trim());
    if (success) {
      setShowSuccessAlert(true);
      setShowErrorAlert(false);
    } else {
      setShowErrorAlert(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete the current API Key? This action cannot be undone.')) {
      const success = clearApiCredentials();
      if (success) {
        setAccessKey('');
        setSecretKey('');
        setShowSuccessAlert(true);
        setShowErrorAlert(false);
      } else {
        setShowErrorAlert(true);
      }
    }
  };

  const handleTestConnection = async () => {
    // 如果输入框有新的密钥，使用输入框的密钥进行测试
    if (accessKey.trim() && secretKey.trim()) {
      const testCredentials = {
        accessToken: accessKey.trim(),
        secretKey: secretKey.trim()
      };
      const success = await testConnection(testCredentials);
      console.log(success);
      if (success) {
        setShowSuccessAlert(true);
        setShowErrorAlert(false);
      } else {
        setShowErrorAlert(true);
      }
    } else {
      // 使用已保存的密钥进行测试
      const success = await testConnection();
      console.log(success);
      if (success) {
        setShowSuccessAlert(true);
        setShowErrorAlert(false);
      } else {
        setShowErrorAlert(true);
      }
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      {/* 成功提示 */}
      {showSuccessAlert && (
        <div className="alert alert-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Operation completed successfully!</span>
        </div>
      )}

      {/* 错误提示 */}
      {(showErrorAlert || error) && (
        <div className="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error?.message || 'Operation failed, please check your input'}</span>
        </div>
      )}

      {/* 标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content mb-2">API Key Management</h1>
        <p className="text-base-content/70">Configure your exchange API keys to enable trading functionality</p>
      </div>

      {/* 连接状态指示器 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </div>
          {isConnected && credentials && (
            <span className="text-sm text-base-content/70">
              Access Key: {credentials.accessToken.substring(0, 8)}...
            </span>
          )}
        </div>
      </div>

      {/* 表单区域 */}
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="space-y-6">
            {/* Access Key 输入框 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Access Key</span>
                <span className="label-text-alt text-error">*Required</span>
              </label>
              <input
                type="text"
                placeholder="Enter Access Key"
                className="input input-bordered w-full"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                disabled={isLoading}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Access Token obtained from Coinone exchange
                </span>
              </label>
            </div>

            {/* Secret Key 输入框 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Secret Key</span>
                <span className="label-text-alt text-error">*Required</span>
              </label>
              <input
                type="password"
                placeholder="Enter Secret Key"
                className="input input-bordered w-full"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                disabled={isLoading}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  Private key, please keep it secure
                </span>
              </label>
            </div>

            {/* 安全提示 */}
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="font-bold">Security Notice</h3>
                <div className="text-xs">
                  Please ensure your API Key has appropriate permissions. We recommend enabling only balance inquiry and trading permissions, avoiding withdrawal permissions.
                </div>
              </div>
            </div>

            {/* 按钮组 - 纵向排列 */}
            <div className="flex flex-col gap-3 pt-4">
              <button
                className="btn btn-primary w-full"
                onClick={handleSave}
                disabled={!accessKey.trim() || !secretKey.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                )}
                Save Configuration
              </button>
              
              <button
                className="btn btn-info btn-outline w-full"
                onClick={handleTestConnection}
                disabled={(!isConnected && (!accessKey.trim() || !secretKey.trim())) || isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                Test Connection
              </button>
              
              <button
                className="btn btn-error btn-outline w-full"
                onClick={handleDelete}
                disabled={(!accessKey.trim() && !secretKey.trim()) || isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                Delete Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}