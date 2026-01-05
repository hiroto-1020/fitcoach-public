const ko = {
  app: {
    name: "FitGear",
  },

  ui: {
    cancel: "취소",
    ok: "확인",
    save: "저장",
    input: "입력",
    done: "완료",
  },

  home: {
    title: "홈",
    subtitle: "오늘도 조금씩 쌓아가요 💪",

    summary_title: "오늘 하루 총 영양",
    goal_button: "🎯 목표",
    loading: "불러오는 중…",
    total_badge_label: "합계",

    label_kcal: "kcal",
    label_p: "P (g)",
    label_f: "F (g)",
    label_c: "C (g)",

    body_today_label: "체성분: ",
    body_record_cta: "체성분을 기록하기 →",

    button_meal_record: "식단 기록하기",
    button_product_search: "상품 찾아보기",
    button_quick_body: "오늘 체중 빠르게 입력",

    ai_advice_title: "AI에게 식단 조언 받기",
    ai_advice_button: "오늘 식단으로 조언 생성",
    ai_advice_loading: "AI가 식단을 분석 중입니다… 🤖💭",

    goal_modal_title: "목표 PFC·kcal",

    calendar_title: "날짜 선택",
    calendar_manual_hint:
      "캘린더가 설치되어 있지 않습니다. (YYYY-MM-DD) 형식으로 직접 입력해주세요.",
    calendar_placeholder: "YYYY-MM-DD",

    quick_title: "오늘 체중 빠르게 입력",
    quick_weight_label: "체중 (kg)",
    quick_weight_placeholder: "예: 68.2",
    quick_bodyfat_label: "체지방률 (선택)",
    quick_bodyfat_placeholder: "예: 13.0",

    alert_weight_title: "체중 값을 확인해주세요",
    alert_weight_message:
      "20~300 kg 범위에서 입력해주세요.",
    alert_bodyfat_title: "체지방 값을 확인해주세요",
    alert_bodyfat_message: "2~60% 범위에서 입력해주세요.",
    alert_saved_title: "저장되었습니다",
    alert_saved_message:
      "체성분 탭 그래프에도 반영됩니다.",

    // ▼ 오늘의 트레이닝 카드
    training_today: {
      title: "오늘의 트레이닝",
      pr_badge: "🎉 PR 갱신",
      badge_has_record: "기록 있음",
      badge_no_record: "기록 없음",
      empty_message:
        "아직 셋트가 없습니다. 오늘 기록을 시작해 보세요.",
      summary_exercises: "종목",
      summary_sets: "셋트",
      summary_reps: "횟수",
      summary_tonnage: "톤수",
      set_line: "{{weight}} {{unit}} × {{reps}} 회",
      cta_continue: "계속 기록하기",
      cta_start_today: "오늘 기록하기",
      cta_calendar: "캘린더",
    },
  },
  home_tab: {
    title: "홈",
    help_label: "도움말",
    help_accessibility: "홈 도움말 열기",
  },

  auth: {
    login: "로그인",
    signup: "회원가입",
  },

  tabs: {
    home: "홈",
    record: "기록",
    explore: "탐색",
    gotore: "합트레",
    me: "마이페이지",

    training: "트레이닝",
    meals: "식단",
    body: "체성분",
    more: "기타",
    videos: "영상",
  },

  settings: {
    title: "설정",
    language: "언어",
    language_ja: "일본어",
    language_en: "영어",
    language_ko: "한국어",
    language_hint:
      "앱 전체의 표시 언어를 변경합니다. (홈 화면 등에도 적용됩니다)",
    description:
      "프로필, 목표, 알림, 앱 설정 등을 관리합니다.",
    readonlyNote:
      "※ 이 페이지는 읽기 전용입니다. 각 화면에서 편집 후 저장하면 여기 반영됩니다.",
    rowOpen: "“{{title}}” 열기",
    appSettings_title: "앱 설정",
    appSettings_desc: "테마, 햅틱 피드백, 언어를 설정합니다.",

    theme_title: "테마",
    theme_mode_label: "화면 모드",
    theme_auto: "자동",
    theme_light: "라이트",
    theme_dark: "다크",
    theme_accessibility: "{{label}} 테마로 변경",
    theme_preview_title: "미리보기",
    theme_preview_description: "현재 선택한 테마에서 카드가 어떻게 보이는지 예시입니다.",
    theme_current_prefix: "현재 선택: ",
    theme_current_auto: "자동 (기기: {{scheme}})",
    theme_preview_cardTitle: "카드 제목",
    theme_preview_cardBody:
      "본문 색상과 대비는 기기/테마 설정에 따라 달라집니다.",
    theme_preview_button: "버튼 예시 (햅틱)",
    language_accessibility: "{{label}}(으)로 언어 변경",

    haptics_title: "햅틱 피드백",
    haptics_label: "햅틱 피드백",
    haptics_hint:
      "버튼을 눌렀을 때 가벼운 진동으로 반응합니다. (저장 후 전체 화면에 적용)",
    haptics_test: "진동 테스트",

    memo_title: "메모",
    memo_body:
      "・테마 \"자동\"은 기기의 라이트/다크 설정을 따릅니다.\n" +
      "・이 화면에서 \"저장\"을 눌러야 전체 앱에 적용·저장됩니다.\n" +
      "・언어는 홈 화면 등 앱 텍스트에 적용됩니다.",

    alert_saved_title: "저장되었습니다",
    alert_saved_body: "설정이 앱 전체에 적용되었습니다.",
    alert_failed_title: "저장 실패",
    alert_failed_body: "다시 시도해 주세요.",

    accessory_close: "닫기",
    accessory_save: "저장",
    accessory_saving: "저장 중...",
    bottom_save: "저장하기",
    bottom_saving: "저장 중...",

    account: {
      title: "👤 계정",
      checking: "확인 중…",
      emailLabel: "이메일 주소",
      emailPlaceholder: "you@example.com",
      passwordLabel: "비밀번호",
      passwordPlaceholder: "6자 이상",
      signIn: "로그인",
      signUp: "회원 가입",
      signOut: "로그아웃",
      deleteAccount: "계정 삭제",
      enableBuddy: "합동 운동 모집 켜기",
      goBuddy: "합동 운동으로 이동",
      currentEmail: "이메일: {{email}}",
    },

    alert: {
      signInSuccess: "로그인되었습니다.",
      signInFailTitle: "로그인 실패",
      signUpSuccess: "계정이 생성되었습니다.",
      signUpFailTitle: "회원 가입 실패",
      signOutSuccess: "로그아웃되었습니다.",
      signOutFailTitle: "로그아웃 실패",
      buddyOnSuccess: "합동 운동 모집을 켰습니다.",
      updateFailTitle: "업데이트 실패",
      unknownError: "알 수 없는 오류",
    },

    profile: {
      nameUnset: "미설정",
      emailSignedOut: "미로그인",
      summary: "{{name}} / {{email}}",
    },

    goals: {
      weightWithUnit: "{{value}}kg",
      bodyFatWithUnit: "{{value}}%",
      kcalWithUnit: "{{value}}kcal",
      macroP: "P{{value}}",
      macroF: "F{{value}}",
      macroC: "C{{value}}",
      summary:
        "목표 {{weight}} / {{bodyFat}} · 영양 {{kcal}} ({{p}} {{f}} {{c}})",
    },

    notifications: {
      countTimes: "{{count}}회",
      weeklyOn: "주간 리뷰: ON",
      weeklyOff: "주간 리뷰: OFF",
      summary: "운동: {{training}} · 식사: {{meals}} · {{weekly}}",
    },

    app: {
      summary: "테마: {{theme}} · 진동 피드백: {{haptics}}",
      theme: {
        light: "라이트",
        dark: "다크",
        auto: "자동",
        unset: "미설정",
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
      summary: "{{weight}} / {{bodyFat}} ({{at}})",
    },

    export: {
      never: "마지막 내보내기: —",
      latest: "마지막 내보내기: {{datetime}}",
    },

    version: {
      value: "버전: {{version}}",
      none: "버전: —",
    },

    rows: {
      profile: { title: "프로필" },
      goals: { title: "목표 · 체성분" },
      notifications: { title: "알림" },
      language: {
        title: "언어 설정",
        subtitle: "앱 표시 언어를 변경합니다",
      },
      appSettings: { title: "앱 설정" },
      dataPrivacy: { title: "데이터 · 개인정보" },
      support: {
        title: "지원",
        subtitle: "문의 · 버그 신고",
      },
      about: { title: "앱 정보" },
      help: { title: "도움말" },
    },
  },
  account: {
    title: "계정",
    subtitle: "이 기기에 저장되는 표시 이름과 서버에 저장되는 합트레이닝 프로필을 수정합니다.",
    common: {
      loading: "불러오는 중…",
      saving: "저장 중…",
      close: "닫기",
      save: "저장",
      imagePickerMissingTitle: "이미지 라이브러리가 설치되지 않음",
      imagePickerMissingMessage: "expo-image-picker를 설치해 주세요.",
      loadErrorTitle: "불러오기 오류",
      loadErrorFallbackMessage: "알 수 없는 오류",
    },
    local: {
      cardTitle: "로컬 프로필 (이 기기)",
      displayNameLabel: "표시 이름",
      displayNamePlaceholder: "예: 타로",
      emailLabel: "이메일 (선택 / 로컬 표시용)",
      emailPlaceholder: "example@example.com",
      removeImageButton: "이미지 삭제",
      changeImageButton: "이미지 변경",
      saveSuccessTitle: "저장되었습니다",
      saveSuccessMessage: "로컬 프로필이 업데이트되었습니다.",
      saveErrorTitle: "저장에 실패했습니다",
      saveErrorMessage: "다시 시도해 주세요.",
      imageUpdatedTitle: "이미지가 업데이트되었습니다",
      imageUpdatedMessage: "저장 후 프로필에 반영됩니다.",
      imageLoadErrorTitle: "이미지를 불러오지 못했습니다",
      imageLoadErrorMessage: "다른 이미지로 시도해 주세요.",
      saveBarButton: "로컬 프로필 저장",
      saveBarSaving: "저장 중…",
    },
    gotore: {
      cardTitle: "합트레이닝 프로필 (서버)",
      nicknameLabel: "닉네임",
      nicknamePlaceholder: "예: 타로 / 사쿠라",
      genderLabel: "성별",
      homeGymLabel: "홈짐 (선택)",
      homeGymPlaceholder: "예: XX짐 시부야점",
      tagsLabel: "운동 태그 (쉼표 구분)",
      tagsPlaceholder: "벤치,데드리프트,스쿼트 등",
      bioLabel: "자기소개",
      bioPlaceholder: "운동 경력, 강점, 운동 가능한 시간대 등",
      trainingYearsLabel: "운동 경력 (년)",
      trainingYearsPlaceholder: "예: 3",
      heightLabel: "키 (cm)",
      heightPlaceholder: "예: 176",
      goalLabel: "목표",
      goalPlaceholder: "예: 3개월 -5kg / 벤치 100kg / 체지방 -5% 등",
      freqLabel: "빈도 (주당 횟수)",
      freqPlaceholder: "예: 3",
      freqPill: "주 {{n}}회",
      saveButton: "합트레이닝 프로필 저장",
      saveSuccessTitle: "저장되었습니다",
      saveSuccessMessage: "합트레이닝 프로필이 업데이트되었습니다.",
      saveErrorTitle: "저장 오류",
      saveNote: "※ 지역은 \"찾기\" 화면의 표시 및 필터에 사용됩니다(필수). 사진 목록의 첫 번째가 메인 사진입니다.",
    },
    gender: {
      male: "남성",
      female: "여성",
      other: "기타",
      unknown: "무응답",
    },
    region: {
      label: "지역 (도도부현) *필수",
      placeholder: "탭하여 선택",
      change: "변경",
      setFromCurrentLocation: "현재 위치로 설정",
      clear: "지우기",
      modalTitle: "도도부현 선택",
      searchPlaceholder: "예: 도쿄 / 후쿠오카",
      locationLibMissingTitle: "위치 모듈이 설치되지 않음",
      locationLibMissingMessage: "expo-location을 설치해 주세요.",
      cannotDetectTitle: "지역을 판별하지 못했습니다",
      cannotDetectMessage: "직접 선택해 주세요.",
      locationErrorTitle: "위치를 가져오지 못했습니다",
      locationErrorMessage: "직접 선택해 주세요.",
      missingTitle: "지역이 설정되지 않았습니다",
      missingMessage: "도도부현은 필수입니다. 설정해 주세요.",
    },
    photos: {
      label: "프로필 사진 (서버)",
      note: "드래그하여 순서를 변경 / 첫 번째 사진이 메인입니다. 길게 눌러 삭제. 최대 {{max}}장.",
      uploadErrorTitle: "업로드에 실패했습니다",
      uploadErrorMessageFallback: "알 수 없는 오류가 발생했습니다.",
      removeErrorTitle: "삭제에 실패했습니다",
      removeErrorMessageFallback: "알 수 없는 오류가 발생했습니다.",
    },
    kyc: {
      cardTitle: "본인 확인 (KYC)",
      personIdLabel: "ID:",
      status: {
        verified: "본인 확인 완료",
        pending: "심사 중",
        rejected: "반려",
        failed: "실패",
        unverified: "미확인",
      },
      description: {
        verified: "본인 확인이 완료되었습니다. 배지가 앱 내에 표시됩니다.",
        pending: "심사 중입니다. 잠시 후 \"상태 업데이트\"를 다시 시도해 주세요.",
        rejected: "반려되었습니다. 성별은 무응답으로 되돌렸습니다. 다시 성별을 선택하고 저장해 주세요.",
        failed: "판정에 실패했습니다. 촬영/이미지를 확인 후 다시 신청해 주세요.",
        unverified: "사칭 방지를 위해 신분증으로 본인 확인을 진행해 주세요.",
      },
      startButton: "본인 확인 시작하기",
      startButtonLoading: "시작하는 중…",
      retryButton: "다시 신청하기",
      retryButtonLoading: "재신청 중…",
      refreshButton: "상태 업데이트",
      refreshButtonLoading: "업데이트 중…",
      startErrorTitle: "본인 확인을 시작할 수 없습니다",
    },
    admin: {
      cardTitle: "관리자 메뉴",
      promoteSuccessTitle: "관리자 권한이 부여되었습니다",
      promoteSuccessMessage: "\"관리: 본인 확인 목록\"을 열 수 있습니다.",
      promoteErrorTitle: "권한 부여에 실패했습니다",
      selfPromoteNote: "※ {{emails}} 메일 계정으로 로그인한 경우에만 표시됩니다.",
      promoteButton: "관리자 권한 복구",
      openKycListButton: "관리: 본인 확인 목록 열기",
    },
    errors: {
      genderLocked: "성별은 한 번만 설정할 수 있습니다(다시 수정하려면 관리자 토큰이 필요합니다).",
      genderUpdateBlocked: "현재는 성별을 변경할 수 없습니다(심사 중 / 잠금 상태).",
      kycPending: "본인 확인 심사 중에는 성별을 변경할 수 없습니다.",
      invalidOrUsedToken: "편집 토큰이 잘못되었거나 이미 사용되었습니다.",
      invalidGender: "선택한 성별이 올바르지 않습니다.",
      profileNotFound: "프로필이 생성되지 않았습니다. 화면을 다시 열어 주세요.",
      genderUpdateNotAllowed: "현재는 성별을 변경할 수 없습니다.",
      unknown: "알 수 없는 오류가 발생했습니다.",
      notAuthenticatedTitle: "로그인되지 않음",
      notAuthenticatedMessage: "먼저 설정 → 계정에서 로그인해 주세요.",
    },
  },
  me: {
    back: "뒤로 가기",
    settings: "설정",
    account: "계정",
    goals: "목표·신체 데이터",
    notifications: "알림",
    appSettings: "앱 설정",
    dataPrivacy: "데이터 및 개인정보",
    support: "지원",
    about: "앱 정보",
  },

  record: {
    switch_hint:
      "위의 칩에서 각 기록 화면으로 전환할 수 있어요.",
    bbs_open_label: "근육 게시판 열기",
    omikuji: {
      title: "근육 운세",
      reset_in: "{{time}} 후 리셋",
      loading: "불러오는 중…",
      empty_lead:
        "하루 한 번, 근육의 신이 보내는 메시지.",
      draw_button: "운세 뽑기",
      draw_hint:
        "한 번 뽑으면 그날은 결과가 고정됩니다.",
      section_meigen: "근육 명언",
      section_kotowaza: "근육 속담",
      section_form: "폼의 포인트",
      section_recovery: "회복 팁",
      section_challenge: "오늘의 30초 챌린지",
      section_lucky_guide: "럭키 가이드",
      label_lucky_item: "럭키 아이템",
      label_lucky_color: "럭키 컬러",
      label_lucky_set: "럭키 세트",
      label_lucky_tempo: "럭키 템포",
      note:
        "운세는 하루 한 번만. 0:00에 자동으로 리셋됩니다.",
        muscles: {
        chest: { name: "가슴(대흉근)",     focus: "밀기" },
        shoulders: { name: "어깨(삼각근)", focus: "밀기" },
        triceps: { name: "삼두근",         focus: "밀기" },
        back: { name: "등(광배근)",        focus: "당기기" },
        biceps: { name: "이두근",          focus: "당기기" },
        legs: { name: "하체(다리)",        focus: "하체" },
        core: { name: "코어",              focus: "코어" },
      },

      fortuneLabels: {
        daikichi: "대길",
        chuukichi: "중길",
        kichi: "길",
        shoukichi: "소길",
        suekichi: "말길",
      },

      fortuneMessages: {
        daikichi:
          "오늘은 {{focus}} 감이 폭발하는 맑은 날이에요. {{muscleName}}는 ‘적은 볼륨, 높은 퀄리티’로 날카롭게 만들어 보세요!",
        chuukichi:
          "오늘은 폼이 빛나는 날. {{muscleName}}는 컨트롤에 집중해서 정교하게 움직여 보세요.",
        kichi:
          "꾸준함이 승리하는 날. {{muscleName}} 마지막 세트만큼은 천천히, 정성스럽게 해보세요.",
        shoukichi:
          "무리하지 말고 차곡차곡. {{muscleName}}는 볼륨을 조금 줄이고 동작의 질을 다듬어 보세요.",
        suekichi:
          "오늘은 회복 우선. {{muscleName}}는 스트레칭과 가벼운 펌프로 혈류만 살짝 올려 주세요.",
      },
      recoveryTipsPool: [
        "하루 1.5~2.5L 정도의 수분을 마시고, 카페인은 주로 운동 전에 모아 두자.",
        "취침 90분 전, 40°C 안팎에서 10~15분 정도 목욕하기.",
        "체중 1kg당 단백질 1.6~2.2g을 하루에 나누어 섭취하자.",
        "가벼운 스트레칭과 호흡으로 부교감 신경을 활성화하자.",
        "침실은 19~21°C 정도로 유지하고, 빛은 최대한 줄이자.",
        "하루 6,000~8,000보 정도의 가벼운 유산소로 회복을 돕자.",
        "알코올은 최소화하자. 회복의 가장 큰 적이다.",
        "마그네슘과 오메가3 섭취를 고려해 보자.",
        "낮잠은 20분 이내로, 저녁 이후에는 피하자.",
      ],

      challengePool: [
        "코로 들이마시고 입으로 내쉬는 심호흡을 30초간 해 보자.",
        "어깨를 10회 돌리고, 목 스트레칭을 각 방향 20초씩 하자.",
        "오랫동안 앉아 있었다면 일어나서 5번 정도 쭉 뻗어 스트레칭.",
        "자세를 곧게 세우고 물 한 컵을 마시자.",
        "눈을 감고 심호흡 5회를 해 보자.",
        "발목을 각 방향으로 10회씩 돌리자.",
        "손바닥을 30초간 가볍게 마사지하자.",
        "위를 올려다보고 5초간 미소 지어 보자.",
      ],

      luckyItemsPool: {
        chest: [
          "손목 랩",
          "딥 벨트",
          "경량 플레이트",
          "미니 밴드",
          "푸시업 바",
          "슬링샷 벤치 밴드",
          "체인 플레이트",
          "폼 매트",
          "그립 초크",
          "얇은 트레이닝 장갑",
          "쿠션 패드",
          "강한 저항 밴드",
          "스파이더 바",
          "엘보 슬리브",
          "미니 타월",
          "바벨 어깨 패드",
          "모빌리티 볼",
          "소형 폼 롤러",
          "목 쿠션",
          "짐 아로마 디퓨저",
        ],
        shoulders: [
          "약한 미니 밴드",
          "페이스풀 로프",
          "가벼운 덤벨",
          "D핸들 케이블 어태치먼트",
          "운동 튜브",
          "플라스틱 컬러",
          "소프트 볼",
          "트레이닝 캡",
          "얇은 후디",
          "사이드 레이즈 벨트",
          "폼 스틱 롤러",
          "리어 델트 패드",
          "미러 스티커",
          "커프 어태치먼트",
          "미니 선풍기",
          "바디 와이프",
          "손거울",
          "어깨 마사지 스틱",
          "쉐이커 보틀",
          "가벼운 케틀벨",
        ],
        triceps: [
          "로프 어태치먼트",
          "V바",
          "EZ바",
          "딥 벨트",
          "암 블라스터",
          "프레스다운 그립",
          "엘보 슬리브",
          "얇은 손목 랩",
          "러버 케이블",
          "푸시다운 스토퍼",
          "스컬 크러셔 쿠션",
          "폼 패드",
          "미니 체인",
          "팔꿈치 서포트 테이프",
          "강한 스트레치 밴드",
          "얇은 리프팅 벨트",
          "긴 타월",
          "팔꿈치 아이스팩",
          "트레이닝 양말",
          "헤드밴드",
        ],
        back: [
          "미디엄 랫풀 그립",
          "MAG 스타일 어태치먼트",
          "친업 스트랩",
          "리프팅 스트랩",
          "헥스 그립",
          "하프 스트랩",
          "초크 볼",
          "친 어시스트 밴드",
          "파워 그립",
          "데드리프트 양말",
          "롱 폼 롤러",
          "등 전용 고무 밴드",
          "핸드 그리퍼",
          "후면 미러",
          "발판용 보드",
          "훅 그립 테이프",
          "등 온열 패치",
          "얇은 허리 서포트 벨트",
          "2.5kg 플레이트",
          "그립 링",
        ],
        biceps: [
          "암 블라스터",
          "슬림 그립 어태치먼트",
          "회외용 덤벨",
          "케이블 그립 핸들",
          "라이트 EZ바",
          "마이크로 플레이트",
          "프런트 미러",
          "팜 가드",
          "그립 볼",
          "짧은 타월",
          "손목 테이핑",
          "리스트 컬 벤치",
          "미디엄 케틀벨",
          "라이트 자세 교정 벨트",
          "실리콘 링",
          "손땀 파우더",
          "전완 컴프레션 슬리브",
          "짧은 로프",
          "케이블 커프",
          "해머 컬 그립",
        ],
        legs: [
          "회복용 수면 안대",
          "니 랩",
          "굽이 있는 슬리퍼",
          "웨지 보드",
          "니삭스",
          "강한 미니 밴드",
          "미끄러운 솔 신발",
          "리프팅 벨트",
          "햄스트링 패드",
          "롱 저항 튜브",
          "대형 폼 볼",
          "힙 서클 밴드",
          "시시 스쿼트 패드",
          "서스펜션 슬링",
          "발목 웨이트",
          "발목 스트랩",
          "플레이트 매트",
          "캘프 블록",
          "소프트 니 패드",
          "타이머",
        ],
        core: [
          "복근 휠(아브휠)",
          "플랭크 매트",
          "미니 볼",
          "슬라이더 디스크",
          "라이트 코어 벨트",
          "호흡 트레이너",
          "스트레치 폴",
          "라이트 골반 벨트",
          "무소음 타이머",
          "요가 블록",
          "쿠션 블록",
          "바닥 보호 매트",
          "자세 센서",
          "메트로놈",
          "얇은 타월",
          "라텍스 밴드",
          "모빌리티 링",
          "스트레칭 스트랩",
          "웨이스트 파우치",
          "실온 물 병",
        ],
      },

      luckySetsPool: {
        chest: [
          "벤치 프레스 3×8, 휴식 150초",
          "인클라인 덤벨 프레스 4×10, 휴식 90초",
          "딥 3×AMRAP, 휴식 120초",
          "케이블 플라이 3×12, 휴식 60초",
          "푸시업 3×15, 휴식 45초",
        ],
        shoulders: [
          "사이드 레이즈 4×12, 휴식 45초",
          "숄더 프레스 3×8, 휴식 120초",
          "리어 델트 레이즈 3×15, 휴식 45초",
          "프런트 레이즈 3×12, 휴식 60초",
          "아널드 프레스 3×10, 휴식 90초",
        ],
        triceps: [
          "로프 프레스다운 4×12, 휴식 60초",
          "스컬 크러셔 3×10, 휴식 90초",
          "딥 3×AMRAP, 휴식 120초",
          "오버헤드 익스텐션 3×12, 휴식 60초",
          "클로즈그립 벤치 프레스 3×8, 휴식 120초",
        ],
        back: [
          "랫 풀다운 4×10, 휴식 90초",
          "벤트오버 로우 3×8, 휴식 120초",
          "원암 로우 3×10/측, 휴식 90초",
          "케이블 로우 3×12, 휴식 60초",
          "풀업 3×AMRAP, 휴식 120초",
        ],
        biceps: [
          "EZ바 컬 4×10, 휴식 60초",
          "해머 컬 3×12, 휴식 60초",
          "인클라인 컬 3×10, 휴식 90초",
          "케이블 컬 3×12, 휴식 45초",
          "프리처 컬 3×10, 휴식 90초",
        ],
        legs: [
          "하이바 스쿼트 3×6, 휴식 180초",
          "레그 프레스 4×12, 휴식 90초",
          "RDL 3×8, 휴식 120초",
          "런지 3×10/측, 휴식 60초",
          "카프 레이즈 4×15, 휴식 45초",
        ],
        core: [
          "플랭크 3×45초, 휴식 45초",
          "데드버그 3×12/측, 휴식 45초",
          "팔로프 프레스 3×12/측, 휴식 60초",
          "니 레이즈 3×12, 휴식 60초",
          "회전 코어 운동 3×12, 휴식 45초",
        ],
      },
        meigen: {
          chest: [
            "가슴을 펴면 마음도 펴진다. 끝까지 밀어붙이는 용기는 대흉근이 알려준다.",
            "오늘의 한계가 내일의 기준이 된다.",
            "대흉근은 거짓말하지 않는다. 쌓은 만큼 두꺼워질 뿐이다.",
            "가동범위 1cm가 자신감 1마일이 된다.",
            "가슴은 장식이 아니라 각오라는 갑옷이다.",
            "미는 힘을 기르면, 흔들림을 밀어낼 수 있다.",
            "오늘의 1kg 증량이 내일의 기본이 된다.",
            "바벨은 무겁지만, 타협의 무게는 그보다 훨씬 더 크다.",
            "세트는 짧지만, 자부심은 오래간다.",
            "폼이 아름다운 사람은 목표로 가는 길도 곧다.",
            "가슴이 강하게 느껴지는 날은, 약해진 마음이 물러나는 날이다.",
            "땀방울 하나하나가 어제의 나를 씻어내는 소리다.",
          ],
          shoulders: [
            "어깨로 말하라. 작은 각도의 차이가 내일의 차이를 만든다.",
            "짐을 짊어질 각오는 삼각근에 새겨진다.",
            "옆으로 한 걸음이 존재감을 향한 한 걸음이다.",
            "삼각근이 모양을 만들고, 꾸준함이 그 의미를 만든다.",
            "어깨는 장식이 아니라 안정의 증거다.",
            "가벼운 무게로 정교하게. 아름다움은 디테일에 깃든다.",
            "어깨가 올라가면, 시선도 함께 올라간다.",
            "조금의 외회전이 큰 여유를 만든다.",
            "자세가 좋은 날엔 운도 따라온다.",
            "어깨가 말하는 날엔, 등도 조용히 미소 짓는다.",
            "아픔을 만나기 전에, 먼저 정렬하는 법을 배워라.",
            "가동범위는 자산이고, 조급함은 낭비다.",
          ],
          triceps: [
            "마지막 한 번의 밀어주기가 근육의 모양을 결정한다.",
            "끝까지 펴 주는 성실함이 결과를 끌어올린다.",
            "몇 번 미는지가 아니라, 끝까지 밀어붙이려는 각오가 중요하다.",
            "락아웃 1초가 인생의 1초를 더 강하게 만든다.",
            "약점은 마무리에서 드러나고, 노력도 마무리에서 보상받는다.",
            "팔꿈치에는 다정하게, 자신에게는 엄격하게.",
            "한 번 밀어낼 때마다 망설임이 뒤로 떨어진다.",
            "삼두가 자라면, 가슴과 어깨도 함께 빛난다.",
            "삼두는 말하지 않는다. 결과로 말할 뿐이다.",
            "지쳤다면, 무게를 줄이고 폼을 더 깨끗하게 하라.",
          ],
          back: [
            "등은 말한다. 노력은 뒷모습에 드러난다.",
            "당길 수 있는 자만이 앞으로 나아갈 수 있다.",
            "견갑골로 이상적인 자신을 끌어안아라.",
            "넓게 당기고, 깊게 살아라.",
            "그립에는 의지를, 팔꿈치에는 궤도를, 등에는 자부심을 담아라.",
            "서두르지 마라. 광배근은 조용히, 그러나 확실히 커진다.",
            "등에는 날개를, 바닥에는 뿌리를 내려라.",
            "반동은 조금만, 집중은 깊게.",
            "악력은 끝까지 놓지 않겠다는 약속이다.",
            "등이 강해지면, 마음도 함께 조여진다.",
          ],
          biceps: [
            "쥔 손에 절대 놓지 않겠다는 의지를 담아라.",
            "펌핑은 신호일 뿐, 꾸준함이 진짜 증거다.",
            "한 번 굽힐 때마다 약함을 펴 나가는 것이다.",
            "반동은 버리고, 자부심을 집어 들어라.",
            "강력한 해머컬 한 번은 수많은 미세 조정에서 나온다.",
            "정점에서 멈추는 1초가 매력을 만드는 1초다.",
            "가벼운 무게로 속이지 말고, 정교함으로 보여줘라.",
            "바를 쥐는 방식이 결국 삶의 태도와 닮아간다.",
            "수축의 퀄리티가 실루엣의 퀄리티다.",
            "이두는 장식이 아니라, 지켜낸 약속이다.",
          ],
          legs: [
            "다리는 거짓말하지 않는다. 중력이 증인이다.",
            "계단 한 칸 한 칸이 미래로 가는 발판이 된다.",
            "약한 상부는 튼튼한 토대 위에 설 수 없다.",
            "앉아 내려갈 용기가 일어설 힘을 부른다.",
            "다리는 배신하지 않는다. 다만 너를 시험할 뿐이다.",
            "오늘의 한 걸음이 내일의 천 걸음이 된다.",
            "얕은 욕심보다 깊은 스쿼트를 택하라.",
            "햄스트링이 늘어나는 만큼 내일의 성장도 늘어난다.",
            "힘든 날은 폼을 다듬는 날이다.",
            "다리가 말하기 시작하면, 온 몸이 귀 기울인다.",
          ],
          core: [
            "중심이 잡히면 모든 동작이 아름다워진다.",
            "흔들리지 않는 몸은 흔들리지 않는 마음에서 시작된다.",
            "한 번의 호흡으로 정리하고, 한 번의 반복으로 자신을 믿어라.",
            "자세는 습관이고, 아름다움은 그 부산물이다.",
            "복압은 방패이고, 호흡은 검이다.",
            "풀었다가 조여라. 여유가 강함을 만든다.",
            "코어는 조용히 존재감을 드러낸다.",
            "멈출 줄 아는 용기가 움직임의 질을 높인다.",
            "1분의 플랭크가 하루 종일 집중력을 불러온다.",
            "코어를 단련한 자는 쉽게 흔들리지 않는다.",
          ],
        },

        kotowaza: {
          generic: [
            "꾸준함이 모든 근육을 만든다.",
            "진짜 성장은 지름길이 없다.",
            "큰 기록도 한 번의 반복에서 시작된다.",
            "천천히, 부드럽게, 그리고 강하게.",
            "근육은 몇 달, 몇 년을 버틴 사람에게 생긴다.",
            "작은 노력들이 쌓여 큰 결과가 된다.",
            "서두른 반복은 관절로 대가를 치른다.",
            "한 방울 한 방울의 노력이 몸을 깎아낸다.",
            "조언만 듣지 말고, 거울 속 폼을 확인하라.",
          ],
        },

        form: {
          chest: [
            "견갑골을 모으고 아래로 내린다. 어깨가 아니라 가슴에서 민다고 느껴라.",
            "팔꿈치는 손목 바로 아래, 전완은 수직을 유지한다.",
            "발바닥은 완전히 붙이고, 엉덩이·어깨·머리는 벤치에 고정한다.",
            "바는 윗가슴을 지나가게 하고, 튕기거나 반동을 쓰지 않는다.",
            "내릴 때는 2~3초간 천천히, 바닥에서 너무 오래 멈추지 않는다.",
          ],
          shoulders: [
            "덤벨의 새끼손가락 쪽을 살짝 올리면 어깨에 더 잘 들어간다.",
            "치팅은 최소화하고, 정점에서 잠깐 멈춰라.",
            "목은 길게, 가슴은 살짝 납작하게 해서 승모근으로 힘이 새지 않게 한다.",
            "동작 내내 내회전·외회전을 의식하며 조절한다.",
            "통증이 느껴지면 각도를 바꿔라. 아픔이 곧 실력은 아니다.",
          ],
          triceps: [
            "팔꿈치를 벌리지 말고 고정한다. 어깨가 움직이지 않게 한다.",
            "정점에서 1초간 꽉 조이는 시간을 소중히 해라.",
            "반동은 최소로, 가동범위는 끝까지 가져간다.",
            "케이블은 끝까지 내린 뒤, 팔꿈치 아래에서 멈춘다.",
            "락아웃이 안 되는 날엔 무게를 줄이는 용기도 필요하다.",
          ],
          back: [
            "팔꿈치로 당기고, 손은 갈고리라고 생각하라.",
            "가슴을 펴고 명치를 바 쪽으로 끌어당긴다.",
            "먼저 견갑골을 아래로 내리고 안쪽으로 모으는 동작부터 시작한다.",
            "그립 너비를 바꿔가며 자극을 분산시켜라.",
            "반동은 보조일 뿐, 주인공이 되어선 안 된다.",
          ],
          biceps: [
            "팔꿈치를 몸 옆에 고정한다.",
            "정점에서 손목을 바깥쪽으로 돌려준다.",
            "반드시 치팅을 쓴다면 마지막 두 번에만 써라.",
            "내릴 때는 2초 정도 천천히 내려라.",
            "손목은 약간 젖힌 상태로 단단히 고정한다.",
          ],
          legs: [
            "발뒤꿈치·엄지발가락·새끼발가락에 고르게 체중을 싣는다.",
            "무릎과 발끝이 같은 방향을 향하게 한다.",
            "동작은 먼저 힙힌지로 시작한다.",
            "본인 가동범위 안에서 깊이를 정하고, 무리해서 내리지 않는다.",
            "루마니안 데드리프트에서는 무릎을 살짝 굽히고 햄스트링에 긴장을 유지한다.",
          ],
          core: [
            "숨을 들이쉴 때 배와 옆구리, 등까지 360°로 부풀린다.",
            "골반은 중립, 갈비뼈는 살짝 아래로 내린 상태를 유지한다.",
            "플랭크에서는 팔꿈치로 바닥을 강하게 민다고 느껴라.",
            "호흡을 멈추지 말고 자연스럽게 이어가라.",
            "조급해하지 않고 쌓아가는 것이 가장 빠른 길이다.",
          ],
        },
    },
  },
  gotore: {
    coming_soon: {
      title: "🤝 합트레이닝 기능은\n현재 준비 중입니다!",
      description_1:
        "앱 이용자가 더 늘어나면\n합트레이닝 기능을 순차적으로 공개할 예정입니다.\n근처 파트너 찾기 → 서로 좋아요로 매칭\n→ 채팅까지 한 번에 이어서 사용할 수 있도록 준비 중이에요.",
      planned_title: "예정된 주요 기능",
      planned_1: "・지역 / 태그 / 본인 인증을 활용한 정밀 매칭",
      planned_2: "・이성 / 동성 파트너 모두 매칭 가능",
      planned_3: "・받은 좋아요 → 즉시 매칭 → 채팅으로 연결",
      planned_4: "・차단 / 매칭 해제 등 안전 기능",
      description_2:
        "그동안에는 설정 → 프로필 →\n합트레이닝용 프로필에서\n미리 프로필을 만들어 두고 기다려 주세요!",
      btn_back_home: "홈으로 돌아가기",
      btn_open_notifications: "알림 설정 열기",
      note_ios: "알림을 켜 두시면 기능이 공개될 때 알려 드립니다.",
      note_android: "알림을 켜 두시면 기능이 공개될 때 알려 드립니다.",
    },
  },
  training: {
    help_button: "도움말",
    help_accessibility: "트레이닝 도움말 열기",

    day_title: "{{date}} 기록",
    filter_all: "전체",
    filter_manage: "+ 관리",
    filter_note:
      "※ 캘린더에는 「{{partName}}」을(를) 한 날만 표시됩니다. (아래 목록과 메모는 전체 표시)",

    loading: "불러오는 중…",
    day_empty: "이 날의 기록과 메모가 아직 없습니다.",

    summary: {
      exercises: "종목 수",
      sets: "세트 수",
      reps: "반복 수",
      tonnage: "톤수",
    },

    note_label: "메모",

    set_unit_reps: "회",
    no_work_sets: "본 세트 없음",
    warmup_count: "WU {{count}} 세트",

    fab_label: "이 날 기록하기",

    pr: {
      title: "지금까지의 최고 기록",

      max_weight_badge: "👑 최고 중량",
      max_reps_badge: "🏆 최고 반복 수",
      streak_badge: "🔥 연속 일수",
      total_days_badge: "🎖️ 총 기록 일수",

      no_record: "기록 없음",

      max_weight_big: "{{weight}} kg × {{reps}} 회",
      max_reps_big: "{{reps}} 회 @ {{weight}} kg",
      entry_line: "{{name}} / {{date}}",

      current_streak_big: "현재 {{days}}일 연속",
      longest_streak:
        "최장 {{days}}일 ({{start}}–{{end}})",
      no_longest_data: "최장 연속 기록이 없습니다",

      total_days_big: "{{days}}일",
      total_days_sub: "꾸준함에 박수! 👏",
    },
  },
  trainingSession: {
    note_title: "오늘 메모",
    note_placeholder:
      "컨디션, 수면, 관절 불편감, 전체 소감 등을 적어 두세요.",
    saving: "저장 중…",
    saved: "저장됨",

    add_exercise: "+ 종목 추가",
    deleted_message: "세트를 삭제했습니다.",
    undo: "되돌리기",

    weight_placeholder: "중량",
    reps_placeholder: "횟수",
    reps_suffix: "회",
    wu_label: "WU",
    delete_set: "삭제",

    empty: "아직 기록이 없습니다.",
    add_set: "+ 세트 추가",
  },
  trainingPicker: {
    loading: "불러오는 중…",
    manage_button: "+ 부위·종목 추가",

    alert_title: "추가 방법 선택",
    alert_message: "이 종목을 어떻게 추가할지 선택하세요.",
    alert_copy_last: "지난 기록의 세트 복사",
    alert_empty_set: "빈 세트 1개 추가",
    alert_cancel: "취소",

    empty:
      "종목이 없습니다. 오른쪽 상단의 “+ 부위·종목 추가”에서 등록할 수 있습니다.",
  },
  trainingManage: {
    title: "부위·종목 관리",

    add_part_placeholder: "부위 이름 입력 (예: 가슴)",
    add_button: "추가",

    loading: "불러오는 중…",
    empty_parts: "아직 부위가 없습니다. 위에서 추가해 주세요.",

    error_cannot_add_title: "추가할 수 없습니다",
    error_part_duplicate: "같은 이름의 부위가 이미 있을 수 있습니다.",
    error_exercise_failed: "등록에 실패했습니다.",

    remove_part_title: "부위 삭제",
    remove_part_message:
      "「{{name}}」 부위를 삭제하시겠습니까?\n연결된 종목의 부위는 미설정(NULL) 상태가 됩니다.",
    remove_part_cancel: "취소",
    remove_part_confirm: "삭제",

    add_ex_placeholder: "새로운 종목 이름 (예: 벤치프레스)",
    add_ex_button: "추가",

    ex_block_empty: "(종목 없음)",
    ex_archived_suffix: "(비표시)",

    archived_title: "아카이브했습니다",
    archived_message:
      "「{{name}}」은(는) 과거 기록이 있어 비표시(아카이브) 상태로 전환했습니다.",
  },
  body: {
    title: "체성분",
    title_new: "체성분 기록하기",
    header_asof: "{{date}} 기준",
    header_help: "도움말",
    header_export: "내보내기",
    header_goal: "목표",

    period_day: "일",
    period_week: "주",
    period_month: "월",

    btn_add_record: "+ 기록하기",

    metric_both: "둘 다",
    metric_weight: "체중",
    metric_bodyfat: "체지방",

    avg7_on: "7일 평균 ON",
    avg7_off: "7일 평균 OFF",

    chart_empty_title: "아직 그래프에 표시할 데이터가 없습니다",
    chart_empty_message:
      "오른쪽 위의 “+ 기록하기” 버튼으로 첫 기록을 추가해 주세요.",

    streak_board_title: "✨ 기록 보드 ✨",
    streak_current_title: "현재 연속 기록",
    streak_current_sub: "오늘을 포함한 연속 일수",
    streak_longest_title: "최장 연속 기록",
    streak_longest_sub: "지금까지의 최고 연속 일수",
    streak_month_title: "이번 달 기록 일수",
    streak_month_sub: "{{month}}월 합계",

    recent_title: "최근 기록",
    recent_empty: "아직 기록이 없습니다.",
    recent_edit: "수정",
    recent_delete: "삭제",

    modal_add_title: "기록 추가",
    modal_edit_title: "기록 수정",
    modal_date_label: "날짜 (YYYY/MM/DD)",
    modal_date_placeholder: "예: 2025/10/16",
    modal_weight_label: "체중 (kg)",
    modal_weight_placeholder: "예: 68.2",
    modal_bodyfat_label: "체지방률 (%)",
    modal_bodyfat_placeholder: "예: 18.5",
    modal_note_label: "메모 (선택)",
    modal_note_placeholder:
      "예: 운동 후 프로틴, 저녁은 외식. 컨디션 좋음 등",
    modal_cancel: "취소",
    modal_update: "업데이트",
    modal_save: "저장",

    input_bar_label: "입력",
    input_bar_done: "완료",

    goal_modal_title: "목표 설정",
    goal_weight_label: "목표 체중 (kg)",
    goal_weight_placeholder: "예: 65",
    goal_bodyfat_label: "목표 체지방률 (%) (선택)",
    goal_bodyfat_placeholder: "예: 18",

    error_title: "오류",
    error_load_failed: "체성분 데이터를 불러오지 못했습니다.",
    error_weight_required_title: "체중은 필수입니다",
    error_weight_required_message:
      "현재는 체지방률만 단독으로 저장할 수 없습니다.",
    error_weight_range_title: "체중 범위",
    error_weight_range_message:
      "체중은 {{min}}~{{max}} kg 사이로 입력해 주세요.",
    error_bodyfat_range_title: "체지방률 범위",
    error_bodyfat_range_message:
      "체지방률은 {{min}}~{{max}}% 사이로 입력해 주세요.",
    error_date_format_title: "날짜 형식",
    error_date_format_message:
      "YYYY/MM/DD 형식으로 입력해 주세요.",
    error_save_failed_title: "저장 실패",
    error_save_failed_message:
      "기록 저장에 실패했습니다. 다시 시도해 주세요.",
    error_goal_weight_title: "목표 체중",
    error_goal_weight_message:
      "{{min}}~{{max}} 범위에서 입력해 주세요.",
    error_goal_bodyfat_title: "목표 체지방률",
    error_goal_bodyfat_message:
      "{{min}}~{{max}} 범위에서 입력해 주세요.",
    error_goal_save_title: "저장 실패",
    error_goal_save_message:
      "목표 저장에 실패했습니다. 다시 시도해 주세요.",
    export_success_title: "CSV로 내보냈습니다",
    export_success_message: "위치: {{path}}",
    export_fail_title: "내보내기 실패",
    export_fail_message:
      "CSV 내보내기에 실패했습니다.",

    delete_confirm_title: "이 기록을 삭제할까요?",
    delete_confirm_message: "{{date}} 의 기록을 삭제합니다.",
    delete_cancel: "취소",
    delete_ok: "삭제",

    confirm_change_title: "큰 변화가 감지되었습니다",
    confirm_change_question: "이대로 저장하시겠습니까?",
    confirm_change_fix: "수정하기",
    confirm_change_save: "저장하기",

    eta_title: "목표 도달 예상",
    eta_no_goal_main: "먼저 목표 체중을 설정해 주세요",
    eta_no_goal_sub:
      "상단의 “목표” 버튼에서 설정할 수 있습니다.",
    eta_insufficient_main: "데이터 부족",
    eta_insufficient_sub:
      "최근 기록이 적어 예측할 수 없습니다.",
    eta_achieved_main: "목표 달성! 🎉",
    eta_achieved_sub: "최신 {{weight}} kg",
    eta_flat_main: "최근 변화가 거의 없는 상태입니다",
    eta_flat_sub:
      "현재 페이스를 유지하면서 추이를 지켜보세요.",
    eta_dir_up: "증가하는 추세",
    eta_dir_down: "감소하는 추세",
    eta_reverse_main:
      "목표와 반대로 “{{direction}}” 입니다",
    eta_reverse_sub:
      "입력 실수나 생활 패턴을 한 번 점검해 보세요.",
    eta_unknown_main: "예상치를 계산할 수 없습니다",
    eta_unknown_sub: "",
    eta_eta_main: "{{date}} 즈음 도달 예상",
    eta_eta_sub:
      "현재 페이스라면 {{date}} 즈음 {{goal}} kg에 도달할 가능성이 있습니다.",

    warn_weight_change:
      "체중이 이전 기록보다 {{diff}} kg 변했습니다 (기준 {{threshold}} kg).",
    warn_bodyfat_change:
      "체지방률이 이전 기록보다 {{diff}}% 변했습니다 (기준 {{threshold}}%).",
  },
  meals: {
    loading: "불러오는 중…",
    monthHeader: "{{year}}년 {{month}}월",

    productSection: {
      title: "상품에서 기록하기",
      button: "상품 검색 (식품 DB)",
      caption:
        "키워드 또는 JAN 코드(8~14자리)로 검색할 수 있습니다. 필터와 정렬도 지원합니다.",
    },

    weekday: {
      sun: "일",
      mon: "월",
      tue: "화",
      wed: "수",
      thu: "목",
      fri: "금",
      sat: "토",
    },

    kcalWithUnit: "{{value}} kcal",

    summaryTitle: "{{date}} 요약",
    summary: {
      totalKcal: "총 칼로리",
    },

    aiAdvice: {
      title: "AI가 전하는 오늘의 조언",
      empty:
        "홈의 “AI에게 조언 받기”에서 작성하면, 여기에 메모로 표시됩니다.",
    },

    recordsTitle: "{{date}} 기록 목록",
    records: {
      empty: "아직 기록이 없습니다.",
    },

    noPhoto: "사진 없음",
    untitled: "제목 없음",

    types: {
      breakfast: "아침",
      lunch: "점심",
      dinner: "저녁",
      snack: "간식",
    },

    trend: {
      title: "월간 칼로리 추이",
      needSvg:
        "선 그래프에는 {{libName}}가 필요합니다. Expo 사용 시 “expo install {{libName}}”를 실행하세요.",
      goalLabel: "목표 {{kcal}} kcal",
      caption:
        "{{year}}년 {{month}}월의 일별 kcal (좌우 스크롤 가능). 원하는 날짜를 탭하면 해당 날짜의 칼로리를 자세히 볼 수 있습니다.",
    },
    new: {
      photoPermissionTitle: "사진 접근 권한이 필요합니다",
      photoPermissionMessage:
        "설정에서 사진 라이브러리 접근을 허용해주세요.",
      errorTitle: "오류",

      analyzingLabel: "분석 중…",
      autoFromPhotoButton: "사진으로 자동 입력",
      autoFromPhotoNote:
        "사진에서 자동 입력 기능은 준비 중입니다. 이용자가 늘어나면 기능을 개방할 예정입니다.",

      analyzeSuccessTitle: "자동 입력이 완료되었습니다",
      analyzeSuccessReason: "근거: {{reason}}",
      analyzeNotFoundTitle: "정보를 찾지 못했습니다",
      analyzeNotFoundMessage: "직접 값을 입력해주세요.",
      analyzeFailedTitle: "사진 분석에 실패했습니다",

      basicSectionTitle: "기본 정보",
      titleLabel: "제목",
      titlePlaceholder: "예: 사라다 치킨(로손)",
      brandLabel: "브랜드 (선택)",
      brandPlaceholder: "로손 / 메이지 등",
      photoLabel: "사진 (선택)",
      photoPickButton: "사진 선택",
      barcodeButton: "바코드로 기록",

      nutritionSectionTitle: "영양 (직접 입력)",
      nutritionDescription:
        "필요에 따라 kcal / P / F / C를 입력하세요.",
      kcalLabel: "kcal",
      pLabel: "P (g)",
      fLabel: "F (g)",
      cLabel: "C (g)",
      zeroPlaceholder: "0",

      previewLabel:
        "합계: {{kcal}} kcal / P {{protein}}g / F {{fat}}g / C {{carbs}}g / {{grams}}g",

      baseSaveButton: "현재 값을 기준으로 저장",
      resetButton: "리셋",

      quantitySectionTitle: "수량 · 분량",
      quantityLabel: "수량 (×배)",
      gramsLabel: "분량 (g)",
      sliderHelpButton: "? 도움말",
      sliderHelpTitle: "슬라이더 사용 방법",
      sliderHelpBody:
        "1) PFC/kcal과 g를 입력합니다 (또는 사진/바코드로 자동 입력)\n2) “현재 값을 기준으로 저장”을 눌러 기준을 저장합니다\n3) 수량(×배)이나 분량(g)을 조절하면 비율에 맞게 자동으로 조정됩니다",

      targetSectionTitle: "기록 대상",
      dateLabel: "날짜",
      mealTypeLabel: "구분",
      saveButton: "저장하기",

      calendarTitle: "날짜 선택",
      calendarFallback:
        "캘린더가 설치되어 있지 않습니다. (YYYY-MM-DD) 형식으로 직접 입력해주세요.",
      calendarCancel: "취소",
      calendarDecide: "확인",
    },
    search: {
      queryPlaceholder: "상품명이나 식재료명으로 검색 (예: 프로틴, 요거트)",
      searchButton: "검색",
      scanBarcodeButton: "바코드 스캔",
      recordMealButton: "식사 기록",

      favoritesOnlyChip: "★ 즐겨찾기만",

      headerFrequent: "자주 사용하는 식사",
      headerRecent: "사용 이력",

      searchingLabel: "검색 중…",
      noResultMessage:
        "상품을 찾지 못했습니다.\n" +
        "・키워드를 더 짧게 입력해 보세요 (예: 닭가슴살 → 닭, 요거트 → 요거)\n" +
        "・식재료 이름으로 검색 (예: 닭가슴살 / 현미 / 브로콜리)\n" +
        "・카테고리 이름으로도 검색 가능 (예: 파스타 / 요거트 / 프로틴)\n" +
        "・바코드 스캔도 시도해 보세요",

      loadMoreButton: "더 불러오기",

      noImageLabel: "No Image",
      untitled: "(제목 없음)",
      relogButton: "다시 기록",
      usedCount: "{{count}}회",

      defaultMealTitle: "식사",
      relogSuccessTitle: "다시 기록했습니다",
      relogSuccessMessage: "{{title}} 를 오늘 기록에 추가했습니다.",

      searchErrorTitle: "검색 오류",
      unknownName: "(이름 없음)",

      sort: {
        relevance: "관련도 순",
        kcalAsc: "낮은 칼로리 순",
        kcalDesc: "높은 칼로리 순",
        proteinDesc: "고단백 순",
        updatedDesc: "최근 업데이트 순",
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
      loading: "불러오는 중…",
      notFound: "기록을 찾을 수 없습니다.",

      deleteConfirmTitle: "삭제하시겠습니까?",
      deleteConfirmMessage: "이 기록을 삭제합니다. 되돌릴 수 없습니다.",
      deleteCancel: "취소",
      deleteConfirm: "삭제하기",
      deletedTitle: "삭제되었습니다",

      recordSectionTitle: "기록",
      nutritionSectionTitle: "분량 · 영양",
      amountLabel: "분량",
      untitled: "제목 없음",

      mealTypeBreakfast: "아침",
      mealTypeLunch: "점심",
      mealTypeDinner: "저녁",
      mealTypeSnack: "간식",

      editButton: "편집하기",
    },
    edit: {
      loading: "불러오는 중…",
      errorTitle: "오류",
      errorPhotoMessage: "사진을 추가하는 중 문제가 발생했습니다. 다시 시도해 주세요.",
      fallbackTitle: "제목 없음",

      confirmRemovePhotoTitle: "확인",
      confirmRemovePhotoMessage: "사진을 삭제하시겠습니까?",
      confirmRemovePhotoCancel: "취소",
      confirmRemovePhotoOk: "삭제",

      labelTitle: "제목",
      labelCalories: "칼로리(kcal)",
      labelMemo: "메모",

      buttonChangePhoto: "사진 변경",
      buttonAddPhoto: "사진 추가",
      buttonRemovePhoto: "사진 삭제",
      buttonSave: "저장",
    },
  },
  about: {
    rows: {
      appName: "앱 이름",
      version: "버전",
      buildNumber: "빌드 번호",
      appId: "앱 ID",
      device: "디바이스",
      os: "OS",
      updatesChannel: "Updates / channel",
      updatesUpdateId: "Updates / updateId",
      updatesRuntimeVersion: "Updates / runtimeVersion",
      empty: "—",
    },
    updateCheck: {
      unsupportedTitle: "미지원",
      unsupportedMessage: "이 빌드에서는 EAS 업데이트의 즉시 확인을 사용할 수 없습니다.",
      applyingTitle: "업데이트 적용",
      applyingMessage: "확인을 누르면 앱이 재시작됩니다.",
      applyingOk: "확인",
      applyingCancel: "취소",
      latestTitle: "최신 버전입니다",
      latestMessage: "새로운 업데이트가 없습니다.",
      failedTitle: "업데이트 실패",
      failedMessageFallback: "알 수 없는 오류가 발생했습니다.",
      buttonChecking: "확인 중…",
      buttonCheckNow: "지금 업데이트 확인",
    },
    store: {
      buttonOpenStore: "스토어 열기",
    },
  },

  data: {
    title: "데이터 및 개인정보",
    subtitle: "백업 / 복원 / 데이터 삭제",

    row_async: "AsyncStorage",
    row_sqlite: "SQLite 합계",
    row_lastExport: "마지막 백업 시각",

    export_title: "백업 내보내기",
    export_subtitle:
      "앱 설정(AsyncStorage)과 로컬 DB(SQLite)를 하나의 JSON 파일로 저장합니다.",
    export_button: "내보내기",
    export_processing: "처리 중...",
    export_share_dialog_title: "백업 공유",
    export_tip:
      "공유 다이얼로그를 사용하려면 expo-sharing 패키지가 필요합니다. 없어도 파일은 {{dir}} 경로에 저장됩니다.",

    import_title: "백업에서 복원",
    import_subtitle:
      "JSON 파일을 선택해 복원합니다. (현재 데이터는 덮어쓰기 됩니다)",
    import_button: "가져오기",
    import_processing: "처리 중...",
    import_tip:
      "expo-document-picker 가 없을 경우 {{path}} 위치에 JSON 을 두면 가져오기 할 수 있습니다. (고급 사용자용)",

    list_title: "백업 목록",
    list_subtitle: "이 기기에 저장된 백업",
    list_loading: "불러오는 중...",
    list_empty: "아직 백업이 없습니다.",
    list_share_button: "공유",
    list_restore_button: "복원",
    list_share_path_title: "파일 경로",
    list_share_failed_title: "공유에 실패했습니다",

    reset_title: "모든 데이터 삭제",
    reset_subtitle:
      "이 기기에 저장된 사용자 데이터를 완전히 삭제합니다. (되돌릴 수 없음)",
    reset_button: "모든 데이터 삭제",

    alert_error_title: "오류",
    alert_error_no_doc_dir: "문서 디렉터리에 접근할 수 없습니다.",

    alert_export_done_title: "완료",
    alert_export_done_body: "백업을 내보냈습니다.",

    alert_import_confirm_title: "백업 복원",
    alert_import_confirm_body:
      "현재 데이터(AsyncStorage 및 SQLite)가 덮어쓰기 됩니다. 계속하시겠습니까?",
    alert_import_confirm_cancel: "취소",
    alert_import_confirm_ok: "복원",

    alert_import_not_possible_title: "가져올 수 없습니다",
    alert_import_not_possible_body:
      "expo-document-picker 가 설치되어 있지 않습니다. 다음 경로에 JSON 파일을 두세요:\n\n{{path}}",

    alert_import_not_supported: "이 백업 형식은 지원되지 않습니다.",
    alert_import_no_file: "선택된 파일이 없습니다.",

    alert_import_done_title: "복원 완료",
    alert_import_done_body: "필요하다면 앱을 다시 로드해 주세요.",

    alert_wipe_confirm_title: "모든 데이터 삭제",
    alert_wipe_confirm_body:
      "이 기기에 저장된 모든 사용자 데이터(AsyncStorage 및 SQLite)가 영구적으로 삭제됩니다. 계속하시겠습니까?",
    alert_wipe_confirm_cancel: "취소",
    alert_wipe_confirm_ok: "삭제",

    alert_wipe_done_title: "완료",
    alert_wipe_done_body:
      "이 기기의 사용자 데이터를 삭제했습니다. 필요하다면 앱을 다시 로드해 주세요.",
    alert_wipe_error_title: "삭제 오류",
  },
  support: {
    title: "지원",
    subtitle: "문의 / 진단 정보 / FAQ",

    section_contact_title: "문의하기",
    contact_button_email: "이메일로 문의하기",
    contact_tip1_prefix: "원활한 대응을 위해 ",
    contact_tip1_emphasis: "재현 절차 / OS·기기 정보 / 화면 이름",
    contact_tip1_suffix: " 을(를) 함께 적어 주시면 도움이 됩니다.",
    contact_tip2:
      "여러분의 의견을 반영하여 더 나은 앱으로 개선해 나가고자 합니다.\n개선사항이나 추가되었으면 하는 기능이 있다면 언제든지 편하게 알려 주세요.",

    section_diag_title: "진단 정보",
    section_diag_subtitle:
      "앱·기기 상태 요약 (버그 신고 시 첨부를 권장합니다)",
    diag_loading: "수집 중…",
    row_app_version: "앱 / 버전",
    row_device_os: "기기 / OS",
    row_theme: "테마",
    row_async: "AsyncStorage",
    row_sqlite: "SQLite 합계",
    theme_light: "라이트",
    theme_dark: "다크",
    diag_copy_button: "진단 정보 복사",
    diag_share_button: "진단 정보를 JSON으로 공유",

    section_faq_title: "자주 묻는 질문",
    faq_q1: "백업은 어디에 저장되나요?",
    faq_a1:
      '"데이터 및 개인정보" 화면에서 내보내기를 실행하면, 기기 내 다음 폴더에 JSON 파일이 저장됩니다.\n{{dir}}backups/',
    faq_q2: "진단 정보에 개인정보가 포함되나요?",
    faq_a2:
      "포함되지 않습니다. 앱 이름/버전, 기기 정보, 로컬 저장 용량 등의 기술적인 메타데이터만 포함됩니다.",
    faq_q3: "화면이 멈췄을 때는 어떻게 하나요?",
    faq_a3:
      "먼저 앱을 한 번 재시작해 보세요. 개선되지 않으면 진단 정보를 JSON으로 공유한 뒤 이메일로 연락해 주세요.",
    reload_button: "강제 Reload (개발용)",

    footer_version: "버전: {{version}} · SDK: {{sdk}}",

    alert_copy_done_title: "복사 완료",
    alert_copy_done_body: "진단 정보를 클립보드에 복사했습니다.",
    alert_copy_fail_title: "복사 실패",

    alert_share_dialog_title: "진단 정보 공유",
    alert_file_path_title: "파일 경로",
    alert_share_error_title: "공유 오류",
    alert_error_title: "오류",

    email_subject: "[FitGear] 지원 문의 ({{version}})",
    email_intro:
      "아래 템플릿에 따라 내용을 적어 주세요.\n\n■ 발생 중인 문제:\n\n■ 재현 절차:\n1) \n2) \n3) \n\n---- (아래는 자동으로 수집된 진단 정보입니다. 필요에 따라 수정·삭제해도 됩니다.) ----",
    email_open_failed_title: "메일 앱을 열 수 없습니다",
    email_open_failed_body:
      "본문은 이미 복사되었습니다. 메일 앱에 붙여넣어 보내 주세요.",

    open_url_failed_title: "열 수 없습니다",
  },
  goals: {
    title: "목표 · 신체 데이터",
    subtitle:
      "값을 비워 두어도 괜찮습니다. 입력한 항목만 요약에 반영됩니다.",

    loading: "불러오는 중...",

    storage_missing:
      "⚠️ AsyncStorage 를 찾을 수 없습니다. 저장은 불가능하며 (표시만 됩니다). 사용하려면 @react-native-async-storage/async-storage 를 설치해 주세요.",

    section_body_title: "목표 (체중 · 체지방)",
    section_nutrition_title: "영양 목표 (1일 기준)",

    field_weight: "목표 체중",
    field_body_fat: "목표 체지방률",
    field_kcal: "칼로리",
    field_p: "단백질",
    field_f: "지방",
    field_c: "탄수화물",

    placeholder_weight: "예: 80.0",
    placeholder_body_fat: "예: 18",
    placeholder_kcal: "예: 2200",
    placeholder_p: "예: 120",
    placeholder_f: "예: 50",
    placeholder_c: "예: 260",

    unit_kg: "kg",
    unit_percent: "%",
    unit_kcal: "kcal",
    unit_g: "g",

    macro_line: "대략: {{kcal}} kcal (P×4 + F×9 + C×4)",
    macro_hint_empty:
      "목표 칼로리를 입력하면 차이가 표시됩니다. ±50kcal 이내를 기준으로 생각하세요.",
    macro_diff: "목표와의 차이: {{diff}} kcal",

    button_save: "저장하기",
    button_saving: "저장 중...",
    button_clear: "입력 초기화",
    bar_close: "닫기",
    bar_save: "저장",

    error_range: "{{range}} 범위에서 입력해 주세요",
    range_weight: "30–200kg",
    range_body_fat: "3–60%",
    range_kcal: "800–5000kcal",
    range_p: "0–300g",
    range_f: "0–200g",
    range_c: "0–800g",

    alert_no_storage_title: "저장할 수 없습니다",
    alert_no_storage_body:
      "AsyncStorage 를 찾을 수 없습니다. 의존성을 설치하거나 나중에 다시 시도해 주세요.",
    alert_input_error_title: "입력 오류",
    alert_input_error_body: "빨간색으로 표시된 항목을 수정해 주세요.",
    alert_saved_title: "저장 완료",
    alert_saved_body:
      "설정이 저장되었습니다. 설정 상단 요약에 반영됩니다.",
    alert_save_failed_title: "저장 실패",
    alert_save_failed_body: "다시 시도해 주세요.",
  },
  notifications: {
    title: "알림",
    subtitle: "리마인더를 설정하면 습관 만들기가 훨씬 쉬워집니다.",
    loading: "불러오는 중...",

    perm_module_missing:
      "알림 모듈이 설치되어 있지 않습니다. 설정은 저장되지만 기기에 스케줄 등록되지는 않습니다.",
    perm_granted: "알림: 허용",
    perm_denied: "알림: 거부됨 (단말기 설정에서 허용이 필요합니다)",
    perm_unknown: "알림: 미확인",

    button_request_perm: "알림 허용하기",

    section_training_title: "트레이닝 리마인더",
    section_meals_title: "식사 리마인더",
    section_weekly_title: "주간 리뷰",

    switch_enabled: "사용하기",

    training_slot_label: "슬롯 {{index}}",
    button_delete: "삭제",
    button_add_slot: "+ 슬롯 추가",

    time_label: "시간",
    time_label_with_index: "시간 {{index}}",
    button_add_time: "+ 시간 추가",

    dow_sun: "일",
    dow_mon: "월",
    dow_tue: "화",
    dow_wed: "수",
    dow_thu: "목",
    dow_fri: "금",
    dow_sat: "토",

    accessibility_add_suffix: " 추가",
    accessibility_remove_suffix: " 제외",

    actions_title: "액션",

    button_save: "저장하기",
    button_saving: "저장 중...",
    bar_close: "닫기",
    bar_save: "저장",

    alert_perm_needed_title: "권한이 필요합니다",
    alert_perm_needed_body:
      "단말기 설정에서 이 앱의 알림을 허용해 주세요.",
    alert_perm_error_title: "오류",
    alert_perm_error_body:
      "알림 권한 요청에 실패했습니다.",

    alert_no_storage_title: "저장할 수 없습니다",
    alert_no_storage_body:
      "AsyncStorage 를 찾을 수 없습니다. 의존성을 설치한 후 다시 시도해 주세요.",
    alert_saved_title: "저장되었습니다",
    alert_saved_with_schedule:
      "설정과 알림 스케줄이 업데이트되었습니다.",
    alert_saved_without_module:
      "설정이 저장되었습니다. 알림 모듈이 없어 기기 등록은 생략되었습니다.",
    alert_save_error_title: "저장 오류",
    alert_save_error_body: "다시 시도해 주세요.",

    training_noti_title: "트레이닝 시간입니다",
    training_noti_body: "준비가 되면 앱을 열고 운동을 시작해 보세요.",
    meals_noti_title: "식사 기록 리마인더",
    meals_noti_body:
      "식사 후 바로 ‘식사’ 탭에 기록해 두면 훨씬 편합니다.",
    weekly_noti_title: "주간 리뷰 시간입니다",
    weekly_noti_body:
      "1주일 동안의 체중/식사/운동을 되돌아보세요.",

    warn_requires_module:
      "⚠️ 기기에 알림을 등록하려면 알림 모듈과 권한 허용이 필요합니다.\n・모듈: expo-notifications\n・권한: 앱 알림을 ON 으로 설정",
  },
  help_home: {
    title: "홈",
    summary:
      "오늘 할 일과 진행 상황, AI 조언을 확인할 수 있습니다. 최신 체중·체지방을 크게 표시하고, 하루 총칼로리도 함께 확인할 수 있습니다.",
    capabilities: [
      "오늘의 총칼로리와 진행 상황을 한눈에 확인",
      "최신 체중·체지방을 강조 표시(체성분 탭의 최신 기록을 자동 반영)",
      "AI 조언 확인 및 저장",
      "당겨서 새로고침(Pull to Refresh)으로 수동 업데이트",
    ],
    howto: [
      {
        title: "AI 조언 받기",
        steps: [
          "“오늘 내용으로 조언 생성” 버튼을 누릅니다",
          "AI의 답변은 자동으로 기록됩니다",
        ],
      },
      {
        title: "화면을 최신 상태로 만들기",
        steps: [
          "화면 상단에서 아래로 당겨 새로고침합니다(Pull to Refresh)",
          "최신 기록과 합계가 반영됩니다",
        ],
      },
    ],
    tips: [
      "AI 조언은 짧게 써도 괜찮지만, 기간·빈도·목표 등 상황을 함께 적어 주면 정확도가 올라갑니다.",
      "홈 화면의 최신 값은 체성분 탭에서 가장 최근 날짜의 기록을 반영합니다.",
    ],
    actions: [{ label: "홈으로 이동", deepLink: "/(tabs)/home" }],
    faq: [
      {
        q: "AI 조언 입력란이 저절로 열리거나 닫히지 않아요",
        a:
          "최신 버전에서는 버튼을 눌렀을 때만 입력란이 열립니다. 닫으려면 오른쪽 상단의 X 버튼을 누르거나 모달 바깥을 탭해 주세요. 그래도 문제가 계속되면 버그로 신고해 주세요.",
        keywords: ["AI", "모달", "닫기"],
        deepLink: "/(tabs)/home",
      },
      {
        q: "홈 화면 숫자가 업데이트되지 않아요",
        a:
          "앱이 백그라운드에서 다시 열릴 때 자동으로 다시 불러옵니다. 필요하면 당겨서 새로고침(Pull to Refresh)도 사용해 보세요.",
        keywords: ["업데이트", "동기화", "새로고침"],
      },
    ],
  },

  help_training: {
    title: "트레이닝",
    summary:
      "메뉴 실행, 타이머 사용, 폼 메모 기록, 완료 저장까지 한 화면에서 할 수 있습니다. 오동작 방지를 위해 타이머는 초 단위 버튼을 눌렀을 때만 시작됩니다.",
    capabilities: [
      "각 세트별 무게·횟수·메모 기록",
      "인터벌 타이머(초 단위 버튼으로만 시작)",
      "완료 바에서 최종 저장",
      "각 세트 다시 수정·입력 가능",
    ],
    howto: [
      {
        title: "세트 기록하기",
        steps: [
          "해당 운동의 입력란에 무게와 횟수를 입력합니다",
          "필요하다면 메모도 함께 입력합니다",
          "키보드 위에 표시되는 완료 바에서 저장을 눌러 확정합니다",
        ],
      },
      {
        title: "타이머 사용하기",
        steps: [
          "원하는 초 단위 버튼을 탭해 타이머를 시작합니다",
          "다른 영역을 눌러도 타이머에는 영향이 가지 않도록 설계되어 있습니다(오조작 방지)",
          "필요에 따라 다시 시작하거나 정지할 수 있습니다",
        ],
      },
      {
        title: "세트 수정하기",
        steps: [
          "각 세트 오른쪽의 ‘편집’ 버튼을 눌러 값을 변경합니다",
          "저장을 눌러 변경 내용을 반영합니다. 잘 반영되지 않으면 한 번 저장한 후 다시 편집해 보세요",
        ],
      },
    ],
    tips: [
      "입력란에 포커스가 있을 때 키보드 바로 위에 완료 바가 밀착해서 표시됩니다.",
      "빈 공간을 탭해도 타이머가 작동하지 않습니다. 만약 그럴 때 타이머가 움직이면 버그일 가능성이 있습니다.",
    ],
    actions: [{ label: "트레이닝으로 이동", deepLink: "/(tabs)/training" }],
    faq: [
      {
        q: "빈 공간을 탭했는데 타이머가 저절로 움직여요",
        a:
          "현재 사양에서는 초 단위 버튼 이외의 동작으로는 타이머가 시작되지 않습니다. 만약 그 외의 조작으로 움직인다면, 사용한 동작 순서와 기기 정보를 함께 알려 주시면 도움이 됩니다.",
        keywords: ["타이머", "오동작", "자동 시작"],
        deepLink: "/(tabs)/training",
      },
      {
        q: "완료 버튼을 찾기 어렵거나 너무 멀게 느껴져요",
        a:
          "입력란에 포커스가 있을 때 키보드 위에 완료 바가 표시됩니다. 보이지 않거나 잘려 보인다면, 키보드를 한 번 닫았다 다시 열거나 화면을 조금 스크롤해 주세요.",
        keywords: ["완료", "키보드", "바"],
      },
    ],
  },

  help_meals: {
    title: "식사",
    summary:
      "사진, 메모, 칼로리, PFC를 기록할 수 있습니다. 일·주 단위 합계를 자동으로 집계해 홈 화면에 하이라이트로 보여 줍니다.",
    capabilities: [
      "식사 사진·메모·칼로리·PFC 저장",
      "“최근 기록”에서 불러와 입력 시간을 단축",
      "일·주 단위 총칼로리와 영양 합계 확인",
      "등록된 식사 기록 편집/삭제",
    ],
    howto: [
      {
        title: "새 식사 추가하기",
        steps: [
          "“신규 추가” 화면을 엽니다",
          "식사 종류(아침/점심/저녁/간식)를 선택합니다",
          "사진(선택 사항), 칼로리, PFC, 메모를 입력합니다",
          "저장을 눌러 확정합니다",
        ],
      },
      {
        title: "같은 메뉴 재사용하기",
        steps: [
          "입력 화면에서 “최근 기록”을 엽니다",
          "해당 메뉴를 선택하고 양만 조절한 뒤 저장합니다",
        ],
      },
    ],
    tips: [
      "사진이 없어도 괜찮습니다. 숫자만으로도 빠르게 기록할 수 있습니다.",
      "주간 합계를 확인하면 과식이나 부족한 섭취를 빠르게 수정하는 데 도움이 됩니다.",
    ],
    actions: [
      { label: "식사 탭으로 이동", deepLink: "/(tabs)/meals" },
      { label: "신규 추가", deepLink: "/(tabs)/meals/new" },
    ],
    faq: [
      {
        q: "이미지 플레이스홀더 때문에 빌드가 실패해요",
        a:
          "에셋의 상대 경로가 올바른지 확인해 주세요. 존재하지 않는 경로를 require하면 번들 에러가 발생합니다(예: ../../../assets/placeholder.png).",
        keywords: ["이미지", "에셋", "번들"],
        deepLink: "/(tabs)/meals",
      },
    ],
  },

  help_body: {
    title: "체성분",
    summary:
      "체중·체지방·허리둘레 등을 기록합니다. 홈 화면의 ‘최신 값’은 체성분 탭에서 가장 최근 날짜의 기록을 자동으로 반영합니다.",
    capabilities: [
      "체중·체지방·허리둘레·메모·측정 시각 기록",
      "과거 기록 편집/삭제",
      "기간 필터로 그래프 표시를 가볍고 빠르게 유지",
      "홈 화면에 ‘최신 값’을 자동 반영",
    ],
    howto: [
      {
        title: "새 기록 추가하기",
        steps: [
          "체성분 탭을 엽니다",
          "날짜를 ‘오늘’로 맞추고, 필요하다면 다른 날짜로 변경합니다",
          "값과 메모를 입력한 뒤 저장합니다",
        ],
      },
      {
        title: "이전 기록 수정하기",
        steps: [
          "목록에서 수정하고 싶은 기록을 탭합니다",
          "값을 수정하고 저장합니다",
        ],
      },
      {
        title: "그래프를 가볍게 보기",
        steps: [
          "화면 상단의 기간 필터를 일/주 등 짧은 범위로 변경합니다",
          "필요한 기간만 표시해 확인합니다",
        ],
      },
    ],
    tips: [
      "홈 화면에 최신 값이 보이지 않으면 체성분 탭의 날짜가 오늘로 저장되어 있는지 확인해 주세요.",
      "하루에 여러 번 측정했다면 그날 중 가장 늦은 시각의 기록을 기준으로 보는 것이 더 보기 편합니다.",
    ],
    actions: [{ label: "체성분 탭으로 이동", deepLink: "/(tabs)/body" }],
    faq: [
      {
        q: "오늘 기록이 홈 화면에 표시되지 않아요",
        a:
          "체성분 탭에서 해당 기록이 ‘오늘’ 날짜로 저장되어 있는지 확인해 주세요. 날짜가 어긋나 있다면 수정해 주세요.",
        keywords: ["홈", "반영", "날짜"],
        deepLink: "/(tabs)/body",
      },
    ],
  },

  help_gotore: {
    title: "합트레이닝(고우트레)",
    summary:
      "근처에서 함께 운동할 파트너를 찾고, 좋아요를 보내고, 상호 매칭이 되면 바로 채팅까지 이어집니다. 지역, 태그, 헬스장 이름, 본인 인증 여부로 후보를 필터링하고, 본인 성별에 따라 ‘성별 무관’ 또는 ‘동성만’을 선택할 수 있습니다.",
    capabilities: [
      "거주 지역(도도부현)을 기준으로 가까운 후보를 우선 표시",
      "매칭 대상 설정을 ‘성별 무관’ 또는 ‘동성만’으로 전환(본인 성별에 따라 표시되는 후보가 달라집니다)",
      "태그, 홈짐 이름, ‘본인 인증 완료만’, ‘이미 좋아요 보낸 사람 숨기기’ 등 다양한 필터 제공",
      "스와이프 또는 버튼으로 LIKE/NOPE 선택, 서로 좋아요를 누르면 자동 매칭",
      "수신 좋아요 목록(미확인 배지 표시)에서 바로 매칭으로 전환 가능",
      "매칭 목록(미읽은 메시지 수 표시)에서 바로 채팅으로 이동",
      "채팅에서 텍스트·이미지 송수신, 길게 눌러 복사·삭제·저장/공유 메뉴 사용, 읽음 표시 지원",
      "문제 발생 시 차단 또는 매칭 해제로 안전하게 대응",
    ],
    howto: [
      {
        title: "합트레이닝 처음 이용하기(셋업)",
        steps: [
          "‘프로필/설정’에서 지역(도도부현)을 설정합니다. 필수 항목입니다",
          "‘합트레용 프로필’에서 닉네임, 자기소개, 사진, 태그 등을 정리합니다",
          "합트레 탭을 열고, 오른쪽 상단의 ‘조건’ 버튼에서 필요한 필터를 설정합니다",
          "후보 카드를 확인하고 ♥(좋아요) 또는 ✕를 선택합니다. 서로 ♥를 누르면 매칭됩니다",
        ],
      },
      {
        title: "매칭 대상(성별 필터) 변경하기",
        steps: [
          "합트레 화면에서 오른쪽 상단 ‘조건’ 버튼을 엽니다",
          "‘매칭 대상’ 항목에서 원하는 옵션을 선택합니다",
          "남성인 경우: ‘성별 무관’ 또는 ‘남성끼리만’, 여성인 경우: ‘성별 무관’ 또는 ‘여성끼리만’을 선택할 수 있습니다",
          "성별이 미설정 또는 ‘기타’인 경우에는 ‘성별 무관’만 선택할 수 있습니다",
          "‘이 조건으로 표시’ 버튼을 눌러 후보 목록을 갱신합니다",
        ],
      },
      {
        title: "검색 좁혀 보기(태그/홈짐/본인 인증)",
        steps: [
          "합트레 화면에서 오른쪽 상단 ‘조건’ 버튼을 엽니다",
          "태그: 쉼표로 구분하여 입력합니다(예: 벤치, 데드, 스쿼트)",
          "홈짐: 부분 일치로 검색합니다(예: 시부야 / 골드)",
          "‘본인 인증 완료만 표시’를 켜면 인증 배지가 있는 사용자만 표시됩니다",
          "‘내가 좋아요한 사람 숨기기’를 켜면 이미 좋아요를 보낸 사람은 목록에서 제외되어 새 후보를 놓치지 않게 됩니다",
        ],
      },
      {
        title: "받은 좋아요 → 매칭 → 채팅",
        steps: [
          "합트레 화면 오른쪽 상단의 ‘수신’ 탭을 열면 미확인 개수가 배지로 표시됩니다",
          "마음에 드는 상대에게 ♥를 눌러 주면 즉시 매칭됩니다",
          "매칭이 성사되면 ‘매칭되었습니다!’ 연출이 나오고, 이어서 ‘채팅으로 가기’를 눌러 대화를 시작합니다",
          "채팅에서는 텍스트와 이미지를 보낼 수 있고, 메시지를 길게 눌러 복사·삭제·저장·공유가 가능합니다",
        ],
      },
      {
        title: "트러블 대응(차단/매칭 해제)",
        steps: [
          "채팅 화면 오른쪽 상단의 ‘⋯’ 메뉴를 엽니다",
          "상대를 더 이상 보지 않고 연락도 받지 않으려면 ‘차단’을 선택합니다",
          "대화만 종료하고 싶다면 ‘매칭 해제’를 선택합니다",
        ],
      },
    ],
    tips: [
      "지역이 설정되어 있지 않으면 후보가 표시되지 않습니다. 먼저 도도부현을 설정해 주세요.",
      "후보가 적을 때는 태그 수를 줄이거나, ‘본인 인증만’ 옵션을 끄거나, 홈짐 키워드를 좀 더 느슨하게 입력해 보세요.",
      "첫 번째 사진은 얼굴과 전신이 보이거나 운동하는 모습이 담긴 사진이 효과적입니다. 가장 최근에 설정한 1번 사진이 카드에 표시됩니다.",
      "합트레용 프로필의 태그·시간대·요일 정보를 채워 넣으면 매칭 정확도가 올라갑니다.",
      "좋아요 잔수가 0이 되면 구매 모달에서 추가로 구매할 수 있습니다.",
    ],
    actions: [
      { label: "합트레 열기", deepLink: "/(tabs)/gotore" },
      { label: "지역 설정(계정)", deepLink: "/(tabs)/me/account" },
    ],
    faq: [
      {
        q: "‘남성끼리만’으로 설정했는데 여성도 나와요",
        a:
          "다음과 같은 경우가 있을 수 있습니다. ① 내 성별이 미설정 또는 ‘기타’인 경우 → 동성 필터가 적용되지 않습니다. 먼저 성별을 설정해 주세요. ② 바로 전에 조건을 바꿨지만 카드 덱(후보 목록)이 옛 상태인 경우 → 조건 모달에서 ‘이 조건으로 표시’를 다시 누르거나, 화면을 아래로 당겨 새로고침해 보세요. ③ 상대방 성별이 미설정/심사 중인 경우 → 일시적으로 ‘미설정’으로 취급되어 섞여 보일 수 있습니다(카드의 성별 표시나 프로필 상세에서 확인 가능). 그래도 개선되지 않으면, 앱을 다시 시작하거나 재로그인해 보세요.",
        keywords: ["남성끼리", "여성이 나옴", "필터", "성별"],
        deepLink: "/(tabs)/gotore",
      },
      {
        q: "본인 인증 후 성별이 수정되거나 변경되면 어떻게 되나요?",
        a:
          "본인 인증 결과에 따라 내 성별이 변경되면, 선택 가능한 매칭 대상(‘성별 무관’/‘동성만’) 옵션도 자동으로 바뀝니다. 변경 내용을 후보에 반영하려면 ‘조건’ → ‘이 조건으로 표시’를 다시 누르거나 당겨서 새로고침을 실행해 주세요.",
        keywords: ["본인 인증", "성별", "변경", "동기화"],
      },
      {
        q: "후보가 표시되지 않거나 금방 다 사라져요",
        a:
          "지역이 설정되어 있지 않으면 후보가 표시되지 않습니다(같은 도도부현의 사용자만 표시). 태그나 홈짐 조건을 완화하고, ‘본인 인증만’이나 ‘내가 좋아요한 사람 숨기기’를 끄면 후보가 늘어납니다. 시간이 지나면 새로운 후보가 추가되는 경우도 있습니다.",
        keywords: ["후보 없음", "지역", "조건", "필터"],
        deepLink: "/(tabs)/me/account",
      },
      {
        q: "상대 성별이 ‘미설정/Unknown’으로 표시돼요",
        a:
          "상대방의 성별이 미설정이거나 심사 중일 때, 또는 카드가 그려질 때 성별 데이터 로딩이 늦어진 경우 일시적으로 이렇게 표시될 수 있습니다. 프로필 상세 화면을 열면 최신 성별 정보가 반영되어 있을 수 있습니다.",
        keywords: ["성별", "미설정", "unknown"],
      },
      {
        q: "좋아요가 다 떨어졌어요",
        a:
          "♥를 누를 때마다 좋아요 잔수가 1씩 차감됩니다. 잔수가 0이 되면 구매 모달이 열립니다. 구매 후에는 잔수가 자동으로 반영됩니다(반영되지 않으면 화면을 다시 불러와 주세요).",
        keywords: ["좋아요", "잔수", "구매"],
      },
      {
        q: "사진이 어둡게 나오거나 표시되지 않아요",
        a:
          "첫 번째 프로필 사진이 없거나, 권한이 만료되었거나, 오래된 URL을 참고하고 있을 수 있습니다. 합트레용 프로필에서 1번 사진을 다시 설정한 뒤, 몇 초 기다렸다가 다시 확인해 주세요.",
        keywords: ["사진", "표시 안 됨", "첫 번째"],
        deepLink: "/(tabs)/gotore/profile/edit",
      },
      {
        q: "매칭 후 연락을 끊고 싶어요(불쾌/불편)",
        a:
          "채팅 화면 오른쪽 상단의 ‘⋯’ 메뉴에서 ‘차단’ 또는 ‘매칭 해제’를 선택할 수 있습니다. 차단은 상대 표시와 연락을 모두 막고, 매칭 해제는 대화만 종료합니다.",
        keywords: ["차단", "매칭 해제", "신고"],
        deepLink: "/(tabs)/gotore/matches",
      },
    ],
  },

  help_profile: {
    title: "프로필/설정",
    summary:
      "기본 정보, 목표, 알림 설정, 앱 정보(버전)를 관리합니다.",
    capabilities: [
      "키·나이·목표 수치 등 프로필 정보 편집",
      "알림 ON/OFF 및 시간대 조정",
      "앱 버전 확인(문의 시 함께 전달하면 편리)",
    ],
    howto: [
      {
        title: "알림을 켜고 시간대를 조정하기",
        steps: [
          "프로필/설정 화면을 엽니다",
          "알림 스위치를 ON으로 켭니다",
          "원하는 시간대를 선택하고 저장합니다",
        ],
      },
      {
        title: "앱 버전 확인하기",
        steps: [
          "설정 화면 맨 아래의 ‘앱 정보’ 영역을 확인합니다",
          "문의할 때 이 버전 번호를 함께 알려 주세요",
        ],
      },
    ],
    tips: [
      "알림이 오지 않는다면, 기기 자체의 알림 설정도 함께 확인해 주세요.",
    ],
    actions: [{ label: "프로필로 이동", deepLink: "/(tabs)/me" }],
    faq: [
      {
        q: "앱 버전을 확인하고 싶어요",
        a:
          "설정 화면 맨 아래의 ‘앱 정보’ 영역에 표기되어 있습니다. 문의하실 때 이 버전 번호도 함께 적어 주세요.",
        keywords: ["버전", "정보", "설정"],
        deepLink: "/(tabs)/me",
      },
    ],
  },
  help_screen: {
    title: "도움말",
    subtitle: "각 탭 사용법 · FAQ · 문의",
    search_placeholder: "키워드로 검색 (예: 타이머 / 체중 반영 / 추가 등)",
    filter_onlySection: "「{{title}}」만 표시 중",
    filter_clear: "◀ 필터 해제",

    support_title: "문제가 생겼나요?",
    support_body:
      "먼저 해당 탭의 FAQ를 확인해 주세요. 해결되지 않으면 상세 내용을 적어 문의해 주세요.",
    support_button: "문의 / 버그 신고 보내기",

    block_capabilities: "가능한 작업",
    block_howto: "사용 방법",
    block_tips: "퀵 팁",
    block_faq: "자주 묻는 질문",

    link_open_related: "관련 화면 열기",

    footer_ios:
      "iOS: 절전 모드나 백그라운드 제한으로 동기화가 지연될 수 있습니다.",
    footer_android:
      "Android: 절전 모드나 백그라운드 제한으로 동기화가 지연될 수 있습니다.",

    theme_auto: "자동",
    theme_light: "라이트",
    theme_dark: "다크",
    theme_toggle: "테마를 {{mode}}(으)로 변경",

    accessibility_showSectionHelp: "{{title}} 도움말 보기",
    accessibility_openContact: "문의 화면 열기",
    accessibility_toggleFaq_open: "{{title}} 답변 열기",
    accessibility_toggleFaq_close: "{{title}} 답변 닫기",

    mail_subject: "【FitGear】문의 / 버그 신고",
    mail_body:
      "다음 내용을 적어 주세요.\n- 발생 화면:\n- 수행한 조작:\n- 기대한 동작:\n- 실제 동작:\n- 재현성 (항상 / 가끔):\n\n※ 스크린샷이나 화면 녹화가 있으면 도움이 됩니다.",
  },
  explore: {
    categories: {
      workout: "운동",
      motivation: "동기부여",
      music: "음악",
      news: "뉴스",
      fav: "즐겨찾기",
      all: "추천",
    },
    search_placeholder_news: "뉴스 검색",
    search_placeholder_fav: "즐겨찾기 검색 (제목)",
    search_placeholder_default: "영상 검색 (캐시 내)",

    offline_title: "오프라인 상태입니다",
    offline_body: "네트워크에 연결한 뒤 다시 시도해주세요.",
    error_title: "불러오기 오류",
    error_generic: "불러오기에 실패했습니다.",
    retry: "다시 불러오기",

    fav_empty_title: "즐겨찾기가 비어 있습니다",
    fav_empty_body: "영상의 ♥ 아이콘을 눌러 추가할 수 있어요.",

    open_in_youtube: "YouTube에서 열기",
    fav_add_label: "즐겨찾기에 추가",
    fav_remove_label: "즐겨찾기 제거",
  },

};

export default ko;
