import { Plugin } from 'obsidian';
import { NucleiConverterSettings, DEFAULT_SETTINGS, NucleiSettingTab } from './settings';
import { NucleiConverterView, NUCLEI_CONVERTER_VIEW_TYPE } from './view';

export default class MyPlugin extends Plugin {
    settings: NucleiConverterSettings;

    async onload() {
        await this.loadSettings();

        // 注册我们的自定义视图
        this.registerView(
            NUCLEI_CONVERTER_VIEW_TYPE,
            (leaf) => new NucleiConverterView(leaf, this)
        );

        // 添加一个Ribbon图标，点击后打开我们的视图
        this.addRibbonIcon('file-cog', 'Nuclei 转换器', () => {
            this.activateView();
        });

        // 添加一个命令，也可以用来打开视图
        this.addCommand({
            id: 'open-nuclei-converter-view',
            name: '打开 Nuclei 模板转换器',
            callback: () => {
                this.activateView();
            },
        });

        // 添加设置页面
        this.addSettingTab(new NucleiSettingTab(this.app, this));

        console.log('Nuclei Converter Plugin loaded.');
    }

    onunload() {
        // 卸载视图
        this.app.workspace.detachLeavesOfType(NUCLEI_CONVERTER_VIEW_TYPE);
        console.log('Nuclei Converter Plugin unloaded.');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // 激活并显示我们的视图
    async activateView() {
        // 如果视图已经存在，则直接激活
        const existingLeaves = this.app.workspace.getLeavesOfType(NUCLEI_CONVERTER_VIEW_TYPE);
        if (existingLeaves.length > 0) {
            this.app.workspace.revealLeaf(existingLeaves[0]);
            return;
        }

        // 否则在右侧边栏新建一个
        const leaf = this.app.workspace.getRightLeaf(false);
		if (leaf) {
			await leaf.setViewState({
				type: NUCLEI_CONVERTER_VIEW_TYPE,
				active: true,
			});
		}
    }
}
