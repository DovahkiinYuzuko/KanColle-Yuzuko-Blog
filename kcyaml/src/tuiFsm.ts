import { CliOptions } from './types.js';

export type TuiState =
  | 'INPUT_SOURCE'
  | 'TARGET_SELECTION'
  | 'MODE_BRANCH'
  | 'AIR_ONLY'
  | 'SINGLE_FLEET'
  | 'COMBINED_CANDIDATE'
  | 'THEME_SELECT'
  | 'OUTPUT_SETTING'
  | 'EXECUTION'
  | 'CANCELLED';

export interface TuiContext {
  inputSource: 'clipboard' | 'file';
  inputFilePath?: string;
  selectedFleets: number[];
  selectedAir: number[];
  isRengo: boolean;
  isExactMas: boolean;
  isImage: boolean;
  imageTheme: string;
  isSaveFile: boolean;
}

export class TuiFsmEngine {
  private state: TuiState = 'INPUT_SOURCE';
  public context: TuiContext = {
    inputSource: 'clipboard',
    selectedFleets: [1],
    selectedAir: [],
    isRengo: false,
    isExactMas: false,
    isImage: false,
    imageTheme: 'official',
    isSaveFile: false,
  };

  public getState(): TuiState {
    return this.state;
  }

  public transitionTo(nextState: TuiState): void {
    this.state = nextState;
  }

  /**
   * 第1艦隊と第2艦隊の両方が選択されているか判定するガード条件
   */
  public isCombinedCandidate(): boolean {
    return (
      this.context.selectedFleets.includes(1) &&
      this.context.selectedFleets.includes(2)
    );
  }

  /**
   * ターゲット選択状態から、モード分岐階層サブ状態（AIR_ONLY, SINGLE_FLEET, COMBINED_CANDIDATE）を評価して遷移する
   */
  public evaluateTargetBranch(): 'AIR_ONLY' | 'SINGLE_FLEET' | 'COMBINED_CANDIDATE' {
    if (this.context.selectedFleets.length === 0 && this.context.selectedAir.length > 0) {
      // 基地航空隊のみの場合: 連合艦隊・画像質問はスキップ
      this.context.isRengo = false;
      this.context.isImage = false;
      this.transitionTo('AIR_ONLY');
      return 'AIR_ONLY';
    }

    if (this.isCombinedCandidate()) {
      // 第1艦隊と第2艦隊を含む場合: 連合艦隊・熟練度・画像質問を評価
      this.transitionTo('COMBINED_CANDIDATE');
      return 'COMBINED_CANDIDATE';
    }

    // 単艦隊または [1, 2] を同時に含まない艦隊選択の場合: 連合艦隊質問はスキップ
    this.context.isRengo = false;
    this.transitionTo('SINGLE_FLEET');
    return 'SINGLE_FLEET';
  }

  /**
   * 中断・キャンセル時の安全な状態遷移
   */
  public handleCancel(): void {
    this.transitionTo('CANCELLED');
  }

  /**
   * コンテキストから CliOptions オブジェクトを構築する
   */
  public buildCliOptions(defaultTheme: string, defaultDialogEnabled: boolean): CliOptions {
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
