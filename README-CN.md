# Obsidian Nuclei Converter

![GitHub release (latest by date)](https://img.shields.io/github/v/release/dringer123/TryYaml-plugin-for-obsidian)
![GitHub License](https://img.shields.io/github/license/dringer123/TryYaml-plugin-for-obsidian)

一款为 [Obsidian](https://obsidian.md) 设计的插件，旨在将 [Nuclei](https://github.com/projectdiscovery/nuclei) 的 YAML 模板批量转换为结构清晰、信息丰富的 Markdown 笔记。特别为网络安全专业人士、渗透测试人员和漏洞研究员打造，帮助您将分散的漏洞模板整合进强大的个人知识库中。

通过可选的 AI 功能（通义千问），本插件还能自动优化漏洞描述、翻译内容并生成专业的修复建议，极大地提升了模板的实用性和可读性。

---

## ✨ 功能特性

-   **批量转换**: 一键处理指定文件夹下的所有 Nuclei YAML 模板，自动生成对应的 Markdown 文件。
-   **结构化内容**: 智能解析 YAML 内容，将 `info`, `http`, `dns` 等模块格式化为易于阅读的 Markdown 格式。
-   **丰富的元数据**: 自动在笔记顶部生成一个包含作者、严重性等关键信息的元数据块。
-   **知识图谱关联**:
    -   自动链接到原始的 `.yaml` 模板文件。
    -   自动链接到其所在的父文件夹，方便在关系图谱中将同类漏洞聚合。
-   **🤖 AI 增强 (可选)**:
    -   **智能描述优化**: 利用通义千问大模型，将原始描述翻译并优化为更详尽、更专业的中文描述。
    -   **自动生成修复建议**: 根据漏洞信息，AI 会自动生成具体、可操作的修复方案。
-   **高度可定制**:
    -   自由选择要处理的目录。
    -   轻松开启或关闭 AI 功能。
    -   完全自定义向 AI 发出的 Prompt，以满足您的个性化需求。
-   **用户友好的界面**: 提供独立的侧边栏视图，包含清晰的操作按钮和实时的处理日志。

---

## 🚀 效果演示

*图片演示。*

![Image](https://github.com/user-attachments/assets/0c7921d8-f131-4ac1-97ad-d85c82fccbf9)

**生成的 Markdown 文件示例:**

```markdown
# Atlassian Confluence Path Traversal (CVE-2021-26085)

> [!NOTE] 元数据
> - **作者**: dwisiswant0
> - **严重程度**: high
> - **所属分类**: [[cves]]
> - **关联模板**: [[cves/CVE-2021-26085.yaml]]

## 漏洞描述
Atlassian Confluence 服务器在 7.12.2 之前的版本中存在一个路径穿越漏洞。未经身份验证的远程攻击者可利用此漏洞通过特制的 URI 访问 `/WEB-INF/web.xml` 文件，获取敏感配置信息，进而可能导致进一步的攻击。

## 修复建议
1. **立即升级**: 强烈建议将 Atlassian Confluence Server 及 Data Center 升级到 7.12.3 或更高版本以修复此漏洞。
2. **临时缓解**: 如果无法立即升级，可以应用 Atlassian 官方提供的临时补丁或遵循其缓解指南进行操作。
3. **访问控制**: 限制对 Confluence 实例的访问，仅允许受信任的 IP 地址访问，并使用 Web 应用防火墙（WAF）来过滤恶意请求。

## Http
```yaml
http:
  - method: GET
    path:
      - "{{BaseURL}}/s/{{rand_int(1,10000)}}{{rand_int(1,10000)}}/../../../../WEB-INF/web.xml"
    matchers:
      - type: word
        words:
          - <web-app
          - <display-name>Confluence</display-name>
        condition: and
        part: body
# ... 其他部分
```

---

## 📦 安装指南

### 从 Obsidian 插件市场安装 (推荐)

1.  打开 Obsidian 设置 > `Community plugins`。
2.  确保 `Restricted mode` 是 **关闭** 状态。
3.  点击 `Browse` 浏览社区插件。
4.  搜索 "Nuclei Converter"。
5.  点击 `Install` 安装插件。
6.  安装完成后，点击 `Enable` 启用插件。

### 手动安装

1.  从 [GitHub Releases](https://github.com/dringer123/TryYaml-plugin-for-obsidian/releases) 页面下载最新的 `main.js`, `styles.css`, `manifest.json` 文件。
2.  在你的 Obsidian 仓库中，进入 `.obsidian/plugins` 目录，(没有就创建；注意：每次选择obsidian的新仓库目录时，插件不会跟随过去，因为他们总是在一个仓库目录下的隐藏目录.obsidian/plugins)。
3.  创建一个新的文件夹，例如 `TryYaml-plugin`。
4.  将下载的三个文件复制到这个新创建的文件夹中。
5.  重启 Obsidian，然后在设置中启用 "TryYaml-plugin" 插件。

---

## ⚙️ 如何使用

1.  **准备模板**: 将你的 Nuclei YAML 模板文件放入 Obsidian 仓库的任意文件夹中（例如 `nuclei-templates/cves`）。
2.  **配置插件**:
    -   进入插件设置页面。
    -   （可选）如果你想使用 AI 功能，填入你的 **通义千问 API Key** 并 **启用 AI**。
3.  **打开转换器**:
    -   点击 Obsidian 左侧 Ribbon 栏的 ![图标](https://raw.githubusercontent.com/lucide-icons/lucide/master/icons/file-cog.svg) 图标。
    -   或使用命令面板 (Ctrl/Cmd + P) 搜索并执行 `TryYaml-plugin`。
4.  **开始处理**:
    -   在插件视图中，从下拉菜单选择包含 Nuclei 模板的 **处理目录**。
    -   点击 **“开始处理”** 按钮。
5.  **查看结果**:
    -   观察下方的日志区域以了解处理进度。
    -   处理完成后，新的 Markdown 笔记会生成在与原 YAML 文件相同的目录下。

---

## 🛠️ 设置详解

| 设置项                 | 描述                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **处理目录**           | 选择一个文件夹作为处理起点。插件将转换此文件夹及其所有子文件夹中的 `.yaml` 或 `.yml` 文件。                                                                            |
| **启用通义千问**       | 全局开关，用于启用或禁用所有 AI 相关的功能（描述优化、生成修复建议）。                                                                                                   |
| **通义千问 API Key**   | 你的阿里云通义千问 API Key。请前往[阿里云控制台](https://dashscope.console.aliyun.com/apiKey)获取。此 Key 仅存储在本地，不会上传。                                     |
| **AI 模型**            | 选择要使用的通义千问模型。默认为 `qwen-turbo`，你也可以根据需要选择其他兼容模型。                                                                                      |
| **AI Prompt**          | **(高级)** 自定义发送给 AI 的指令模板。你可以修改它来改变 AI 生成内容的风格、语言或侧重点。**必须** 包含 `{{name}}` 和 `{{description}}` 两个占位符。 |

### AI Prompt 示例 (默认)

```text
你是一个专业的网络安全专家。请分析以下 Nuclei 模板中的漏洞名和原始描述，并完成两个任务：
1. 将漏洞描述翻译成中文，如果原始描述不清不楚，请结合其漏洞名进行优化。
2. 根据漏洞信息，提供具体、可操作的修复建议。

漏洞名：
{{name}}

原始描述：
{{description}}

请严格按照以下 JSON 格式返回你的答案，不要添加任何额外的解释或文本：
{
  "description": "在这里填写你优化后的漏洞描述",
  "suggestion": "在这里填写你的修复建议"
}
```

---

## 🤝 贡献

欢迎任何形式的贡献！如果你有好的想法、发现了 Bug 或者想改进代码，请随时：

-   提交 [Issues](https://github.com/dringer123/TryYaml-plugin-for-obsidian/issues) 来报告问题或提出建议。
-   提交 [Pull Requests](https://github.com/dringer123/TryYaml-plugin-for-obsidian/pulls) 来贡献代码。

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 许可证。
