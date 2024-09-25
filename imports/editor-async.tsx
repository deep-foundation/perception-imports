import React from 'react';
import dynamic from 'next/dynamic';
 
export const Editor = dynamic(() => import('./editor').then(m => m.Editor), {
  loading: () => <></>,
})
