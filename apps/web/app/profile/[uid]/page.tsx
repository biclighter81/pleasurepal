'use client'
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function Profile() {
  const params = useParams()
  const { uid } = params
  const { data, isLoading, mutate } = useSWR(
    uid && `friends/friend/${uid}`,
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div>{JSON.stringify(data)}</div>
      <button
        onClick={() => {
          mutate({ ...data, username: 'mutated' }, false);
        }}
      >
        mutate
      </button>
    </div>
  );
}
