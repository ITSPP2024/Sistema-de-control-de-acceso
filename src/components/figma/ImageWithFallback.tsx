import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string | null;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function ImageWithFallback({ src, alt, className = '', fallback }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return fallback ? <>{fallback}</> : <div className={className} />;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}
