import dynamic from 'next/dynamic';

const AnatomyModel = dynamic(
  () => import('./AnatomyModel'),
  { ssr: false }
);

export default AnatomyModel; 