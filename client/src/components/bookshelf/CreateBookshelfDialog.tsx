import { useEffect, useState as useReactState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For family selection
import { useAuth } from '@/contexts/AuthContext'; // Removed unused CurrentUser type import
import type { FamilySimpleDto, Family } from '@/lib/types'; // User type from lib is now handled by CurrentUser from AuthContext
import { apiRequest, queryClient } from '@/lib/queryClient'; // Import apiRequest
import { CreateFamilyDialog } from '@/components/dialogs/CreateFamilyDialog'; // Import CreateFamilyDialog

// Define Zod schema for form validation
const bookshelfFormSchema = z.object({
  name: z.string().min(1, { message: '书架名称不能为空' }).max(100, { message: '书架名称不能超过100个字符' }),
  numShelves: z.coerce // Use z.coerce for better type handling from input
    .number({ invalid_type_error: '层数必须是数字' })
    .min(1, { message: '层数至少为1' })
    .optional(),
  isPrivate: z.boolean().optional(),
  ownerId: z.number().nullable().optional(),
  familyId: z.number().nullable().optional(),
  assignToFamily: z.boolean().optional(),
  setAsOwnerInFamily: z.boolean().optional(),
}).refine(() => {
    // Validation will be more robust in onSubmitHandler where currentUser is definitely available
    // This refine can be simplified or made more context-aware if needed at Zod level
    return true; 
}, {
  message: "书架必须指定拥有者或关联一个家庭",
  // path: ["ownerId"], // Path can be more general or handled in form.setError
});

type BookshelfFormData = z.infer<typeof bookshelfFormSchema>;

interface CreateBookshelfDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  context: 'my-bookshelf' | 'family-bookshelf';
  defaultFamilyId?: number | null;
  onSuccess?: (newBookshelf: any) => void;
}

