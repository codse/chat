import { Shield } from 'lucide-react';
import { Separator } from '../ui/separator';

export const SystemMessage = ({ visible }: { visible?: boolean }) => {
  if (!visible) {
    return null;
  }

  // We will add other types and conditional rendering later.
  return (
    <div className="w-full flex items-center justify-center gap-2 px-4">
      <div className="flex-1" role="presentation">
        <Separator className="w-full" />
      </div>
      <p className="text-xs min-w-fit flex items-center gap-2 text-muted-foreground">
        <Shield className="size-4" />
        Messages after this point are visible to you only.
      </p>
      <div className="flex-1" role="presentation">
        <Separator className="w-full" />
      </div>
    </div>
  );
};
