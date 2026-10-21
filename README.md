# 量小智：Vercel 部署版

本项目从原 Flask 项目转换而来，保留原聊天页面和两份知识库。仅 Node.js 标准库，无运行时第三方依赖。

## 部署

1. 在自己的 GitHub 账号下创建仓库并上传本文件夹内容（包括隐藏的 .gitignore）。不要上传 .env、日志、node_modules。
2. 用 GitHub 登录 Vercel，Add New → Project → 导入自己的仓库。
3. Framework Preset 选 Other，Root Directory 保持仓库根目录，构建命令 npm run build，输出目录 public。vercel.json 已配置。
4. 在 Environment Variables 添加 DEEPSEEK_API_KEY，值为你自己在 DeepSeek 平台创建的密钥。不要使用 VITE_、NEXT_PUBLIC_ 等公开前缀。可选 DEEPSEEK_MODEL，默认 deepseek-flash。
5. 点击 Deploy。访问项目 Production 域名，而不是每次生成的预览地址。项目域名由 Vercel 实际分配，不能保证名称可用或永久免费。
6. /api/health 返回 ok:true 表示接口可用；mode:deepseek 仅表示已设置密钥，仍须真实提问验证模型调用。

Vercel Hobby 仅限符合其条款的个人非商业用途，有免费额度限制；DeepSeek 单独计费。中国大陆网络可达性须由实际使用网络验证。

## 日常更新与协作

编辑 knowledge/ 中的 .txt，或 role_prompt.txt，再提交至生产分支。GitHub 联动部署成功后生效。构建会重建 lib/knowledge.mjs，无需手动修改生成文件。

GitHub 仓库 Settings → Collaborators 可邀请合作者。/api/knowledge 会公开全部知识库文字，公开仓库同样可被任何人读取；仅放允许公开的资料。合作者改代码会影响上线行为，只授权给可信的人。是否能自动部署合作者的提交，以 Vercel 当前 Git 集成和账号方案规则为准；如被拦截，可由仓库所有者审核合并后触发。

## 本地验证

安装 Node.js 24 后运行：

```powershell
npm run build
npm test
npm run dev
```

浏览器访问 http://127.0.0.1:3000。未设置密钥时返回相关资料原文；配置环境变量后调用 DeepSeek。本地预览脚本不自动读取 .env。

## 限流与拒答说明

每个函数实例内按客户端地址限制每分钟 10 次；重启和多实例会重置或分散计数，不能当作全站费用保护。正式公开时应增加共享限流或平台防火墙，配合模型服务的额度控制。

拒答和知识库约束通过服务端提示词实施，模型仍可能出错，无法保证抵御所有提示词攻击。离线模式仅检索并返回资料原文，不是离线大模型。没有配置密钥时只用离线模式；模型调用失败不会伪装成模型成功。

## 可选 CLI

已经使用 GitHub 导入时无需 CLI。若要按教程安装，可在已安装 Node.js/npm 的 PowerShell 中执行：

```powershell
npm install --save-dev vercel --registry=https://registry.npmmirror.com
npx vercel login
npx vercel link
npx vercel env add DEEPSEEK_API_KEY production
npx vercel --prod
```

密钥在交互提示中输入，不要放在命令行参数或聊天消息中。CLI 安装镜像不改变 Vercel 服务的网络可达性。
