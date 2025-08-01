'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Dock() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      path: '/',
      label: 'Trade',
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <polyline points="22,6 12,16 9,13 2,20" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></polyline>
            <polyline points="16,6 22,6 22,12" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></polyline>
          </g>
        </svg>
      )
    },
    {
      path: '/walletAddress',
      label: 'Wallet',
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></line>
            <circle cx="18" cy="15" r="1" fill="currentColor"></circle>
          </g>
        </svg>
      )
    },
    {
      path: '/history',
      label: 'History',
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></circle>
            <polyline points="12,6 12,12 16,14" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></polyline>
          </g>
        </svg>
      )
    },
    {
      path: '/apikeySetting',
      label: 'Settings',
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></circle>
            <path d="m22,13.25v-2.5l-2.318-.966c-.167-.581-.395-1.135-.682-1.654l.954-2.318-1.768-1.768-2.318.954c-.518-.287-1.073-.515-1.654-.682l-.966-2.318h-2.5l-.966,2.318c-.581.167-1.135.395-1.654.682l-2.318-.954-1.768,1.768.954,2.318c-.287.518-.515,1.073-.682,1.654l-2.318.966v2.5l2.318.966c.167.581.395,1.135.682,1.654l-.954,2.318,1.768,1.768,2.318-.954c.518.287,1.073.515,1.654.682l.966,2.318h2.5l.966-2.318c.581-.167,1.135-.395,1.654-.682l2.318.954,1.768-1.768-.954-2.318c.287-.518.515-1.073.682-1.654l2.318-.966Z" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2"></path>
          </g>
        </svg>
      )
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="dock">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={pathname === item.path ? "dock-active" : ""}
          onClick={() => handleNavigation(item.path)}
        >
          {item.icon}
          <span className="dock-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}