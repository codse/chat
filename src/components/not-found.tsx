import { Link } from '@tanstack/react-router';

export default function NotFoundPage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">This page does not exist.</h1>
        <Link to="/" className="text-sm text-muted-foreground">
          Go to home
        </Link>
      </div>
    </div>
  );
}
