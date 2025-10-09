import { Plugin } from 'obsidian';
import { NucleiConverterSettings, DEFAULT_SETTINGS, NucleiSettingTab } from './settings';
import { NucleiConverterView, NUCLEI_CONVERTER_VIEW_TYPE } from './view';

// 【修改2】将 MyPlugin 重命名为 NucleiConverterPlugin
export default class NucleiConverterPlugin extends Plugin {
    settings: NucleiConverterSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(
            NUCLEI_CONVERTER_VIEW_TYPE,
            (leaf) => new NucleiConverterView(leaf, this)
        );

        this.addRibbonIcon('file-cog', 'Nuclei 转换器', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-nuclei-converter-view',
            name: '打开 Nuclei 模板转换器',
            callback: () => {
                this.activateView();
            },
        });

        this.addSettingTab(new NucleiSettingTab(this.app, this));

        console.log('Nuclei Converter Plugin loaded.');
    }

    // 【修改3】移除了 detachLeavesOfType 的调用
    onunload() {
        console.log('Nuclei Converter Plugin unloaded.');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async activateView() {
        const existingLeaves = this.app.workspace.getLeavesOfType(NUCLEI_CONVERTER_VIEW_TYPE);
        if (existingLeaves.length > 0) {
            this.app.workspace.revealLeaf(existingLeaves[0]);
            return;
        }

        const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: NUCLEI_CONVERTER_VIEW_TYPE,
				active: true,
			});
		}
    }
}
