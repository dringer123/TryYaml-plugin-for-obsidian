import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main'; // 导入主插件类

// 定义插件设置的接口
export interface NucleiConverterSettings {
    processingPath: string;
    aiEnabled: boolean;
    aiApiKey: string;
    aiModel: string;
    aiPrompt: string;
}

// 默认设置
export const DEFAULT_SETTINGS: NucleiConverterSettings = {
    processingPath: '/',
    aiEnabled: false,
    aiApiKey: '',
    aiModel: 'qwen-turbo',
    // 在这里更新为新的默认 Prompt
    aiPrompt: 
`你是一个专业的网络安全专家。请分析以下 Nuclei 模板中的漏洞名和原始描述，并完成两个任务：
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
}`
};
// 设置页面
// 设置面板的UI实现
export class NucleiSettingTab extends PluginSettingTab {
    plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Nuclei 模板转换设置' });

        new Setting(containerEl)
            .setName('通义千问 API Key')
            .setDesc('从阿里云获取的 API Key，用于调用AI服务。')
            .addText(text => text
                .setPlaceholder('sk-xxxxxxxx')
                .setValue(this.plugin.settings.aiApiKey)
                .onChange(async (value) => {
                    this.plugin.settings.aiApiKey = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('AI 模型')
            .setDesc('选择要使用的通义千问模型。')
            .addText(text => text
                .setPlaceholder('例如: qwen-turbo')
                .setValue(this.plugin.settings.aiModel)
                .onChange(async (value) => {
                    this.plugin.settings.aiModel = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('自定义 AI 提示词 (Prompt)')
            .setDesc('定义发送给AI的指令。使用 {{description}} 和{{name}}作为占位符代表原始漏洞描述和名称。')
            .addTextArea(text => text
                .setPlaceholder(DEFAULT_SETTINGS.aiPrompt)
                .setValue(this.plugin.settings.aiPrompt)
                .onChange(async (value) => {
                    this.plugin.settings.aiPrompt = value;
                    await this.plugin.saveSettings();
                })
                .inputEl.rows = 6); // 让输入框大一点
    }
}
