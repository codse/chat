import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function ChatNotFound() {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center">
      <div className="text-muted-foreground mb-4">
        The chat you are looking for does not exist.
      </div>
      <Button asChild>
        <Link to="/" className="text-sm text-muted-foreground">
          Start a new chat
        </Link>
      </Button>
    </div>
  );
}
