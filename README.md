# PAPERHEAD 生存模式指南

独立整理的中英文单页指南，保留玩家经验的来源与实测限制。

- 英文：https://yxhtl.github.io/paperhead-survival-guide/
- 中文：https://yxhtl.github.io/paperhead-survival-guide/zh.html
- 托管：GitHub Pages，main 分支根目录；无需构建或付费接口。

## 本地预览

在项目根目录运行 `python -m http.server 8766 --bind 127.0.0.1`。

## 发布

`bash release.sh` 只做文件、语法、仓库和远端读取预检。

`bash release.sh --push "中文提交说明"` 提交已跟踪改动并推送。新文件须在 `--` 后明确列出。脚本只允许本项目的 github 远端，不接管已有暂存内容，不强推，不自动重试。

推送完成后，仍须另外核对 Pages 部署与线上页面。GSC 所有权、收录状态、GA4 配置和实际收到事件是不同验收项。
