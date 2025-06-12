import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useConvexMutation } from '@convex-dev/react-query';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/uploads';

export type Attachment = {
  fileId: Id<'_storage'>;
  fileName: string;
  fileType: string;
  fileSize: number;
};

export function useFileUpload() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const generateUploadUrl = useConvexMutation(api.storage.generateUploadUrl);

  const { mutateAsync: uploadFile, isPending: isUploading } = useMutation({
    mutationFn: async (file: File) => {
      // 1. Validate file
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`
        );
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          throw new Error(`File type ${file.type} is not allowed.`);
        }
      }

      // 2. Get upload URL
      const postUrl = await generateUploadUrl();

      // 3. Upload file
      const result = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // 4. Add to attachments
      const newAttachment: Attachment = {
        fileId: storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };

      setAttachments((prev) => [...prev, newAttachment]);
      return newAttachment;
    },
    onError: (error) => {
      setErrors((prev) => [...prev, error.message]);
    },
  });

  const handleFiles = (files: File[]) => {
    setErrors([]);
    for (const file of files) {
      uploadFile(file);
    }
  };

  const removeAttachment = (fileId: Id<'_storage'>) => {
    setAttachments((prev) => prev.filter((att) => att.fileId !== fileId));
  };

  const reset = () => {
    setAttachments([]);
    setErrors([]);
  };

  return {
    attachments,
    isUploading,
    errors,
    handleFiles,
    removeAttachment,
    reset,
  };
}
