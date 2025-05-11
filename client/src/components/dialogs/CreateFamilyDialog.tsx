import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { Family } from '@/lib/types'; // Assuming Family type is defined

// Zod schema for form validation
const familyFormSchema = z.object({
  name: z.string().min(2, { message: '家庭名称至少需要2个字符' }).max(100, { message: '家庭名称不能超过100个字符' }),
});

type FamilyFormData = z.infer<typeof familyFormSchema>;

interface CreateFamilyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess?: (newFamily: Family) => void;
}

async function createFamilyAPI(data: FamilyFormData): Promise<Family> {
  const response = await apiRequest('POST', '/api/families', data);
  // apiRequest already throws if response is not ok
  return response.json();
}

export function CreateFamilyDialog({ isOpen, onOpenChange, onSuccess }: CreateFamilyDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familyFormSchema),
    defaultValues: {
      name: '',
    },
  });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  const mutation = useMutation({
    mutationFn: createFamilyAPI,
    onSuccess: (newFamily) => {
      toast({
        title: t('createFamilyDialog.successTitle'),
        description: t('createFamilyDialog.successDescription', { familyName: newFamily.name }),
      });
      // Invalidate queries that might be affected by a new family
      // e.g., user's profile/details if it shows families, list of families for selection
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] }); // To refresh user's families list
      queryClient.invalidateQueries({ queryKey: ['/api/families'] }); // If there's a general families list
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/family/current'] }); // Refresh family bookshelves list

      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newFamily);
      }
      reset(); // Reset form after successful submission
    },
    onError: (error: Error) => {
      toast({
        title: t('createFamilyDialog.errorTitle'),
        description: error.message || t('createFamilyDialog.genericError'),
        variant: 'destructive',
      });
      console.error('创建家庭失败:', error);
    },
  });

  const onSubmitHandler = (data: FamilyFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        reset(); // Reset form when dialog is closed
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('createFamilyDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('createFamilyDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('createFamilyDialog.familyNameLabel')}</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder={t('createFamilyDialog.familyNamePlaceholder')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.creating') : t('createFamilyDialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 