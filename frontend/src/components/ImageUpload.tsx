import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getAuthToken } from '../lib/api/request';
import { API_BASE_URL } from '../lib/apiConfig';
import AvatarCropper from './AvatarCropper';

interface ImageUploadProps {
  value?: string; // 当前图片 URL
  onChange: (url: string) => void;
  type: 'network' | 'skill' | 'author'; // 上传类型
  size?: number; // 预览尺寸，默认 100
  label?: string;
  placeholder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  type,
  size = 100,
  label,
  placeholder = '点击上传图片',
}) => {
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 读取文件并打开裁剪器
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setTempImage(dataUrl);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // 清空 input 以便重复选择同一文件
    e.target.value = '';
  };

  // 处理裁剪完成
  const handleCropConfirm = async (croppedImage: string) => {
    setShowCropper(false);
    setUploading(true);

    try {
      // 将 base64 转换为 Blob
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      
      // 创建 FormData 上传
      const formData = new FormData();
      formData.append('image', blob, 'avatar.png');

      // 上传到服务器
      const uploadTypeMap = { network: 'avatars', skill: 'skills', author: 'avatars' };
      const uploadType = uploadTypeMap[type];

      // 获取认证 token
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const uploadRes = await fetch(`${API_BASE_URL}/api/upload/image/${uploadType}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await uploadRes.json();
      
      if (result.success && result.data?.originalUrl) {
        onChange(result.data.originalUrl);
      } else {
        // 如果上传失败，直接使用 base64
        onChange(croppedImage);
      }
    } catch (error) {
      console.error('上传失败:', error);
      // 上传失败时使用 base64
      onChange(croppedImage);
    } finally {
      setUploading(false);
      setTempImage(null);
    }
  };

  // 取消裁剪
  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  // 删除图片
  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div className="flex items-start gap-4">
        {/* 预览区域 */}
        <div
          className="relative flex-shrink-0 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
          style={{ width: size, height: size }}
          onClick={() => fileInputRef.current?.click()}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={20} className="text-white" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
              <ImageIcon size={size * 0.3} />
              <span className="text-[10px] mt-1 text-center px-1">{placeholder}</span>
            </div>
          )}

          {/* 上传中遮罩 */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            {value ? '更换图片' : '上传图片'}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
            >
              <X size={12} />
              移除
            </button>
          )}
        </div>
      </div>

      {/* 裁剪器弹窗 */}
      {showCropper && tempImage && (
        <AvatarCropper
          image={tempImage}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          size={200}
        />
      )}
    </div>
  );
};

export default ImageUpload;
