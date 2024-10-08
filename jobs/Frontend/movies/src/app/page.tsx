'use client'

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchMovies } from '@/api/movieApi';
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage';
import Pagination from '@/components/Pagination/Pagination';


// shareable links can be used to set up e2e tests and for development purposes
// but in the future they can be a feature if we keep in sync URI and app state
// example: http://localhost:3000/?query=lord%20of%20the&page=3

export default function SearchMovies() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedQuery = useDebounce(query, 500);

  const { data, isError } = useQuery({
    queryKey: ['movies', debouncedQuery, page],
    queryFn: () => fetchMovies(debouncedQuery, page),
    enabled: !!debouncedQuery,
  });

  useEffect(() => {
    if (!debouncedQuery) {
      setPage(1);
      setTotalPages(1);
    }

  }, [debouncedQuery]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const initialQuery = searchParams.get('query') || '';
    const initialPage = parseInt(searchParams.get('page') || '1', 10);

    setQuery(initialQuery);
    setPage(initialPage);
  }, []);

  if (data && data.total_pages >= 1 && data.total_pages !== totalPages) {
    setTotalPages(data.total_pages)
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
    }
  }
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
    }
  };

  const handleMissingImage = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement
    target.srcset = "/image_unavailable.webp";
  };

  return (
    <div className="container">
      <input
        type="text"
        placeholder="Search for a movie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
        autoFocus
      />

      {isError && <ErrorMessage>Error fetching movies</ErrorMessage>}
      {data?.results?.length === 0 && <p>There are no movies matching {query}</p>}

      {data &&
        <div className="movie-list">
          {data.results.map(movie => (
            <Link key={movie.id} href={`/movie/${movie.id}`}>
              <h3>{movie.title}</h3>
              <Image
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                alt={movie.title}
                width={200}
                height={300}
                onError={handleMissingImage}
              />
            </Link>
          ))}
        </div>
      }

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
        />
      )}

    </div>
  );
}
