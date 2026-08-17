# BanG Dream! 风格 UI 插件（bngd-ui）

给 DeepSeek Harness 的 Web 界面（web profile）换上的邦邦风格皮肤：

- 🎨 **主题选择母菜单**：9 个角色主题作为子选项（单选，再点当前项可关闭主题）：
  户山香澄 #FF5522 · 凑友希那 #881188 · 美竹兰 #EE0022 · 丸山彩 #FF88BB · 弦卷心 #E8C400 ·
  仓田真白 #6677CC · 和奏瑞依 #CC0000 · 高松灯 #77BBDD · 三角初华 #BB9955
- 🖼️ **自由选择背景图**：「背景图片」文字右侧的「选择图片」按钮上传任意 jpeg/png/webp/gif；
  上传的图片会复制保存到本机 DSH 存储（`$DSH_HOME/storages/bngd-ui`），**即使原文件被删除，重启后背景依然生效**；
  「恢复默认」可清除上传的图片
- 🎶 悦动队标动效（独立开关）：8 个乐队队标统一 26px，沿袭音符粒子自下而上的漂浮动画
- ✨ **乐队皮肤装饰层**：Poppin'Party 全套装饰已内置——输入框镂空花边、设置按钮框、侧栏四角星饰、星屑闪光、发送键判定圈旋转、favicon 与标题栏 logo、新建会话按钮花边（深鲸布局：边框贴紧按钮边缘）、对话框主题描边；切主题自动切换对应乐队素材（未提供素材的乐队回退到 common，素材内嵌于 client bundle）。添加新乐队素材后重新注入即可
- 💎 **邦邦细节层**：窄侧栏时所有图标按钮统一为当前乐队应援色的圆形徽章；宽侧栏的工作区选中项显示渐变飘带与扫光动画；会话列表带彩色时间轴与运行中宝石呼吸灯；主界面鱼形 logo 会被主题色光环托起，输入框在“新对话 → 进入会话”时带 dock/rise 入场动画，侧栏立绘保持轻微浮动
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


## 背景图

- **上传背景图**：面板或设置页里点「选择图片」，选中后自动启用并保存；之后按钮变为「更换图片」，旁边出现「恢复默认」。
- **默认背景图（可选）**：编辑 `bngd-ui\cordis.patch.yml`，把 `wallpaperPath` 改成你机器上的图片路径（用正斜杠）：

```yaml
wallpaperPath: 'D:/pictures/my-wallpaper.jpg'
```

改完重新运行 `-Install`（刷新插件副本），再重启 DSH。留空字符串 `''` 表示不提供默认背景图。
优先级：上传的图片 > 当前主题自带的乐队背景图 > `wallpaperPath` 默认图。



## 说明与限制

- 针对 DSH 0.1.0-rc.x 的 web profile（`profiles/web`）构建；DSH 升级后如失效，需要按新版本适配。
- 安装不依赖 npm/pnpm（脚本直接把插件复制进 profile 的 `node_modules`）。
- 开关保存在浏览器 localStorage（按访问地址区分）；换浏览器或隐身窗口会回到默认值。
- 也支持官方插件机制手动安装：`dsh plugin --profile web add <本文件夹路径>`（要求本机装有 pnpm）。
