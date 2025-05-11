import { useEffect, useState as useReactState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import type { FamilySimpleDto, Family, Bookshelf } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { CreateFamilyDialog } from '@/components/dialogs/CreateFamilyDialog';
import { useToast } from "@/hooks/use-toast";

const defaultNumShelvesConst = 3;

const bookshelfFormSchema = z.object({
  name: z.string().min(1, { message: '书架名称不能为空' }).max(100, { message: '书架名称不能超过100个字符' }),
  numShelves: z.coerce // Coerce to number, then validate
    .number({ required_error: "层数不能为空", invalid_type_error: '层数必须是数字' })
    .min(1, { message: '层数至少为1' })
    .max(10, { message: '层数最多为10' }),
  isPrivate: z.boolean(), // No longer optional, will rely on defaultValues
  ownerId: z.number().nullable().optional(),
  familyId: z.number().nullable().optional(),
  assignToFamily: z.boolean().optional(),
  setAsOwnerInFamily: z.boolean().optional(),
  shelfNamesArray: z.array(z.object({ name: z.string().max(50, {message: "层名不能超过50字符"}).optional() })).optional(),
});

type BookshelfFormData = z.infer<typeof bookshelfFormSchema>;

interface CreateBookshelfDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  context: 'my-bookshelf' | 'family-bookshelf';
  defaultFamilyId?: number | null;
  onSuccess?: (newBookshelf: Bookshelf) => void;
}

async function createBookshelfAPI(data: { 
  name: string; 
  numShelves: number; 
  isPrivate: boolean; 
  ownerId?: number | null; 
  familyId?: number | null; 
  shelfNames?: Record<string, string>; 
}) {
  const response = await apiRequest('POST', '/api/bookshelves', data);
  return response.json(); 
}

