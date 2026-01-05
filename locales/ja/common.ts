//C:\Users\horit\fitcoach\locales\ja\common.ts
const ja = {
  app: {
    name: "FitGear",
  },

  home: {
    title: "ホーム",
    subtitle: "今日もコツコツ積み上げましょう💪",

    summary_title: "1日の合計栄養素",
    goal_button: "🎯 目標",
    loading: "読み込み中…",
    total_badge_label: "合計",

    label_kcal: "kcal",
    label_p: "P (g)",
    label_f: "F (g)",
    label_c: "C (g)",

    body_today_label: "体組成：",
    body_record_cta: "体組成を記録する →",

    button_meal_record: "食事を記録",
    button_product_search: "商品検索へ",
    button_quick_body: "今日の体重をクイック追加",

    ai_advice_title: "AIに食事アドバイスをもらう",
    ai_advice_button: "今日の内容でアドバイス生成",
    ai_advice_loading: "AIが分析中です…🤖💭",

    goal_modal_title: "目標 PFC・kcal",

    calendar_title: "日付を選択",
    calendar_manual_hint:
      "カレンダー未導入。手入力してください（YYYY-MM-DD）。",
    calendar_placeholder: "YYYY-MM-DD",

    quick_title: "今日の体重をクイック追加",
    quick_weight_label: "体重 (kg)",
    quick_weight_placeholder: "例: 68.2",
    quick_bodyfat_label: "体脂肪率 (任意)",
    quick_bodyfat_placeholder: "例: 13.0",

    alert_weight_title: "体重の値を確認",
    alert_weight_message: "20〜300 kg の範囲で入力してください",
    alert_bodyfat_title: "体脂肪率の値を確認",
    alert_bodyfat_message: "2〜60 % の範囲で入力してください",
    alert_saved_title: "保存しました",
    alert_saved_message: "体組成タブのグラフにも反映されます",

    // ▼ 今日のトレーニングカード
    training_today: {
      title: "今日のトレーニング",
      pr_badge: "🎉 PR更新",
      badge_has_record: "記録あり",
      badge_no_record: "未記録",
      empty_message:
        "まだセットがありません。今日の記録を始めましょう。",
      summary_exercises: "種目",
      summary_sets: "セット",
      summary_reps: "レップ",
      summary_tonnage: "負荷量",
      set_line: "{{weight}} {{unit}} × {{reps}} 回",
      cta_continue: "続きを記録",
      cta_start_today: "今日を記録",
      cta_calendar: "カレンダー",
    },
  },
  home_tab: {
    title: "ホーム",
    help_label: "ヘルプ",
    help_accessibility: "ホームのヘルプを開く",
  },
  ui: {
    cancel: "キャンセル",
    ok: "決定",
    save: "保存",
    input: "入力",
    done: "完了",
  },

  auth: {
    login: "ログイン",
    signup: "新規登録",
  },

  tabs: {
    home: "ホーム",
    record: "記録",
    explore: "探索",
    gotore: "合トレ",
    me: "マイページ",

    training: "トレーニング",
    meals: "食事",
    body: "体組成",
    more: "その他",
    videos: "動画",
  },

  settings: {
    title: "設定",
    language: "言語",
    language_ja: "日本語",
    language_en: "英語",
    language_ko: "韓国語",
    language_hint: "アプリ全体の表示言語を変更します。",
    description: "プロフィール、目標、通知、アプリ設定などを管理します。",
    readonlyNote:
      "※ このページは読み取り専用です。各ページで編集→保存すると、ここに反映されます。",
    rowOpen: "「{{title}}」を開く",
    appSettings_title: "アプリ設定",
    appSettings_desc: "テーマと触覚フィードバック、言語を設定します。",

    theme_title: "テーマ",
    theme_mode_label: "表示モード",
    theme_auto: "自動",
    theme_light: "ライト",
    theme_dark: "ダーク",
    theme_accessibility: "テーマを{{label}}にする",
    theme_preview_title: "プレビュー",
    theme_preview_description: "現在の選択に応じたカード表示の一例です。",
    theme_current_prefix: "現在の選択：",
    theme_current_auto: "自動（端末：{{scheme}}）",
    theme_preview_cardTitle: "カード見出し",
    theme_preview_cardBody: "本文の色やコントラストが端末設定/選択に応じて変わります。",
    theme_preview_button: "ボタン例（触覚）",
    language_accessibility: "言語を{{label}}にする",

    haptics_title: "触覚フィードバック",
    haptics_label: "触覚フィードバック",
    haptics_hint: "ボタン操作時に軽い振動で反応を返します（保存後に全画面へ適用）。",
    haptics_test: "テスト振動",

    memo_title: "メモ",
    memo_body:
      "・テーマ「自動」は端末のライト/ダーク設定に追従します。\n" +
      "・この画面の「保存」でアプリ全体に反映＆永続化されます。\n" +
      "・言語はホームなどの画面テキストに反映されます。",

    alert_saved_title: "保存しました",
    alert_saved_body: "アプリ全体へ反映しました。",
    alert_failed_title: "保存に失敗",
    alert_failed_body: "もう一度お試しください。",

    accessory_close: "閉じる",
    accessory_save: "保存",
    accessory_saving: "保存中...",
    bottom_save: "保存する",
    bottom_saving: "保存中...",

    account: {
      title: "👤 アカウント",
      checking: "確認中…",
      emailLabel: "メールアドレス",
      emailPlaceholder: "you@example.com",
      passwordLabel: "パスワード",
      passwordPlaceholder: "6文字以上",
      signIn: "ログイン",
      signUp: "新規登録",
      signOut: "ログアウト",
      deleteAccount: "アカウント削除",
      enableBuddy: "合トレ募集をONにする",
      goBuddy: "合トレへ",
      currentEmail: "メール：{{email}}",
    },

    alert: {
      signInSuccess: "ログインしました",
      signInFailTitle: "ログイン失敗",
      signUpSuccess: "アカウントを作成しました",
      signUpFailTitle: "登録失敗",
      signOutSuccess: "ログアウトしました",
      signOutFailTitle: "ログアウト失敗",
      buddyOnSuccess: "合トレ募集をONにしました",
      updateFailTitle: "更新失敗",
      unknownError: "不明なエラー",
    },

    profile: {
      nameUnset: "未設定",
      emailSignedOut: "未サインイン",
      summary: "{{name}} ／ {{email}}",
    },

    goals: {
      weightWithUnit: "{{value}}kg",
      bodyFatWithUnit: "{{value}}%",
      kcalWithUnit: "{{value}}kcal",
      macroP: "P{{value}}",
      macroF: "F{{value}}",
      macroC: "C{{value}}",
      summary:
        "目標 {{weight}} / {{bodyFat}} ・ 栄養 {{kcal}}（{{p}} {{f}} {{c}}）",
    },

    notifications: {
      countTimes: "{{count}}件",
      weeklyOn: "週レビュー:ON",
      weeklyOff: "週レビュー:OFF",
      summary: "トレ:{{training}}・食事:{{meals}}・{{weekly}}",
    },

    app: {
      summary: "テーマ:{{theme}}・触覚:{{haptics}}",
      theme: {
        light: "ライト",
        dark: "ダーク",
        auto: "自動",
        unset: "未設定",
      },
      haptics: {
        on: "ON",
        off: "OFF",
        unset: "—",
      },
    },

    body: {
      weightWithUnit: "{{value}}kg",
      bodyFatWithUnit: "{{value}}%",
      summary: "{{weight}} / {{bodyFat}}（{{at}}）",
    },

    export: {
      never: "最終エクスポート：—",
      latest: "最終エクスポート：{{datetime}}",
    },

    version: {
      value: "バージョン：{{version}}",
      none: "バージョン：—",
    },

    rows: {
      profile: { title: "プロフィール" },
      goals: { title: "目標・体データ" },
      notifications: { title: "通知" },
      language: {
        title: "言語設定",
        subtitle: "アプリ全体の表示言語を変更します",
      },
      appSettings: { title: "アプリ設定" },
      dataPrivacy: { title: "データとプライバシー" },
      support: {
        title: "サポート",
        subtitle: "お問い合わせ・不具合報告",
      },
      about: { title: "アプリ情報" },
      help: { title: "ヘルプ" },
    },
  },
  account: {
    title: "アカウント",
    subtitle: "表示名（端末保存）と、合トレ用プロフィール（サーバ保存）を編集します。",
    common: {
      loading: "読み込み中…",
      saving: "保存中…",
      close: "閉じる",
      save: "保存",
      imagePickerMissingTitle: "画像ライブラリが未導入",
      imagePickerMissingMessage: "expo-image-picker を導入してください。",
      loadErrorTitle: "読み込みエラー",
      loadErrorFallbackMessage: "不明なエラー",
    },
    local: {
      cardTitle: "端末内プロフィール（ローカル）",
      displayNameLabel: "表示名",
      displayNamePlaceholder: "例：太郎",
      emailLabel: "メール（任意／端末表示用）",
      emailPlaceholder: "example@example.com",
      removeImageButton: "画像を削除",
      changeImageButton: "画像を変更",
      saveSuccessTitle: "保存しました",
      saveSuccessMessage: "端末内プロフィールを更新しました。",
      saveErrorTitle: "保存に失敗しました",
      saveErrorMessage: "もう一度お試しください。",
      imageUpdatedTitle: "画像を更新しました",
      imageUpdatedMessage: "保存するとプロフィールに反映されます。",
      imageLoadErrorTitle: "画像の読み込みに失敗しました",
      imageLoadErrorMessage: "別の画像でお試しください。",
      saveBarButton: "端末内プロフィールを保存",
      saveBarSaving: "保存中…",
    },
    gotore: {
      cardTitle: "合トレ用プロフィール（サーバ保存）",
      nicknameLabel: "ニックネーム",
      nicknamePlaceholder: "例：たろう / さくら",
      genderLabel: "性別",
      homeGymLabel: "ホームジム（任意）",
      homeGymPlaceholder: "例：○○ジム渋谷店",
      tagsLabel: "種目タグ（カンマ区切り）",
      tagsPlaceholder: "ベンチ,デッド,スクワット など",
      bioLabel: "自己紹介",
      bioPlaceholder: "トレ歴や得意種目、活動時間帯など",
      trainingYearsLabel: "トレーニング年数（年）",
      trainingYearsPlaceholder: "例：3",
      heightLabel: "身長（cm）",
      heightPlaceholder: "例：176",
      goalLabel: "目標",
      goalPlaceholder: "例：3ヶ月で-5kg / ベンチ100kg / 体脂肪-5% など",
      freqLabel: "頻度（週あたり回数）",
      freqPlaceholder: "例：3",
      freqPill: "{{n}} 回/週",
      saveButton: "合トレ用プロフィールを保存",
      saveSuccessTitle: "保存しました",
      saveSuccessMessage: "合トレ用プロフィールを更新しました。",
      saveErrorTitle: "保存エラー",
      saveNote: "※ 地域は「探す」の表示・絞り込みに使われます（必須）。メイン写真は配列の先頭です。",
    },
    gender: {
      male: "男性",
      female: "女性",
      other: "その他",
      unknown: "未回答",
    },
    region: {
      label: "地域（都道府県）〈必須〉",
      placeholder: "タップして選択",
      change: "変更",
      setFromCurrentLocation: "現在地から設定",
      clear: "クリア",
      modalTitle: "都道府県を選択",
      searchPlaceholder: "例: 東京 / 福岡",
      locationLibMissingTitle: "位置情報未導入",
      locationLibMissingMessage: "expo-location を導入してください。",
      cannotDetectTitle: "地域を特定できませんでした",
      cannotDetectMessage: "手動で選択してください。",
      locationErrorTitle: "位置情報の取得に失敗しました",
      locationErrorMessage: "手動で選択してください。",
      missingTitle: "地域が未設定",
      missingMessage: "都道府県は必須です。設定してください。",
    },
    photos: {
      label: "プロフィール写真（サーバ保存）",
      note: "ドラッグで並び替え / 先頭がメイン。長押しで削除。最大{{max}}枚。",
      uploadErrorTitle: "アップロードに失敗しました",
      uploadErrorMessageFallback: "不明なエラーが発生しました。",
      removeErrorTitle: "削除に失敗しました",
      removeErrorMessageFallback: "不明なエラーが発生しました。",
    },
    kyc: {
      cardTitle: "本人確認（KYC）",
      personIdLabel: "ID:",
      status: {
        verified: "本人確認済",
        pending: "審査中",
        rejected: "否認",
        failed: "失敗",
        unverified: "未確認",
      },
      description: {
        verified: "本人確認が完了しています。バッジがアプリ内に表示されます。",
        pending: "審査中です。しばらくしてから「状態を更新」をお試しください。",
        rejected: "否認となりました。性別は未回答に戻しています。もう一度、性別を選択して保存してください。",
        failed: "判定に失敗しました。撮影や画像を見直して再申請してください。",
        unverified: "なりすまし防止のため、身分証での本人確認にご協力ください。",
      },
      startButton: "本人確認をはじめる",
      startButtonLoading: "起動中…",
      retryButton: "再申請する",
      retryButtonLoading: "再申請中…",
      refreshButton: "状態を更新",
      refreshButtonLoading: "更新中…",
      startErrorTitle: "開始できませんでした",
    },
    admin: {
      cardTitle: "管理者メニュー",
      promoteSuccessTitle: "管理権限を付与しました",
      promoteSuccessMessage: "「管理：本人確認一覧」を開けます。",
      promoteErrorTitle: "付与に失敗",
      selfPromoteNote: "※ {{emails}} のメールでログイン中のみ表示されます。",
      promoteButton: "管理権限を復旧する",
      openKycListButton: "管理：本人確認一覧を開く",
    },
    errors: {
      genderLocked: "性別は一度設定すると変更できません（再編集は管理者トークンが必要）",
      genderUpdateBlocked: "現在は性別を変更できません（審査中/ロック中）",
      kycPending: "本人確認の審査中は性別を変更できません",
      invalidOrUsedToken: "編集トークンが無効/使用済みです",
      invalidGender: "選択した性別が不正です",
      profileNotFound: "プロフィールが未作成です。いったん画面を開き直してください",
      genderUpdateNotAllowed: "現在は性別を変更できません",
      unknown: "不明なエラーが発生しました",
      notAuthenticatedTitle: "未ログイン",
      notAuthenticatedMessage: "先に 設定 → アカウント からログインしてください。",
    },
  },
  me: {
    back: "戻る",
    settings: "設定",
    account: "アカウント",
    goals: "目標・体データ",
    notifications: "通知",
    appSettings: "アプリ設定",
    dataPrivacy: "データとプライバシー",
    support: "サポート",
    about: "アプリ情報",
  },

  record: {
    switch_hint: "上のチップから記録画面に切り替えます。",
    bbs_open_label: "筋肉掲示板を開く",
    omikuji: {
      title: "筋肉おみくじ",
      reset_in: "リセットまで {{time}}",
      loading: "読み込み中…",
      empty_lead: "1日1回、筋肉の神様からメッセージ。",
      draw_button: "おみくじを引く",
      draw_hint: "※ 引いた後は当日中は結果固定。",
      section_meigen: "筋肉名言",
      section_kotowaza: "筋肉ことわざ",
      section_form: "フォームの鍵",
      section_recovery: "回復のコツ",
      section_challenge: "今日の挑戦（〜30秒）",
      section_lucky_guide: "ラッキーガイド",
      label_lucky_item: "ラッキーアイテム",
      label_lucky_color: "ラッキーカラー",
      label_lucky_set: "ラッキーセット",
      label_lucky_tempo: "ラッキーテンポ",
      note:
        "※ おみくじは一日一回。0:00 に自動リセットされます。",
      // 部位名・フォーカス（押し／引き／脚／芯）
      muscles: {
        chest: { name: "大胸筋",       focus: "押し" },
        shoulders: { name: "三角筋",   focus: "押し" },
        triceps: { name: "上腕三頭筋", focus: "押し" },
        back: { name: "広背筋",        focus: "引き" },
        biceps: { name: "上腕二頭筋",  focus: "引き" },
        legs: { name: "下半身（脚）",  focus: "脚" },
        core: { name: "体幹（コア）",  focus: "芯" },
      },

      // 運勢ラベル
      fortuneLabels: {
        daikichi: "大吉",
        chuukichi: "中吉",
        kichi: "吉",
        shoukichi: "小吉",
        suekichi: "末吉",
      },

      // 運勢ごとのリードメッセージ
      // → t("record.omikuji.fortuneMessages.daikichi", { muscleName, focus })
      fortuneMessages: {
        daikichi: "今日は{{focus}}が冴える超・快晴。{{muscleName}}は「質×少量」でキレを出そう！",
        chuukichi: "フォームが光る日。{{muscleName}}はコントロール重視で丁寧に。",
        kichi: "コツコツ勝ち。{{muscleName}}は最後の1セットを“ゆっくり”で。",
        shoukichi: "無理せず積み上げ。{{muscleName}}はボリューム控えめで質を磨こう。",
        suekichi: "回復優先。{{muscleName}}はストレッチ／軽いパンプで血流アップ。",
      },

      // 回復のコツ
      recoveryTipsPool: [
        "水分1.5〜2.5L／日。カフェインはトレ前に寄せる。",
        "就寝90分前の入浴（10〜15分・40℃前後）。",
        "タンパク質は体重×1.6〜2.2g／日を分割摂取。",
        "軽いストレッチと呼吸で副交感優位に。",
        "寝室19〜21℃、光を抑える。",
        "6,000〜8,000歩の軽い有酸素で回復促進。",
        "アルコール控えめに。回復の天敵。",
        "Mgとω3の摂取を検討。",
        "昼寝20分以内、夕方以降は避ける。",
      ],

      // 小チャレンジ
      challengePool: [
        "鼻→口の深呼吸30秒でリセット。",
        "肩回し10回＋首ストレッチ各20秒。",
        "座りっぱなしをやめて立って伸び5回。",
        "水をコップ1杯。姿勢を正して飲む。",
        "目を閉じて深呼吸5回。",
        "足首ぐるぐる各10回。",
        "手のひらマッサージ30秒。",
        "上を見て笑顔5秒。",
      ],

      // ラッキーアイテム
      luckyItemsPool: {
        chest: [
          "リストラップ",
          "ディップスベルト",
          "軽量プレート",
          "ミニバンド",
          "プッシュアップバー",
          "スリングショット",
          "チェーンプレート",
          "フォームマット",
          "グリップチョーク",
          "薄手グローブ",
          "クッションパッド",
          "ラバーバンド（強）",
          "スパイダーバー",
          "エルボースリーブ",
          "ミニタオル",
          "ショルダーポッド",
          "モビリティボール",
          "フォームローラー（小）",
          "ネッククッション",
          "ジム用アロマ",
        ],
        shoulders: [
          "ミニバンド（弱）",
          "フェイスプルロープ",
          "軽ダンベル",
          "ケーブルアタッチメントD",
          "エクサチューブ",
          "プラスチックカラー",
          "ソフトボール",
          "トレーニングキャップ",
          "薄手フーディ",
          "サイドレイズ用ベルト",
          "フォームスティック",
          "リアデルトパッド",
          "ミラーステッカー",
          "カフアタッチメント",
          "ミニ扇風機",
          "汗拭きシート",
          "ハンドミラー",
          "肩ほぐしスティック",
          "ドリンクシェイカー",
          "ケトルベル（軽）",
        ],
        triceps: [
          "ロープアタッチメント",
          "Vバー",
          "EZバー",
          "ディップスベルト",
          "アームブラスター",
          "プレスダウン用グリップ",
          "エルボースリーブ",
          "薄手リストラップ",
          "ラバーケーブル",
          "プッシュダウンストッパー",
          "スカルクラッシャークッション",
          "フォームパッド",
          "ミニチェーン",
          "肘サポーターテープ",
          "ストレッチバンド（強）",
          "薄手トレーニングベルト",
          "タオル（長）",
          "肘アイスパック",
          "トレーニングソックス",
          "汗止めヘッドバンド",
        ],
        back: [
          "ラットプルグリップ（中）",
          "マググリップ風アタッチメント",
          "チンニングストラップ",
          "リフティングストラップ",
          "ヘックスグリップ",
          "ハーフストラップ",
          "チョークボール",
          "チンアシストバンド",
          "パワーグリップ",
          "デッドリフトソックス",
          "フォームローラー（長）",
          "背中ゴムバンド",
          "ハンドクリップ",
          "背面ミラー",
          "下敷きボード（足場用）",
          "フックグリップテープ",
          "背中温感シート",
          "腰サポベルト（薄）",
          "軽量プレート2.5kg",
          "握力リング",
        ],
        biceps: [
          "アームブラスター",
          "細グリップアタッチメント",
          "スピネーション用ダンベル",
          "ケーブルグリップ",
          "EZバー（軽）",
          "マイクロプレート",
          "フロントミラー",
          "パームガード",
          "グリップボール",
          "タオル（短）",
          "手首テーピング",
          "リストカール用台",
          "ケトルベル（中）",
          "姿勢矯正ベルト（軽）",
          "シリコンリング",
          "手汗用パウダー",
          "肘下コンプレッション",
          "ロープ（短）",
          "ケーブルカフ",
          "ハンマーカールグリップ",
        ],
        legs: [
          "スリーピングマスク（回復）",
          "ニーラップ",
          "スリッパ（ヒール高）",
          "ウェッジボード",
          "ニーソックス",
          "ミニバンド（強）",
          "スムーズソールシューズ",
          "リフティングベルト",
          "ハムストパッド",
          "チューブ（長）",
          "フォームボール（大）",
          "ヒップサークル",
          "シシスクワットパッド",
          "スリング",
          "アンクルウェイト",
          "アンクルストラップ",
          "プレートマット",
          "カーフブロック",
          "ソフトニーパッド",
          "タイマー",
        ],
        core: [
          "アブホイール",
          "プランクマット",
          "ミニボール",
          "スライダーディスク",
          "腹圧ベルト（軽）",
          "呼吸トレーナー",
          "ストレッチポール",
          "骨盤ベルト（軽）",
          "タイマー（静音）",
          "ヨガブロック",
          "クッションブロック",
          "床保護マット",
          "姿勢センサー",
          "メトロノーム",
          "タオル（薄）",
          "ラテックスバンド",
          "モビリティリング",
          "柔軟ストラップ",
          "ウエストポーチ",
          "ドリンク（常温水）",
        ],
      },

      // ラッキーセット（メニュー例）
      luckySetsPool: {
        chest: [
          "ベンチプレス 3×8 休150s",
          "インクラインダンベル 4×10 休90s",
          "ディップス 3×AMRAP 休120s",
          "ケーブルフライ 3×12 休60s",
          "プッシュアップ 3×15 休45s",
        ],
        shoulders: [
          "サイドレイズ 4×12 休45s",
          "ショルダープレス 3×8 休120s",
          "リアデルト 3×15 休45s",
          "フロントレイズ 3×12 休60s",
          "アーノルドプレス 3×10 休90s",
        ],
        triceps: [
          "ローププレスダウン 4×12 休60s",
          "スカルクラッシャー 3×10 休90s",
          "ディップス 3×AMRAP 休120s",
          "オーバーヘッド 3×12 休60s",
          "クローズグリップBP 3×8 休120s",
        ],
        back: [
          "ラットプル 4×10 休90s",
          "ベントロー 3×8 休120s",
          "ワンハンドロー 3×10/side 休90s",
          "ケーブルロー 3×12 休60s",
          "懸垂 3×AMRAP 休120s",
        ],
        biceps: [
          "EZカール 4×10 休60s",
          "ハンマーカール 3×12 休60s",
          "インクライン 3×10 休90s",
          "ケーブル 3×12 休45s",
          "プリチャー 3×10 休90s",
        ],
        legs: [
          "ハイバーSQ 3×6 休180s",
          "レッグプレス 4×12 休90s",
          "RDL 3×8 休120s",
          "ランジ 3×10/side 休60s",
          "カーフ 4×15 休45s",
        ],
        core: [
          "プランク 3×45s 休45s",
          "デッドバグ 3×12/side 休45s",
          "パロフ 3×12/side 休60s",
          "ニーアップ 3×12 休60s",
          "ロータリー 3×12 休45s",
        ],
      },
        meigen: {
          chest: [
            "胸を張れ、心も張れ。押し切る勇気は大胸筋が教える。",
            "一回の限界が、次の自分の標準になる。",
            "大胸筋は嘘をつかない。積み上げただけ厚くなる。",
            "可動域の一センチが自信の一マイル。",
            "胸は飾りじゃない。覚悟の甲冑だ。",
            "押しを鍛えると、迷いを押しのけられる。",
            "今日の1kgは明日の常識。",
            "バーベルは重い。でも妥協の方がずっと重い。",
            "セットは短い、誇りは長い。",
            "フォームが美しい人は、目標もまっすぐだ。",
            "胸が強い日は、弱気が退く日。",
            "汗の粒は、昨日の自分が流れ落ちる音。",
          ],
          shoulders: [
            "肩で語れ。小さな角度の差が明日の差。",
            "荷を担ぐ覚悟が三角筋に刻まれる。",
            "横への一歩が、存在感の一歩。",
            "三角筋が形を作り、継続が意味を作る。",
            "肩は飾りじゃない。安定の証明だ。",
            "軽い重さで丁寧に。美しさは細部に宿る。",
            "肩が上がれば、視線も上がる。",
            "僅かな外旋が、大きな余裕を生む。",
            "姿勢が良い日は、運も良い。",
            "肩が語る日は、背筋も微笑む。",
            "痛みの前に、整えることを覚えよ。",
            "可動域は財産。焦りは浪費。",
          ],
          triceps: [
            "最後の一押しが形を決める。",
            "伸ばし切る誠実さが成果を押し上げる。",
            "押す回数より、押し切る覚悟。",
            "ロックアウトの1秒が人生の1秒を強くする。",
            "弱点は仕上げに現れ、努力は仕上げで報われる。",
            "肘にやさしく、自分に厳しく。",
            "押し出すたび、迷いが後ろに落ちる。",
            "三頭が育てば、胸も肩も輝く。",
            "三頭は語らない。結果で語る。",
            "疲れたら、軽くして綺麗に。",
          ],
          back: [
            "背中は語る。努力は後ろ姿に出る。",
            "引ける者だけが前に進める。",
            "肩甲骨で抱きしめろ、理想の自分を。",
            "広く引け、深く生きよ。",
            "グリップに意志を、肘に軌道を、背中に誇りを。",
            "焦るな、広背筋は静かに大きくなる。",
            "背中に翼を。床に根を。",
            "反動は少し、集中は深く。",
            "握力は約束。最後まで離さない。",
            "背中が強いと、心も引き締まる。",
          ],
          biceps: [
            "握る手に、離さない意思を込める。",
            "パンプは合図、継続は証拠。",
            "曲げるたび、弱さを伸ばしている。",
            "反動を捨て、誇りを拾え。",
            "ハンマーの一撃は、日々の微調整から生まれる。",
            "トップで止める1秒が、魅せる1秒。",
            "軽さで誤魔化すな、丁寧さで魅せろ。",
            "握り方が、生き方に似てくる。",
            "収縮の質が、シルエットの質。",
            "二頭は飾りじゃない。約束だ。",
          ],
          legs: [
            "脚は嘘をつかない。重力が証人だ。",
            "一段一段が、未来への階段になる。",
            "強い土台に、弱い上物は乗らない。",
            "しゃがむ勇気が、立ち上がる力を呼ぶ。",
            "脚は裏切らない。ただ試すだけだ。",
            "今日の一歩は、明日の千歩。",
            "浅い欲より、深いスクワット。",
            "ハムの伸びに、明日の伸びを見よ。",
            "つらい日は、フォームを磨く日。",
            "脚で語れば、全身が聴く。",
          ],
          core: [
            "芯が通れば、動きは美しくなる。",
            "ブレない体は、ブレない心から。",
            "一呼吸で整え、一レップで信じる。",
            "姿勢は習慣。美しさは副産物。",
            "腹圧は盾、呼吸は剣。",
            "緩めて締める。余裕が強さを生む。",
            "コアは静かに主張する。",
            "止まる勇気が、動く質を上げる。",
            "1分のプランクが、1日の集中を呼ぶ。",
            "芯を鍛える者、ぶれず。",
          ],
        },

        kotowaza: {
          generic: [
            "継続は{{muscleName}}なり",
            "{{muscleName}}に近道なし",
            "{{muscleName}}も一歩から",
            "急がば回れ、フォーム第一",
            "石の上にも三年、筋も三ヶ月",
            "塵も積もれば{{muscleName}}となる",
            "急いては事を仕損じる、可動域は丁寧に",
            "雨垂れ石を穿つ、レップは筋を作る",
            "百聞は一見にしかず、鏡でフォームを見よ",
          ],
        },

        form: {
          chest: [
            "肩甲骨は寄せて下げる。胸を起点に押す。",
            "肘は手首の真下。前腕は垂直を意識。",
            "足裏フルコンタクト。お尻・肩・頭はベンチ固定。",
            "バーは胸上部を通過。反動は使わない。",
            "ネガティブは2〜3秒。溜めすぎない。",
          ],
          shoulders: [
            "小指側わずかに上げると狙いが刺さる。",
            "チーティング最小。トップで一瞬止める。",
            "首は長く、胸は薄く。僧帽に逃がさない。",
            "外旋/内旋コントロールを意識。",
            "痛ければ角度変更。痛みは正義じゃない。",
          ],
          triceps: [
            "肘は開かず固定。肩を動かさない。",
            "トップで絞る1秒を大切に。",
            "反動は最小。可動域は最後まで。",
            "ケーブルは引き切って肘下で止める。",
            "押し切れない日は重量を落とす勇気。",
          ],
          back: [
            "肘で引く。手はフック。",
            "胸を張り、みぞおちをバーへ。",
            "肩甲骨の下制・内転を先に動かす。",
            "グリップ幅を変えて刺激を散らす。",
            "反動は補助、主役にしない。",
          ],
          biceps: [
            "肘は身体の横で固定。",
            "トップでスピネーション。",
            "反動を使うなら最後の2回だけ。",
            "ネガティブ2秒で落とす。",
            "手首はわずかに背屈で固定。",
          ],
          legs: [
            "足圧は三点分配。",
            "膝とつま先は同方向。",
            "ヒップヒンジを先に。",
            "深さは可動域で決める。無理しない。",
            "RDLは膝わずかに曲げ、ハムにテンション。",
          ],
          core: [
            "吸気で360°膨らませる。",
            "骨盤中間位、肋骨下げる。",
            "プランクは肘で床を押す。",
            "呼吸を止めない。",
            "焦らず積むのが最短。",
          ],
        },
    },
  },
  gotore: {
    coming_soon: {
      title: "🤝 合トレ機能は\n現在準備中です！",
      description_1:
        "アプリの利用者が増え次第、\n合トレ機能を順次解放します。\n近くの相手探し → 相互いいねでマッチ \n→ チャットまで一気通貫で利用できる予定です。",
      planned_title: "予定していること",
      planned_1: "・地域／タグ／本人確認での精密なマッチング",
      planned_2: "・異性／同性同士でのマッチング",
      planned_3: "・受信いいね → 即マッチ → チャット",
      planned_4: "・ブロック／マッチ解除など安全対策",
      description_2:
        "その他👉設定👉プロフィール\n👉合トレ用プロフィールより\nプロフィールの作成をしてお待ちください！",
      btn_back_home: "ホームへ戻る",
      btn_open_notifications: "通知設定を開く",
      note_ios: "通知をONにすると、公開時にお知らせします。",
      note_android: "通知をONにすると、公開時にお知らせします。",
    },
  },
  training: {
    help_button: "ヘルプ",
    help_accessibility: "トレーニングのヘルプを開く",

    day_title: "{{date}} の記録",
    filter_all: "すべて",
    filter_manage: "＋ 管理",
    filter_note:
      "※カレンダーは「{{partName}}」の日のみ表示中（下の一覧・メモは全件表示）",

    loading: "読み込み中…",
    day_empty: "まだ記録とメモはありません。",

    summary: {
      exercises: "種目数",
      sets: "セット数",
      reps: "レップ数",
      tonnage: "負荷量",
    },

    note_label: "メモ",

    set_unit_reps: "回",
    no_work_sets: "本番セットなし",
    warmup_count: "WU {{count}} セット",

    fab_label: "この日を記録する",

    pr: {
      title: "これまでの最高記録",

      max_weight_badge: "👑 最高重量",
      max_reps_badge: "🏆 最高回数",
      streak_badge: "🔥 連続日数",
      total_days_badge: "🎖️ 総日数",

      no_record: "記録なし",

      max_weight_big: "{{weight}} kg × {{reps}} 回",
      max_reps_big: "{{reps}} 回 @ {{weight}} kg",
      entry_line: "{{name}} / {{date}}",

      current_streak_big: "現在 {{days}} 日",
      longest_streak:
        "最長 {{days}} 日（{{start}}〜{{end}}）",
      no_longest_data: "最長データなし",

      total_days_big: "{{days}} 日",
      total_days_sub: "積み重ねに拍手！",
    },
  },
  trainingSession: {
    note_title: "今日のメモ",
    note_placeholder:
      "体調、睡眠、関節の違和感、全体の所感などをメモ",
    saving: "保存中…",
    saved: "保存済み",

    add_exercise: "＋ 種目を追加",
    deleted_message: "セットを削除しました。",
    undo: "取り消す",

    weight_placeholder: "重量",
    reps_placeholder: "回数",
    reps_suffix: "回",
    wu_label: "WU",
    delete_set: "削除",

    empty: "まだ記録がありません",
    add_set: "＋ セット追加",
  },
  trainingPicker: {
    loading: "読み込み中…",
    manage_button: "＋ 部位・種目を追加",

    alert_title: "追加方法を選択",
    alert_message: "この種目の追加方法を選んでください",
    alert_copy_last: "前回のセットをコピー",
    alert_empty_set: "空のセットを1つ",
    alert_cancel: "キャンセル",

    empty:
      "種目が見つかりません。右上の「＋ 部位・種目を追加」から登録できます。",
  },
  trainingManage: {
    title: "部位・種目の管理",

    add_part_placeholder: "部位名を入力（例：胸）",
    add_button: "追加",

    loading: "読み込み中…",
    empty_parts: "まだ部位がありません。上で追加してください。",

    error_cannot_add_title: "追加できません",
    error_part_duplicate: "同名が存在する可能性があります。",
    error_exercise_failed: "登録に失敗しました。",

    remove_part_title: "部位を削除",
    remove_part_message:
      "「{{name}}」を削除しますか？\n紐づく種目の部位は未設定(NULL)になります。",
    remove_part_cancel: "キャンセル",
    remove_part_confirm: "削除する",

    add_ex_placeholder: "新しい種目名（例：ベンチプレス）",
    add_ex_button: "追加",

    ex_block_empty: "（種目なし）",
    ex_archived_suffix: "（非表示）",

    archived_title: "アーカイブしました",
    archived_message:
      "「{{name}}」は過去の記録があるため非表示(アーカイブ)にしました。",
  },
  body: {
    header_asof: "{{date}} 時点",
    title: "体組成",
    title_new: "体組成を記録",
    header_help: "ヘルプ",
    header_export: "書き出し",
    header_goal: "目標",

    period_day: "日",
    period_week: "週",
    period_month: "月",

    btn_add_record: "＋ 記録する",

    metric_both: "両方",
    metric_weight: "体重",
    metric_bodyfat: "体脂肪",

    avg7_on: "7日平均 ON",
    avg7_off: "7日平均 OFF",

    chart_empty_title: "まだグラフに表示できるデータがありません",
    chart_empty_message:
      "右上の「＋ 記録する」から最初の記録を追加してください",

    streak_board_title: "✨ 優勝記録ボード ✨",
    streak_current_title: "現在のストリーク",
    streak_current_sub: "今日を含む連続日数",
    streak_longest_title: "最長ストリーク",
    streak_longest_sub: "過去最高の連続日数",
    streak_month_title: "今月の記録日数",
    streak_month_sub: "{{month}}月の合計",

    recent_title: "直近の記録",
    recent_empty: "まだ記録がありません",
    recent_edit: "編集",
    recent_delete: "削除",

    modal_add_title: "記録を追加",
    modal_edit_title: "記録を編集",
    modal_date_label: "日付（YYYY/MM/DD）",
    modal_date_placeholder: "例: 2025/10/16",
    modal_weight_label: "体重 (kg)",
    modal_weight_placeholder: "例: 68.2",
    modal_bodyfat_label: "体脂肪率 (%)",
    modal_bodyfat_placeholder: "例: 18.5",
    modal_note_label: "ノート（任意）",
    modal_note_placeholder:
      "例: トレ後にプロテイン、夜は外食。体調は良好。",
    modal_cancel: "キャンセル",
    modal_update: "更新",
    modal_save: "保存",

    input_bar_label: "入力",
    input_bar_done: "完了",

    goal_modal_title: "目標を設定",
    goal_weight_label: "目標体重 (kg)",
    goal_weight_placeholder: "例: 65",
    goal_bodyfat_label: "目標体脂肪率 (%)（任意）",
    goal_bodyfat_placeholder: "例: 18",

    error_title: "エラー",
    error_load_failed: "体組成データの読み込みに失敗しました",
    error_weight_required_title: "体重は必須",
    error_weight_required_message:
      "現在は体脂肪率のみの保存には対応していません",
    error_weight_range_title: "体重の範囲",
    error_weight_range_message:
      "体重は {{min}}〜{{max}} kg で入力してください",
    error_bodyfat_range_title: "体脂肪率の範囲",
    error_bodyfat_range_message:
      "体脂肪率は {{min}}〜{{max}} % で入力してください",
    error_date_format_title: "日付の形式",
    error_date_format_message:
      "YYYY/MM/DD の形式で入力してください",
    error_save_failed_title: "保存に失敗しました",
    error_save_failed_message:
      "体組成データの保存に失敗しました。もう一度お試しください。",
    error_goal_weight_title: "目標体重",
    error_goal_weight_message:
      "{{min}}〜{{max}} の範囲で入力してください",
    error_goal_bodyfat_title: "目標体脂肪率",
    error_goal_bodyfat_message:
      "{{min}}〜{{max}} の範囲で入力してください",
    error_goal_save_title: "保存に失敗しました",
    error_goal_save_message:
      "目標の保存に失敗しました。もう一度お試しください。",
    export_success_title: "CSVを書き出しました",
    export_success_message: "場所: {{path}}",
    export_fail_title: "書き出しに失敗しました",
    export_fail_message:
      "CSVの書き出しに失敗しました。",

    delete_confirm_title: "削除しますか？",
    delete_confirm_message: "{{date}} の記録を削除します。",
    delete_cancel: "キャンセル",
    delete_ok: "削除",

    confirm_change_title: "大きな変化を検知",
    confirm_change_question: "このまま保存しますか？",
    confirm_change_fix: "修正する",
    confirm_change_save: "保存する",

    eta_title: "目標到達の見込み",
    eta_no_goal_main: "目標体重を設定してください",
    eta_no_goal_sub: "「目標」から設定すると表示されます",
    eta_insufficient_main: "データ不足",
    eta_insufficient_sub:
      "直近の記録が少ないため推定できません",
    eta_achieved_main: "目標達成！ 🎉",
    eta_achieved_sub: "最新 {{weight}} kg",
    eta_flat_main: "最近は変化が小さい状態",
    eta_flat_sub: "この調子で様子を見ましょう",
    eta_dir_up: "増え気味",
    eta_dir_down: "減り気味",
    eta_reverse_main: "目標とは逆に「{{direction}}」です",
    eta_reverse_sub:
      "入力ミスや生活リズムをチェックしてみましょう",
    eta_unknown_main: "見込みを計算できませんでした",
    eta_unknown_sub: "",
    eta_eta_main: "{{date}} 頃に到達見込み",
    eta_eta_sub:
      "今のペースなら {{date}} 頃に {{goal}} kg を達成できそうです",

    warn_weight_change:
      "体重が前回から {{diff}} kg 変化しています（しきい値 {{threshold}} kg）",
    warn_bodyfat_change:
      "体脂肪率が前回から {{diff}} % 変化しています（しきい値 {{threshold}} %）",
  },
  meals: {
    loading: "読み込み中…",
    monthHeader: "{{year}}年 {{month}}月",

    productSection: {
      title: "商品から記録する",
      button: "商品を検索（食品DB）",
      caption:
        "キーワードやJANコード（8〜14桁）で検索できます。フィルタ＆並び順にも対応。",
    },

    weekday: {
      sun: "日",
      mon: "月",
      tue: "火",
      wed: "水",
      thu: "木",
      fri: "金",
      sat: "土",
    },

    kcalWithUnit: "{{value}} kcal",

    summaryTitle: "{{date}} のサマリー",
    summary: {
      totalKcal: "総カロリー",
    },

    aiAdvice: {
      title: "AIからの本日のアドバイス",
      empty:
        "ホームの「AIにアドバイスをもらう」で作成すると、ここにメモとして表示されます。",
    },

    recordsTitle: "{{date}} の記録一覧",
    records: {
      empty: "まだ記録がありません。",
    },

    noPhoto: "No Photo",
    untitled: "無題",

    types: {
      breakfast: "朝食",
      lunch: "昼食",
      dinner: "夕食",
      snack: "間食",
    },

    trend: {
      title: "月のカロリー推移",
      needSvg:
        "折れ線グラフには {{libName}} が必要です。Expo の場合は「expo install {{libName}}」を実行してください。",
      goalLabel: "目標 {{kcal}} kcal",
      caption:
        "{{year}}年 {{month}}月 の日別kcal（横にスクロールできます）。該当の日付をタップすると、その日のカロリーを詳しく確認できます。",
    },
      new: {
      photoPermissionTitle: "写真へのアクセスが必要です",
      photoPermissionMessage:
        "設定から写真ライブラリのアクセスを許可してください。",
      errorTitle: "エラー",

      analyzingLabel: "解析中…",
      autoFromPhotoButton: "写真から自動入力",
      autoFromPhotoNote:
        "写真から自動入力は現在準備中です。\n利用者が増え次第、機能開放を行います。",

      analyzeSuccessTitle: "自動入力しました",
      analyzeSuccessReason: "根拠: {{reason}}",
      analyzeNotFoundTitle: "情報が見つかりませんでした",
      analyzeNotFoundMessage: "手入力で補ってください。",
      analyzeFailedTitle: "解析に失敗しました",

      basicSectionTitle: "基本情報",
      titleLabel: "タイトル",
      titlePlaceholder: "例：サラダチキン（ローソン）",
      brandLabel: "ブランド（任意）",
      brandPlaceholder: "ローソン / 明治 など",
      photoLabel: "写真（任意）",
      photoPickButton: "写真を選ぶ",
      barcodeButton: "バーコードから記録",

      nutritionSectionTitle: "栄養（手入力）",
      nutritionDescription:
        "必要に応じてkcal / P / F / Cを入力してください。",
      kcalLabel: "kcal",
      pLabel: "P（g）",
      fLabel: "F（g）",
      cLabel: "C（g）",
      zeroPlaceholder: "0",

      previewLabel:
        "合計: {{kcal}} kcal / P {{protein}}g / F {{fat}}g / C {{carbs}}g / {{grams}}g",

      baseSaveButton: "今の数値を基準にする",
      resetButton: "リセット",

      quantitySectionTitle: "数量・分量",
      quantityLabel: "数量（×倍）",
      gramsLabel: "分量（g）",
      sliderHelpButton: "？ヘルプ",
      sliderHelpTitle: "スライダーの使い方",
      sliderHelpBody:
        "1) PFC/kcal と g を入力（または写真/バーコードで自動入力）\n2) 「今の数値を基準にする」で基準保存\n3) 数量（×倍）や分量（g）を動かすと比例して自動調整",

      targetSectionTitle: "記録先",
      dateLabel: "日付",
      mealTypeLabel: "区分",
      saveButton: "保存する",

      calendarTitle: "日付を選択",
      calendarFallback:
        "カレンダーが未導入です。手入力してください（YYYY-MM-DD）。",
      calendarCancel: "キャンセル",
      calendarDecide: "決定",
    },
    search: {
      queryPlaceholder: "商品名や食材名で検索（例：プロテイン、ヨーグルト）",
      searchButton: "検索",
      scanBarcodeButton: "バーコードをスキャン",
      recordMealButton: "食事を記録",

      favoritesOnlyChip: "★ お気に入りのみ",

      headerFrequent: "よく使う",
      headerRecent: "使用履歴",

      searchingLabel: "検索中…",
      noResultMessage:
        "商品がヒットしませんでした。\n" +
        "・キーワードを短くして再検索してみてください（例：鶏むね → 鶏、ヨーグルト → ヨーグ）\n" +
        "・食材名で検索（例：鶏むね肉 / 玄米 / ブロッコリー）\n" +
        "・カテゴリ名でも検索可能（例：パスタ / ヨーグルト / プロテイン）\n" +
        "・バーコードスキャンもお試しください",

      loadMoreButton: "さらに読み込む",

      noImageLabel: "No Image",
      untitled: "（無題）",
      relogButton: "再記録",
      usedCount: "{{count}}回",

      defaultMealTitle: "食事",
      relogSuccessTitle: "再記録しました",
      relogSuccessMessage: "{{title}} を今日の記録に追加しました。",

      searchErrorTitle: "検索エラー",
      unknownName: "(名称不明)",

      sort: {
        relevance: "関連順",
        kcalAsc: "低カロリー順",
        kcalDesc: "高カロリー順",
        proteinDesc: "高たんぱく順",
        updatedDesc: "更新が新しい順",
      },

      kcalPer100g: "{{value}} kcal/100g",
      kcalPer100gUnknown: "- kcal/100g",
      proteinPer100g: "P {{value}}g/100g",
      proteinPer100gUnknown: "P -g/100g",
      fatPer100g: "F {{value}}g/100g",
      fatPer100gUnknown: "F -g/100g",
      carbsPer100g: "C {{value}}g/100g",
      carbsPer100gUnknown: "C -g/100g",
    },
    detail: {
      loading: "読み込み中…",
      notFound: "見つかりませんでした。",

      deleteConfirmTitle: "削除しますか？",
      deleteConfirmMessage: "この記録を削除します。元に戻せません。",
      deleteCancel: "キャンセル",
      deleteConfirm: "削除する",
      deletedTitle: "削除しました",

      recordSectionTitle: "記録",
      nutritionSectionTitle: "分量・栄養",
      amountLabel: "分量",
      untitled: "無題",

      mealTypeBreakfast: "朝食",
      mealTypeLunch: "昼食",
      mealTypeDinner: "夕食",
      mealTypeSnack: "間食",

      editButton: "編集する",
    },
    edit: {
      loading: "読み込み中…",
      errorTitle: "エラー",
      errorPhotoMessage: "写真の追加で問題が発生しました。もう一度お試しください。",
      fallbackTitle: "無題",

      confirmRemovePhotoTitle: "確認",
      confirmRemovePhotoMessage: "写真を削除しますか？",
      confirmRemovePhotoCancel: "キャンセル",
      confirmRemovePhotoOk: "削除",

      labelTitle: "タイトル",
      labelCalories: "カロリー(kcal)",
      labelMemo: "メモ",

      buttonChangePhoto: "写真を変更",
      buttonAddPhoto: "写真を追加",
      buttonRemovePhoto: "写真を削除",
      buttonSave: "保存",
    },
  },
  about: {
    rows: {
      appName: "アプリ名",
      version: "バージョン",
      buildNumber: "ビルド番号",
      appId: "アプリID",
      device: "デバイス",
      os: "OS",
      updatesChannel: "Updates / channel",
      updatesUpdateId: "Updates / updateId",
      updatesRuntimeVersion: "Updates / runtimeVersion",
      empty: "—",
    },
    updateCheck: {
      unsupportedTitle: "未対応",
      unsupportedMessage: "このビルドでは EAS Update の即時チェックは利用できません。",
      applyingTitle: "更新を適用します",
      applyingMessage: "OKを押すとアプリが再起動します。",
      applyingOk: "OK",
      applyingCancel: "キャンセル",
      latestTitle: "最新です",
      latestMessage: "新しい更新は見つかりませんでした。",
      failedTitle: "更新に失敗しました",
      failedMessageFallback: "不明なエラーが発生しました。",
      buttonChecking: "確認中…",
      buttonCheckNow: "今すぐ更新を確認",
    },
    store: {
      buttonOpenStore: "ストアを開く",
    },
  },
  data: {
    title: "データとプライバシー",
    subtitle: "バックアップ／復元／データ消去",

    row_async: "AsyncStorage",
    row_sqlite: "SQLite 合計",
    row_lastExport: "最終エクスポート",

    export_title: "バックアップを書き出す",
    export_subtitle: "アプリ設定（AsyncStorage）＋ローカルDB（SQLite）を1つのJSONに保存します。",
    export_button: "エクスポート",
    export_processing: "処理中…",
    export_share_dialog_title: "バックアップを共有",
    export_tip:
      "共有ダイアログを使うには expo-sharing が必要です。なくても {{dir}} にファイルは保存されます。",

    import_title: "バックアップを復元する",
    import_subtitle: "JSON を選んで復元します（現在のデータは上書き）。",
    import_button: "インポート",
    import_processing: "処理中…",
    import_tip:
      "expo-document-picker が無い場合：{{path}} に JSON を置けばインポートできます（上級者向け）。",

    list_title: "バックアップ一覧",
    list_subtitle: "端末内に保存されているバックアップ",
    list_loading: "読み込み中…",
    list_empty: "まだバックアップがありません。",
    list_share_button: "共有",
    list_restore_button: "復元",
    list_share_path_title: "ファイルパス",
    list_share_failed_title: "共有できませんでした",

    reset_title: "全データの消去",
    reset_subtitle: "端末内のユーザーデータを完全に削除します（不可逆）。",
    reset_button: "全データを消去",

    alert_error_title: "エラー",
    alert_error_no_doc_dir: "ドキュメントディレクトリにアクセスできません。",

    alert_export_done_title: "完了",
    alert_export_done_body: "バックアップを書き出しました。",

    alert_import_confirm_title: "バックアップを復元",
    alert_import_confirm_body:
      "現在のデータ（AsyncStorage と SQLite）は上書きされます。よろしいですか？",
    alert_import_confirm_cancel: "キャンセル",
    alert_import_confirm_ok: "復元する",

    alert_import_not_possible_title: "インポートできません",
    alert_import_not_possible_body:
      "expo-document-picker が未導入です。次の場所に JSON を置いてください:\n\n{{path}}",

    alert_import_not_supported: "このバックアップ形式はサポートされていません。",
    alert_import_no_file: "ファイルが選択されていません。",

    alert_import_done_title: "復元完了",
    alert_import_done_body: "必要に応じてアプリを Reload してください。",

    alert_wipe_confirm_title: "全データの消去",
    alert_wipe_confirm_body:
      "この端末内のユーザーデータ（AsyncStorage と SQLite）を完全に消去します。よろしいですか？",
    alert_wipe_confirm_cancel: "やめる",
    alert_wipe_confirm_ok: "消去する",

    alert_wipe_done_title: "完了",
    alert_wipe_done_body:
      "端末内のユーザーデータを消去しました。必要に応じて Reload してください。",
    alert_wipe_error_title: "消去エラー",
  },
  support: {
    title: "サポート",
    subtitle: "お問い合わせ／診断情報／FAQ",

    section_contact_title: "お問い合わせ",
    contact_button_email: "メールで問い合わせる",
    contact_tip1_prefix: "スムーズな対応のため、",
    contact_tip1_emphasis: "再現手順 / OS・機種 / 画面名",
    contact_tip1_suffix: " を書いていただけると助かります。",
    contact_tip2:
      "皆様のお声を取り入れてより良いアプリへ変化させていきたいと考えております。\n改善や追加してほしい機能がありましたらお気軽にお問い合わせください。",

    section_diag_title: "診断情報",
    section_diag_subtitle: "端末・アプリ状態のサマリー（不具合報告に添付推奨）",
    diag_loading: "収集中…",
    row_app_version: "アプリ / バージョン",
    row_device_os: "機種 / OS",
    row_theme: "テーマ",
    row_async: "AsyncStorage",
    row_sqlite: "SQLite 合計",
    theme_light: "ライト",
    theme_dark: "ダーク",
    diag_copy_button: "診断情報をコピー",
    diag_share_button: "診断情報をJSONで共有",

    section_faq_title: "よくある質問",
    faq_q1: "バックアップはどこに保存されますか？",
    faq_a1:
      "「データとプライバシー」画面のエクスポートで作成すると、端末内の次のフォルダにJSONが保存されます。\n{{dir}}backups/",
    faq_q2: "診断情報に個人情報は含まれますか？",
    faq_a2:
      "含みません。アプリ名/バージョン、端末情報、ローカル保存量などの技術的メタデータのみです。",
    faq_q3: "画面が固まった時は？",
    faq_a3:
      "一度アプリを再起動してください。改善しない場合は、診断情報をJSONで共有の上、メールでご連絡ください。",
    reload_button: "強制 Reload（開発用）",

    footer_version: "バージョン: {{version}} ・ SDK: {{sdk}}",

    alert_copy_done_title: "コピーしました",
    alert_copy_done_body: "診断情報をクリップボードにコピーしました。",
    alert_copy_fail_title: "コピー失敗",

    alert_share_dialog_title: "診断情報を共有",
    alert_file_path_title: "ファイルパス",
    alert_share_error_title: "共有エラー",
    alert_error_title: "エラー",

    email_subject: "[FitGear] サポート依頼 ({{version}})",
    email_intro:
      "以下のテンプレに沿ってご記入ください。\n\n■発生している問題:\n\n■再現手順:\n1) \n2) \n3) \n\n----（以下は自動収集の診断情報です。追記・削除OK）----",
    email_open_failed_title: "メールを開けませんでした",
    email_open_failed_body:
      "本文はコピー済みです。メールアプリに貼り付けて送信してください。",

    open_url_failed_title: "開けませんでした",
  },
  goals: {
    title: "目標・体データ",
    subtitle: "数値は空でも保存できます。入れた項目だけが要約に反映されます。",

    loading: "読み込み中...",

    storage_missing:
      "⚠️ AsyncStorage が見つかりません。保存は行えません（表示のみ）。依存を追加する場合：@react-native-async-storage/async-storage",

    section_body_title: "目標（体重・体脂肪）",
    section_nutrition_title: "栄養目標（1日）",

    field_weight: "目標体重",
    field_body_fat: "目標体脂肪率",
    field_kcal: "カロリー",
    field_p: "たんぱく質",
    field_f: "脂質",
    field_c: "炭水化物",

    placeholder_weight: "例: 80.0",
    placeholder_body_fat: "例: 18",
    placeholder_kcal: "例: 2200",
    placeholder_p: "例: 120",
    placeholder_f: "例: 50",
    placeholder_c: "例: 260",

    unit_kg: "kg",
    unit_percent: "%",
    unit_kcal: "kcal",
    unit_g: "g",

    macro_line: "概算：{{kcal}} kcal（P×4 + F×9 + C×4）",
    macro_hint_empty:
      "目標カロリーを入力するとズレが表示されます。±50kcal以内が目安。",
    macro_diff: "目標との差：{{diff}} kcal",

    button_save: "保存する",
    button_saving: "保存中...",
    button_clear: "入力をクリア",
    bar_close: "閉じる",
    bar_save: "保存",

    error_range: "{{range}} の範囲で入力してください",
    range_weight: "30–200kg",
    range_body_fat: "3–60%",
    range_kcal: "800–5000kcal",
    range_p: "0–300g",
    range_f: "0–200g",
    range_c: "0–800g",

    alert_no_storage_title: "保存できません",
    alert_no_storage_body:
      "AsyncStorage が見つかりません。依存を追加するか、後でお試しください。",
    alert_input_error_title: "入力エラー",
    alert_input_error_body: "赤字の項目を修正してください。",
    alert_saved_title: "保存しました",
    alert_saved_body: "設定が保存されました。設定トップに要約が反映されます。",
    alert_save_failed_title: "保存に失敗",
    alert_save_failed_body: "もう一度お試しください。",
  },
  notifications: {
    title: "通知",
    subtitle: "リマインダーを設定すると、習慣化がグッと楽になります。",
    loading: "読み込み中...",

    perm_module_missing: "通知モジュール未導入（保存は可能／端末登録はスキップ）",
    perm_granted: "通知：許可",
    perm_denied: "通知：拒否（端末の設定から許可が必要）",
    perm_unknown: "通知：未確認",

    button_request_perm: "通知を許可する",

    section_training_title: "トレーニングのリマインダー",
    section_meals_title: "食事のリマインダー",
    section_weekly_title: "週間レビュー",

    switch_enabled: "有効にする",

    training_slot_label: "スロット {{index}}",
    button_delete: "削除",
    button_add_slot: "＋ スロットを追加",

    time_label: "時刻",
    time_label_with_index: "時刻 {{index}}",
    button_add_time: "＋ 時刻を追加",

    dow_sun: "日",
    dow_mon: "月",
    dow_tue: "火",
    dow_wed: "水",
    dow_thu: "木",
    dow_fri: "金",
    dow_sat: "土",

    accessibility_add_suffix: "曜日を追加",
    accessibility_remove_suffix: "曜日を除外",

    actions_title: "アクション",

    button_save: "保存する",
    button_saving: "保存中...",
    bar_close: "閉じる",
    bar_save: "保存",

    alert_perm_needed_title: "権限が必要です",
    alert_perm_needed_body: "端末の設定から通知を許可してください。",
    alert_perm_error_title: "エラー",
    alert_perm_error_body: "通知権限のリクエストに失敗しました。",

    alert_no_storage_title: "保存できません",
    alert_no_storage_body:
      "AsyncStorage が見つかりません。依存を追加して再度お試しください。",
    alert_saved_title: "保存しました",
    alert_saved_with_schedule: "設定と通知スケジュールを更新しました。",
    alert_saved_without_module:
      "設定を保存しました（通知モジュール未導入のため端末登録はスキップ）。",
    alert_save_error_title: "保存エラー",
    alert_save_error_body: "もう一度お試しください。",

    training_noti_title: "トレーニングの時間です",
    training_noti_body: "準備ができたらメニューを開始しましょう！",
    meals_noti_title: "食事の記録リマインダー",
    meals_noti_body: "食べたらすぐに“食事”タブで記録しておくと楽です。",
    weekly_noti_title: "週間レビューの時間です",
    weekly_noti_body: "1週間の体重/食事/トレを振り返りましょう。",

    warn_requires_module:
      "⚠️ 端末への登録には通知モジュールの導入と権限許可が必要です。\n・モジュール：expo-notifications\n・権限：アプリの通知をON",
  },
  help_home: {
    title: "ホーム",
    summary:
      "今日のタスク・進捗・AIアドバイスの受け取り。最新の体重/体脂肪を大きく表示し、合計カロリーも確認できます。",
    capabilities: [
      "今日の合計カロリー・進捗の把握",
      "最新の体重/体脂肪のハイライト表示（体組成の最新記録を自動反映）",
      "AIアドバイスの確認・保存",
      "Pull to Refresh で手動更新",
    ],
    howto: [
      {
        title: "AIアドバイスを受け取る",
        steps: [
          "「今日の内容でアドバイスを生成」を押す",
          "回答が自動で記録されます",
        ],
      },
      {
        title: "表示を最新にする",
        steps: ["画面を上から引っ張る（Pull to Refresh）", "最新の記録/合計が反映されます"],
      },
    ],
    tips: [
      "AIアドバイスは短文OK。状況（期間・頻度・目標）を書くと精度UP。",
      "ホームの最新値は、体組成タブの“直近の日付”の記録が反映されます。",
    ],
    actions: [{ label: "ホームへ移動", deepLink: "/(tabs)/home" }],
    faq: [
      {
        q: "AIアドバイスの入力欄が勝手に開く/閉じない",
        a: "最新版ではボタン押下時のみ開きます。閉じるには右上✕、またはモーダル外タップ。改善しない場合は不具合報告をお願いします。",
        keywords: ["AI", "モーダル", "閉じる"],
        deepLink: "/(tabs)/home",
      },
      {
        q: "ホームの数値が更新されない",
        a: "バックグラウンド復帰時に再取得します。Pull to Refresh もお試しください。",
        keywords: ["更新", "同期", "リフレッシュ"],
      },
    ],
  },

  help_training: {
    title: "トレーニング",
    summary:
      "メニュー実施・タイマー・フォーム記録・完了登録。誤タップ防止のため、秒数ボタン以外ではタイマーは起動しません。",
    capabilities: [
      "各セットの重量/回数/メモの記録",
      "インターバルタイマー（秒数ボタンのみで起動）",
      "完了バーからの確定保存",
      "各セットの編集・再入力",
    ],
    howto: [
      {
        title: "セットを記録する",
        steps: [
          "対象エクササイズの入力欄に重量/回数を入力",
          "必要に応じてメモも入力",
          "キーボード上の“完了バー”→保存で確定",
        ],
      },
      {
        title: "タイマーを使う",
        steps: [
          "秒数ボタンをタップしてカウント開始",
          "他の領域を触っても動かない設計（誤操作防止）",
          "必要に応じて再スタート/停止",
        ],
      },
      {
        title: "編集する",
        steps: [
          "各セットの右側にある“編集”から値を変更",
          "保存で反映。うまくいかない場合は一度保存→再編集",
        ],
      },
    ],
    tips: [
      "入力フォーカス中は“完了バー”がキーボード直上に密着表示されます。",
      "余白タップでタイマーが動くことはありません（動く場合は不具合の可能性）。",
    ],
    actions: [{ label: "トレーニングへ移動", deepLink: "/(tabs)/training" }],
    faq: [
      {
        q: "余白をタップするとタイマーが勝手に動く",
        a: "現行仕様では秒数ボタン以外で起動しません。もし動作する場合は、操作手順と端末情報を添えてご報告ください。",
        keywords: ["タイマー", "誤タップ", "自動開始"],
        deepLink: "/(tabs)/training",
      },
      {
        q: "完了ボタンが見つからない/遠い",
        a: "入力フォーカス中はキーボード上に“完了バー”が出ます。見切れる場合は一度キーボードを閉じるか、画面を少しスクロールしてください。",
        keywords: ["完了", "キーボード", "バー"],
      },
    ],
  },

  help_meals: {
    title: "食事",
    summary:
      "写真・メモ・カロリー・PFCの記録。日/週の合計を自動集計し、ホームにハイライトします。",
    capabilities: [
      "食事の写真/メモ/カロリー/PFCの保存",
      "“最近の記録”からの再利用（入力時短）",
      "日/週の合計カロリー/栄養の確認",
      "登録済みの食事の編集/削除",
    ],
    howto: [
      {
        title: "食事を新規追加",
        steps: [
          "「新規追加」を開く",
          "食事の種類（朝/昼/夜/間食）を選ぶ",
          "写真（任意）・カロリー・PFC・メモを入力",
          "保存を押して確定",
        ],
      },
      {
        title: "同じメニューを再利用",
        steps: [
          "入力画面で“最近の記録”を開く",
          "対象のメニューを選び、量だけ調整して保存",
        ],
      },
    ],
    tips: [
      "写真なしでもOK。数値だけで素早く登録できます。",
      "週合計の把握で“食べ過ぎ/足りない”を早期に修正。",
    ],
    actions: [
      { label: "食事へ移動", deepLink: "/(tabs)/meals" },
      { label: "新規追加", deepLink: "/(tabs)/meals/new" },
    ],
    faq: [
      {
        q: "画像のプレースホルダーでビルドが失敗する",
        a: "アセットの相対パスが正しいか確認してください。存在しない path を require するとバンドルエラーになります（例：../../../assets/placeholder.png）。",
        keywords: ["画像", "アセット", "バンドル"],
        deepLink: "/(tabs)/meals",
      },
    ],
  },

  help_body: {
    title: "体組成",
    summary:
      "体重・体脂肪・ウエスト等の記録。ホームの“最新値”は体組成の直近日の記録を自動反映します。",
    capabilities: [
      "体重/体脂肪/ウエスト/メモ/計測時刻の記録",
      "過去記録の編集/削除",
      "期間フィルタによるグラフ表示の軽量化",
      "ホームへの“最新値”自動反映",
    ],
    howto: [
      {
        title: "新しく記録する",
        steps: [
          "体組成タブを開く",
          "日付を“今日”に合わせる（必要に応じて変更）",
          "数値とメモを入力して保存",
        ],
      },
      {
        title: "過去の記録を直す",
        steps: ["一覧から対象の記録をタップ", "数値を修正して保存"],
      },
      {
        title: "グラフを軽くする",
        steps: [
          "画面上部の期間フィルタを短め（日/週など）に変更",
          "必要な範囲だけ表示して確認",
        ],
      },
    ],
    tips: [
      "ホームの最新値が出ないときは、体組成の“日付”が今日か確認。",
      "複数回計測した日は、もっとも遅い時刻の記録が見やすいです。",
    ],
    actions: [{ label: "体組成へ移動", deepLink: "/(tabs)/body" }],
    faq: [
      {
        q: "本日の記録がホームに出ない",
        a: "体組成タブで“今日”の日付で保存されているか確認してください。日付がズレている場合は修正してください。",
        keywords: ["ホーム", "反映", "日付"],
        deepLink: "/(tabs)/body",
      },
    ],
  },

  help_gotore: {
    title: "合トレ（ゴウトレ）",
    summary:
      "近くの合トレ相手を探して“いいね”→相互でマッチ→チャットまでを一気通貫で行えます。地域/タグ/ジム名・本人確認の有無で絞り込み、あなたの性別に応じて「男女問わず」か「同性のみ」を選べます。",
    capabilities: [
      "地域（都道府県）ベースの近場優先表示",
      "マッチ対象（男女問わず / 同性のみ）の切替（※あなたの性別に応じた候補のみ表示）",
      "タグ・ホームジム名・本人確認済み限定・既にいいね済みを隠す等のフィルタ",
      "スワイプまたはボタンで LIKE/NOPE、相互で自動マッチ",
      "受信いいねリスト（未読バッジ付き）→ 即マッチ化",
      "マッチ一覧（未読数表示）→ チャットへ",
      "チャットでテキスト/画像送受信、長押しメニュー（コピー・削除・保存/共有）、既読表示",
      "ブロック/マッチ解除（トラブル対策）",
    ],
    howto: [
      {
        title: "はじめての合トレ（セットアップ）",
        steps: [
          "「プロフィール/設定」で“地域（都道府県）”を設定（必須）",
          "「合トレ用プロフィール」でニックネーム/自己紹介/写真/タグ等を整える",
          "合トレタブを開き、右上「条件」から必要ならフィルタを設定",
          "候補カードを確認し、♥（いいね）または✕で進める（相互 ♥ でマッチ）",
        ],
      },
      {
        title: "マッチ対象（男女の絞り込み）を切り替える",
        steps: [
          "合トレ画面 → 右上「条件」を開く",
          "“マッチ対象”で希望を選択",
          "男性: 「男女問わず」か「男同士のみ」／ 女性: 「男女問わず」か「女同士のみ」",
          "性別が未設定/その他の場合は「男女問わず」のみ選択可能",
          "「この条件で表示」を押して反映",
        ],
      },
      {
        title: "検索を絞り込む（タグ/ホームジム/本人確認）",
        steps: [
          "合トレ画面 → 右上「条件」を開く",
          "タグ: カンマ区切りで入力（例: ベンチ, デッド, スクワット）",
          "ホームジム: 部分一致で検索（例: 渋谷 / ゴールド）",
          "“本人確認済のみ表示”をONにすると、バッジ付きユーザーだけに限定",
          "“自分がいいね済みを隠す”で既に送った相手を省き、見落とし防止",
        ],
      },
      {
        title: "受信いいね→マッチ→チャット",
        steps: [
          "合トレ画面右上「受信」を開く（未読バッジが件数を表示）",
          "気になる相手に ♥ を返すと即マッチ",
          "マッチすると“マッチしました！”の演出 → 「チャットへ」",
          "チャットではテキスト/画像送信、長押しでコピー/削除/保存/共有が可能",
        ],
      },
      {
        title: "トラブル対策（ブロック / マッチ解除）",
        steps: [
          "チャット画面の右上“⋯”を開く",
          "相手を表示/連絡不可にする場合は「ブロック」",
          "会話のみ解消したい場合は「マッチを解除」",
        ],
      },
    ],
    tips: [
      "地域未設定だと候補が出ません。まずは都道府県を設定してください。",
      "候補が少ない時は、タグを減らす/本人確認限定をOFF/ホームジムのキーワードを緩めると表示が増えます。",
      "写真は“顔+全身/トレーニング風景”の1枚目が効果的。最新の1枚目がカードに出ます。",
      "合トレ用プロフィールの“タグ/時間帯/曜日”を埋めるとマッチ精度UP。",
      "いいね残数が0の時は購入モーダルから追加可能です。",
    ],
    actions: [
      { label: "合トレを開く", deepLink: "/(tabs)/gotore" },
      { label: "地域設定（アカウント）", deepLink: "/(tabs)/me/account" },
    ],
    faq: [
      {
        q: "「男同士のみ」にしているのに女性が出てくる",
        a:
          "次の可能性があります：①あなたの性別が未設定/その他 → 同性フィルタが適用されません。性別を設定してください。②直前に条件を変えたがデッキ（候補リスト）が古い → 条件モーダルで「この条件で表示」を押すか、画面を引っ張って更新。③相手の性別が未設定/確認中 → 一時的に“未設定”扱いで混在することがあります（カードの性別表示やプロフィールで確認可能）。改善しない場合は一度アプリ再起動/再ログインをお試しください。",
        keywords: ["男同士", "女性が出る", "フィルタ", "性別"],
        deepLink: "/(tabs)/gotore",
      },
      {
        q: "本人確認で性別が修正された/変わった場合の挙動は？",
        a:
          "本人確認の結果に応じてあなたの性別が更新されると、選べるマッチ対象（男女問わず/同性のみ）の選択肢も自動で切り替わります。切替後に候補へ反映するには「条件」→「この条件で表示」またはPull to Refreshを実行してください。",
        keywords: ["本人確認", "性別", "変更", "同期"],
      },
      {
        q: "候補が表示されない/すぐ尽きる",
        a:
          "地域が未設定だと候補は出ません（同じ都道府県のユーザーのみ表示）。また、タグやホームジムの条件を緩める・“本人確認のみ”をOFF・“いいね済みを隠す”をOFFにすると候補が増えます。しばらく時間を置くと新しい候補が追加されることもあります。",
        keywords: ["候補なし", "地域", "条件", "フィルタ"],
        deepLink: "/(tabs)/me/account",
      },
      {
        q: "相手の性別が「未設定/アンノーン」と出る",
        a:
          "相手が性別未設定/審査中の場合や、カード描画時に性別情報の取得が間に合っていない場合に一時的に表示されます。プロフィール詳細を開くと最新の性別が反映されることがあります。",
        keywords: ["性別", "未設定", "unknown"],
      },
      {
        q: "いいねが尽きた",
        a:
          "「♥」を押した時点でいいね残数を1消費します。残数が0の場合は購入モーダルが開きます。購入後は自動で残数が反映されます（反映されない場合は再読み込み）。",
        keywords: ["いいね", "残数", "購入"],
      },
      {
        q: "写真が真っ暗/表示されない",
        a:
          "1枚目のプロフィール写真が存在しない・権限が切れている・古いURLを参照している可能性があります。合トレ用プロフィールで1枚目の写真を再設定し、数秒待って再表示してください。",
        keywords: ["写真", "表示されない", "1枚目"],
        deepLink: "/(tabs)/gotore/profile/edit",
      },
      {
        q: "マッチ後の連絡を止めたい（迷惑/不快）",
        a:
          "チャット画面右上“⋯”から「ブロック」または「マッチを解除」を選べます。ブロックは相手からの表示・連絡を停止、マッチ解除は会話のみ終了します。",
        keywords: ["ブロック", "マッチ解除", "通報"],
        deepLink: "/(tabs)/gotore/matches",
      },
    ],
  },

  help_profile: {
    title: "プロフィール/設定",
    summary: "基本情報・目標・通知設定・アプリ情報（バージョン）を管理します。",
    capabilities: [
      "身長/年齢/目標値などのプロフィール編集",
      "通知のON/OFFや時間帯の調整",
      "アプリのバージョン確認（問い合わせ時に便利）",
    ],
    howto: [
      {
        title: "通知を有効化/時間を調整",
        steps: ["プロフィール/設定を開く", "通知スイッチをON", "時間帯を選んで保存"],
      },
      {
        title: "バージョンを確認",
        steps: ["設定画面の最下部“アプリ情報”を確認", "問い合わせ時はこの番号を一緒に送る"],
      },
    ],
    tips: ["通知が来ない場合は、端末側の通知設定もご確認ください。"],
    actions: [{ label: "プロフィールへ移動", deepLink: "/(tabs)/me" }],
    faq: [
      {
        q: "アプリのバージョンを確認したい",
        a: "設定画面の最下部“アプリ情報”に表記しています。お問い合わせ時はこの番号も添えてください。",
        keywords: ["バージョン", "情報", "設定"],
        deepLink: "/(tabs)/me",
      },
    ],
  },
  help_screen: {
    title: "ヘルプ",
    subtitle: "各タブの使い方・FAQ・お問い合わせ",
    search_placeholder: "キーワードで検索（例：タイマー / 体重 反映 / 追加 など）",
    filter_onlySection: "「{{title}}」のみ表示中",
    filter_clear: "◀ 絞り込みを解除",

    support_title: "困ったときは？",
    support_body:
      "まずは該当タブのFAQをご確認ください。解決しない場合は詳細を添えてご連絡ください。",
    support_button: "お問い合わせ / 不具合報告を送る",

    block_capabilities: "できること",
    block_howto: "使い方",
    block_tips: "クイックTIPS",
    block_faq: "よくある質問",

    link_open_related: "関連画面を開く",

    footer_ios: "iOS: 省電力やバックグラウンド制限で同期が遅れる場合があります。",
    footer_android:
      "Android: 省電力やバックグラウンド制限で同期が遅れる場合があります。",

    theme_auto: "自動",
    theme_light: "ライト",
    theme_dark: "ダーク",
    theme_toggle: "テーマを{{mode}}に切り替え",

    accessibility_showSectionHelp: "{{title}}のヘルプを表示",
    accessibility_openContact: "お問い合わせを開く",
    accessibility_toggleFaq_open: "{{title}}の回答を開く",
    accessibility_toggleFaq_close: "{{title}}の回答を閉じる",

    mail_subject: "【FitGear】お問い合わせ/不具合報告",
    mail_body:
      "以下をご記入ください：\n・発生画面：\n・操作手順：\n・期待した動作：\n・実際の動作：\n・再現性（毎回/時々）：\n\n※ スクリーンショット/画面収録があると助かります。",
  },
  explore: {
    categories: {
      workout: "筋トレ",
      motivation: "モチベ",
      music: "音楽",
      news: "ニュース",
      fav: "お気に入り",
      all: "おすすめ",
    },
    search_placeholder_news: "ニュースを検索",
    search_placeholder_fav: "お気に入りを検索（タイトル内）",
    search_placeholder_default: "動画を検索（キャッシュ内）",

    offline_title: "オフラインです",
    offline_body: "ネットワークに接続して再試行してください。",
    error_title: "読み込みエラー",
    error_generic: "読み込みに失敗しました",
    retry: "再読み込み",

    fav_empty_title: "お気に入りは空です",
    fav_empty_body: "動画の♥をタップして登録できます。",

    open_in_youtube: "YouTubeで開く",
    fav_add_label: "お気に入り",
    fav_remove_label: "お気に入り解除",
  },

};

export default ja;
