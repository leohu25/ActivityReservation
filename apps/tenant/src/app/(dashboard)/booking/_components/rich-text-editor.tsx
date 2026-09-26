"use client";

import React, { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Image,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  Undo,
  Redo,
  Sparkles,
} from "lucide-react";

interface RichTextEditorProps {
  readonly name: string;
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly minHeight?: string;
}

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "输入详细正文内容，支持文字排版、插入图片与排版修饰...",
  minHeight = "240px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(defaultValue);
  const [imgUrlInput, setImgUrlInput] = useState("");
  const [showImgPrompt, setShowImgPrompt] = useState(false);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (imgUrlInput.trim()) {
      exec("insertImage", imgUrlInput.trim());
      setImgUrlInput("");
      setShowImgPrompt(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/80 border-b border-slate-200 text-slate-700">
        <button
          type="button"
          onClick={() => exec("bold")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="加粗"
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="斜体"
        >
          <Italic className="size-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("formatBlock", "<h1>")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="大标题"
        >
          <Heading1 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="中标题"
        >
          <Heading2 className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<p>")}
          className="px-2 py-1 text-xs font-semibold rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="常规段落"
        >
          正文
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="无序列表"
        >
          <List className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="有序列表"
        >
          <ListOrdered className="size-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="居左"
        >
          <AlignLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
          title="居中"
        >
          <AlignCenter className="size-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => setShowImgPrompt(!showImgPrompt)}
          className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center gap-1 text-xs font-medium ${
            showImgPrompt ? "bg-primary text-white" : "hover:bg-slate-200/80 text-slate-700"
          }`}
          title="插入网络图片"
        >
          <Image className="size-4" />
          <span>插入图片</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => exec("undo")}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
            title="撤销"
          >
            <Undo className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => exec("redo")}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 active:scale-95 transition-all text-slate-700"
            title="重做"
          >
            <Redo className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 插入图片弹出快捷栏 */}
      {showImgPrompt && (
        <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="url"
            value={imgUrlInput}
            onChange={(e) => setImgUrlInput(e.target.value)}
            placeholder="粘贴外部图片图片链接 (如: https://.../pic.jpg)"
            className="flex-1 text-xs px-3 py-1.5 bg-white rounded-lg border border-blue-200 focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleInsertImage}
            className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-2xs"
          >
            确认插入
          </button>
          <button
            type="button"
            onClick={() => setShowImgPrompt(false)}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            取消
          </button>
        </div>
      )}

      {/* 可编辑区域 */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        style={{ minHeight }}
        className="p-4 text-xs text-slate-800 focus:outline-none leading-relaxed prose prose-sm max-w-none prose-img:rounded-xl prose-img:max-h-72 prose-img:object-cover prose-h1:text-base prose-h2:text-sm prose-h1:font-bold prose-h2:font-bold prose-p:my-1.5"
      />

      {/* 隐藏的真实表单字段，随 form 提交 */}
      <input type="hidden" name={name} value={content} />
    </div>
  );
}
