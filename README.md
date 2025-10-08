[简体中文](./README-CN.md)

# Obsidian NucleiYaml Plugin : Try-Yaml-To-Md

![GitHub release (latest by date)](https://img.shields.io/github/v/release/dringer123/TryYaml-plugin-for-obsidian)
![GitHub License](https://img.shields.io/github/license/dringer123/TryYaml-plugin-for-obsidian)

A plugin for [Obsidian](https://obsidian.md) designed to batch convert [Nuclei](https://github.com/projectdiscovery/nuclei) YAML templates into well-structured, information-rich Markdown notes. Tailored for cybersecurity professionals, penetration testers, and vulnerability researchers, it helps you integrate scattered vulnerability templates into your powerful personal knowledge base.

With an optional AI feature (powered by Tongyi Qianwen), this plugin can also automatically refine vulnerability descriptions, translate content, and generate professional remediation suggestions, greatly enhancing the usability and readability of your templates.

---

## ✨ Features

-   **Batch Conversion**: Process all Nuclei YAML templates within a specified folder with a single click, automatically generating corresponding Markdown files.
-   **Structured Content**: Intelligently parses YAML content, formatting modules like `info`, `http`, and `dns` into easy-to-read Markdown.
-   **Rich Metadata**: Automatically generates a metadata block at the top of each note, including key information like author, severity, and more.
-   **Knowledge Graph Linking**:
    -   Automatically links to the original `.yaml` template file.
    -   Automatically links to the parent folder, helping to cluster similar vulnerabilities in the graph view.
-   **🤖 AI Enhancement (Optional)**:
    -   **AI-Powered Description Optimization**: Leverages the Tongyi Qianwen large language model to translate and enhance original descriptions into more detailed and professional summaries.
    -   **Automatic Remediation Suggestions**: Generates concrete, actionable remediation steps based on the vulnerability information.
-   **Highly Customizable**:
    -   Freely choose the directory to process.
    -   Easily enable or disable AI features.
    -   Fully customize the prompt sent to the AI to meet your specific needs.
-   **User-Friendly Interface**: Provides a dedicated sidebar view with clear action buttons and a real-time processing log.

---

## 🚀 Demo

*Image demonstration.*

![Image](https://github.com/user-attachments/assets/0c7921d8-f131-4ac1-97ad-d85c82fccbf9)

**Example of a Generated Markdown File:**

```markdown
# Atlassian Confluence Path Traversal (CVE-2021-26085)

> [!NOTE] Metadata
> - **Author**: dwisiswant0
> - **Severity**: high
> - **Category**: [[cves]]
> - **Related Template**: [[cves/CVE-2021-26085.yaml]]

## Vulnerability Description
A path traversal vulnerability exists in Atlassian Confluence Server versions prior to 7.12.2. A remote, unauthenticated attacker can exploit this vulnerability by sending a specially crafted URI to access the `/WEB-INF/web.xml` file, which may lead to the disclosure of sensitive configuration information and potential further attacks.

## Remediation Suggestions
1.  **Upgrade Immediately**: It is strongly recommended to upgrade Atlassian Confluence Server and Data Center to version 7.12.3 or later to fix this vulnerability.
2.  **Temporary Mitigation**: If an immediate upgrade is not possible, apply the official temporary patch provided by Atlassian or follow their mitigation guidelines.
3.  **Access Control**: Restrict access to the Confluence instance to trusted IP addresses only and use a Web Application Firewall (WAF) to filter malicious requests.

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
# ... other sections
```

---

## 📦 Installation Guide

### From Obsidian Community Plugins (Recommended)

1.  Open Obsidian `Settings` > `Community plugins`.
2.  Make sure `Restricted mode` is **off**.
3.  Click `Browse` to search for community plugins.
4.  Search for "try-yaml-to-md".
5.  Click `Install` to install the plugin.
6.  Once installed, click `Enable` to activate it.

### Manual Installation

1.  Download the latest `main.js`, `styles.css`, and `manifest.json` from the [GitHub Releases](https://github.com/dringer123/TryYaml-plugin-for-obsidian/releases) page.
2.  In your Obsidian vault, navigate to the `.obsidian/plugins` directory. (If it doesn't exist, create it. Note: plugins are specific to a vault and are stored in the hidden `.obsidian/plugins` directory within that vault's root).
3.  Create a new folder, for example, `TryYaml-plugin`.
4.  Copy the three downloaded files into this newly created folder.
5.  Restart Obsidian and then enable the "TryYaml-plugin" in the settings.

---

## ⚙️ How to Use

1.  **Prepare Your Templates**: Place your Nuclei YAML template files into any folder within your Obsidian vault (e.g., `nuclei-templates/cves`).
2.  **Configure the Plugin**:
    -   Go to the plugin's settings page.
    -   (Optional) If you want to use the AI features, enter your **Tongyi Qianwen API Key** and **enable AI**.
3.  **Open the Converter**:
    -   Click the icon (![icon](https://raw.githubusercontent.com/lucide-icons/lucide/master/icons/file-cog.svg)) in the left ribbon bar.
    -   Or, use the Command Palette (Ctrl/Cmd + P), search for, and run `TryYaml-plugin`.
4.  **Start Processing**:
    -   In the plugin view, select the **Directory to Process** from the dropdown menu. This should be the folder containing your Nuclei templates.
    -   Click the **"Start Processing"** button.
5.  **Check the Results**:
    -   Monitor the log area below to track the progress.
    -   Once finished, new Markdown notes will be generated in the same directory as their original YAML files.

---

## 🛠️ Settings Explained

| Setting                  | Description                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Directory to Process** | Select a folder as the starting point. The plugin will convert `.yaml` or `.yml` files in this folder and all its subfolders.                                                   |
| **Enable Tongyi Qianwen**| A global switch to enable or disable all AI-related features (description optimization, remediation suggestion generation).                                                        |
| **Tongyi Qianwen API Key** | Your API key for Alibaba Cloud's Tongyi Qianwen. You can get one from the [Alibaba Cloud Console](https://dashscope.console.aliyun.com/apiKey). This key is stored locally and is never uploaded. |
| **AI Model**             | Choose the Tongyi Qianwen model to use. Defaults to `qwen-turbo`, but you can select other compatible models as needed.                                                       |
| **AI Prompt**            | **(Advanced)** Customize the instruction template sent to the AI. You can modify this to change the style, language, or focus of the generated content. **Must** include the `{{name}}` and `{{description}}` placeholders. |

### Example AI Prompt (Default - Translated for clarity)

```text
You are a professional cybersecurity expert. Please analyze the vulnerability name and original description from the following Nuclei template and complete two tasks:
1. Translate the vulnerability description into clear English. If the original description is vague, please enhance it based on the vulnerability's name.
2. Provide specific, actionable remediation suggestions based on the vulnerability information.

Vulnerability Name:
{{name}}

Original Description:
{{description}}

Please return your answer strictly in the following JSON format, without any extra explanations or text:
{
  "description": "Your refined vulnerability description here",
  "suggestion": "Your remediation suggestions here"
}
```

---

## 🤝 Contributing

Contributions of any kind are welcome! If you have great ideas, find a bug, or want to improve the code, feel free to:

-   Open an [Issue](https://github.com/dringer123/TryYaml-plugin-for-obsidian/issues) to report problems or suggest features.
-   Submit a [Pull Request](https://github.com/dringer123/TryYaml-plugin-for-obsidian/pulls) to contribute code.

## 🤝  AAAAA NNNNNN  DDDD
-   If You Like This Plugin ! Please donate any amount of money to me, Wechat:
-   ![image](https://github.com/user-attachments/assets/3321a0a2-2d1d-4a12-9601-0f5c5acb988c)


## 📄 License

This project is licensed under the [MIT License](./LICENSE).