export function CreateBookshelfDialog({
  isOpen,
  onOpenChange,
  context,
  defaultFamilyId,
  onSuccess,
}: CreateBookshelfDialogProps) {
  const { user: currentUser, isLoadingUser, refetchUserData } = useAuth();
  const [isCreateFamilyDialogOpen, setIsCreateFamilyDialogOpen] = useReactState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookshelfFormData>({
    resolver: zodResolver(bookshelfFormSchema),
    defaultValues: {
      name: '',
      numShelves: defaultNumShelvesConst,
      isPrivate: context === 'my-bookshelf', // Default for my-bookshelf
      ownerId: null,
      familyId: null,
      assignToFamily: false,
      setAsOwnerInFamily: context === 'family-bookshelf',
      shelfNamesArray: Array.from({ length: defaultNumShelvesConst }, () => ({ name: '' }))
    }
  });
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors }, getValues } = form;
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "shelfNamesArray"
  });

  const numShelvesWatch = watch("numShelves", defaultNumShelvesConst);
  const assignToFamilyWatch = watch('assignToFamily');
  const userFamilies = currentUser?.families || [];

  useEffect(() => {
    const currentFieldsLength = fields.length;
    const targetShelves = numShelvesWatch || 0;
    if (currentFieldsLength < targetShelves) {
      for (let i = currentFieldsLength; i < targetShelves; i++) {
        append({ name: '' });
      }
    } else if (currentFieldsLength > targetShelves) {
      for (let i = currentFieldsLength - 1; i >= targetShelves; i--) {
        remove(i);
      }
    }
  }, [numShelvesWatch, fields.length, append, remove]);
  
  useEffect(() => {
    if (isOpen) {
      const isMyBookshelfContext = context === 'my-bookshelf';
      const currentNumShelves = getValues("numShelves") || defaultNumShelvesConst;
      let initialOwnerId: number | null = null;
      let initialFamilyId: number | null = null;
      let initialAssignToFamily = false;
      let initialSetAsOwnerInFamily = false;
      let initialIsPrivate = isMyBookshelfContext;

      if (currentUser) {
        if (isMyBookshelfContext) {
          initialOwnerId = currentUser.id;
          initialAssignToFamily = userFamilies.length > 0;
          if (initialAssignToFamily && userFamilies.length > 0) {
            initialFamilyId = userFamilies[0]?.id || null;
          }
        } else { 
          initialSetAsOwnerInFamily = true; 
          if (initialSetAsOwnerInFamily) {
            initialOwnerId = currentUser.id;
          }
          if (defaultFamilyId) {
            initialFamilyId = defaultFamilyId;
          } else if (userFamilies.length > 0) {
            initialFamilyId = userFamilies[0]?.id || null;
          }
          initialIsPrivate = false; 
        }
      }

      reset({
        name: '',
        numShelves: currentNumShelves,
        isPrivate: initialIsPrivate,
        ownerId: initialOwnerId,
        familyId: initialFamilyId,
        assignToFamily: initialAssignToFamily,
        setAsOwnerInFamily: initialSetAsOwnerInFamily,
        shelfNamesArray: Array.from({ length: currentNumShelves }, () => ({ name: '' }))
      });
    }
  }, [isOpen, context, currentUser, defaultFamilyId, reset, getValues, userFamilies, defaultNumShelvesConst]);

  const mutation = useMutation<Bookshelf, Error, Parameters<typeof createBookshelfAPI>[0]>({
    mutationFn: createBookshelfAPI,
    onSuccess: (data) => {
      toast({title: "书架创建成功", description: `书架 "${data.name}" 已成功创建。`});
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/owner/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/family/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves'] });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      toast({title: "创建书架失败", description: error.message || "发生未知错误。", variant: "destructive"});
    },
  });

  const onSubmitHandler = (data: BookshelfFormData) => {
    if (isLoadingUser || !currentUser) {
        toast({title: "错误", description: "用户信息加载中或未登录。", variant: "destructive"});
        return;
    }

    const shelfNamesMap: Record<string, string> = {};
    if (data.shelfNamesArray) {
      data.shelfNamesArray.forEach((shelf, index) => {
        if (shelf.name && shelf.name.trim() !== '') {
          shelfNamesMap[(index + 1).toString()] = shelf.name.trim();
        }
      });
    }

    const payload: Parameters<typeof createBookshelfAPI>[0] = {
      name: data.name,
      numShelves: data.numShelves || defaultNumShelvesConst, // Ensure numShelves is always a number
      isPrivate: !!data.isPrivate, // Ensure isPrivate is always a boolean
      ownerId: null, 
      familyId: null, 
      shelfNames: shelfNamesMap
    };

    if (context === 'my-bookshelf') {
      payload.ownerId = currentUser.id;
      if (data.assignToFamily && data.familyId) {
        payload.familyId = data.familyId;
      } 
      // isPrivate is already set based on assignToFamily in defaultValues/useEffect or checkbox interaction
      payload.isPrivate = data.assignToFamily ? !!data.isPrivate : true;

    } else if (context === 'family-bookshelf') {
      payload.familyId = data.familyId;
      if (!payload.familyId) {
        if (userFamilies.length > 0) {
            payload.familyId = userFamilies[0].id;
        } else {
          setIsCreateFamilyDialogOpen(true); 
          return;
        }
      }
      if (data.setAsOwnerInFamily) {
        payload.ownerId = currentUser.id;
      }
      payload.isPrivate = false; 
    }
    
    if (payload.ownerId === null && payload.familyId === null) {
        toast({title:"提交错误", description: "书架必须指定拥有者或关联一个家庭。", variant: "destructive"});
        return;
    }
    mutation.mutate(payload);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) { reset(); }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>创建新书架</DialogTitle>
          <DialogDescription>
            {context === 'my-bookshelf' 
              ? '为您的个人图书馆添加一个新的书架。' 
              : `为家庭"${userFamilies.find(f => f.id === (watch('familyId') || defaultFamilyId))?.name || (watch('familyId') ? '所选家庭' : (userFamilies.length > 0 ? userFamilies[0].name : '...'))}"添加一个新的共享书架。`}
          </DialogDescription>
        </DialogHeader>

        {context === 'family-bookshelf' && userFamilies.length === 0 && !watch('familyId') && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm">
            <p>您当前没有加入任何家庭。您需要先创建一个家庭才能为其添加书架。</p>
            <Button type="button" variant="link" className="p-0 h-auto text-yellow-700 hover:text-yellow-800 font-semibold" onClick={() => setIsCreateFamilyDialogOpen(true)}>
              点击这里创建家庭
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div>
            <Label htmlFor="name">书架名称</Label>
            <Input id="name" {...register('name')} placeholder="例如：客厅书架" />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numShelves">层数 (1-10)</Label>
              <Controller
                name="numShelves"
                control={control}
                defaultValue={defaultNumShelvesConst} // Ensure a default value for controller
                render={({ field }) => (
                  <Input 
                    id="numShelves" 
                    type="number" 
                    {...field} 
                    onChange={e => {
                        const value = parseInt(e.target.value, 10);
                        const processedValue = isNaN(value) ? defaultNumShelvesConst : Math.max(1, Math.min(10, value));
                        field.onChange(processedValue);
                    }}
                    value={field.value || ''} // Handle undefined/null for input display
                    min="1" max="10"
                  />
                )}
              />
              {errors.numShelves && <p className="text-sm text-red-500 mt-1">{errors.numShelves.message}</p>}
            </div>
             <div>
                <Label htmlFor="isPrivate" className="flex items-center space-x-2 mt-2 pt-5">
                    <Controller name="isPrivate" control={control} defaultValue={context === 'my-bookshelf'} render={({ field }) => (
                       <Checkbox id="isPrivate" checked={field.value} onCheckedChange={field.onChange} /> // Directly use field.value
                    )} />
                    <span>设为私有 (仅自己可见)</span>
                </Label>
            </div>
          </div>
          
          {fields.map((item, index) => (
            <div key={item.id}>
              <Label htmlFor={`shelfNamesArray.${index}.name`}>{`第 ${index + 1} 层名称 (可选)`}</Label>
              <Input
                id={`shelfNamesArray.${index}.name`}
                {...register(`shelfNamesArray.${index}.name`)}
                placeholder={`例如：文学、历史、工具书`}
              />
              {errors.shelfNamesArray?.[index]?.name && 
                <p className="text-sm text-red-500 mt-1">{errors.shelfNamesArray[index]?.name?.message}</p>}
            </div>
          ))}
          
          {context === 'my-bookshelf' && userFamilies.length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                 <Controller name="assignToFamily" control={control} render={({ field }) => (
                    <Checkbox id="assignToFamily" checked={!!field.value} 
                        onCheckedChange={(checkedBool) => {
                            const isChecked = Boolean(checkedBool);
                            field.onChange(isChecked);
                            if (!isChecked) {
                                setValue('familyId', null);
                                setValue('isPrivate', true);
                            } else {
                                if (userFamilies.length > 0 && !getValues('familyId')) {
                                    setValue('familyId', userFamilies[0].id);
                                }
                                setValue('isPrivate', false);
                            }
                        }}
                    />
                )} />
                <Label htmlFor="assignToFamily">同时共享到家庭</Label>
              </div>
              {assignToFamilyWatch && (
                <div>
                  <Label htmlFor="familyIdMyBookshelf">选择家庭</Label>
                  <Controller name="familyId" control={control} rules={{ required: assignToFamilyWatch ? '请选择一个家庭' : false }}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)} value={field.value?.toString() || ""} >
                        <SelectTrigger id="familyIdMyBookshelf"><SelectValue placeholder="选择一个家庭..." /></SelectTrigger>
                        <SelectContent>
                          {userFamilies.map((family: FamilySimpleDto) => (
                            <SelectItem key={`my-fam-${family.id}`} value={family.id.toString()}>{family.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.familyId && <p className="text-sm text-red-500 mt-1">{errors.familyId.message}</p>}
                </div>
              )}
            </>
          )}

        {context === 'family-bookshelf' && userFamilies.length > 0 && (
            <div>
                <Label htmlFor="familyIdFamilyBookshelf">所属家庭</Label>
                <Controller name="familyId" control={control} 
                rules={{ required: '必须为家庭书架选择一个家庭' }}
                defaultValue={defaultFamilyId || (userFamilies.length > 0 ? userFamilies[0].id : undefined)}
                render={({ field }) => (
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)} 
                      value={field.value?.toString() || ""}
                    >
                      <SelectTrigger id="familyIdFamilyBookshelf"><SelectValue placeholder="选择一个家庭..." /></SelectTrigger>
                      <SelectContent>
                          {userFamilies.map((family: FamilySimpleDto) => (
                          <SelectItem key={`fam-shelf-fam-${family.id}`} value={family.id.toString()}>{family.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                )}
                />
                {errors.familyId && <p className="text-sm text-red-500 mt-1">{errors.familyId.message}</p>}
            </div>
        )}

          {context === 'family-bookshelf' && (
             <div className="flex items-center space-x-2">
                <Controller name="setAsOwnerInFamily" control={control} render={({ field }) => (
                    <Checkbox id="setAsOwnerInFamily" checked={!!field.value} onCheckedChange={field.onChange} />
                )} />
                <Label htmlFor="setAsOwnerInFamily">将我指定为此家庭书架的管理者</Label>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">取消</Button></DialogClose>
            <Button type="submit" disabled={mutation.isPending || isLoadingUser}>
              {mutation.isPending ? '创建中...' : (isLoadingUser ? '加载用户数据...': '创建书架')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CreateFamilyDialog 
        isOpen={isCreateFamilyDialogOpen} 
        onOpenChange={setIsCreateFamilyDialogOpen} 
        onSuccess={async (newFamily: Family) => {
          setIsCreateFamilyDialogOpen(false);
          await refetchUserData(); 
          queryClient.invalidateQueries({ queryKey: ['/api/users/current'] }); 
          if (newFamily && newFamily.id) {
            setValue('familyId', newFamily.id, { shouldValidate: true, shouldDirty: true });
          }
          toast({title: "家庭创建成功", description: "现在您可以为新家庭创建书架了。"});
        }}
      />
    </Dialog>
  );
}


