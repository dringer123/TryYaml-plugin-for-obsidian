import { ItemView, WorkspaceLeaf, Notice, Setting, TFile, TFolder, DropdownComponent, requestUrl, ToggleComponent } from 'obsidian';
import * as yaml from 'js-yaml';
// 【修改2】导入重命名后的主插件类
import NucleiConverterPlugin from './main';

export const NUCLEI_CONVERTER_VIEW_TYPE = 'nuclei-converter-view';

interface AIEnrichment {
    description: string;
    suggestion: string;
}

export class NucleiConverterView extends ItemView {
    // 【修改2】更新类型定义
    plugin: NucleiConverterPlugin;
    private logsContainer: HTMLElement;

    constructor(leaf: WorkspaceLeaf, plugin: NucleiConverterPlugin) {
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

        new Setting(container)
            .setName('处理目录')
            .setDesc('选择要处理 Nuclei 模板的文件夹。')
            .addDropdown((dropdown: DropdownComponent) => {
                const files = this.app.vault.getAllLoadedFiles();
                // 【修改1】使用 this.app.vault.configDir 替换硬编码的 '.obsidian'
                const configDir = this.app.vault.configDir; 
                const folders = files.filter(
                    (file): file is TFolder => file instanceof TFolder && file.path !== configDir
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

        const startButton = container.createEl('button', { text: '开始处理', cls: 'mod-cta' });
        startButton.onclick = () => this.processFiles();

        container.createEl('h4', { text: '处理日志' });
        this.logsContainer = container.createEl('div', { cls: 'logs-container' });
    }

    // ... (后面的代码无需更改)
    
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
                // !!重要!! 之前这里有一个bug, getAIEnrichment 的第一个参数应该是 name, 第二个是 description
                // private async getAIEnrichment(name: string, description: string): Promise<AIEnrichment>
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
        for (const blockName in otherBlocks) {
            md += `## ${blockName.charAt(0).toUpperCase() + blockName.slice(1)}\n`;
            md += "```yaml\n";
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

    // 修复了之前的一个小bug: getAIEnrichment 的第一个参数应该是 name
    private async getAIEnrichment(name: string, description: string): Promise<AIEnrichment> {
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
                throw: false
            });
            if (response.status >= 400) {
                const errorData = response.json || { message: `HTTP Error ${response.status}` };
                throw new Error(`API 请求失败: ${errorData.message || '未知错误'}`);
            }
            const result = response.json;
            let textOutput = result.output.text;
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
            console.error("AI Enrichment 失败:", e);
            throw new Error(e.message || "AI 请求或解析时发生未知错误。");
        }
    }    
}
