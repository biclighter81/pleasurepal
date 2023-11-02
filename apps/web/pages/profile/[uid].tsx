import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export default function Profile() {
  const router = useRouter();
  const { uid } = router.query;
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
