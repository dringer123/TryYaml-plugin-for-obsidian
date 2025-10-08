// 在顶部 import 语句中加入 requestUrl
import { ItemView, WorkspaceLeaf, Notice, Setting, TFile, TFolder, ButtonComponent, ToggleComponent, DropdownComponent, requestUrl } from 'obsidian';
import * as yaml from 'js-yaml';
import MyPlugin from './main';

export const NUCLEI_CONVERTER_VIEW_TYPE = 'nuclei-converter-view';

// 定义AI返回的结构类型
interface AIEnrichment {
    description: string;
    suggestion: string;
}

export class NucleiConverterView extends ItemView {
    plugin: MyPlugin;
    private logsContainer: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return NUCLEI_CONVERTER_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Nuclei 模板转换器';
    }

    getIcon() {
        return 'file-cog';
    }

    async onOpen() {
        const container = this.contentEl;
        container.empty();
        container.createEl('h3', { text: 'Nuclei 模板转换' });

        // 路径选择
        new Setting(container)
            .setName('处理目录')
            .setDesc('选择要处理 Nuclei 模板的文件夹。')
            .addDropdown((dropdown: DropdownComponent) => {
                const files = this.app.vault.getAllLoadedFiles();
                const folders = files.filter(
                    (file): file is TFolder => file instanceof TFolder && file.path !== '.obsidian'
                );
                dropdown.addOption('/', '/ (仓库根目录)');
                folders.forEach(folder => {
                    if (folder.path !== '/') {
                        dropdown.addOption(folder.path, folder.path);
                    }
                });
                dropdown.setValue(this.plugin.settings.processingPath);
                dropdown.onChange(async (value) => {
                    this.plugin.settings.processingPath = value;
                    await this.plugin.saveSettings();
                    new Notice(`处理目录已更新为: ${value}`);
                });
            });
        
        // AI 开关
        new Setting(container)
            .setName('启用通义千问')
            .setDesc('开启后，将使用AI优化描述并生成修复建议。')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.aiEnabled)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.aiEnabled = value;
                        await this.plugin.saveSettings();
                        new Notice(`通义千问已${value ? '开启' : '关闭'}`);
                    });
            });

        // 开始处理按钮
        const startButton = container.createEl('button', { text: '开始处理', cls: 'mod-cta' });
        startButton.onclick = () => this.processFiles();

        // 日志区域
        container.createEl('h4', { text: '处理日志' });
        this.logsContainer = container.createEl('div', { cls: 'logs-container' });
    }

    private log(message: string) {
        this.logsContainer.createEl('div', { text: message });
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }

    private async processFiles() {
        this.logsContainer.empty();
        this.log('🚀 开始处理...');

        const path = this.plugin.settings.processingPath;
        const filesInVault = this.app.vault.getFiles();
        const yamlFiles = filesInVault.filter(file => 
            (path === '/' ? true : file.path.startsWith(path + '/')) && 
            (file.extension === 'yaml' || file.extension === 'yml')
        );

        if (yamlFiles.length === 0) {
            this.log(`❌ 在目录 "${path}" 下没有找到任何 YAML 文件。`);
            return;
        }

        this.log(`🔍 发现 ${yamlFiles.length} 个 YAML 文件。`);

        for (const file of yamlFiles) {
            try {
                const content = await this.app.vault.read(file);
                const data = yaml.load(content) as any;

                if (!data || !data.info || !data.info.name) {
                    this.log(`⚠️ 跳过文件 ${file.name}：缺少 info.name 字段。`);
                    continue;
                }

                let mdContent = await this.buildMarkdownContent(data, file);
                
                const safeFileName = data.info.name.replace(/[\\/:"*?<>|]+/g, '-') + '.md';
                const mdFilePath = file.parent ? (file.parent.path === '/' ? safeFileName : `${file.parent.path}/${safeFileName}`) : safeFileName;

                const existingFile = this.app.vault.getAbstractFileByPath(mdFilePath);
                if (existingFile instanceof TFile) {
                    this.log(`🔄 更新文件：${mdFilePath}`);
                    await this.app.vault.modify(existingFile, mdContent);
                } else if (existingFile) {
                    this.log(`❌ 路径 ${mdFilePath} 已被一个文件夹占用。`);
                } else {
                    this.log(`✅ 创建文件：${mdFilePath}`);
                    await this.app.vault.create(mdFilePath, mdContent);
                }

            } catch (error) {
                this.log(`❌ 处理文件 ${file.name} 时出错: ${error.message}`);
                console.error(error);
            }
        }
        this.log('🎉 全部处理完成！');
    }

    private async buildMarkdownContent(data: any, file: TFile): Promise<string> {
        const { info, ...otherBlocks } = data;
        const { name, author, severity, description, ...otherInfo } = info;
    
        const parentFolderLink = file.parent && file.parent.path !== '/' ? `> - **所属分类**: [[${file.parent.path}]]\n` : '';

        let md = `# ${name}\n\n`;
        md += `> [!NOTE] 元数据\n`;
        md += `> - **作者**: ${author || 'N/A'}\n`;
        md += `> - **严重程度**: ${severity || 'N/A'}\n`;
        md += parentFolderLink;
        md += `> - **关联模板**: [[${file.path}]]\n\n`;
    
        let originalDescription = description || '无描述信息。';
        let fixSuggestion = '';

        if (this.plugin.settings.aiEnabled && this.plugin.settings.aiApiKey) {
            try {
                this.log(`🤖 正在为 "${name}" 调用 AI...`);
                const aiResult = await this.getAIEnrichment(name, originalDescription);
                originalDescription = aiResult.description;
                fixSuggestion = aiResult.suggestion;
            } catch (e) {
                this.log(`🤖 AI 调用失败: ${e.message}，将使用原始描述。`);
            }
        }

        md += `## 漏洞描述\n`;
        md += `${originalDescription}\n\n`;

        if (fixSuggestion) {
            md += `## 修复建议\n`;
            md += `${fixSuggestion}\n\n`;
        }
        
        // 【已修改】还原为通用处理方式，不再特殊处理 http 块
        for (const blockName in otherBlocks) {
            md += `## ${blockName.charAt(0).toUpperCase() + blockName.slice(1)}\n`;
            md += "```yaml\n";
            // 使用 { [blockName]: ... } 来保留顶层键
            md += yaml.dump({ [blockName]: otherBlocks[blockName] });
            md += "```\n\n";
        }
        
        if (Object.keys(otherInfo).length > 0) {
            md += `## 其他信息\n`;
            md += "```yaml\n";
            md += yaml.dump(otherInfo);
            md += "```\n\n";
        }
    
        return md;
    }

    // 【已修改】使用 Obsidian 的 requestUrl 替换 fetch
    private async getAIEnrichment(description: string): Promise<AIEnrichment> {
        const { aiApiKey, aiModel, aiPrompt } = this.plugin.settings;
        if (!aiApiKey) throw new Error('未设置通义千问 API Key');
    
        const prompt = aiPrompt
            .replace('{{name}}', name)
            .replace('{{description}}', description);
    
        try {
            const response = await requestUrl({
                url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${aiApiKey}`
                },
                contentType: 'application/json',
                body: JSON.stringify({
                    model: aiModel,
                    input: {
                        prompt: prompt
                    }
                }),
                throw: false // 设置为 false，这样即使API返回4xx/5xx错误，也不会抛出异常，而是返回response对象
            });

            // 检查HTTP状态码
            if (response.status >= 400) {
                const errorData = response.json || { message: `HTTP Error ${response.status}` };
                throw new Error(`API 请求失败: ${errorData.message || '未知错误'}`);
            }
    
            const result = response.json;
            let textOutput = result.output.text;

            // 尝试解析AI返回的JSON
            const jsonMatch = textOutput.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                textOutput = jsonMatch[1];
            }
            const parsed = JSON.parse(textOutput) as AIEnrichment;
            
            if (parsed.description && parsed.suggestion) {
                return parsed;
            } else {
                throw new Error("AI 返回的 JSON 格式不完整。");
            }
        } catch(e) {
            // 捕获网络错误或解析错误
            console.error("AI Enrichment 失败:", e);
            // 重新抛出更友好的错误信息
            throw new Error(e.message || "AI 请求或解析时发生未知错误。");
        }
    }    
}
