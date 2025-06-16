import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BYOKStorage } from '@/utils/byok-storage';
import { useAppContext } from '@/context/app-context';
import { Label } from './ui/label';

export type BYOKKeys = {
  openai?: string;
  openrouter?: string;
};

export function getBYOKKeys(): BYOKKeys {
  return BYOKStorage.get();
}

export function clearBYOKKeys() {
  BYOKStorage.clear();
}

export default function BYOKDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setUserKeys } = useAppContext();
  const [openai, setOpenai] = useState('');
  const [openrouter, setOpenrouter] = useState('');

  useEffect(() => {
    if (open) {
      const k = BYOKStorage.get();
      setOpenai(k.openai || '');
      setOpenrouter(k.openrouter || '');
    }
  }, [open]);

  const save = () => {
    const newKeys = {
      openai: openai.trim() || undefined,
      openrouter: openrouter.trim() || undefined,
    };
    BYOKStorage.set(newKeys);
    setUserKeys(newKeys);
    onOpenChange(false);
  };

  const clear = () => {
    BYOKStorage.clear();
    setUserKeys({});
    setOpenai('');
    setOpenrouter('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bring Your Own Key</DialogTitle>
          <DialogDescription>
            Add your OpenAI and OpenRouter API keys. They are stored only in
            your browser, not on our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div>
            <Label htmlFor="openai" className="block text-sm font-medium mb-1">
              OpenAI API Key
            </Label>
            <Input
              type="password"
              name="openai"
              value={openai}
              onChange={(e) => setOpenai(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>
          <div>
            <Label
              htmlFor="openrouter"
              className="block text-sm font-medium mb-1"
            >
              OpenRouter API Key
            </Label>
            <Input
              type="password"
              name="openrouter"
              value={openrouter}
              onChange={(e) => setOpenrouter(e.target.value)}
              placeholder="..."
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter className="flex gap-2 justify-between mt-4">
          <Button variant="ghost" onClick={clear} type="button">
            Clear
          </Button>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={save} type="button">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
