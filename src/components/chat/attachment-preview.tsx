import { cn } from '@/lib/utils';
import { ModelCapability } from '@/utils/models';
import { Id } from '@convex/_generated/dataModel';
import {
  Brain,
  File,
  FileText,
  Image,
  Loader,
  Paperclip,
  X,
} from 'lucide-react';

interface Attachment {
  fileId: Id<'_storage'>;
  fileName: string;
  fileType: string;
}

interface AttachmentPreviewProps {
  attachments?: Attachment[];
  errors?: string[];
  isUploading?: boolean;
  removeAttachment?: (fileId: Id<'_storage'>) => void;
  preview?: boolean;
}

const iconMap = {
  text: FileText,
  application: File,
  image: Image,
};

function AttachmentPreviewItem({
  preview,
  attachment,
  removeAttachment,
}: {
  preview?: boolean;
  attachment: Attachment;
  removeAttachment?: (fileId: Id<'_storage'>) => void;
}) {
  const Icon =
    iconMap[attachment.fileType.split('/')[0] as keyof typeof iconMap] ||
    Paperclip;
  return (
    <div
      className={cn(
        'bg-secondary flex items-center gap-2 rounded-lg pl-3 pr-2 py-1.5 text-sm',
        {
          'bg-background border border-foreground/10 p-4': preview,
        }
      )}
    >
      <Icon className={cn('size-4', { 'size-5': preview })} />
      <span className="max-w-[120px] truncate">{attachment.fileName}</span>
      {typeof removeAttachment === 'function' && (
        <button
          onClick={() => removeAttachment(attachment.fileId)}
          className="hover:bg-secondary/50 rounded-full p-1"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function AttachmentPreview({
  attachments,
  errors,
  isUploading,
  removeAttachment,
  preview,
}: AttachmentPreviewProps) {
  if (!attachments?.length && !errors?.length && !isUploading) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 justify-end">
      {attachments?.map((file) => (
        <AttachmentPreviewItem
          key={file.fileId}
          attachment={file}
          preview={preview}
          removeAttachment={removeAttachment}
        />
      ))}
      {errors?.map((error, index) => (
        <div
          key={index}
          className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
        >
          <span className="max-w-[240px] truncate">{error}</span>
        </div>
      ))}
      {isUploading && (
        <div className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm">
          <Loader className="size-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
}
