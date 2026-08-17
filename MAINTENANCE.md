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
