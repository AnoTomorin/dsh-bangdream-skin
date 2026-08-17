# BanG Dream! 风格 UI 插件（bngd-ui）

给 DeepSeek Harness 的 Web 界面（web profile）换上的邦邦风格皮肤：

- 🎨 **主题选择母菜单**：9 个角色主题作为子选项（单选，再点当前项可关闭主题）：
  户山香澄 #FF5522 · 凑友希那 #881188 · 美竹兰 #EE0022 · 丸山彩 #FF88BB · 弦卷心 #E8C400 ·
  仓田真白 #6677CC · 和奏瑞依 #CC0000 · 高松灯 #77BBDD · 三角初华 #BB9955
- 🖼️ **自由选择背景图**：「背景图片」文字右侧的「选择图片」按钮上传任意 jpeg/png/webp/gif；
  上传的图片会复制保存到本机 DSH 存储（`$DSH_HOME/storages/bngd-ui`），**即使原文件被删除，重启后背景依然生效**；
  「恢复默认」可清除上传的图片
- 🎶 悦动队标动效（独立开关）：8 个乐队队标统一 26px，沿袭音符粒子自下而上的漂浮动画
- ✨ **乐队皮肤装饰层**：Poppin'Party 全套装饰已内置——输入框镂空花边、设置按钮框、侧栏四角星饰、星屑闪光、发送键判定圈旋转、favicon 与标题栏 logo、新建会话按钮花边（深鲸布局：边框贴紧按钮边缘）、对话框主题描边；切主题自动切换对应乐队素材（未提供素材的乐队回退到 common，素材内嵌于 client bundle）。素材目录与命名规范见 `C:\Users\87090\Desktop\Deepseek\bangdream素材\素材清单.txt`，添加新乐队素材后重新注入即可
- 💎 **deep-whale 式邦邦细节层**：窄侧栏时所有图标按钮统一为当前乐队应援色的圆形徽章；宽侧栏的工作区选中项显示渐变飘带与扫光动画；会话列表带彩色时间轴与运行中宝石呼吸灯；主界面鱼形 logo 会被主题色光环托起，输入框在“新对话 → 进入会话”时带 dock/rise 入场动画，侧栏立绘保持轻微浮动
- 💾 **位置记忆**：右侧悬浮面板拖到哪里就记住哪里；侧栏展开宽度也会在拖动调整后保存，收起再展开或重启浏览器后都会恢复到上次调整的宽度（保存在浏览器 localStorage）
- 🧍 **户山香澄立绘**：Poppin'Party 主题在侧栏显示 `img_toyama-kasumi_1.webp`，位置仿照 deep-whale-study 的 Q 版鲸鱼娘（居中、立于侧栏底部操作区上方），但允许更大、更高且保持原始比例；`-Install` 会把素材镜像到 `lib/skin/poppin-party/`，未镜像时回退到 `cordis.patch.yml` 的 `characterPath`
- 🌸 **美竹兰 / Afterglow 主题皮肤**：切换到美竹兰主题后自动启用 `afterglow\` 全套素材——输入框/设置框/新会话框花边、侧栏四角饰、判定圈、星屑、favicon、标题栏 logo 与 `img_mitake-ran_1.webp` 立绘。素材由 `/bngd-ui/skin/afterglow/` 提供，`-Install` 会镜像到 `lib/skin/afterglow/`，未镜像时回退到 `cordis.patch.yml` 的 `skinAssetsPath`
- 🌹 **凑友希那 / Roselia 主题皮肤**：切换到凑友希那主题后自动启用 `roselia\` 全套素材——输入框/设置框/新会话框花边、侧栏四角饰、判定圈、星屑、favicon、标题栏 logo 与 `img_minato-yukina_1.webp` 立绘。素材由 `/bngd-ui/skin/roselia/` 提供，`-Install` 会镜像到 `lib/skin/roselia/`，未镜像时回退到 `cordis.patch.yml` 的 `skinAssetsPath`
- 🔊 **主题 BGM 与音量控制**：每位主唱主题内置对应歌曲（循环播放），面板内可开关音乐并调节音量（0–100%，默认 50%）；切到其他主题自动切换，浏览器拦截自动播放时点击页面任意处即可开始。曲目映射：
  户山香澄→Poppin'Party「RiNG A BELL」· 凑友希那→Roselia「LOUDER」· 美竹兰→Afterglow「燦々」·
  丸山彩→Pastel*Palettes「天下トーイツA to Z☆」· 弦卷心→Hello, Happy World!「サンバロハッピ〜！」·
  仓田真白→Morfonica「Wreath of Brave」· 和奏瑞依→RAISE A SUILEN「R·I·O·T」·
  高松灯→MyGO!!!!!「証命讃歌」· 三角初华→Ave Mujica「Imprisoned XII」
  BGM 文件存放在插件包 `lib/bgm/`，由 `/bngd-ui/bgm/<文件名>` 路由提供（支持 Range 请求）
- 🎵 右下角可拖拽控制面板（可收起为小球），设置页「🎵 BanG Dream UI」同步可配置
- 所有开关保存在浏览器 localStorage，重启不丢；首次使用默认户山香澄主题

## 安装（需要 PowerShell）

1. 把本文件夹解压到任意位置（例如 `D:\plugins`）；
2. 运行：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\plugins\bngd-ui.ps1" -Install
```

