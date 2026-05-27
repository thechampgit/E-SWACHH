import TrackPage from './TrackClient';

export function generateStaticParams() {
  // Return a default dynamic param records to satisfy Next.js static site export compiler
  return [{ id: 'default' }];
}

export default function Page() {
  return <TrackPage />;
}
