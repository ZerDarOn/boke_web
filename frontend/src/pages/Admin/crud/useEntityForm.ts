import { useCallback, useState } from 'react';
import { useToastActions } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';

/** 与 useAdminResource* hooks 兼容的最小 mutation 形状（载荷用 any 以兼容任意实体类型） */
export interface CrudMutation {
  mutateAsync: (input: any) => Promise<unknown>;
  isPending: boolean;
}

export type EntityFormData = Record<string, any>;

export interface EntityFormOptions<T extends { id: string }> {
  createMutation: CrudMutation;
  updateMutation: CrudMutation;
  deleteMutation: CrudMutation;
  /** 新建时的表单初始值 */
  defaults: EntityFormData;
  /** 列表项 → 表单值（如 tags 数组转逗号串）。默认浅拷贝 */
  toForm?: (item: T) => EntityFormData;
  /** 表单值 → 提交载荷（如 featured 字符串转布尔）。默认原样提交 */
  toSubmit?: (formData: EntityFormData) => Record<string, unknown>;
  /** 校验：返回错误提示文案则中断提交 */
  validate?: (formData: EntityFormData) => string | null;
}

/**
 * 管理 Admin 实体页共用的「弹窗表单 + 增删改」状态机。
 * 列表查询由页面自行选择 hooks 传入，本 hook 不关心数据来源。
 */
export function useEntityForm<T extends { id: string }>(options: EntityFormOptions<T>) {
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    defaults,
    toForm,
    toSubmit,
    validate,
  } = options;
  const toast = useToastActions();
  const confirm = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<EntityFormData>({});
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const openCreate = useCallback(() => {
    setEditingItem(null);
    setFormData({ ...defaults });
    setIsModalOpen(true);
  }, [defaults]);

  const openEdit = useCallback(
    (item: T) => {
      setEditingItem(item);
      setFormData(toForm ? { ...toForm(item) } : { ...item });
      setIsModalOpen(true);
    },
    [toForm],
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  }, []);

  const setField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submit = useCallback(async () => {
    const validationError = validate?.(formData) ?? null;
    if (validationError) {
      toast.warning(validationError);
      return false;
    }
    const payload = toSubmit ? toSubmit(formData) : formData;
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload as Partial<T>);
      }
      closeModal();
      toast.success(editingItem ? '更新成功' : '创建成功');
      return true;
    } catch (err) {
      console.error('Failed to save entity:', err);
      toast.error(err instanceof Error ? `保存失败：${err.message}` : '保存失败');
      return false;
    }
  }, [formData, validate, toSubmit, editingItem, createMutation, updateMutation, closeModal, toast]);

  const remove = useCallback(
    async (id: string, message = '确定要删除吗？') => {
      if (!(await confirm({ message }))) return false;
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('删除成功');
        return true;
      } catch (err) {
        console.error('Failed to delete entity:', err);
        toast.error('删除失败');
        return false;
      }
    },
    [deleteMutation, confirm, toast],
  );

  return {
    isModalOpen,
    editingItem,
    formData,
    isSubmitting,
    openCreate,
    openEdit,
    closeModal,
    setField,
    submit,
    remove,
  };
}
