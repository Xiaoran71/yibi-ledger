# 一笔

一个仅供个人使用、移动端优先的极简记账 PWA。账目只保存在本机 IndexedDB，不包含账号、服务器、同步、统计追踪或广告。

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建与测试：

```bash
pnpm test
pnpm build
```

## 数据与备份

- 金额使用整数“分”保存，避免浮点误差。
- 删除已使用分类时采用归档，历史账目不会损坏。
- JSON 是完整恢复格式；CSV 仅用于查看和分析。
- 恢复 JSON 会在校验后完整替换当前本地数据。

Safari、iOS 或系统仍可能在清理网站数据时移除 IndexedDB。请定期在“设置 → 数据”中导出完整 JSON 备份。

## GitHub Pages

项目使用相对资源路径，兼容 `用户名.github.io/仓库名/` 子目录。推送到 `main` 后，GitHub Actions 会测试、构建并部署 `dist`。

首次使用需在仓库 Settings → Pages 中把 Source 设为 **GitHub Actions**。然后用 iPhone Safari 打开 Pages 地址，通过分享菜单选择“添加到主屏幕”。
