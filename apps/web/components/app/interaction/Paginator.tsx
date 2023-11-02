import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function Paginator({
  total,
  offset,
  limit,
  onChange,
}: {
  total: number;
  offset: number;
  limit: number;
  onChange: (offset: number) => void;
}) {
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number[]>([]);

  useEffect(() => {
    const pages = [];
    for (let i = 1; i <= Math.ceil(total / limit); i++) {
      pages.push(i);
    }
    setPages(pages);
  }, [total, limit]);

  useEffect(() => {
    setPage(Math.ceil(offset / limit) + 1);
  }, [offset, limit]);

  function handlePageChange(page: number) {
    onChange((page - 1) * limit);
  }

  return (
    <div className='flex items-center justify-center'>
      <div className='flex items-center space-x-2'>
        <button
          className={` text-white px-2 py-1 rounded-md ${
            page == 1 && 'hidden'
          }`}
          onClick={() => handlePageChange(page - 1)}
          disabled={page == 1}
        >
          <IconArrowLeft className='h-4 w-4' />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`bg-dark  text-white h-8 w-8 rounded-md text-sm hover:scale-105 transition-transform ease-in-out
            ${p == page ? 'bg-primary-500' : null}`}
            onClick={() => handlePageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          className={` text-white px-2 py-1 rounded-md ${
            page == pages.length && 'hidden'
          }`}
          onClick={() => handlePageChange(page + 1)}
          disabled={page == pages.length}
        >
          <IconArrowRight className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
}
