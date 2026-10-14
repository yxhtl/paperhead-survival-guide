#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

die() { echo "错误：$*" >&2; exit 1; }
network_git() { git -c http.sslBackend=openssl "$@"; }
root="$(git rev-parse --show-toplevel 2>/dev/null)" || die "尚未初始化项目仓库。"
[[ "$(pwd -P)" == "$(cd "$root" && pwd -P)" ]] || die "必须在本项目仓库中执行。"
branch="$(git symbolic-ref --quiet --short HEAD)" || die "不能在 detached HEAD 中发布。"
[[ "$branch" == main ]] || die "本项目只从 main 分支发布。"
remote="$(git remote get-url github)" || die "尚未配置 github 远端。"
[[ "$remote" == 'https://github.com/yxhtl/paperhead-survival-guide.git' ]] || die "远端不属于本项目。"
git diff --cached --quiet || die "暂存区已有内容，请先检查；脚本不会接管。"

case "${1:-}" in
  '') ;;
  --push)
    [[ $# -ge 2 && -n "$2" ]] || die "需要中文提交说明。"
    message="$2"
    shift 2
    if (( $# > 0 )); then
      [[ "$1" == -- ]] || die "未跟踪路径必须放在 -- 后。"
      shift
    fi
    for file in "$@"; do
      [[ -f "$file" && "$file" != /* && "$file" != *'..'* ]] || die "无效的未跟踪文件：$file"
      [[ "$(git status --porcelain=v1 --untracked-files=all -- "$file")" == "?? "* ]] || die "只能点名未跟踪文件：$file"
    done
    ;;
  --push-only)
    [[ $# == 1 ]] || die "--push-only 不接收提交说明或文件。"
    push_only=1
    ;;
  *) die '用法：bash release.sh 或 bash release.sh --push "提交说明" [-- 新文件 ...] 或 bash release.sh --push-only' ;;
esac

python tools/check_site.py
node --check app.js
node --check analytics.js
node tools/check_analytics.cjs
echo "分支：$branch"
echo "目标：$remote"
git status --short
network_git ls-remote github HEAD >/dev/null || die "远端读取预检失败，未提交或推送。"
[[ -n "${message:-}" || -n "${push_only:-}" ]] || exit 0

if [[ -n "${message:-}" ]]; then
  git add -u
  for file in "$@"; do git add -- "$file"; done
  git diff --cached --quiet && die "没有可提交的改动。"
  git diff --cached --stat
  git commit -m "$message"
fi
network_git push -u github "HEAD:refs/heads/$branch" || die "推送失败；本地提交已保留，不自动重试。"
echo "推送完成；Pages 部署、GSC 和 GA4 需要另外验证。"
