const en = {
  app: {
    name: "FitGear",
  },

  ui: {
    cancel: "Cancel",
    ok: "OK",
    save: "Save",
    input: "Input",
    done: "Done",
  },

  home: {
    title: "Home",
    subtitle: "Let’s make small gains today 💪",

    summary_title: "Today's total nutrition",
    goal_button: "🎯 Goals",
    loading: "Loading...",
    total_badge_label: "Total",

    label_kcal: "kcal",
    label_p: "P (g)",
    label_f: "F (g)",
    label_c: "C (g)",

    body_today_label: "Body: ",
    body_record_cta: "Record body data →",

    button_meal_record: "Log meals",
    button_product_search: "Search foods",
    button_quick_body: "Quick add today's weight",

    ai_advice_title: "Get meal advice from AI",
    ai_advice_button: "Generate advice for today",
    ai_advice_loading: "Analyzing your meals… 🤖💭",

    goal_modal_title: "Target PFC & kcal",

    calendar_title: "Select date",
    calendar_manual_hint:
      "Calendar not installed. Please enter the date manually (YYYY-MM-DD).",
    calendar_placeholder: "YYYY-MM-DD",

    quick_title: "Quick add today's weight",
    quick_weight_label: "Weight (kg)",
    quick_weight_placeholder: "e.g. 68.2",
    quick_bodyfat_label: "Body fat (%) (optional)",
    quick_bodyfat_placeholder: "e.g. 13.0",

    alert_weight_title: "Check weight value",
    alert_weight_message: "Please enter a value between 20 and 300 kg.",
    alert_bodyfat_title: "Check body fat value",
    alert_bodyfat_message: "Please enter a value between 2 and 60%.",
    alert_saved_title: "Saved",
    alert_saved_message:
      "It will also appear in the body composition tab.",

    training_today: {
      title: "Today's Training",
      pr_badge: "🎉 New PR",
      badge_has_record: "Logged",
      badge_no_record: "Not logged",
      empty_message:
        "No sets yet. Let's start today's training log.",
      summary_exercises: "Exercises",
      summary_sets: "Sets",
      summary_reps: "Reps",
      summary_tonnage: "Tonnage",
      set_line: "{{weight}} {{unit}} × {{reps}} reps",
      cta_continue: "Continue logging",
      cta_start_today: "Log today",
      cta_calendar: "Calendar",
    },
  },
  home_tab: {
    title: "Home",
    help_label: "Help",
    help_accessibility: "Open Home help",
  },

  auth: {
    login: "Log in",
    signup: "Sign up",
  },

  tabs: {
    home: "Home",
    record: "Record",
    explore: "Explore",
    gotore: "Buddy",
    me: "My page",

    training: "Training",
    meals: "Meals",
    body: "Body",
    more: "More",
    videos: "Videos",
  },

  settings: {
    title: "Settings",
    language: "Language",
    language_ja: "Japanese",
    language_en: "English",
    language_ko: "Korean",
    language_hint:
      "Change the display language of the app (applies to home and other screens).",
    description:
      "Manage your profile, goals, notifications, and app preferences.",
    readonlyNote:
      "※ This page is read-only. Edit and save on each screen to update this summary.",
    rowOpen: "Open “{{title}}”",
    appSettings_title: "App settings",
    appSettings_desc: "Configure theme, haptic feedback and app language.",

    theme_title: "Theme",
    theme_mode_label: "Appearance",
    theme_auto: "Auto",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_accessibility: "Switch theme to {{label}}",
    theme_preview_title: "Preview",
    theme_preview_description: "Example of how cards look with the current selection.",
    theme_current_prefix: "Current: ",
    theme_current_auto: "Auto (device: {{scheme}})",
    theme_preview_cardTitle: "Card title",
    theme_preview_cardBody:
      "Body text color and contrast change depending on the selected theme or device setting.",
    theme_preview_button: "Button example (haptic)",

    language_accessibility: "Switch language to {{label}}",

    haptics_title: "Haptic feedback",
    haptics_label: "Haptic feedback",
    haptics_hint:
      "Play a subtle vibration when you press buttons (applied app-wide after saving).",
    haptics_test: "Test vibration",

    memo_title: "Notes",
    memo_body:
      "・“Auto” theme follows your device’s light/dark setting.\n" +
      "・Tap “Save” on this screen to apply and persist changes app-wide.\n" +
      "・Language applies to texts on the home screen and other pages.",

    alert_saved_title: "Saved",
    alert_saved_body: "Settings have been applied to the whole app.",
    alert_failed_title: "Save failed",
    alert_failed_body: "Please try again.",

    accessory_close: "Close",
    accessory_save: "Save",
    accessory_saving: "Saving...",
    bottom_save: "Save",
    bottom_saving: "Saving...",

    account: {
      title: "👤 Account",
      checking: "Checking…",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "At least 6 characters",
      signIn: "Sign in",
      signUp: "Sign up",
      signOut: "Sign out",
      deleteAccount: "Delete account",
      enableBuddy: "Turn on workout buddy",
      goBuddy: "Go to buddy",
      currentEmail: "Email: {{email}}",
    },

    alert: {
      signInSuccess: "Signed in successfully.",
      signInFailTitle: "Sign-in failed",
      signUpSuccess: "Account created.",
      signUpFailTitle: "Sign-up failed",
      signOutSuccess: "Signed out.",
      signOutFailTitle: "Sign-out failed",
      buddyOnSuccess: "Workout buddy is now ON.",
      updateFailTitle: "Update failed",
      unknownError: "Unknown error",
    },

    profile: {
      nameUnset: "Not set",
      emailSignedOut: "Not signed in",
      summary: "{{name}} / {{email}}",
    },

    goals: {
      weightWithUnit: "{{value}} kg",
      bodyFatWithUnit: "{{value}} %",
      kcalWithUnit: "{{value}} kcal",
      macroP: "P{{value}}",
      macroF: "F{{value}}",
      macroC: "C{{value}}",
      summary:
        "Goal {{weight}} / {{bodyFat}} · Nutrition {{kcal}} ({{p}} {{f}} {{c}})",
    },

    notifications: {
      countTimes: "{{count}} times",
      weeklyOn: "Weekly review: ON",
      weeklyOff: "Weekly review: OFF",
      summary: "Training: {{training}} · Meals: {{meals}} · {{weekly}}",
    },

    app: {
      summary: "Theme: {{theme}} · Haptics: {{haptics}}",
      theme: {
        light: "Light",
        dark: "Dark",
        auto: "Auto",
        unset: "Not set",
      },
      haptics: {
        on: "ON",
        off: "OFF",
        unset: "—",
      },
    },

    body: {
      weightWithUnit: "{{value}} kg",
      bodyFatWithUnit: "{{value}} %",
      summary: "{{weight}} / {{bodyFat}} ({{at}})",
    },

    export: {
      never: "Last export: —",
      latest: "Last export: {{datetime}}",
    },

    version: {
      value: "Version: {{version}}",
      none: "Version: —",
    },

    rows: {
      profile: { title: "Profile" },
      goals: { title: "Goals & body data" },
      notifications: { title: "Notifications" },
      language: {
        title: "Language",
        subtitle: "Change the app display language",
      },
      appSettings: { title: "App settings" },
      dataPrivacy: { title: "Data & privacy" },
      support: {
        title: "Support",
        subtitle: "Contact & bug report",
      },
      about: { title: "About this app" },
      help: { title: "Help" },
    },
  },
  account: {
    title: "Account",
    subtitle: "Edit your local display name and your Gotore profile stored on the server.",
    common: {
      loading: "Loading…",
      saving: "Saving…",
      close: "Close",
      save: "Save",
      imagePickerMissingTitle: "Image library not installed",
      imagePickerMissingMessage: "Please install expo-image-picker.",
      loadErrorTitle: "Load error",
      loadErrorFallbackMessage: "Unknown error",
    },
    local: {
      cardTitle: "Local profile (on this device)",
      displayNameLabel: "Display name",
      displayNamePlaceholder: "e.g. Taro",
      emailLabel: "Email (optional / local use)",
      emailPlaceholder: "example@example.com",
      removeImageButton: "Remove image",
      changeImageButton: "Change image",
      saveSuccessTitle: "Saved",
      saveSuccessMessage: "Local profile has been updated.",
      saveErrorTitle: "Save failed",
      saveErrorMessage: "Please try again.",
      imageUpdatedTitle: "Image updated",
      imageUpdatedMessage: "It will be reflected in your profile after saving.",
      imageLoadErrorTitle: "Failed to load image",
      imageLoadErrorMessage: "Please try another image.",
      saveBarButton: "Save local profile",
      saveBarSaving: "Saving…",
    },
    gotore: {
      cardTitle: "Gotore profile (server)",
      nicknameLabel: "Nickname",
      nicknamePlaceholder: "e.g. Taro / Sakura",
      genderLabel: "Gender",
      homeGymLabel: "Home gym (optional)",
      homeGymPlaceholder: "e.g. XX Gym Shibuya",
      tagsLabel: "Training tags (comma-separated)",
      tagsPlaceholder: "bench, deadlift, squat, etc.",
      bioLabel: "Self introduction",
      bioPlaceholder: "Training history, strong points, available time, etc.",
      trainingYearsLabel: "Years of training",
      trainingYearsPlaceholder: "e.g. 3",
      heightLabel: "Height (cm)",
      heightPlaceholder: "e.g. 176",
      goalLabel: "Goal",
      goalPlaceholder: "e.g. -5kg in 3 months / bench 100kg / -5% body fat, etc.",
      freqLabel: "Frequency (times per week)",
      freqPlaceholder: "e.g. 3",
      freqPill: "{{n}} times/week",
      saveButton: "Save Gotore profile",
      saveSuccessTitle: "Saved",
      saveSuccessMessage: "Gotore profile has been updated.",
      saveErrorTitle: "Save error",
      saveNote: "※ Region is used for search listing and filters (required). The first photo in the list is used as your main photo.",
    },
    gender: {
      male: "Male",
      female: "Female",
      other: "Other",
      unknown: "Prefer not to say",
    },
    region: {
      label: "Region (prefecture) *required",
      placeholder: "Tap to select",
      change: "Change",
      setFromCurrentLocation: "Use current location",
      clear: "Clear",
      modalTitle: "Select prefecture",
      searchPlaceholder: "e.g. Tokyo / Fukuoka",
      locationLibMissingTitle: "Location module not installed",
      locationLibMissingMessage: "Please install expo-location.",
      cannotDetectTitle: "Could not detect region",
      cannotDetectMessage: "Please select it manually.",
      locationErrorTitle: "Failed to get location",
      locationErrorMessage: "Please select it manually.",
      missingTitle: "Region not set",
      missingMessage: "Prefecture is required. Please select it.",
    },
    photos: {
      label: "Profile photos (server)",
      note: "Drag to reorder / first photo is main. Long press to delete. Up to {{max}} photos.",
      uploadErrorTitle: "Upload failed",
      uploadErrorMessageFallback: "An unknown error occurred.",
      removeErrorTitle: "Delete failed",
      removeErrorMessageFallback: "An unknown error occurred.",
    },
    kyc: {
      cardTitle: "Identity verification (KYC)",
      personIdLabel: "ID:",
      status: {
        verified: "Verified",
        pending: "Pending",
        rejected: "Rejected",
        failed: "Failed",
        unverified: "Not verified",
      },
      description: {
        verified: "Your identity has been verified. A badge will be shown in the app.",
        pending: "Your verification is in review. Please try “Refresh status” later.",
        rejected: "Verification was rejected. Gender has been reset to “not answered”. Please select gender again and save.",
        failed: "Verification failed. Please check your photos/images and try again.",
        unverified: "To prevent impersonation, please complete identity verification with your ID.",
      },
      startButton: "Start verification",
      startButtonLoading: "Starting…",
      retryButton: "Retry verification",
      retryButtonLoading: "Retrying…",
      refreshButton: "Refresh status",
      refreshButtonLoading: "Refreshing…",
      startErrorTitle: "Could not start verification",
    },
    admin: {
      cardTitle: "Admin menu",
      promoteSuccessTitle: "Admin permissions granted",
      promoteSuccessMessage: "You can now open “Admin: KYC list”.",
      promoteErrorTitle: "Failed to grant permissions",
      selfPromoteNote: "※ Only shown when logged in with {{emails}}.",
      promoteButton: "Restore admin permissions",
      openKycListButton: "Open admin KYC list",
    },
    errors: {
      genderLocked: "Gender can only be set once (editing again requires an admin token).",
      genderUpdateBlocked: "You cannot change gender right now (under review / locked).",
      kycPending: "You cannot change gender while verification is pending.",
      invalidOrUsedToken: "Edit token is invalid or already used.",
      invalidGender: "Selected gender is invalid.",
      profileNotFound: "Profile not found. Please reopen this screen.",
      genderUpdateNotAllowed: "You cannot change gender right now.",
      unknown: "An unknown error occurred.",
      notAuthenticatedTitle: "Not logged in",
      notAuthenticatedMessage: "Please log in first from Settings → Account.",
    },
  },
  me: {
    back: "Back",
    settings: "Settings",
    account: "Account",
    goals: "Goals & body data",
    notifications: "Notifications",
    appSettings: "App settings",
    dataPrivacy: "Data & privacy",
    support: "Support",
    about: "App info",
  },

  record: {
    switch_hint:
      "Switch to each log screen from the chips above.",
    bbs_open_label: "Open muscle board",
    omikuji: {
      title: "Muscle fortune",
      reset_in: "Resets in {{time}}",
      loading: "Loading...",
      empty_lead:
        "One message a day from the muscle gods.",
      draw_button: "Draw a fortune",
      draw_hint:
        "Once drawn, the result is fixed for the rest of the day.",
      section_meigen: "Muscle quote",
      section_kotowaza: "Muscle proverb",
      section_form: "Form keys",
      section_recovery: "Recovery tips",
      section_challenge: "Today's 30-second challenge",
      section_lucky_guide: "Lucky guide",
      label_lucky_item: "Lucky item",
      label_lucky_color: "Lucky color",
      label_lucky_set: "Lucky set",
      label_lucky_tempo: "Lucky tempo",
      note:
        "You can draw once a day. It automatically resets at 0:00.",
        muscles: {
        chest: { name: "Chest (Pecs)",        focus: "Push" },
        shoulders: { name: "Shoulders (Delts)", focus: "Push" },
        triceps: { name: "Triceps",           focus: "Push" },
        back: { name: "Back (Lats)",          focus: "Pull" },
        biceps: { name: "Biceps",             focus: "Pull" },
        legs: { name: "Lower Body (Legs)",    focus: "Legs" },
        core: { name: "Core",                 focus: "Core" },
      },

      fortuneLabels: {
        daikichi: "Excellent luck",
        chuukichi: "Good luck",
        kichi: "Fair luck",
        shoukichi: "Small luck",
        suekichi: "Future luck",
      },

      fortuneMessages: {
        daikichi:
          "Clear skies for {{focus}} today. Train {{muscleName}} with “high quality, low volume” to sharpen your performance!",
        chuukichi:
          "Today your form will shine. Work {{muscleName}} with control and precision.",
        kichi:
          "Slow and steady wins. For {{muscleName}}, make your last set extra slow and controlled.",
        shoukichi:
          "No need to overdo it. Keep the volume a bit lower on {{muscleName}} and polish your quality.",
        suekichi:
          "Recovery first today. Use stretching and a light pump for {{muscleName}} to boost blood flow.",
      },
      

      recoveryTipsPool: [
        "Drink about 1.5–2.5 L of water per day; save caffeine mainly for pre-workout.",
        "Take a bath about 90 minutes before bed (10–15 minutes at around 40°C).",
        "Aim for 1.6–2.2 g of protein per kg of bodyweight per day, split across meals.",
        "Use light stretching and breathing to shift into a relaxed state.",
        "Keep your bedroom around 19–21°C and reduce light.",
        "Add 6,000–8,000 light steps of cardio to support recovery.",
        "Go easy on alcohol — it’s the enemy of recovery.",
        "Consider supplementing magnesium and omega-3.",
        "Keep naps under 20 minutes and avoid napping late in the day.",
      ],

      challengePool: [
        "Reset with 30 seconds of deep breathing through nose and out through mouth.",
        "Do 10 shoulder rolls and 20 seconds of neck stretching each side.",
        "Break up sitting by standing and stretching 5 times.",
        "Drink a glass of water with upright posture.",
        "Close your eyes and take 5 deep breaths.",
        "Rotate each ankle 10 times.",
        "Massage your palms for 30 seconds.",
        "Look up and smile for 5 seconds.",
      ],

      luckyItemsPool: {
        chest: [
          "Wrist wraps",
          "Dipping belt",
          "Lightweight plates",
          "Mini band",
          "Push-up bars",
          "Slingshot bench band",
          "Chain plates",
          "Form mat",
          "Grip chalk",
          "Thin training gloves",
          "Cushion pad",
          "Heavy resistance band",
          "Spider bar",
          "Elbow sleeves",
          "Small towel",
          "Shoulder pad for barbell",
          "Mobility ball",
          "Small foam roller",
          "Neck cushion",
          "Gym aroma diffuser",
        ],
        shoulders: [
          "Light mini band",
          "Face-pull rope",
          "Light dumbbells",
          "D-handle cable attachment",
          "Exercise tube",
          "Plastic collars",
          "Soft ball",
          "Training cap",
          "Thin hoodie",
          "Side-raise belt",
          "Form stick roller",
          "Rear-delt pad",
          "Mirror sticker",
          "Cuff attachment",
          "Mini fan",
          "Body wipes",
          "Hand mirror",
          "Shoulder massage stick",
          "Shaker bottle",
          "Light kettlebell",
        ],
        triceps: [
          "Rope attachment",
          "V-bar",
          "EZ-bar",
          "Dipping belt",
          "Arm blaster",
          "Press-down grip",
          "Elbow sleeves",
          "Thin wrist wraps",
          "Rubber cable",
          "Push-down stopper",
          "Skull-crusher cushion",
          "Foam pad",
          "Mini chains",
          "Elbow support tape",
          "Strong stretch band",
          "Thin lifting belt",
          "Long towel",
          "Elbow ice pack",
          "Training socks",
          "Sweat-band headband",
        ],
        back: [
          "Medium lat-pull grip",
          "MAG-style attachment",
          "Chin-up straps",
          "Lifting straps",
          "Hex grip",
          "Half straps",
          "Chalk ball",
          "Chin-assist band",
          "Power grips",
          "Deadlift socks",
          "Long foam roller",
          "Back resistance band",
          "Hand gripper",
          "Rear-view mirror",
          "Platform board for feet",
          "Hook-grip tape",
          "Back warming sheet",
          "Thin lumbar support belt",
          "2.5 kg plates",
          "Grip ring",
        ],
        biceps: [
          "Arm blaster",
          "Narrow-grip attachment",
          "Supination dumbbell",
          "Cable grip handle",
          "Light EZ-bar",
          "Micro plates",
          "Front mirror",
          "Palm guards",
          "Grip ball",
          "Short towel",
          "Wrist tape",
          "Wrist-curl bench",
          "Medium kettlebell",
          "Light posture-corrector belt",
          "Silicone ring",
          "Hand-sweat powder",
          "Forearm compression sleeve",
          "Short rope",
          "Cable cuff",
          "Hammer-curl grip",
        ],
        legs: [
          "Sleeping mask for recovery",
          "Knee wraps",
          "Heeled slippers",
          "Wedge board",
          "Knee-high socks",
          "Strong mini band",
          "Smooth-sole shoes",
          "Lifting belt",
          "Hamstring pad",
          "Long resistance tube",
          "Large foam ball",
          "Hip circle band",
          "Sissy-squat pad",
          "Suspension sling",
          "Ankle weights",
          "Ankle straps",
          "Plate mat",
          "Calf block",
          "Soft knee pads",
          "Timer",
        ],
        core: [
          "Ab wheel",
          "Plank mat",
          "Mini ball",
          "Slider discs",
          "Light core-bracing belt",
          "Breathing trainer",
          "Stretch pole",
          "Light pelvic belt",
          "Silent timer",
          "Yoga block",
          "Cushion block",
          "Floor-protection mat",
          "Posture sensor",
          "Metronome",
          "Thin towel",
          "Latex band",
          "Mobility ring",
          "Stretching strap",
          "Waist pouch",
          "Room-temperature water bottle",
        ],
      },

      luckySetsPool: {
        chest: [
          "Bench press 3×8, rest 150 s",
          "Incline dumbbell press 4×10, rest 90 s",
          "Dips 3×AMRAP, rest 120 s",
          "Cable fly 3×12, rest 60 s",
          "Push-ups 3×15, rest 45 s",
        ],
        shoulders: [
          "Side raises 4×12, rest 45 s",
          "Shoulder press 3×8, rest 120 s",
          "Rear delt raises 3×15, rest 45 s",
          "Front raises 3×12, rest 60 s",
          "Arnold press 3×10, rest 90 s",
        ],
        triceps: [
          "Rope press-downs 4×12, rest 60 s",
          "Skull crushers 3×10, rest 90 s",
          "Dips 3×AMRAP, rest 120 s",
          "Overhead extensions 3×12, rest 60 s",
          "Close-grip bench press 3×8, rest 120 s",
        ],
        back: [
          "Lat pull-down 4×10, rest 90 s",
          "Bent-over row 3×8, rest 120 s",
          "One-arm row 3×10/side, rest 90 s",
          "Cable row 3×12, rest 60 s",
          "Pull-ups 3×AMRAP, rest 120 s",
        ],
        biceps: [
          "EZ-bar curls 4×10, rest 60 s",
          "Hammer curls 3×12, rest 60 s",
          "Incline curls 3×10, rest 90 s",
          "Cable curls 3×12, rest 45 s",
          "Preacher curls 3×10, rest 90 s",
        ],
        legs: [
          "High-bar squats 3×6, rest 180 s",
          "Leg press 4×12, rest 90 s",
          "Romanian deadlifts 3×8, rest 120 s",
          "Lunges 3×10/side, rest 60 s",
          "Calf raises 4×15, rest 45 s",
        ],
        core: [
          "Plank 3×45 s, rest 45 s",
          "Dead bug 3×12/side, rest 45 s",
          "Pallof press 3×12/side, rest 60 s",
          "Knee raises 3×12, rest 60 s",
          "Rotational core work 3×12, rest 45 s",
        ],
      },
        meigen: {
          chest: [
            "Lift your chest and lift your heart. Your pecs teach you the courage to push through.",
            "Today's limit becomes tomorrow's standard.",
            "Your chest never lies; it only grows as much as you stack the work.",
            "One extra centimeter of range is a mile of confidence.",
            "Your chest isn't decoration; it's armor for your resolve.",
            "Train your pushing power, and you'll push doubt out of the way.",
            "The extra kilo today is tomorrow's normal.",
            "The barbell is heavy, but compromise weighs far more.",
            "Sets are short; pride lasts long.",
            "Those with beautiful form walk straight toward their goals.",
            "On days your chest feels strong, your doubts step back.",
            "Each bead of sweat is the sound of yesterday's self washing away.",
          ],
          shoulders: [
            "Let your shoulders speak; tiny angle changes become tomorrow's difference.",
            "Your readiness to carry the load is carved into your delts.",
            "One step to the side is one step toward presence.",
            "Delts create the shape; consistency gives it meaning.",
            "Your shoulders aren't decoration; they're proof of stability.",
            "Train light but precise; beauty lives in the details.",
            "As your shoulders rise, so does the way you see yourself.",
            "A tiny bit of external rotation creates huge control.",
            "On days your posture is good, luck tends to follow.",
            "When your shoulders speak, your back quietly smiles.",
            "Before you meet pain, learn to realign.",
            "Range of motion is an asset; impatience is waste.",
          ],
          triceps: [
            "That final push shapes the muscle.",
            "The honesty of fully extending drives your progress up.",
            "More than how many reps you do, it's your will to finish them.",
            "That one second at lockout makes one second of your life stronger.",
            "Weakness appears in the finisher; effort is rewarded there too.",
            "Be kind to your elbows, strict with yourself.",
            "Each press sends your doubts falling behind you.",
            "When your triceps grow, your chest and shoulders shine too.",
            "Your triceps don't talk; they speak through results.",
            "When you're tired, go lighter and cleaner.",
          ],
          back: [
            "Your back speaks; effort shows in your silhouette.",
            "Only those who can pull can truly move forward.",
            "Hug your ideal self with your shoulder blades.",
            "Pull wide, live deep.",
            "Put intent in your grip, a path in your elbows, and pride in your back.",
            "Don't rush; lats grow quietly but surely.",
            "Grow wings on your back, roots on the floor.",
            "Use a little momentum, but deep focus.",
            "Grip strength is a promise not to let go.",
            "A strong back tightens your spirit too.",
          ],
          biceps: [
            "Put the will to never let go into your grip.",
            "The pump is a signal; consistency is the proof.",
            "Every curl bends the weight and stretches your weakness.",
            "Drop the swing, pick up your pride.",
            "A powerful hammer curl comes from countless small adjustments.",
            "That one-second pause at the top is what makes it impressive.",
            "Don't fake it with light weight; impress with precision.",
            "The way you grip starts to resemble the way you live.",
            "The quality of your contraction is the quality of your silhouette.",
            "Your biceps aren't ornaments; they're a promise you've kept.",
          ],
          legs: [
            "Your legs don't lie; gravity is the witness.",
            "Each step becomes a stair toward your future.",
            "No weak structure can stand on a strong foundation.",
            "The courage to squat down calls forth the strength to rise.",
            "Your legs never betray you; they simply test you.",
            "One step today is a thousand steps tomorrow.",
            "Choose deep squats over shallow desires.",
            "See tomorrow's progress in today's hamstring stretch.",
            "Hard days are the days to polish your form.",
            "When your legs speak, your whole body listens.",
          ],
          core: [
            "When your core is solid, every movement becomes beautiful.",
            "An unshakable body starts with an unshakable mind.",
            "One breath to reset, one rep to believe in yourself.",
            "Posture is a habit; beauty is the side effect.",
            "Bracing is your shield; your breath is your sword.",
            "Relax, then brace; composure creates strength.",
            "Your core asserts itself quietly.",
            "The courage to stop improves the quality of your movement.",
            "One minute of plank invites a whole day of focus.",
            "Those who train their core do not waver.",
          ],
        },

        kotowaza: {
          generic: [
            "Consistency builds every muscle.",
            "There are no shortcuts to real gains.",
            "Every big lift starts with a single rep.",
            "Slow is smooth, and smooth is strong.",
            "Stay on the grind; muscle is made over months and years.",
            "Small efforts stacked daily become big results.",
            "Rush the reps and you'll pay with your joints.",
            "Drip by drip, effort carves out your physique.",
            "Don't just hear advice—watch your form in the mirror.",
          ],
        },

        form: {
          chest: [
            "Pinch and depress your shoulder blades. Press from your chest, not your shoulders.",
            "Keep your elbows under your wrists and your forearms vertical.",
            "Keep your feet flat and your glutes, shoulders, and head planted on the bench.",
            "Let the bar travel over your upper chest and avoid bouncing or using momentum.",
            "Control the negative for 2–3 seconds, but don't pause excessively at the bottom.",
          ],
          shoulders: [
            "Slightly raise the pinky side of the dumbbell to really target the delts.",
            "Keep cheating to a minimum and pause briefly at the top.",
            "Keep your neck long and chest soft to stop the load from shifting into your traps.",
            "Stay aware of your internal and external rotation throughout the movement.",
            "If it hurts, change the angle; pain is not a badge of honor.",
          ],
          triceps: [
            "Keep your elbows tucked and fixed; don't let your shoulders move.",
            "Treasure that one-second squeeze at the top.",
            "Use minimal momentum and work through the full range of motion.",
            "With cables, pull all the way down and stop just below your elbows.",
            "On days you can't lock out, have the courage to drop the weight.",
          ],
          back: [
            "Pull with your elbows; let your hands be hooks.",
            "Keep your chest up and pull your sternum toward the bar.",
            "Start by depressing and retracting your shoulder blades.",
            "Change your grip width to spread the stimulus.",
            "Momentum is just an assistant, never the main actor.",
          ],
          biceps: [
            "Fix your elbows by your sides.",
            "Supinate at the top of the curl.",
            "If you must use momentum, save it for the last two reps.",
            "Take two seconds on the negative.",
            "Keep your wrists slightly extended and firm.",
          ],
          legs: [
            "Distribute pressure across heel, big toe, and little toe.",
            "Align your knees in the same direction as your toes.",
            "Initiate the move with a hip hinge.",
            "Choose depth based on your safe range of motion; don't force it.",
            "For RDLs, keep a slight knee bend and constant tension in your hamstrings.",
          ],
          core: [
            "As you inhale, expand your torso 360° around.",
            "Keep your pelvis neutral and your ribs gently down.",
            "In planks, push the floor away with your elbows.",
            "Don't hold your breath.",
            "Stack work patiently; that's actually the fastest route.",
          ],
        },
    },
  },
  gotore: {
    coming_soon: {
      title: "🤝 Gotore matching is\ncoming soon!",
      description_1:
        "As more people start using this app,\nwe'll gradually unlock the gotore matching feature.\nYou'll be able to find partners nearby,\nmatch with mutual likes, and go straight into chat.",
      planned_title: "What we're planning",
      planned_1: "・Precise matching by area, tags, and ID verification",
      planned_2: "・Matching for both same-sex and opposite-sex partners",
      planned_3: "・Instant matching from received likes to chat",
      planned_4: "・Safety features such as block and unmatch",
      description_2:
        "In the meantime, open Settings → Profile →\nGotore profile, create your profile, and get ready!",
      btn_back_home: "Back to Home",
      btn_open_notifications: "Open notification settings",
      note_ios: "Turn on notifications to get an alert when it launches.",
      note_android: "Turn on notifications to get an alert when it launches.",
    },
  },
  training: {
    help_button: "Help",
    help_accessibility: "Open training help",

    day_title: "Log on {{date}}",
    filter_all: "All",
    filter_manage: "+ Manage",
    filter_note:
      "※Calendar shows only days with “{{partName}}”. (The list and memo below show all records.)",

    loading: "Loading...",
    day_empty: "No logs or notes yet for this day.",

    summary: {
      exercises: "Exercises",
      sets: "Sets",
      reps: "Reps",
      tonnage: "Tonnage",
    },

    note_label: "Notes",

    set_unit_reps: "reps",
    no_work_sets: "No working sets",
    warmup_count: "WU {{count}} set(s)",

    fab_label: "Log this day",

    pr: {
      title: "Personal bests so far",

      max_weight_badge: "👑 Max weight",
      max_reps_badge: "🏆 Max reps",
      streak_badge: "🔥 Streak",
      total_days_badge: "🎖️ Total days",

      no_record: "No record",

      max_weight_big: "{{weight}} kg × {{reps}} reps",
      max_reps_big: "{{reps}} reps @ {{weight}} kg",
      entry_line: "{{name}} / {{date}}",

      current_streak_big: "Current {{days}} day(s)",
      longest_streak:
        "Longest {{days}} day(s) ({{start}}–{{end}})",
      no_longest_data: "No longest-streak data yet",

      total_days_big: "{{days}} day(s)",
      total_days_sub: "Amazing consistency!",
    },
  },
  trainingSession: {
    note_title: "Today’s note",
    note_placeholder:
      "Write about condition, sleep, joint discomfort, overall feeling, etc.",
    saving: "Saving...",
    saved: "Saved",

    add_exercise: "+ Add exercise",
    deleted_message: "Set deleted.",
    undo: "Undo",

    weight_placeholder: "Weight",
    reps_placeholder: "Reps",
    reps_suffix: "reps",
    wu_label: "WU",
    delete_set: "Delete",

    empty: "No logs yet.",
    add_set: "+ Add set",
  },
  trainingPicker: {
    loading: "Loading...",
    manage_button: "+ Add body part / exercise",

    alert_title: "Choose how to add",
    alert_message: "Select how to add this exercise.",
    alert_copy_last: "Copy last session’s sets",
    alert_empty_set: "Add one empty set",
    alert_cancel: "Cancel",

    empty:
      "No exercises found. You can register them from “+ Add body part / exercise” at the top right.",
  },
  trainingManage: {
    title: "Manage body parts & exercises",

    add_part_placeholder: "Enter body part name (e.g. Chest)",
    add_button: "Add",

    loading: "Loading...",
    empty_parts: "No body parts yet. Add one above.",

    error_cannot_add_title: "Cannot add",
    error_part_duplicate: "A body part with the same name may already exist.",
    error_exercise_failed: "Failed to register exercise.",

    remove_part_title: "Delete body part",
    remove_part_message:
      'Delete "{{name}}"?\nExercises linked to this body part will become unassigned (NULL).',
    remove_part_cancel: "Cancel",
    remove_part_confirm: "Delete",

    add_ex_placeholder: "New exercise (e.g. Bench Press)",
    add_ex_button: "Add",

    ex_block_empty: "(No exercises)",
    ex_archived_suffix: " (hidden)",

    archived_title: "Archived",
    archived_message:
      '"{{name}}" has past records, so it has been archived (hidden) instead.',
  },
  body: {
    title: "Body composition",
    title_new: "Record body composition",
    header_asof: "As of {{date}}",
    header_help: "Help",
    header_export: "Export",
    header_goal: "Goal",

    period_day: "Day",
    period_week: "Week",
    period_month: "Month",

    btn_add_record: "+ Add record",

    metric_both: "Both",
    metric_weight: "Weight",
    metric_bodyfat: "Body fat",

    avg7_on: "7-day avg ON",
    avg7_off: "7-day avg OFF",

    chart_empty_title: "No data to show on the chart yet",
    chart_empty_message:
      "Add your first record from “+ Add record” on the top right.",

    streak_board_title: "✨ Best record board ✨",
    streak_current_title: "Current streak",
    streak_current_sub: "Consecutive days including today",
    streak_longest_title: "Longest streak",
    streak_longest_sub: "Your best consecutive days",
    streak_month_title: "Days recorded this month",
    streak_month_sub: "Total days in month {{month}}",

    recent_title: "Recent records",
    recent_empty: "No records yet.",
    recent_edit: "Edit",
    recent_delete: "Delete",

    modal_add_title: "Add record",
    modal_edit_title: "Edit record",
    modal_date_label: "Date (YYYY/MM/DD)",
    modal_date_placeholder: "e.g. 2025/10/16",
    modal_weight_label: "Weight (kg)",
    modal_weight_placeholder: "e.g. 68.2",
    modal_bodyfat_label: "Body fat (%)",
    modal_bodyfat_placeholder: "e.g. 18.5",
    modal_note_label: "Note (optional)",
    modal_note_placeholder:
      "e.g. Protein after workout, dinner out, felt good overall.",
    modal_cancel: "Cancel",
    modal_update: "Update",
    modal_save: "Save",

    input_bar_label: "Input",
    input_bar_done: "Done",

    goal_modal_title: "Set goals",
    goal_weight_label: "Target weight (kg)",
    goal_weight_placeholder: "e.g. 65",
    goal_bodyfat_label: "Target body fat (%) (optional)",
    goal_bodyfat_placeholder: "e.g. 18",

    error_title: "Error",
    error_load_failed: "Failed to load body composition data.",
    error_weight_required_title: "Weight is required",
    error_weight_required_message:
      "Saving only body fat is not supported at the moment.",
    error_weight_range_title: "Weight range",
    error_weight_range_message:
      "Please enter a weight between {{min}} and {{max}} kg.",
    error_bodyfat_range_title: "Body fat range",
    error_bodyfat_range_message:
      "Please enter a body fat between {{min}} and {{max}}%.",
    error_date_format_title: "Date format",
    error_date_format_message:
      "Please enter the date in YYYY/MM/DD format.",
    error_save_failed_title: "Save failed",
    error_save_failed_message:
      "Failed to save your record. Please try again.",
    error_goal_weight_title: "Target weight",
    error_goal_weight_message:
      "Please enter a value between {{min}} and {{max}}.",
    error_goal_bodyfat_title: "Target body fat",
    error_goal_bodyfat_message:
      "Please enter a value between {{min}} and {{max}}.",
    error_goal_save_title: "Save failed",
    error_goal_save_message:
      "Failed to save goals. Please try again.",
    export_success_title: "CSV exported",
    export_success_message: "Location: {{path}}",
    export_fail_title: "Export failed",
    export_fail_message:
      "Failed to export CSV file.",

    delete_confirm_title: "Delete this record?",
    delete_confirm_message: "Delete the record on {{date}}.",
    delete_cancel: "Cancel",
    delete_ok: "Delete",

    confirm_change_title: "Large change detected",
    confirm_change_question: "Do you want to save it as-is?",
    confirm_change_fix: "Edit",
    confirm_change_save: "Save",

    eta_title: "Estimated time to goal",
    eta_no_goal_main: "Set a target weight first",
    eta_no_goal_sub:
      "You can set it from the “Goal” button.",
    eta_insufficient_main: "Not enough data",
    eta_insufficient_sub:
      "There are too few recent records to estimate.",
    eta_achieved_main: "Goal achieved! 🎉",
    eta_achieved_sub: "Latest: {{weight}} kg",
    eta_flat_main: "Recent changes are small",
    eta_flat_sub: "Keep going and watch the trend.",
    eta_dir_up: "going up",
    eta_dir_down: "going down",
    eta_reverse_main:
      "The trend is “{{direction}}” away from your goal",
    eta_reverse_sub:
      "Check for input errors or lifestyle factors.",
    eta_unknown_main: "Could not calculate an estimate",
    eta_unknown_sub: "",
    eta_eta_main: "Likely around {{date}}",
    eta_eta_sub:
      "At the current pace you may reach {{goal}} kg around {{date}}.",

    warn_weight_change:
      "Weight changed {{diff}} kg since last time (threshold {{threshold}} kg).",
    warn_bodyfat_change:
      "Body fat changed {{diff}}% since last time (threshold {{threshold}}%).",
  },
  meals: {
    loading: "Loading…",
    monthHeader: "{{year}} / {{month}}",

    productSection: {
      title: "Log from products",
      button: "Search foods (DB)",
      caption:
        "Search by keyword or JAN code (8–14 digits). Filtering and sorting are supported.",
    },

    weekday: {
      sun: "Sun",
      mon: "Mon",
      tue: "Tue",
      wed: "Wed",
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
    },

    kcalWithUnit: "{{value}} kcal",

    summaryTitle: "Summary for {{date}}",
    summary: {
      totalKcal: "Total calories",
    },

    aiAdvice: {
      title: "Today's advice from AI",
      empty:
        "Create advice from “Ask AI for advice” on Home and it will appear here as a memo.",
    },

    recordsTitle: "Entries on {{date}}",
    records: {
      empty: "No entries yet.",
    },

    noPhoto: "No photo",
    untitled: "Untitled",

    types: {
      breakfast: "Breakfast",
      lunch: "Lunch",
      dinner: "Dinner",
      snack: "Snack",
    },

    trend: {
      title: "Monthly calorie trend",
      needSvg:
        "The line chart requires {{libName}}. On Expo, run “expo install {{libName}}”.",
      goalLabel: "Goal {{kcal}} kcal",
      caption:
        "Daily kcal in {{year}}/{{month}} (scroll horizontally). Tap a day to focus its calorie value.",
    },
      new: {
      photoPermissionTitle: "Photo access required",
      photoPermissionMessage:
        "Please allow photo library access from the system settings.",
      errorTitle: "Error",

      analyzingLabel: "Analyzing…",
      autoFromPhotoButton: "Auto-fill from photo",
      autoFromPhotoNote:
        "Auto-fill from photo is currently in preparation. The feature will be opened once we have more users.",

      analyzeSuccessTitle: "Auto-fill completed",
      analyzeSuccessReason: "Reason: {{reason}}",
      analyzeNotFoundTitle: "No information found",
      analyzeNotFoundMessage: "Please fill in the values manually.",
      analyzeFailedTitle: "Failed to analyze the photo",

      basicSectionTitle: "Basic info",
      titleLabel: "Title",
      titlePlaceholder: "e.g. Salad chicken (Lawson)",
      brandLabel: "Brand (optional)",
      brandPlaceholder: "Lawson / Meiji, etc.",
      photoLabel: "Photo (optional)",
      photoPickButton: "Choose photo",
      barcodeButton: "Log from barcode",

      nutritionSectionTitle: "Nutrition (manual input)",
      nutritionDescription: "Enter kcal / P / F / C as needed.",
      kcalLabel: "kcal",
      pLabel: "P (g)",
      fLabel: "F (g)",
      cLabel: "C (g)",
      zeroPlaceholder: "0",

      previewLabel:
        "Total: {{kcal}} kcal / P {{protein}}g / F {{fat}}g / C {{carbs}}g / {{grams}}g",

      baseSaveButton: "Set current values as base",
      resetButton: "Reset",

      quantitySectionTitle: "Quantity & amount",
      quantityLabel: "Quantity (× times)",
      gramsLabel: "Amount (g)",
      sliderHelpButton: "? Help",
      sliderHelpTitle: "How to use the sliders",
      sliderHelpBody:
        "1) Enter PFC / kcal and grams (or auto-fill from photo/barcode)\n2) Tap “Set current values as base” to save the base\n3) Adjust quantity (× times) or amount (g) to scale values automatically",

      targetSectionTitle: "Target",
      dateLabel: "Date",
      mealTypeLabel: "Meal type",
      saveButton: "Save",

      calendarTitle: "Select date",
      calendarFallback:
        "Calendar library is not installed. Please enter the date manually (YYYY-MM-DD).",
      calendarCancel: "Cancel",
      calendarDecide: "OK",
    },
    search: {
      queryPlaceholder: "Search by product or ingredient name (e.g. protein, yogurt)",
      searchButton: "Search",
      scanBarcodeButton: "Scan barcode",
      recordMealButton: "Log a meal",

      favoritesOnlyChip: "★ Favorites only",

      headerFrequent: "Frequently used",
      headerRecent: "History",

      searchingLabel: "Searching…",
      noResultMessage:
        "No products were found.\n" +
        "・Try shorter keywords (e.g. chicken breast → chicken, yogurt → yogo)\n" +
        "・Search by ingredient name (e.g. chicken breast / brown rice / broccoli)\n" +
        "・You can also search by category (e.g. pasta / yogurt / protein)\n" +
        "・Or try scanning the barcode",

      loadMoreButton: "Load more",

      noImageLabel: "No Image",
      untitled: "(Untitled)",
      relogButton: "Log again",
      usedCount: "{{count}} times",

      defaultMealTitle: "meal",
      relogSuccessTitle: "Logged again",
      relogSuccessMessage: "{{title}} has been added to today's log.",

      searchErrorTitle: "Search error",
      unknownName: "(Unknown name)",

      sort: {
        relevance: "Relevance",
        kcalAsc: "Low calories",
        kcalDesc: "High calories",
        proteinDesc: "High protein",
        updatedDesc: "Recently updated",
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
      loading: "Loading…",
      notFound: "Meal not found.",

      deleteConfirmTitle: "Delete this meal?",
      deleteConfirmMessage: "This record will be deleted and cannot be undone.",
      deleteCancel: "Cancel",
      deleteConfirm: "Delete",
      deletedTitle: "Deleted",

      recordSectionTitle: "Record",
      nutritionSectionTitle: "Amount & Nutrition",
      amountLabel: "Amount",
      untitled: "Untitled",

      mealTypeBreakfast: "Breakfast",
      mealTypeLunch: "Lunch",
      mealTypeDinner: "Dinner",
      mealTypeSnack: "Snack",

      editButton: "Edit",
    },
    edit: {
      loading: "Loading…",
      errorTitle: "Error",
      errorPhotoMessage: "An error occurred while adding the photo. Please try again.",
      fallbackTitle: "Untitled",

      confirmRemovePhotoTitle: "Confirm",
      confirmRemovePhotoMessage: "Remove this photo?",
      confirmRemovePhotoCancel: "Cancel",
      confirmRemovePhotoOk: "Remove",

      labelTitle: "Title",
      labelCalories: "Calories (kcal)",
      labelMemo: "Memo",

      buttonChangePhoto: "Change photo",
      buttonAddPhoto: "Add photo",
      buttonRemovePhoto: "Remove photo",
      buttonSave: "Save",
    },
  },
  about: {
    rows: {
      appName: "App name",
      version: "Version",
      buildNumber: "Build number",
      appId: "App ID",
      device: "Device",
      os: "OS",
      updatesChannel: "Updates / channel",
      updatesUpdateId: "Updates / updateId",
      updatesRuntimeVersion: "Updates / runtimeVersion",
      empty: "—",
    },
    updateCheck: {
      unsupportedTitle: "Not supported",
      unsupportedMessage: "This build does not support immediate EAS Update checks.",
      applyingTitle: "Apply update",
      applyingMessage: "The app will restart after applying the update.",
      applyingOk: "OK",
      applyingCancel: "Cancel",
      latestTitle: "Up to date",
      latestMessage: "No new updates were found.",
      failedTitle: "Update failed",
      failedMessageFallback: "An unknown error occurred.",
      buttonChecking: "Checking…",
      buttonCheckNow: "Check for updates now",
    },
    store: {
      buttonOpenStore: "Open store",
    },
  },
  data: {
    title: "Data & privacy",
    subtitle: "Backup / restore / wipe data",

    row_async: "AsyncStorage",
    row_sqlite: "SQLite total",
    row_lastExport: "Last export",

    export_title: "Export backup",
    export_subtitle:
      "Save app settings (AsyncStorage) and local DB (SQLite) into a single JSON file.",
    export_button: "Export",
    export_processing: "Processing...",
    export_share_dialog_title: "Share backup",
    export_tip:
      "To use the share dialog, expo-sharing is required. Even without it, files are saved under {{dir}}.",

    import_title: "Restore from backup",
    import_subtitle:
      "Choose a JSON file and restore (current data will be overwritten).",
    import_button: "Import",
    import_processing: "Processing...",
    import_tip:
      "If expo-document-picker is not installed, you can place your JSON at {{path}} and import it (advanced use).",

    list_title: "Backup list",
    list_subtitle: "Backups stored on this device",
    list_loading: "Loading...",
    list_empty: "No backups yet.",
    list_share_button: "Share",
    list_restore_button: "Restore",
    list_share_path_title: "File path",
    list_share_failed_title: "Failed to share",

    reset_title: "Erase all data",
    reset_subtitle:
      "Completely remove user data stored on this device (irreversible).",
    reset_button: "Erase all data",

    alert_error_title: "Error",
    alert_error_no_doc_dir: "Cannot access the document directory.",

    alert_export_done_title: "Done",
    alert_export_done_body: "Backup has been exported.",

    alert_import_confirm_title: "Restore backup",
    alert_import_confirm_body:
      "Current data (AsyncStorage and SQLite) will be overwritten. Continue?",
    alert_import_confirm_cancel: "Cancel",
    alert_import_confirm_ok: "Restore",

    alert_import_not_possible_title: "Cannot import",
    alert_import_not_possible_body:
      "expo-document-picker is not installed. Put the JSON file at the following path:\n\n{{path}}",

    alert_import_not_supported: "This backup format is not supported.",
    alert_import_no_file: "No file selected.",

    alert_import_done_title: "Restore completed",
    alert_import_done_body: "Reload the app if necessary.",

    alert_wipe_confirm_title: "Erase all data",
    alert_wipe_confirm_body:
      "All user data stored on this device (AsyncStorage and SQLite) will be permanently deleted. Continue?",
    alert_wipe_confirm_cancel: "Cancel",
    alert_wipe_confirm_ok: "Erase",

    alert_wipe_done_title: "Done",
    alert_wipe_done_body:
      "User data on this device has been erased. Reload the app if necessary.",
    alert_wipe_error_title: "Erase error",
  },
  support: {
    title: "Support",
    subtitle: "Contact / diagnostics / FAQ",

    section_contact_title: "Contact us",
    contact_button_email: "Contact via email",
    contact_tip1_prefix: "For smoother support,",
    contact_tip1_emphasis: "steps to reproduce / OS & device / screen name",
    contact_tip1_suffix: " would be very helpful.",
    contact_tip2:
      "We would love to hear your feedback to keep improving this app. Feel free to contact us if you have feature requests or ideas for improvements.",

    section_diag_title: "Diagnostics",
    section_diag_subtitle:
      "Summary of app & device state (recommended to attach for bug reports)",
    diag_loading: "Collecting...",
    row_app_version: "App / version",
    row_device_os: "Device / OS",
    row_theme: "Theme",
    row_async: "AsyncStorage",
    row_sqlite: "SQLite total",
    theme_light: "Light",
    theme_dark: "Dark",
    diag_copy_button: "Copy diagnostics",
    diag_share_button: "Share diagnostics as JSON",

    section_faq_title: "FAQ",
    faq_q1: "Where are backups stored?",
    faq_a1:
      'When you export from the "Data & privacy" screen, a JSON file is saved in the following folder on your device:\n{{dir}}backups/',
    faq_q2: "Does diagnostics data include personal information?",
    faq_a2:
      "No. It only contains technical metadata such as app name/version, device info, and local storage sizes.",
    faq_q3: "What should I do if the screen freezes?",
    faq_a3:
      "Please try restarting the app once. If it still occurs, share the diagnostics as JSON and contact us by email.",
    reload_button: "Force reload (dev only)",

    footer_version: "Version: {{version}} · SDK: {{sdk}}",

    alert_copy_done_title: "Copied",
    alert_copy_done_body: "Diagnostics have been copied to the clipboard.",
    alert_copy_fail_title: "Copy failed",

    alert_share_dialog_title: "Share diagnostics",
    alert_file_path_title: "File path",
    alert_share_error_title: "Share error",
    alert_error_title: "Error",

    email_subject: "[FitGear] Support request ({{version}})",
    email_intro:
      "Please fill in the template below.\n\n■ Issue:\n\n■ Steps to reproduce:\n1) \n2) \n3) \n\n---- (Diagnostics information collected automatically below. You may edit or delete as needed.) ----",
    email_open_failed_title: "Could not open mail app",
    email_open_failed_body:
      "The message body has been copied. Please paste it into your mail app and send it.",

    open_url_failed_title: "Could not open",
  },
  goals: {
    title: "Goals & body data",
    subtitle:
      "You can leave fields empty. Only the values you enter will appear in the summary.",

    loading: "Loading...",

    storage_missing:
      "⚠️ AsyncStorage was not found. Saving is disabled (view only). If you want to enable it, please install @react-native-async-storage/async-storage.",

    section_body_title: "Goals (weight / body fat)",
    section_nutrition_title: "Nutrition goals (per day)",

    field_weight: "Target weight",
    field_body_fat: "Target body fat",
    field_kcal: "Calories",
    field_p: "Protein",
    field_f: "Fat",
    field_c: "Carbohydrates",

    placeholder_weight: "e.g. 80.0",
    placeholder_body_fat: "e.g. 18",
    placeholder_kcal: "e.g. 2200",
    placeholder_p: "e.g. 120",
    placeholder_f: "e.g. 50",
    placeholder_c: "e.g. 260",

    unit_kg: "kg",
    unit_percent: "%",
    unit_kcal: "kcal",
    unit_g: "g",

    macro_line: "Approx.: {{kcal}} kcal (P×4 + F×9 + C×4)",
    macro_hint_empty:
      "Enter your target calories to see the difference. Aim for within ±50kcal.",
    macro_diff: "Difference from target: {{diff}} kcal",

    button_save: "Save",
    button_saving: "Saving...",
    button_clear: "Clear inputs",
    bar_close: "Close",
    bar_save: "Save",

    error_range: "Please enter a value in the range {{range}}",
    range_weight: "30–200kg",
    range_body_fat: "3–60%",
    range_kcal: "800–5000kcal",
    range_p: "0–300g",
    range_f: "0–200g",
    range_c: "0–800g",

    alert_no_storage_title: "Cannot save",
    alert_no_storage_body:
      "AsyncStorage was not found. Please install the dependency or try again later.",
    alert_input_error_title: "Input error",
    alert_input_error_body: "Please fix the fields marked in red.",
    alert_saved_title: "Saved",
    alert_saved_body:
      "Your settings have been saved. The summary on the settings top screen will be updated.",
    alert_save_failed_title: "Failed to save",
    alert_save_failed_body: "Please try again.",
  },
  notifications: {
    title: "Notifications",
    subtitle: "Set reminders to make building habits much easier.",
    loading: "Loading...",

    perm_module_missing:
      "Notification module not installed (settings can be saved but will not be scheduled on the device).",
    perm_granted: "Notifications: allowed",
    perm_denied: "Notifications: denied (enable from system settings)",
    perm_unknown: "Notifications: not requested",

    button_request_perm: "Allow notifications",

    section_training_title: "Training reminders",
    section_meals_title: "Meal reminders",
    section_weekly_title: "Weekly review",

    switch_enabled: "Enable",

    training_slot_label: "Slot {{index}}",
    button_delete: "Delete",
    button_add_slot: "+ Add slot",

    time_label: "Time",
    time_label_with_index: "Time {{index}}",
    button_add_time: "+ Add time",

    dow_sun: "Sun",
    dow_mon: "Mon",
    dow_tue: "Tue",
    dow_wed: "Wed",
    dow_thu: "Thu",
    dow_fri: "Fri",
    dow_sat: "Sat",

    accessibility_add_suffix: " (add)",
    accessibility_remove_suffix: " (remove)",

    actions_title: "Actions",

    button_save: "Save",
    button_saving: "Saving...",
    bar_close: "Close",
    bar_save: "Save",

    alert_perm_needed_title: "Permission required",
    alert_perm_needed_body:
      "Please enable notifications for this app in your device settings.",
    alert_perm_error_title: "Error",
    alert_perm_error_body:
      "Failed to request notification permissions.",

    alert_no_storage_title: "Cannot save",
    alert_no_storage_body:
      "AsyncStorage was not found. Please install the dependency and try again.",
    alert_saved_title: "Saved",
    alert_saved_with_schedule:
      "Settings and notification schedules have been updated.",
    alert_saved_without_module:
      "Settings have been saved. Notification module is not installed so scheduling was skipped.",
    alert_save_error_title: "Save error",
    alert_save_error_body: "Please try again.",

    training_noti_title: "Time to train",
    training_noti_body:
      "When you're ready, open the app and start your workout.",
    meals_noti_title: "Meal log reminder",
    meals_noti_body:
      "Logging your meals right after eating makes tracking much easier.",
    weekly_noti_title: "Weekly review time",
    weekly_noti_body:
      "Look back on your week of weight, meals, and training.",

    warn_requires_module:
      "⚠️ To schedule notifications on your device, you need the notification module and permission.\n・Module: expo-notifications\n・Permission: turn app notifications ON",
  },
  help_home: {
    title: "Home",
    summary:
      "Check today's tasks, progress, and AI advice. Your latest weight and body fat are highlighted, and you can also see your total calories.",
    capabilities: [
      "See today's total calories and progress at a glance",
      "Highlight the latest weight/body fat (automatically reflects the newest body record)",
      "View and save AI advice",
      "Manually refresh using Pull to Refresh",
    ],
    howto: [
      {
        title: "Get AI advice",
        steps: [
          "Tap “Generate advice based on today’s data”",
          "The AI's response will be saved automatically",
        ],
      },
      {
        title: "Update the display",
        steps: [
          "Pull down from the top of the screen (Pull to Refresh)",
          "The latest records and totals will be reflected",
        ],
      },
    ],
    tips: [
      "Short inputs are fine for AI advice. Adding details like period, frequency, and goals will improve accuracy.",
      "The latest values on the Home screen come from the most recent record in the Body tab.",
    ],
    actions: [{ label: "Go to Home", deepLink: "/(tabs)/home" }],
    faq: [
      {
        q: "The AI advice input field opens by itself or won’t close",
        a:
          "In the latest version, it only opens when you press the button. To close it, tap the X in the top right or tap outside the modal. If the issue persists, please report it as a bug.",
        keywords: ["AI", "modal", "close"],
        deepLink: "/(tabs)/home",
      },
      {
        q: "Numbers on the Home screen are not updating",
        a:
          "Data is reloaded when the app returns from the background. You can also try Pull to Refresh.",
        keywords: ["update", "sync", "refresh"],
      },
    ],
  },

  help_training: {
    title: "Training",
    summary:
      "Run your training menu, use the timer, record notes, and save your sets. To prevent mis-taps, the timer only starts from the second buttons.",
    capabilities: [
      "Record weight, reps, and notes for each set",
      "Interval timer (starts only from the second buttons)",
      "Confirm and save from the completion bar",
      "Edit or re-enter any set",
    ],
    howto: [
      {
        title: "Record a set",
        steps: [
          "Enter the weight and reps in the input fields for the exercise",
          "Add notes if needed",
          "Use the completion bar above the keyboard and tap Save to confirm",
        ],
      },
      {
        title: "Use the timer",
        steps: [
          "Tap a second button to start the countdown",
          "Tapping other areas does not affect the timer (to prevent accidental operations)",
          "Restart or stop the timer as needed",
        ],
      },
      {
        title: "Edit a set",
        steps: [
          "Tap “Edit” on the right side of a set to change its values",
          "Tap Save to apply changes. If it doesn’t work properly, try saving once and then editing again",
        ],
      },
    ],
    tips: [
      "While an input field is focused, the completion bar appears directly above the keyboard.",
      "Tapping empty space will never start the timer. If the timer moves in that case, it may be a bug.",
    ],
    actions: [{ label: "Go to Training", deepLink: "/(tabs)/training" }],
    faq: [
      {
        q: "The timer starts by itself when I tap empty space",
        a:
          "In the current design, the timer cannot start from anything other than the second buttons. If it does, please report it along with your steps and device information.",
        keywords: ["timer", "accidental tap", "auto start"],
        deepLink: "/(tabs)/training",
      },
      {
        q: "I can’t find the Done button or it feels far away",
        a:
          "While an input is focused, a completion bar appears above the keyboard. If it is cut off, try closing the keyboard once or scrolling the screen a little.",
        keywords: ["done", "keyboard", "bar"],
      },
    ],
  },

  help_meals: {
    title: "Meals",
    summary:
      "Record photos, notes, calories, and PFC. Daily and weekly totals are calculated automatically and highlighted on the Home screen.",
    capabilities: [
      "Save meal photos, notes, calories, and PFC",
      "Reuse items from “Recent records” to save input time",
      "Check daily and weekly totals for calories and nutrients",
      "Edit or delete saved meals",
    ],
    howto: [
      {
        title: "Add a new meal",
        steps: [
          "Open “Add new”",
          "Choose the meal type (Breakfast / Lunch / Dinner / Snack)",
          "Enter a photo (optional), calories, PFC, and notes",
          "Tap Save to confirm",
        ],
      },
      {
        title: "Reuse the same menu",
        steps: [
          "In the input screen, open “Recent records”",
          "Select the menu you want, adjust only the amount, and save",
        ],
      },
    ],
    tips: [
      "Photos are optional. You can quickly log meals with numbers only.",
      "Checking your weekly totals helps you quickly correct overeating or under-eating.",
    ],
    actions: [
      { label: "Go to Meals", deepLink: "/(tabs)/meals" },
      { label: "Add new", deepLink: "/(tabs)/meals/new" },
    ],
    faq: [
      {
        q: "Build fails because of the image placeholder",
        a:
          "Check that the relative path of the asset is correct. If you require a path that doesn’t exist, it will cause a bundling error (for example: ../../../assets/placeholder.png).",
        keywords: ["image", "asset", "bundle"],
        deepLink: "/(tabs)/meals",
      },
    ],
  },

  help_body: {
    title: "Body",
    summary:
      "Record weight, body fat, waist, and more. The “latest values” on the Home screen automatically reflect the most recent date in the Body tab.",
    capabilities: [
      "Record weight, body fat, waist, notes, and measurement time",
      "Edit or delete past records",
      "Use period filters to make graph display lighter and faster",
      "Automatically reflect the latest values on the Home screen",
    ],
    howto: [
      {
        title: "Add a new record",
        steps: [
          "Open the Body tab",
          "Set the date to “Today” (or change it if needed)",
          "Enter the values and notes, then save",
        ],
      },
      {
        title: "Fix a past record",
        steps: [
          "Tap the record you want to edit from the list",
          "Adjust the values and save",
        ],
      },
      {
        title: "Make the graph lighter",
        steps: [
          "Change the period filter at the top of the screen to a shorter range (such as Daily or Weekly)",
          "Display and check only the range you need",
        ],
      },
    ],
    tips: [
      "If the latest values don’t appear on Home, check whether the date in the Body tab is set to today.",
      "If you measured multiple times a day, using the latest time of the day tends to be easiest to read.",
    ],
    actions: [{ label: "Go to Body", deepLink: "/(tabs)/body" }],
    faq: [
      {
        q: "Today's record does not show on Home",
        a:
          "Check that the record in the Body tab is saved with today’s date. If the date is off, please correct it.",
        keywords: ["home", "reflect", "date"],
        deepLink: "/(tabs)/body",
      },
    ],
  },

  help_gotore: {
    title: "Buddy Training (Gotore)",
    summary:
      "Find nearby training partners, send Likes, get mutual matches, and move straight into chat. You can filter by region, tags, gym name, and verification status, and choose “All genders” or “Same gender only” based on your own gender.",
    capabilities: [
      "Prioritize candidates near you based on your prefecture/region",
      "Switch match targets between “All genders” and “Same gender only” (candidates are filtered based on your gender)",
      "Filter by tags, home gym name, “Verified only”, and hide users you’ve already liked",
      "Swipe or use buttons to LIKE/NOPE; mutual Likes result in an automatic match",
      "Incoming Likes list (with unread badge) so you can turn them into matches instantly",
      "Match list (shows unread counts) and quick access to chat",
      "Send and receive text and images in chat, with long-press menu (copy, delete, save/share) and read receipts",
      "Block or unmatch users to handle trouble safely",
    ],
    howto: [
      {
        title: "First time using Gotore (setup)",
        steps: [
          "In “Profile / Settings”, set your region (prefecture). This is required",
          "In the “Gotore profile”, set up your nickname, bio, photos, tags, and so on",
          "Open the Gotore tab and set filters from “Filters” in the top right if needed",
          "Check the candidate cards and choose ♥ (Like) or ✕. If both sides press ♥, you get a match",
        ],
      },
      {
        title: "Change match target (gender filter)",
        steps: [
          "On the Gotore screen, open “Filters” in the top right",
          "Choose your preference under “Match target”",
          "If you’re male: “All genders” or “Men only”. If you’re female: “All genders” or “Women only”",
          "If your gender is unset or “Other”, only “All genders” can be selected",
          "Tap “Apply these filters” to update the deck",
        ],
      },
      {
        title: "Refine search (tags / home gym / verification)",
        steps: [
          "On the Gotore screen, open “Filters” in the top right",
          "Tags: enter them separated by commas (e.g., Bench, Deadlift, Squat)",
          "Home gym: search by partial match (e.g., Shibuya / Gold)",
          "Turn on “Verified only” to limit results to users with the verification badge",
          "Enable “Hide users I’ve liked” to skip people you’ve already liked and avoid overlooking new candidates",
        ],
      },
      {
        title: "Incoming Likes → Match → Chat",
        steps: [
          "Open “Incoming” in the top right of the Gotore screen (the unread badge shows the count)",
          "Send ♥ back to someone you’re interested in to instantly match",
          "When you match, you’ll see a “It’s a match!” animation, then tap “Go to chat”",
          "In chat, you can send text and images, and long-press messages to copy, delete, save, or share",
        ],
      },
      {
        title: "Handling trouble (Block / Unmatch)",
        steps: [
          "In the chat screen, open the “⋯” menu in the top right",
          "To hide and prevent contact from the other user, choose “Block”",
          "If you only want to end the conversation, choose “Unmatch”",
        ],
      },
    ],
    tips: [
      "If your region is not set, no candidates will appear. Set your prefecture first.",
      "If there are few candidates, try reducing tags, turning off “Verified only”, or relaxing your home gym keywords.",
      "A first photo showing your face and full body or a training scene works best. The most recent first photo is shown on the card.",
      "Fill in tags, preferred time slots, and days in your Gotore profile to improve match accuracy.",
      "If your remaining Likes reach 0, you can purchase more from the purchase modal.",
    ],
    actions: [
      { label: "Open Gotore", deepLink: "/(tabs)/gotore" },
      { label: "Set region (Account)", deepLink: "/(tabs)/me/account" },
    ],
    faq: [
      {
        q: "Women appear even though I set “Men only”",
        a:
          "Possible reasons: (1) Your gender is unset or “Other”, so the same-gender filter cannot be applied. Please set your gender. (2) You changed filters recently but the deck (candidate list) is still old; press “Apply these filters” in the filter modal or pull down to refresh. (3) The other user's gender is unset or under review, so they may temporarily appear as “unset” and be mixed in. You can check the card's gender display or their profile. If it still doesn’t improve, try restarting the app or logging in again.",
        keywords: ["men only", "women appear", "filter", "gender"],
        deepLink: "/(tabs)/gotore",
      },
      {
        q: "What happens if my gender is corrected or changed after verification?",
        a:
          "When your gender is updated based on verification, the available match targets (“All genders” / “Same gender only”) will automatically switch. To reflect the change in candidates, run “Filters” → “Apply these filters” or use Pull to Refresh.",
        keywords: ["verification", "gender", "change", "sync"],
      },
      {
        q: "No candidates are shown or they run out quickly",
        a:
          "If your region is unset, no candidates will appear (only users in the same prefecture are shown). Also, relaxing tags and home gym conditions, turning off “Verified only”, or turning off “Hide users I’ve liked” will increase candidates. New candidates may appear over time as well.",
        keywords: ["no candidates", "region", "filter"],
        deepLink: "/(tabs)/me/account",
      },
      {
        q: "The other user’s gender shows as “Unset/Unknown”",
        a:
          "This appears when the other user’s gender is unset, under review, or when gender data wasn't loaded in time when drawing the card. Opening their profile details may show the latest gender information.",
        keywords: ["gender", "unset", "unknown"],
      },
      {
        q: "I ran out of Likes",
        a:
          "Each time you press ♥, one Like is consumed. When your remaining Likes reach 0, the purchase modal will open. After purchase, the remaining Likes will be updated automatically (if they are not updated, reload the screen).",
        keywords: ["like", "remaining", "purchase"],
      },
      {
        q: "Photos are dark or not showing",
        a:
          "The first profile photo may be missing, permissions may have expired, or an old URL may be referenced. Re-set your first photo in the Gotore profile and wait a few seconds before checking again.",
        keywords: ["photo", "not showing", "first"],
        deepLink: "/(tabs)/gotore/profile/edit",
      },
      {
        q: "I want to stop contact after matching (harassment / discomfort)",
        a:
          "From the “⋯” menu in the top right of the chat screen, you can choose “Block” or “Unmatch”. Block stops the user from being shown and contacting you; Unmatch simply ends the conversation.",
        keywords: ["block", "unmatch", "report"],
        deepLink: "/(tabs)/gotore/matches",
      },
    ],
  },

  help_profile: {
    title: "Profile / Settings",
    summary:
      "Manage your basic profile, goals, notification settings, and app information (version).",
    capabilities: [
      "Edit profile items such as height, age, and target values",
      "Turn notifications on/off and adjust their time",
      "Check the app version (useful when contacting support)",
    ],
    howto: [
      {
        title: "Enable notifications and adjust time",
        steps: [
          "Open Profile / Settings",
          "Turn the notification switch ON",
          "Choose the time slot and save",
        ],
      },
      {
        title: "Check the app version",
        steps: [
          "Scroll to the bottom of the Settings screen and check “App information”",
          "Include this version number when contacting support",
        ],
      },
    ],
    tips: [
      "If notifications do not arrive, also check your device's notification settings.",
    ],
    actions: [{ label: "Go to Profile", deepLink: "/(tabs)/me" }],
    faq: [
      {
        q: "I want to check the app version",
        a:
          "You can find it at the bottom of the Settings screen under “App information”. When you contact us, please include this version number as well.",
        keywords: ["version", "info", "settings"],
        deepLink: "/(tabs)/me",
      },
    ],
  },
  help_screen: {
    title: "Help",
    subtitle: "How to use each tab, FAQs, and contact.",
    search_placeholder:
      "Search by keyword (e.g. timer / weight not updating / add record)",
    filter_onlySection: 'Showing only "{{title}}"',
    filter_clear: "◀ Clear filter",

    support_title: "Need help?",
    support_body:
      "First, check the FAQ for the relevant tab. If the issue is not resolved, please contact us with details.",
    support_button: "Contact support / Report a bug",

    block_capabilities: "What you can do",
    block_howto: "How to use",
    block_tips: "Quick tips",
    block_faq: "Frequently asked questions",

    link_open_related: "Open related screen",

    footer_ios:
      "iOS: Sync may be delayed due to power saving or background restrictions.",
    footer_android:
      "Android: Sync may be delayed due to power saving or background restrictions.",

    theme_auto: "Auto",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_toggle: "Switch theme to {{mode}}",

    accessibility_showSectionHelp: "Show help for {{title}}",
    accessibility_openContact: "Open contact form",
    accessibility_toggleFaq_open: "Open answer: {{title}}",
    accessibility_toggleFaq_close: "Close answer: {{title}}",

    mail_subject: "[FitGear] Contact / Bug report",
    mail_body:
      "Please fill in the following:\n- Screen where it happened:\n- Steps you took:\n- Expected behavior:\n- Actual behavior:\n- Reproducibility (every time / sometimes):\n\n* Screenshots or screen recordings are very helpful.",
  },
  explore: {
    categories: {
      workout: "Workout",
      motivation: "Motivation",
      music: "Music",
      news: "News",
      fav: "Favorites",
      all: "Recommended",
    },
    search_placeholder_news: "Search news",
    search_placeholder_fav: "Search favorites (by title)",
    search_placeholder_default: "Search videos (cached only)",

    offline_title: "You are offline",
    offline_body: "Please connect to the internet and try again.",
    error_title: "Load error",
    error_generic: "Failed to load data.",
    retry: "Reload",

    fav_empty_title: "No favorites yet",
    fav_empty_body: "Tap the ♥ icon on a video to add it to favorites.",

    open_in_youtube: "Open in YouTube",
    fav_add_label: "Add to favorites",
    fav_remove_label: "Remove from favorites",
  },


};

export default en;
