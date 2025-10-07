"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner"; // 可选：使用 toast 提示（你项目里已装）

export default function UpdateNotice() {
  const t = useTranslations("update");

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) return;

    api.on("update-status", (status: string) => {
      if (status === "available") {
        toast.info(t("available")); // "检测到新版本，正在下载中"
      } else if (status === "downloaded") {
        toast.success(t("downloaded")); // "更新已下载完毕，重启后生效"
      } else if (status === "error") {
        toast.error(t("error")); // "检查更新时出错"
      }
    });
  }, [t]);

  return null; // 只负责监听事件，不渲染内容
}
