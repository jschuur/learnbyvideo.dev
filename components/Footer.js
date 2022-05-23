import React from 'react';

export default function Footer() {
  return (
    <div className='text-right text-sm py-4'>
      Last updated: {new Date().toLocaleString()}. {''}
      <a className='text-blue-700' href='https://twitter.com/learnbyvideodev/'>
        @LearnByVideoDev
      </a>
    </div>
  );
}
