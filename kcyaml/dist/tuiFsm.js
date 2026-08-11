export class TuiFsmEngine {
    state = 'INPUT_SOURCE';
    context = {
        inputSource: 'clipboard',
        selectedFleets: [1],
        selectedAir: [],
        isRengo: false,
        isExactMas: false,
        isImage: false,
        imageTheme: 'official',
        isSaveFile: false,
    };
    getState() {
        return this.state;
    }
    transitionTo(nextState) {
        this.state = nextState;
    }
    /**
     * ターゲット選択状態から、モード分岐状態（AIR_ONLY vs FLEET_INCLUDED）を自動評価して遷移する
     */
    evaluateTargetBranch() {
        if (this.context.selectedFleets.length === 0 && this.context.selectedAir.length > 0) {
            // 基地航空隊のみの場合
            this.context.isRengo = false;
            this.context.isImage = false;
            this.transitionTo('AIR_ONLY');
            return 'AIR_ONLY';
        }
        else {
            // 艦隊を含む場合
            this.transitionTo('FLEET_INCLUDED');
            return 'FLEET_INCLUDED';
        }
    }
    /**
     * コンテキストから CliOptions オブジェクトを構築する
     */
    buildCliOptions(defaultTheme, defaultDialogEnabled) {
        return {
            fleet: this.context.selectedFleets.length > 0 ? this.context.selectedFleets : undefined,
            air: this.context.selectedAir.length > 0 ? this.context.selectedAir : undefined,
            input: this.context.inputFilePath || undefined,
            output: this.context.isSaveFile ? true : undefined,
            image: Boolean(this.context.isImage),
            imageTheme: this.context.imageTheme || defaultTheme,
            noDialog: !defaultDialogEnabled,
            dryRun: false,
            refresh: false,
            validate: false,
            initConfig: false,
            exactMas: Boolean(this.context.isExactMas),
            rengo: Boolean(this.context.isRengo),
        };
    }
}
