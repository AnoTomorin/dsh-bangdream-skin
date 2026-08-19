# 维护与版本更新

本文档供插件维护者使用，也可以在换电脑后继续维护 UI 时参考。

## 改动前先备份（必须）

每次准备修改插件（改样式、加背景、加功能、修 bug 等）之前，先对当前版本做完整备份：

```powershell
Compress-Archive -Path "<当前插件目录>" -DestinationPath "<当前插件目录>-backup.zip"
```

命名规则：`bngd-ui-plugin-v<当前版本号>-backup.zip`

例如当前版本是 `1.7.0`，备份文件就是：

```
bngd-ui-plugin-v1.7.0-backup.zip
```

> 顺序固定：**先备份，再改动**。备份完成后再开始改代码；改完再按下面的流程升版本并生成 share zip。

## 小更新 / 大更新

在插件根目录执行：

- **小更新**（修 bug、调样式、微调）：

```powershell
powershell -ExecutionPolicy Bypass -File ".\bngd-ui.ps1" -BumpPatch -Install
```

  版本号示例：`1.7.0` → `1.7.1`

- **大更新**（加功能、大改版）：

```powershell
powershell -ExecutionPolicy Bypass -File ".\bngd-ui.ps1" -BumpMinor -Install
```

  版本号示例：`1.7.0` → `1.8.0`

脚本会自动完成：

1. 修改 `bngd-ui\package.json` 的 `version`
2. 刷新 profile 的 `node_modules\@local\bngd-ui` 副本
3. 生成 `bngd-ui-plugin-v<新版本号>-share.zip`，并清理旧的 `bngd-ui-plugin-v*-share.zip`

## 脚本不会自动做的事

1. **重命名源文件夹**：脚本不会自动改文件夹名。建议把 `bngd-ui-plugin-v1.7.0` 改成新版本号，例如 `bngd-ui-plugin-v1.7.1`，然后重新跑一次 `-Install`（不加 `-BumpPatch`），这样 share zip 内的根目录名也是新版本号。
2. **更新 profile 依赖路径**：如果 `%USERPROFILE%\.dsh\profiles\web\package.json` 里 `@local/bngd-ui` 还指向旧路径，需要手动改成新文件夹的绝对路径：

```json
"@local/bngd-ui": "link:<新版本插件目录>"
```

   改完后重启 DSH。

## 换电脑继续更新

1. 把整个 `bngd-ui-plugin-vX.Y.Z` 文件夹（或 `bngd-ui-plugin-vX.Y.Z-share.zip` 解压后的文件夹）拷到新电脑。
2. 新电脑上先启动过一次 `dsh web`，确保 `%USERPROFILE%\.dsh\profiles\web\package.json` 存在。
3. 在新电脑上执行：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\plugins\bngd-ui-plugin-vX.Y.Z\bngd-ui.ps1" -Install
```

4. 如果新电脑的 profile 里已经有过旧版本依赖，需要手动把 `@local/bngd-ui` 的 link 改成当前文件夹路径（脚本对已存在的依赖不会自动改路径）。
5. 完全重启 `dsh web` 后生效。

## 从 GitHub 更新后无法启动（Junction 问题）

如果在另一台电脑 clone 后 DSH 无法启动，通常是 `node_modules/@local/bngd-ui` 变成了指向外部路径的 Junction。

修复方式：

```powershell
powershell -ExecutionPolicy Bypass -File "<克隆路径>\bngd-ui.ps1" -Install
```

该脚本会：

- 把 profile 里的 `@local/bngd-ui` 依赖路径更新为当前克隆路径
- 把 `node_modules/@local/bngd-ui` 重新复制为 profile 内实体目录
- 检查并移除 Junction

**注意：**

- 不要对 `bngd-ui` 执行 `pnpm install`
- 不要用普通 `dsh plugin --profile web add` 添加它
- 以后修改 UI 后，统一用 `bngd-ui.ps1 -Install` 刷新

## GitHub 推送规则

- 只有用户明确要求“推送到 GitHub / 更新 GitHub 仓库”时，才执行 `git push`。
- 平时本地修改、生成 share zip、更新 profile 等都不需要推送 GitHub。
- 推送前先确认本地代码可用、README / LICENSE / NOTICE 等已更新。
