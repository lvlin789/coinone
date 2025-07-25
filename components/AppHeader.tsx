'use client';

import { useState, useEffect } from 'react';
import { useCoinoneApi } from '@/hooks/useCoinoneApi';

export default function AppHeader() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(false);

  const { credentials, isConnected, getUserInfo } = useCoinoneApi();

  // 监控API密钥状态并获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (credentials && isConnected) {
        setIsLoadingUserInfo(true);
        try {
          const userInfo = await getUserInfo();
          if (userInfo && userInfo.userInfo) {
            // 优先使用手机用户名（通常是真实姓名），其次使用邮箱用户名，最后使用虚拟账户名
            const name = userInfo.userInfo.mobileInfo?.userName ||
                        userInfo.userInfo.emailInfo?.email?.split('@')[0] ||
                        userInfo.userInfo.virtualAccountInfo?.depositor ||
                        '用户';
            
            const email = userInfo.userInfo.emailInfo?.email || '';
            
            setUserName(name);
            setUserEmail(email);
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 如果获取失败，显示默认信息
          setUserName('用户');
          setUserEmail('');
        } finally {
          setIsLoadingUserInfo(false);
        }
      } else {
        // 没有连接时显示默认信息
        setUserName('未连接');
        setUserEmail('请配置API密钥');
      }
    };

    fetchUserInfo();
  }, [credentials, isConnected, getUserInfo]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="navbar bg-base-100 shadow-sm fixed top-0 left-0 right-0 z-50">
      {/* 左侧用户信息 */}
      <div className="navbar-start">
        <div className="flex flex-col gap-1 px-4">
          {isLoadingUserInfo ? (
            <>
              <div className="skeleton h-4 w-20"></div>
              <div className="skeleton h-3 w-32"></div>
            </>
          ) : (
            <>
              <span className="text-base font-medium text-base-content">
                {userName || '用户'}
              </span>
              <span className="text-sm text-base-content/70">
                {userEmail || '邮箱未设置'}
              </span>
            </>
          )}
      </div>
        
        
      </div>
      {/* 连接状态指示器 */}
      {/* <div className="flex   gap-1">
          <div className={`badge badge-sm ${isConnected ? 'badge-success' : 'badge-warning'}`}>
            {isConnected ? '已连接' : '未连接'}
          </div>
        </div> */}
     
      {/* 右侧刷新按钮 */}
      <div className="navbar-end">
        <button 
          className="btn btn-ghost gap-2"
          onClick={handleRefresh}
          title="刷新页面"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          刷新
        </button>
      </div>
    </div>
  );
}
