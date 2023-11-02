'use client'
import { fetcher } from "@/lib/fetcher";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

export default function Session() {
  const router = useRouter();
  const params = useSearchParams()
  const id = params.get('id')

  const { data, isLoading, error } = useSWR(id && `session/${id}`, fetcher);

  if (error && error?.statusCode === 404) {
    router.push("/sessions");
  }

  return (
    <div>
      {JSON.stringify(data)} {error && JSON.stringify(error)}
    </div>
  );
}
