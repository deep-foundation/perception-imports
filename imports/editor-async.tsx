import React from 'react';
import dynamic from 'next/dynamic.js';
 
export const Editor = dynamic(() => import('./editor.js').then(m => m.Editor), {
  loading: () => <></>,
})
