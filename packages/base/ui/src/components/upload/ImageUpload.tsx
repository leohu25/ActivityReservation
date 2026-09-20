"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { toast } from "../feedback/Toast";

export interface ImageUploadProps {
  readonly value?: string | null;
  readonly onChange?: (url: string | null) => void;
  readonly disabled?: boolean;
  readonly module?: string;
  readonly accept?: string;
  readonly maxSizeMB?: number;
  readonly className?: string;
  readonly onUploadAction?: (params: {
    module: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => Promise<{
    success: boolean;
    data?: { uploadUrl: string; fileUrl: string };
    error?: string;
  }>;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  module = "common",
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 10,
  className,
  onUploadAction,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = localPreview || value;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 清空 input 使得同一文件再次选择能触发 change
    e.target.value = "";

    // 1. 客户端类型与大小自检
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const err = `图片大小不能超过 ${maxSizeMB}MB`;
      toast.error(err);
      setErrorMsg(err);
      return;
    }

    if (!file.type.startsWith("image/")) {
      const err = "请选择有效的图片文件";
      toast.error(err);
      setErrorMsg(err);
      return;
    }

    // 2. 本地即时预览
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setErrorMsg(null);
    setIsUploading(true);

    try {
      if (!onUploadAction) {
        throw new Error("未配置上传授权 Action");
      }

      // 3. 获取直传预签名凭证
      const presignRes = await onUploadAction({
        module,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      if (!presignRes.success || !presignRes.data) {
        throw new Error(presignRes.error || "获取上传凭证失败");
      }

      const { uploadUrl, fileUrl } = presignRes.data;

      // 4. 浏览器直接发起 HTTP PUT 直传 MinIO / OSS
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`存储桶直传失败: HTTP ${uploadRes.status}`);
      }

      // 5. 上传成功，回填公开访问 URL
      onChange?.(fileUrl);
      toast.success("图片上传成功");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "图片上传失败，请重试";
      setErrorMsg(msg);
      toast.error(msg);
      // 清空预览
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    setLocalPreview(null);
    setErrorMsg(null);
    onChange?.(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled || isUploading}
        className="hidden"
        onChange={handleFileChange}
      />

      {displayUrl ? (
        <div className="relative group w-28 h-28 rounded-xl border border-border bg-muted/30 overflow-hidden flex items-center justify-center shadow-xs">
          <img
            src={displayUrl}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
          />

          {isUploading ? (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-10">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-[10px] font-medium text-foreground">上传中...</span>
            </div>
          ) : !disabled ? (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon-xs"
                className="h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                onClick={() => fileInputRef.current?.click()}
                title="重新上传"
              >
                <UploadCloud className="h-3.5 w-3.5 text-foreground" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon-xs"
                className="h-7 w-7 rounded-full"
                onClick={handleRemove}
                title="移除图片"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-28 h-28 rounded-xl border border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
            errorMsg && "border-destructive/60 bg-destructive/5 text-destructive",
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-[11px] font-medium">直传中...</span>
            </>
          ) : errorMsg ? (
            <>
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-[10px] text-destructive px-1 text-center truncate max-w-full">
                点击重试
              </span>
            </>
          ) : (
            <>
              <div className="p-2 rounded-full bg-background/80 shadow-2xs">
                <ImageIcon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-medium">点击上传</span>
              <span className="text-[9px] text-muted-foreground/80">小于 {maxSizeMB}MB</span>
            </>
          )}
        </button>
      )}

      {errorMsg ? (
        <p className="text-[11px] font-medium text-destructive">{errorMsg}</p>
      ) : null}
    </div>
  );
}