// Updated to use apiRequest
async function createBookshelfAPI(data: { name: string; numShelves?: number; isPrivate?: boolean; ownerId?: number | null; familyId?: number | null; }) {
  const response = await apiRequest('POST', '/api/bookshelves', data);
  // apiRequest already throws if response is not ok, so we just need to parse JSON if successful.
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

  const form = useForm<BookshelfFormData>({
    resolver: zodResolver(bookshelfFormSchema),
    defaultValues: {
      name: '',
      numShelves: 3,
      isPrivate: false,
      ownerId: null,
      familyId: null,
      assignToFamily: context === 'my-bookshelf' && !!(currentUser?.families && currentUser.families.length > 0),
      setAsOwnerInFamily: context === 'family-bookshelf', 
    }
  });
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = form;
  
  const assignToFamilyWatch = watch('assignToFamily');
  const userFamilies = currentUser?.families || [];

  useEffect(() => {
    if (isOpen) {
      if (isLoadingUser || !currentUser) {
        // Reset with basic defaults if user is still loading or not available
        reset({
          name: '',
          numShelves: 3,
          isPrivate: false,
          ownerId: null,
          familyId: null,
          assignToFamily: false,
          setAsOwnerInFamily: context === 'family-bookshelf',
        });
        return; 
      }

      const currentFamilies = currentUser.families || []; // Use potentially updated families
      let determinedOwnerId: number | null = null;
      let determinedFamilyId: number | null = null;
      let defaultAssignToFamily = context === 'my-bookshelf' && currentFamilies.length > 0;
      let defaultSetAsOwner = context === 'family-bookshelf';

      if (context === 'my-bookshelf') {
        determinedOwnerId = currentUser.id;
        // If assignToFamily is checked by default and user has families, pick the first one
        if (defaultAssignToFamily && currentFamilies.length > 0) {
          determinedFamilyId = currentFamilies[0].id; 
        }
      } else if (context === 'family-bookshelf') {
        if (defaultFamilyId) { // A specific family is passed as default (e.g. from active tab)
            determinedFamilyId = defaultFamilyId;
        } else if (currentFamilies.length > 0) { // No specific default, pick user's first family
            determinedFamilyId = currentFamilies[0].id;
        }
        // If setAsOwnerInFamily is true, current user is the owner
        if (watch('setAsOwnerInFamily')) {
          determinedOwnerId = currentUser.id;
        }
      }
      
      reset({ 
        name: '',
        numShelves: 3, 
        isPrivate: false, 
        ownerId: determinedOwnerId,
        familyId: determinedFamilyId,
        assignToFamily: defaultAssignToFamily,
        setAsOwnerInFamily: defaultSetAsOwner,
      });
    }
  }, [isOpen, context, currentUser, isLoadingUser, defaultFamilyId, reset, watch]);

  const mutation = useMutation({
    mutationFn: createBookshelfAPI,
    onSuccess: (data) => {
      console.log('书架创建成功！', data);
      
      // 同时刷新个人书架和家庭书架的缓存
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/owner/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookshelves/family/current'] });
      queryClient.invalidateQueries({ queryKey: ['booksByBookshelf'] });
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: Error) => {
      alert(`创建书架失败: ${error.message}`);
      console.error('创建书架失败:', error);
    },
  });

  const onSubmitHandler = (data: BookshelfFormData) => {
    if (isLoadingUser || !currentUser) {
        alert("用户信息仍在加载中或未登录，请稍后再试。");
        return;
    }

    // If trying to create a family bookshelf, but no familyId is selected AND the user has no families,
    // prompt to create a family first.
    const currentFormFamilies = currentUser?.families || []; // Get latest families for this check
    if (context === 'family-bookshelf' && !data.familyId && (!currentFormFamilies || currentFormFamilies.length === 0)) {
      setIsCreateFamilyDialogOpen(true);
      return; // Stop bookshelf creation, user needs to create a family first
    }

    const payload: { name: string; numShelves?: number; isPrivate?: boolean; ownerId?: number | null; familyId?: number | null; } = {
      name: data.name,
      numShelves: data.numShelves,
      isPrivate: data.isPrivate,
      ownerId: null, 
      familyId: null, 
    };

    if (context === 'my-bookshelf') {
      payload.ownerId = currentUser.id;
      if (data.assignToFamily && data.familyId) { // familyId here comes from the form's select
        payload.familyId = data.familyId;
      }
    } else if (context === 'family-bookshelf') {
      // For family bookshelf, familyId is critical.
      // It should have been set by useEffect (from defaultFamilyId or user's first family)
      // or potentially allow selection if user has multiple families and no defaultFamilyId was provided.
      // For now, we rely on the form's familyId value which was set by useEffect.
      payload.familyId = data.familyId; // This should be the one set in useEffect or selected by user if a selector is added
      
      if (!payload.familyId && currentFormFamilies.length > 0) {
        // Fallback: if somehow data.familyId is null but user has families, assign the first one.
        // This indicates a potential logic flaw in form state management if it reaches here.
        console.warn("Fallback: Assigning to user's first family as form.familyId was null for family-bookshelf context.");
        payload.familyId = currentFormFamilies[0].id;
      }
      
      if (data.setAsOwnerInFamily) {
        payload.ownerId = currentUser.id;
      }
    }
    
    // 新增：针对 family-bookshelf 上下文的 familyId 校验
    if (context === 'family-bookshelf' && payload.familyId === null) {
        let errMessage = "无法创建家庭书架：必须选择一个家庭。";
        // 检查 userFamilies 是否为空或未定义
        if (!currentFormFamilies || currentFormFamilies.length === 0) {
            errMessage += " 您当前未加入任何家庭，请先创建或加入一个家庭。";
        } else {
            // 这个情况理论上不应该发生，因为 useEffect 或 fallback 应该已处理，或者用户选择器未正确工作
            errMessage += " 请确保已选择一个家庭。如果下拉列表中没有家庭可选，您可能需要先创建或加入一个家庭。";
        }
        alert(errMessage);
        form.setError("familyId", { type: "manual", message: "请为家庭书架选择一个家庭" });
        return;
    }

    if (payload.ownerId === null && payload.familyId === null) {
        let errMessage = "书架必须至少指定一个拥有者或关联一个家庭。";
        if (context === 'family-bookshelf' && !payload.familyId) {
            // 此处逻辑其实已被上面的 family-bookshelf 特定校验覆盖，但保留以防万一
            errMessage = "在家庭书架模式下，必须选择或指定一个家庭。如果您没有家庭，请先加入或创建一个。";
        }
        alert(errMessage);
        console.error("Validation Error:", errMessage, "Payload:", payload, "Form Data:", data, "Current User:", currentUser);
        // Set error on a relevant field or a general form error
        form.setError(context === 'family-bookshelf' && !payload.familyId ? "familyId" : "ownerId", {
             type: "manual", 
             message: errMessage 
        });
        return;
    }

    console.log("Submitting payload for CreateBookshelfDialog:", payload, "Form data:", data, "Context:", context, "DefaultFamilyId:", defaultFamilyId, "UserFamilies:", userFamilies, "Current User Object:", currentUser); // Enhanced log
    mutation.mutate(payload);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            // Reset form to initial determined defaults when dialog closes
            // The useEffect logic will re-run when it opens again.
            const latestUserFamilies = currentUser?.families || [];
            const initialFamilyId = (context === 'family-bookshelf') 
                ? (defaultFamilyId || (latestUserFamilies.length > 0 ? latestUserFamilies[0].id : null)) 
                : ((context === 'my-bookshelf' && form.getValues('assignToFamily') && latestUserFamilies.length > 0) ? latestUserFamilies[0].id : null);
            const initialOwnerId = (context === 'my-bookshelf') 
                ? (currentUser?.id || null) 
                : ((context === 'family-bookshelf' && form.getValues('setAsOwnerInFamily') && currentUser) ? currentUser.id : null);

            reset({ 
                name: '', 
                numShelves: 3, 
                isPrivate: false, 
                ownerId: initialOwnerId,
                familyId: initialFamilyId, 
                assignToFamily: context === 'my-bookshelf' && !!(initialFamilyId), 
                setAsOwnerInFamily: context === 'family-bookshelf' && !!(initialOwnerId && initialFamilyId) 
            });
        }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>创建新书架</DialogTitle>
          <DialogDescription>
            {context === 'my-bookshelf' 
              ? '为您的个人图书馆添加一个新的书架。' 
              : `为家庭"${currentUser?.families?.find(f => f.id === (watch('familyId') || defaultFamilyId))?.name || (watch('familyId') ? '所选家庭' : (userFamilies && userFamilies.length > 0 ? userFamilies[0].name : '...'))}"添加一个新的共享书架。`}
          </DialogDescription>
        </DialogHeader>

        {/* Prompt to create a family if in family-bookshelf context and user has no families AND no family is yet selected by form */}
        {context === 'family-bookshelf' && (!userFamilies || userFamilies.length === 0) && !watch('familyId') && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded-md text-sm">
            <p>您当前没有加入任何家庭。您需要先创建一个家庭才能为其添加书架。</p>
            <Button 
              type="button" 
              variant="link" 
              className="p-0 h-auto text-yellow-700 hover:text-yellow-800 font-semibold"
              onClick={() => setIsCreateFamilyDialogOpen(true)}
            >
              点击这里创建家庭
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
          <div>
            <Label htmlFor="name">书架名称</Label>
            <Input id="name" {...register('name')} placeholder="例如：客厅书架，卧室书房" />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numShelves">层数</Label>
              <Controller
                name="numShelves"
                control={control}
                render={({ field }) => (
                  <Input 
                    id="numShelves" 
                    type="number" 
                    {...field} 
                    onChange={e => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : value);
                    }}
                    value={field.value === undefined || field.value === null ? '' : String(field.value)}
                  />
                )}
              />
              {errors.numShelves && <p className="text-sm text-red-500 mt-1">{errors.numShelves.message}</p>}
            </div>
             <div>
                <Label htmlFor="isPrivate" className="flex items-center space-x-2 mt-2 pt-5">
                    <Controller
                        name="isPrivate"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                            id="isPrivate"
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                            />
                        )}
                    />
                    <span>设为私有</span>
                </Label>
                {errors.isPrivate && <p className="text-sm text-red-500 mt-1">{errors.isPrivate.message}</p>}
            </div>
          </div>
          
          {context === 'my-bookshelf' && userFamilies && userFamilies.length > 0 && (
            <>
              <div className="flex items-center space-x-2">
                 <Controller
                    name="assignToFamily"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                        id="assignToFamily"
                        checked={!!field.value}
                        onCheckedChange={(checkedBool) => {
                            const isChecked = Boolean(checkedBool);
                            field.onChange(isChecked);
                            if (!isChecked) {
                                setValue('familyId', null);
                            } else if (userFamilies.length > 0 && !form.getValues('familyId')) {
                                // If checked and no familyId yet, default to first family
                                setValue('familyId', userFamilies[0].id);
                            }
                        }}
                        />
                    )}
                    />
                <Label htmlFor="assignToFamily">同时共享到家庭</Label>
              </div>
              {assignToFamilyWatch && (
                <div>
                  <Label htmlFor="familyIdMyBookshelf">选择家庭 (我的书架)</Label>
                  <Controller
                    name="familyId"
                    control={control}
                    rules={{ required: assignToFamilyWatch ? '请选择一个家庭' : false }}
                    render={({ field }) => (
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)} 
                        value={field.value?.toString() || ""} 
                      >
                        <SelectTrigger id="familyIdMyBookshelf">
                          <SelectValue placeholder="选择一个家庭..." />
                        </SelectTrigger>
                        <SelectContent>
                          {userFamilies.map((family: FamilySimpleDto) => (
                            <SelectItem key={`my-fam-${family.id}`} value={family.id.toString()}>
                              {family.name}
                            </SelectItem>
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

        {/* Family selection for family-bookshelf context if no defaultFamilyId and user has multiple families */}
        {context === 'family-bookshelf' && !defaultFamilyId && userFamilies && userFamilies.length > 1 && (
            <div>
                <Label htmlFor="familyIdFamilyBookshelf">选择家庭 (家庭书架)</Label>
                <Controller
                name="familyId"
                control={control}
                rules={{ required: '必须为家庭书架选择一个家庭' }}
                render={({ field }) => (
                    <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : null)} 
                    value={field.value?.toString() || ""}
                    defaultValue={field.value?.toString() || (userFamilies.length > 0 ? userFamilies[0].id.toString() : "")}
                    >
                    <SelectTrigger id="familyIdFamilyBookshelf">
                        <SelectValue placeholder="选择一个家庭..." />
                    </SelectTrigger>
                    <SelectContent>
                        {userFamilies.map((family: FamilySimpleDto) => (
                        <SelectItem key={`fam-shelf-fam-${family.id}`} value={family.id.toString()}>
                            {family.name}
                        </SelectItem>
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
                <Controller
                    name="setAsOwnerInFamily"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                        id="setAsOwnerInFamily"
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                        />
                    )}
                    />
                <Label htmlFor="setAsOwnerInFamily">将我指定为此家庭书架的管理者</Label>
            </div>
          )}
           {errors.root?.message && <p className="text-sm text-red-500 mt-1">{errors.root.message}</p>}
           {(errors.ownerId?.type === 'manual' || errors.familyId?.type === 'manual') && 
             <p className="text-sm text-red-500 mt-1">
                 {errors.ownerId?.message || errors.familyId?.message}
            </p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">取消</Button>
            </DialogClose>
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
          queryClient.invalidateQueries({ queryKey: ['/api/users/current'] }); // Belt and suspenders for other places that might use this key
          
          // Set the newly created family as selected in the bookshelf form
          if (newFamily && newFamily.id) {
            setValue('familyId', newFamily.id, { shouldValidate: true, shouldDirty: true });
            // Ensure the dialog description updates if it was showing a placeholder
            // This might require a re-render or ensuring watch('familyId') picks up the change for the description
          }
          alert("家庭创建成功！现在您可以为新家庭创建书架了。");
        }}
      />
    </Dialog>
  );
}

