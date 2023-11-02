'use client'
import DarkInput from "@/components/app/interaction/DarkInput";
import Paginator from "@/components/app/interaction/Paginator";
import Button from "@/components/app/interaction/Button";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { SessionResponse } from "@/lib/types/session";

export default function Sessions() {
  const [search, setSearch] = useState<string>("");
  const router = useRouter();

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.nextOffset) return null;
    if (pageIndex == 0) return `session?offset=0&q=${search}`;
    return `session?offset=${previousPageData.nextOffset}&q=${search}`;
  };

  const { data, size, setSize } = useSWRInfinite<SessionResponse>(
    getKey,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: true,
      refreshInterval: 15000,
    }
  );
  const total = data?.[0]?.total;
  const sessions = useMemo(
    () =>
      data
        ? data[size - 1 || 0]?.sessions.sort(
          (a: any, b: any) => b.active - a.active
        )
        : [],
    [data, size]
  );

  return (
    <>
      <div className="px-8 py-8">
        <div>
          <h1 className="text-4xl uppercase font-bold">Sessions</h1>
          <span className="text-sm">Manage your pleasurepal sessions</span>
        </div>
        <div className="mt-8 flex w-full mb-8 sm:mb-0 space-y-4 sm:space-y-0 sm:space-x-4 flex-col sm:flex-row">
          <DarkInput
            className="w-full lg:w-fit"
            icon={<IconSearch className="h-5 w-5" />}
            placeholder="Search sessions"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
          <Button
            text="New Session"
            theme="primary-gradient"
            onClick={() => {
              router.push("/sessions/new");
            }}
            icon={<IconPlus />}
          />
        </div>
        <div className="mt-4 flex-col space-y-2">
          {sessions &&
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-dark px-8 py-4 rounded-lg flex items-center space-x-4"
              >
                <div
                  className={`${session.active ? "bg-green-600" : "bg-yellow-600"
                    } text-center bg-opacity-100 px-2 py-1 text-xs uppercase font-bold rounded-md min-w-[80px]`}
                >
                  {session.active ? "Active" : "Inactive"}
                </div>
                <h5
                  className="text-sm uppercase font-bold hover:cursor-pointer"
                  onClick={() => {
                    router.push(`/sessions/${session.id}`);
                  }}
                >
                  {session.name || session.id}
                </h5>
                <div className="flex-grow flex justify-end">
                  <div></div>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4">
          <Paginator
            total={total || 0}
            offset={(size - 1) * 10}
            limit={10}
            onChange={(offset) => {
              console.log(offset / 10 + 1);
              setSize(offset / 10 + 1);
            }}
          />
        </div>
      </div>
    </>
  );
}
