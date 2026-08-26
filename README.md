# iCRM Personal

一款面向个人使用的轻量级客户关系管理系统。项目采用本地优先设计，客户、部门和公司数据保存在浏览器中，无需后端服务即可运行。

在线体验：[https://crmv2-xi.vercel.app/](https://crmv2-xi.vercel.app/)

## 主要功能

- 多公司管理，不同公司的客户和部门数据相互隔离
- 客户信息管理：姓名、电话、邮箱、职务、部门、直属上级、籍贯、合作状态、爱好、家庭情况、备注和照片
- 按姓名、部门或职务搜索客户
- 创建部门及上下级关系
- 横向组织关系图，支持缩放、拖动以及按部门筛选
- Excel 批量导入、更新和导出
- 删除公司前可选择导出该公司的客户数据
- 移动端友好的界面和滑动删除操作
- PWA 配置，可作为独立应用安装

## 技术栈

- React 18 + TypeScript
- Vite
- Tailwind CSS
- D3.js
- SheetJS（xlsx）
- Vitest + Testing Library
- Capacitor（iOS 集成基础）

## 快速开始

环境要求：Node.js 18 或更高版本，推荐使用当前 LTS 版本。

```bash
git clone https://github.com/dongjun-dj/CRMv2.git
cd CRMv2
npm install
npm run dev
```

启动后，根据终端显示的地址在浏览器中访问应用。项目当前不依赖 API Key 或后端环境变量。

## Excel 导入与导出

进入某个公司后，点击顶部的导入/导出按钮即可操作当前公司的数据。

Excel 第一行应使用以下列名：

| 列名 | 必填 | 说明 |
| --- | --- | --- |
| 姓名 | 是 | 作为导入时匹配和更新客户的依据 |
| 电话 | 否 | 建议在 Excel 中设置为文本，避免丢失前导零 |
| 邮箱 | 否 | 客户邮箱 |
| 部门 | 否 | 部门不存在时自动创建 |
| 职务 | 否 | 客户职务 |
| 直属上级 | 否 | 按姓名关联；不存在时自动创建上级记录 |
| 籍贯 | 否 | 推荐格式：`省-市-区` |
| 合作状态 | 否 | `-2` 中止、`-1` 潜在、`0` 初步、`1` 深入、`2` 深度 |
| 爱好 | 否 | 自由文本 |
| 家庭情况 | 否 | 自由文本 |
| 备注 | 否 | 自由文本 |

导入规则：

- 仅更新当前公司，不会覆盖其他公司的客户和部门。
- 同一公司内按“姓名”匹配已有客户；重名客户会被视为同一条记录。
- 导入不会包含或覆盖客户照片。
- 推荐先在空公司中执行一次导出，获得可直接填写的模板。

## 数据存储与备份

应用使用浏览器 `localStorage` 保存数据，数据不会自动上传到服务器。因此需要注意：

- 同一网址在不同浏览器、设备或浏览器用户配置中拥有各自独立的数据。
- 清理站点数据、使用无痕窗口或更换域名可能导致无法访问原有数据。
- 重要数据请定期使用 Excel 导出功能备份。
- 删除公司时会同时删除该公司下的客户和部门；建议保留“删除时同步导出”选项。

## 常用命令

```bash
# 启动开发环境
npm run dev

# 运行全部测试
npm run test:run

# 监听文件变化运行测试
npm test

# 创建生产构建
npm run build

# 本地预览生产构建
npm run preview

# 发布 dist 到 gh-pages 分支
npm run deploy
```

## 测试

当前测试覆盖：

- 多公司连续 Excel 导入的数据隔离
- 客户删除和公司删除
- 删除公司时导出备份
- Excel 导出及异常处理
- 横向组织关系图的节点和连线布局

提交代码前建议运行：

```bash
npm run test:run
npm run build
```

## 项目结构

```text
CRMv2/
├── components/          # 组织关系图、客户卡片和图标组件
├── data/                # 地区数据
├── services/            # 本地存储和 Excel 服务
├── tests/               # 自动化测试
├── App.tsx              # 页面和主要业务流程
├── types.ts             # TypeScript 数据类型
├── manifest.json        # PWA 配置
└── vite.config.ts       # 构建配置
```

## 部署

### Vercel

1. 在 Vercel 中导入本仓库。
2. Framework Preset 选择 Vite（通常会自动识别）。
3. Build Command 使用 `npm run build`。
4. Output Directory 使用 `dist`。
5. 部署完成后，推送到 Vercel 绑定的分支即可触发自动部署。

### GitHub Pages

仓库也保留了 GitHub Pages 发布脚本：

```bash
npm run deploy
```

该命令会先构建项目，再把 `dist` 发布到 `gh-pages` 分支。

## 许可

当前仓库尚未声明开源许可证。如需分发、修改或用于商业项目，请先联系仓库所有者确认授权。