3. **完全关闭**正在运行的 DSH，再重新启动 `dsh web`；
4. 打开页面：右下角出现 🎵 可拖拽面板即成功。

查看状态：`powershell -ExecutionPolicy Bypass -File "D:\plugins\bngd-ui.ps1" -Status`

## 更新与换电脑继续维护

### 改动前先备份（必须）

每次准备修改插件（改样式、加背景、加功能、修 bug 等）之前，先对当前版本做完整备份：

```powershell
Compress-Archive -Path "F:\bangdreamUI\bngd-ui-plugin-v1.7.0" -DestinationPath "F:\bangdreamUI\bngd-ui-plugin-v1.7.0-backup.zip"
```

命名规则：`bngd-ui-plugin-v<当前版本号>-backup.zip`

例如当前版本是 `1.7.0`，备份文件就是：

```
bngd-ui-plugin-v1.7.0-backup.zip
```

> 顺序固定：**先备份，再改动**。备份完成后再开始改代码；改完再按下面的小更新/大更新流程升版本并生成 share zip。

### 小更新 / 大更新

- **小更新**（修 bug、调样式、微调）：在插件根目录执行

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

1. 修改 `bngd-ui\package.json` 的 `version`；
2. 刷新 profile 的 `node_modules\@local\bngd-ui` 副本；
3. 生成 `bngd-ui-plugin-v<新版本号>-share.zip`，并清理旧的 `bngd-ui-plugin-v*-share.zip`。

### 脚本不会自动做的事（手动补两步）

1. **重命名源文件夹**：脚本不会自动改文件夹名。建议把 `bngd-ui-plugin-v1.7.0` 改成新版本号，例如 `bngd-ui-plugin-v1.7.1`，然后重新跑一次 `-Install`（不加 `-BumpPatch`），这样 share zip 内的根目录名也是新版本号。
2. **更新 profile 依赖路径**：如果 `%USERPROFILE%\.dsh\profiles\web\package.json` 里 `@local/bngd-ui` 还指向旧路径，需要手动改成新文件夹的绝对路径：

```json
"@local/bngd-ui": "link:F:/bangdreamUI/bngd-ui-plugin-v1.7.1/bngd-ui"
```

   改完后重启 DSH。

### 换电脑继续更新

