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
    noSectionSelected: '少なくとも1つのセクションを選択してください。',
    noSubSectionsInfo: '選択可能なサブ見出しが見つかりませんでした。テンプレート全体を出力対象とします。'
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
      '{タイトル}': 'ページ・海域タイトル (例: 2026夏イベE5, 7-5 ジャカルタ沖)',
      'En': '海域識別子 (例: E5, 7-5, E1)',
      '(n)': '短縮リンク用 / 記事の通し番号 (例: 1, 2, 3, E1)',
      '{マス}': 'マス名・目的地 (例: D, B2, ボス)',
      '{人}': '引用元・作成者名 (例: 作成者名, 参考サイト名)'
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
    saveError: 'ファイルの書き込み中にエラーが発生しました: ',
    configWarning: (msg) => `警告: 設定ファイルの保存に失敗しました (${msg})。ファイル出力は正常に完了しています。`
  }
};
