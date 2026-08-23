export const messages = {
  app: {
    title: '=== kctemp Markdown Template Generator ===',
    exit: '処理を中断・終了しました。'
  },
  template: {
    selectPrompt: '使用するテンプレートを選択してください:',
    customPathChoice: '[直接ファイルパスを入力する]',
    inputPathPrompt: 'Markdownファイルのパスを入力してください:',
    notFound: '指定されたテンプレートファイルが見つかりません: ',
    readError: 'テンプレートファイルの読み込みに失敗しました: '
  },
  section: {
    selectPrompt: '生成するセクションを選択してください (スペースキーで選択/解除):',
    selectInstruction: '↑/↓で移動、スペースで選択、Aで全選択、Enterで確定',
    noSectionSelected: '少なくとも1つのセクションを選択してください。'
  },
  repeat: {
    askRepeat: (title) => `セクション「${title}」の生成セット数（リピート回数）を入力してください:`,
    invalidNumber: '1以上の整数を入力してください。'
  },
  variable: {
    header: '--- 変数の入力 ---',
    globalHeader: '[全体共通変数]',
    repeatHeader: (sectionTitle, index) => `[「${sectionTitle}」セット ${index + 1} の個別変数]`,
    inputPrompt: (name, desc) => `${desc ? `${desc} ` : ''}(${name}) の値を入力してください:`,
    descriptions: {
      'En': '海域識別子 (例: E1, E4, E5)',
      '(n)': '海域識別子 / 順番 (例: E1, E4)',
      '第n艦隊': '艦隊番号 (例: 第1艦隊, 第3艦隊)',
      '{マス}': 'マス名・目的地 (例: D, B2, ボス)',
      '{人}': '引用元・執筆者名 (例: 四腕, 引用元)'
    }
  },
  output: {
    dirPrompt: '出力先ディレクトリのパスを指定してください:',
    dirNotFoundCreate: '指定されたディレクトリが存在しないため作成します: ',
    fileNamePrompt: '出力ファイル名を入力してください (.md は自動補完されます):',
    invalidFileName: '有効なファイル名を入力してください。',
    duplicateWarning: (filePath) => `ファイルが既に存在します: ${filePath}`,
    duplicateActionPrompt: '重複時の処理を選択してください:',
    duplicateActions: {
      autoRename: (newName) => `自動で連番を付けて保存する (${newName})`,
      manualRename: '別のファイル名を手動で入力する',
      cancel: '処理を中断する'
    },
    success: (filePath) => `Markdownファイルを正常に生成・保存しました:\n  -> ${filePath}`,
    saveError: 'ファイルの書き込み中にエラーが発生しました: '
  }
};
