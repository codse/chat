import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';

export const ChatError = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-4">
      <div className="text-muted-foreground">
        There was an error loading this chat.
      </div>
      <Button asChild variant="outline">
        <Link to="/" replace>
          Go back to home page
        </Link>
      </Button>
    </div>
  );
};
