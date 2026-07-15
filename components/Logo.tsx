import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center space-x-2 select-none">
      <img 
        src="https://media.base44.com/images/public/69db047707a15d69135e3de9/d515e2792_ChatGPTImageJul14202610_12_57PM2.png" 
        style={{ height: '38px', mixBlendMode: 'multiply' as const }} 
        className="object-contain" 
        alt="XTREME SCRAPER" 
      />
    </div>
  );
}

export function LogoSidebar() {
  return (
    <div className="flex items-center select-none">
      <img 
        src="https://media.base44.com/images/public/69db047707a15d69135e3de9/d515e2792_ChatGPTImageJul14202610_12_57PM2.png" 
        style={{ height: '32px', mixBlendMode: 'multiply' as const }} 
        className="object-contain" 
        alt="XS" 
      />
    </div>
  );
}
