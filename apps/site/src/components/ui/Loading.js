import { PulseLoader } from 'react-spinners';

export default function LoadingSpinner() {
  return (
    <div className='flex flex-col items-center justify-center p-2 mt-4'>
      <PulseLoader
        size={10}
        speedMultiplier={0.5}
        color={'slategray'}
        aria-label='Loading Spinner'
      />
    </div>
  );
}