1. 把整个 `bngd-ui-plugin-vX.Y.Z` 文件夹（或 `bngd-ui-plugin-vX.Y.Z-share.zip` 解压后的文件夹）拷到新电脑。
2. 新电脑上先启动过一次 `dsh web`，确保 `%USERPROFILE%\.dsh\profiles\web\package.json` 存在。
3. 在新电脑上执行：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\plugins\bngd-ui-plugin-vX.Y.Z\bngd-ui.ps1" -Install
```

4. 如果新电脑的 profile 里已经有过旧版本依赖，需要手动把 `@local/bngd-ui` 的 link 改成当前文件夹路径（脚本对已存在的依赖不会自动改路径）。
5. 完全重启 `dsh web` 后生效。

## 背景图

- **上传背景图**：面板或设置页里点「选择图片」，选中后自动启用并保存；之后按钮变为「更换图片」，旁边出现「恢复默认」。
- **默认背景图（可选）**：编辑 `bngd-ui\cordis.patch.yml`，把 `wallpaperPath` 改成你机器上的图片路径（用正斜杠）：

```yaml
wallpaperPath: 'D:/pictures/my-wallpaper.jpg'
```

改完重新运行 `-Install`（刷新插件副本），再重启 DSH。留空字符串 `''` 表示不提供默认背景图。
优先级：上传的图片 > 当前主题自带的乐队背景图 > `wallpaperPath` 默认图。

### 主题自带背景图

- Poppin'Party：`bangdream素材\poppin-party\户山香澄背景.png`
- Afterglow：`bangdream素材\afterglow\美竹兰背景.png`
- Roselia：`bangdream素材\roselia\友希那背景.png`
- Pastel*Palettes：`bangdream素材\pastel-palettes\丸山彩.png`
- Hello, Happy World!：`bangdream素材\hello-happy-world\弦卷心.png`
- Morfonica：`bangdream素材\morfonica\仓田真白.png`
- RAISE A SUILEN：`bangdream素材\raise-a-suilen\和奏瑞依.png`
- MyGO!!!!!：`bangdream素材\mygo\高松灯.png`

未上传自定义背景时，或点击「恢复默认」后，当前主题会自动显示对应背景；用户上传的图片始终优先。

每次运行 `-Install` 时，脚本都会把 `poppin-party`、`afterglow`、`roselia`、`pastel-palettes`、`hello-happy-world`、`morfonica`、`raise-a-suilen`、`mygo` 等乐队素材文件夹（包含各自默认背景图）镜像到 `bngd-ui\lib\skin\`，并自动更新分享包 `bngd-ui-plugin-v<当前版本号>-share.zip`（例如本次为 `bngd-ui-plugin-v1.7.0-share.zip`）。部署完成后插件是自包含的：即使删除 `bangdream素材` 文件夹，皮肤、立绘和默认背景也会从插件库 `lib/skin` 与 client 内嵌资源中加载；外部素材文件夹只是开发时便于实时替换的可选覆盖源。

## 户山香澄立绘

- 默认读取 `C:\Users\87090\Desktop\Deepseek\bangdream素材\poppin-party\img_toyama-kasumi_1.webp`。
- 运行 `-Install` 时脚本会把该图镜像进 `bngd-ui\lib\skin\poppin-party\img_toyama-kasumi_1.webp`；之后即使原素材移动，立绘仍由插件包提供。
- 若没有运行安装脚本镜像，或想换图，可编辑 `cordis.patch.yml` 的 `characterPath`（同样使用正斜杠），改完重新 `-Install` 并重启 DSH。

## 美竹兰 / Afterglow 皮肤素材

- 默认素材根目录为 `C:\Users\87090\Desktop\Deepseek\bangdream素材`，通过 `cordis.patch.yml` 的 `skinAssetsPath` 配置。
- 美竹兰主题会请求 `/bngd-ui/skin/afterglow/<文件>`，运行时优先读取 `lib/skin/afterglow/`，没有则回退到 `skinAssetsPath\afterglow\`。
- `-Install` 已加入自动镜像：会把 `bangdream素材\afterglow` 完整复制到 `bngd-ui\lib\skin\afterglow`。

## 卸载

```powershell
powershell -ExecutionPolicy Bypass -File "D:\plugins\bngd-ui.ps1" -Uninstall
```

然后重启 DSH。插件源码目录不会被删除，随时可以 `-Install` 装回。
上传的背景图数据保留在 `$DSH_HOME\storages\bngd-ui`，卸载插件后如需清理可手动删除该目录。

## 说明与限制

- 针对 DSH 0.1.0-rc.x 的 web profile（`profiles/web`）构建；DSH 升级后如失效，需要按新版本适配。
- 安装不依赖 npm/pnpm（脚本直接把插件复制进 profile 的 `node_modules`）。
- 开关保存在浏览器 localStorage（按访问地址区分）；换浏览器或隐身窗口会回到默认值。
- 也支持官方插件机制手动安装：`dsh plugin --profile web add <本文件夹路径>`（要求本机装有 pnpm）。
