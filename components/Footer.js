import React from 'react';

export default function Footer() {
  return <div className='text-right text-sm pt-4'>Last updated: {new Date().toLocaleString()}</div>;
}
