
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Linking,
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";

type ThemeMode = "auto" | "light" | "dark";

const PALETTE_LIGHT = {
  background: "#F7F8FA",
  surface: "#FFFFFF",
  text: "#1C1C1E",
  muted: "#5C5C62",
  border: "#E6E8EE",
  primary: "#2E7AFF",
  primaryTextOn: "#FFFFFF",
  chipBg: "#F1F5FF",
  chipText: "#1E3A8A",
  highlight: "#FFF7D6",
};

const PALETTE_DARK = {
  background: "#0B0B0C",
  surface: "#151518",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.72)",
  border: "rgba(255,255,255,0.14)",
  primary: "#3C7EFF",
  primaryTextOn: "#FFFFFF",
  chipBg: "rgba(255,255,255,0.08)",
  chipText: "#FFFFFF",
  highlight: "rgba(255,255,255,0.06)",
};

function useHelpTheme(mode: ThemeMode) {
  const os = useColorScheme();
  const isDark = mode === "auto" ? os === "dark" : mode === "dark";
  return isDark ? PALETTE_DARK : PALETTE_LIGHT;
}

type FAQ = { q: string; a: string; keywords?: string[]; deepLink?: string };
type HowTo = { title: string; steps: string[] };
type HelpSection = {
  key: string;
  emoji?: string;
  title: string;
  summary: string;
  capabilities?: string[];
  howto?: HowTo[];
  tips?: string[];
  actions?: { label: string; deepLink: string }[];
  faq: FAQ[];
};


type TFn = (key: string, options?: any) => any;

function createHelpSections(t: TFn): HelpSection[] {
  return [
    {
      key: "home",
      emoji: "🏠",
      title: t("help_home.title"),
      summary: t("help_home.summary"),
      capabilities: t("help_home.capabilities", { returnObjects: true }) as string[],
      howto: t("help_home.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_home.tips", { returnObjects: true }) as string[],
      actions: t("help_home.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_home.faq", { returnObjects: true }) as FAQ[],
    },
    {
      key: "training",
      emoji: "🏋️",
      title: t("help_training.title"),
      summary: t("help_training.summary"),
      capabilities: t("help_training.capabilities", { returnObjects: true }) as string[],
      howto: t("help_training.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_training.tips", { returnObjects: true }) as string[],
      actions: t("help_training.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_training.faq", { returnObjects: true }) as FAQ[],
    },
    {
      key: "meals",
      emoji: "🥗",
      title: t("help_meals.title"),
      summary: t("help_meals.summary"),
      capabilities: t("help_meals.capabilities", { returnObjects: true }) as string[],
      howto: t("help_meals.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_meals.tips", { returnObjects: true }) as string[],
      actions: t("help_meals.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_meals.faq", { returnObjects: true }) as FAQ[],
    },
    {
      key: "body",
      emoji: "📈",
      title: t("help_body.title"),
      summary: t("help_body.summary"),
      capabilities: t("help_body.capabilities", { returnObjects: true }) as string[],
      howto: t("help_body.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_body.tips", { returnObjects: true }) as string[],
      actions: t("help_body.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_body.faq", { returnObjects: true }) as FAQ[],
    },
    {
      key: "gotore",
      emoji: "🤝",
      title: t("help_gotore.title"),
      summary: t("help_gotore.summary"),
      capabilities: t("help_gotore.capabilities", { returnObjects: true }) as string[],
      howto: t("help_gotore.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_gotore.tips", { returnObjects: true }) as string[],
      actions: t("help_gotore.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_gotore.faq", { returnObjects: true }) as FAQ[],
    },
    {
      key: "profile",
      emoji: "⚙️",
      title: t("help_profile.title"),
      summary: t("help_profile.summary"),
      capabilities: t("help_profile.capabilities", { returnObjects: true }) as string[],
      howto: t("help_profile.howto", { returnObjects: true }) as HowTo[],
      tips: t("help_profile.tips", { returnObjects: true }) as string[],
      actions: t("help_profile.actions", { returnObjects: true }) as {
        label: string;
        deepLink: string;
      }[],
      faq: t("help_profile.faq", { returnObjects: true }) as FAQ[],
    },
  ];
}

const SECTION_ALIASES: Record<string, HelpSection["key"]> = {
  bodycomp: "body",
  body: "body",
  training: "training",
  meals: "meals",
  meal: "meals",
  food: "meals",
  home: "home",
  gotore: "gotore",
  profile: "profile",
};

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const HELP_SECTIONS = useMemo(() => createHelpSections(t), [t]);

  const params = useLocalSearchParams<{
    section?: string;
    topic?: string;
    filter?: string;
    q?: string;
  }>();

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ThemeMode>("light");
  const C = useHelpTheme(mode);

  const sectionKeyFromQuery: HelpSection["key"] | undefined = useMemo(() => {
    const raw = (params.section || params.topic || params.filter || "")
      .toString()
      .toLowerCase()
      .trim();
    if (raw && SECTION_ALIASES[raw]) return SECTION_ALIASES[raw];

    const q = (params.q || "").toString().toLowerCase().trim();
    if (q) {
      if (["meals", "meal", "food", "foods"].includes(q) || q.includes("食事")) return "meals";
      if (["training", "train", "workout"].includes(q) || q.includes("トレーニング")) return "training";
      if (["body", "bodycomp", "composition"].includes(q) || q.includes("体組成")) return "body";
    }
    return undefined;
  }, [params.section, params.topic, params.filter, params.q]);

  const filtered = useMemo(() => {
    const qRaw = query.trim();
    const q = qRaw.toLowerCase();

    if (!q && sectionKeyFromQuery) {
      return HELP_SECTIONS.filter((s) => s.key === sectionKeyFromQuery);
    }

    if (!q) return HELP_SECTIONS;

    const exact = HELP_SECTIONS.find((sec) => sec.title.toLowerCase() === q);
    if (exact) return [exact];

    return HELP_SECTIONS
      .map((sec) => {
        const haystackSec = (
          `${sec.title} ${sec.summary} ${(sec.tips || []).join(" ")} ` +
          `${(sec.capabilities || []).join(" ")} ` +
          `${(sec.howto || [])
            .map((h) => `${h.title} ${h.steps.join(" ")}`)
            .join(" ")}`
        ).toLowerCase();

        const inSection = haystackSec.includes(q);
        const matchedFaq = sec.faq.filter((f) =>
          `${f.q} ${f.a} ${(f.keywords || []).join(" ")}`.toLowerCase().includes(q)
        );
        const matchedActions = sec.actions?.filter((a) => a.label.toLowerCase().includes(q));

        if (inSection || matchedFaq.length || matchedActions?.length) {
          return {
            ...sec,
            faq: matchedFaq.length ? matchedFaq : sec.faq,
            actions: matchedActions?.length ? matchedActions : sec.actions,
          };
        }
        return null as unknown as HelpSection;
      })
      .filter(Boolean) as HelpSection[];
  }, [query, sectionKeyFromQuery, HELP_SECTIONS]);

  const openDeepLink = (href?: string) => {
    if (href) router.push(href as any);
  };

  const mailToSupport = () => {
    const subject = encodeURIComponent(t("help_screen.mail_subject"));
    const body = encodeURIComponent(t("help_screen.mail_body"));
    Linking.openURL(`mailto:horita.training1020@gmail.com?subject=${subject}&body=${body}`);
  };

  const applySectionFilter = (key?: HelpSection["key"]) => {
    setQuery("");
    if (!key) {
      router.replace({ pathname: "/(tabs)/help" });
    } else {
      router.replace({ pathname: "/(tabs)/help", params: { section: key } });
    }
  };

  const onlySectionTitle =
    sectionKeyFromQuery &&
    HELP_SECTIONS.find((s) => s.key === sectionKeyFromQuery)?.title;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: C.background }]}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 55, paddingBottom: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow} accessibilityRole="header">
        <Text style={[styles.h1, { color: C.text }]}>{t("help_screen.title")}</Text>
        <ThemeToggle mode={mode} onChange={setMode} C={C} />
      </View>
      <Text style={[styles.subtitle, { color: C.muted }]}>
        {t("help_screen.subtitle")}
      </Text>

      <View style={[styles.searchWrap]}>
        <TextInput
          placeholder={t("help_screen.search_placeholder")}
          placeholderTextColor={Platform.OS === "ios" ? "#8E8E93" : "#9E9EA4"}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.searchInput,
            {
              backgroundColor: C.surface,
              color: C.text,
              borderColor: C.border,
            },
          ]}
          returnKeyType="search"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {HELP_SECTIONS.map((s) => {
          const active = !query && sectionKeyFromQuery === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => applySectionFilter(s.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? C.highlight : C.chipBg,
                  borderColor: C.border,
                },
              ]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={t("help_screen.accessibility_showSectionHelp", {
                title: s.title,
              })}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: C.chipText, fontWeight: active ? "900" : "700" },
                ]}
              >
                {s.emoji} {s.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!query && sectionKeyFromQuery && onlySectionTitle ? (
        <View
          style={{
            marginBottom: 12,
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: C.highlight,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: C.border,
          }}
        >
          <Text style={{ color: C.text, fontWeight: "800" }}>
            {t("help_screen.filter_onlySection", { title: onlySectionTitle })}
          </Text>
          <TouchableOpacity
            onPress={() => applySectionFilter(undefined)}
            style={{ marginTop: 6, alignSelf: "flex-start" }}
          >
            <Text style={{ color: C.muted, fontWeight: "800" }}>
              {t("help_screen.filter_clear")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Card C={C} style={{ marginBottom: 16 }}>
        <Text style={[styles.cardTitle, { color: C.text }]}>
          {t("help_screen.support_title")}
        </Text>
        <Text style={[styles.body, { color: C.muted }]}>
          {t("help_screen.support_body")}
        </Text>
        <PrimaryButton
          label={t("help_screen.support_button")}
          onPress={mailToSupport}
          C={C}
          accessibilityLabel={t("help_screen.accessibility_openContact")}
        />
      </Card>

      {filtered.map((sec) => (
        <Card key={sec.key} C={C} style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            {sec.emoji} {sec.title}
          </Text>
          <Text style={[styles.body, { color: C.muted }]}>{sec.summary}</Text>

          {!!sec.capabilities?.length && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.blockTitle, { color: C.text }]}>
                {t("help_screen.block_capabilities")}
              </Text>
              {sec.capabilities.map((cap, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: C.muted }]}>•</Text>
                  <Text style={[styles.body, { color: C.text, flex: 1 }]}>{cap}</Text>
                </View>
              ))}
            </View>
          )}

          {!!sec.howto?.length && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.blockTitle, { color: C.text }]}>
                {t("help_screen.block_howto")}
              </Text>
              {sec.howto.map((h, idx) => (
                <View key={idx} style={{ marginTop: 6 }}>
                  <Text style={[styles.howToTitle, { color: C.text }]}>{h.title}</Text>
                  {h.steps.map((st, j) => (
                    <StepRow key={j} index={j + 1} text={st} C={C} />
                  ))}
                </View>
              ))}
            </View>
          )}

          {!!sec.tips?.length && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.blockTitle, { color: C.text }]}>
                {t("help_screen.block_tips")}
              </Text>
              {sec.tips.map((tip, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: C.muted }]}>•</Text>
                  <Text style={[styles.body, { color: C.text, flex: 1 }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}

          {!!sec.actions?.length && (
            <View style={styles.actionsRow}>
              {sec.actions.map((a, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => openDeepLink(a.deepLink)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={a.label}
                >
                  <Text
                    style={[styles.actionBtnText, { color: C.primaryTextOn }]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.blockTitle, { color: C.text }]}>
              {t("help_screen.block_faq")}
            </Text>
            {sec.faq.map((f, i) => (
              <Accordion key={i} title={`Q. ${f.q}`} C={C}>
                <Text style={[styles.body, { color: C.text }]}>{f.a}</Text>
                {f.deepLink ? (
                  <TouchableOpacity
                    onPress={() => openDeepLink(f.deepLink)}
                    style={[
                      styles.linkBtn,
                      { backgroundColor: C.chipBg, borderColor: C.border },
                    ]}
                  >
                    <Text style={[styles.linkText, { color: C.text }]}>
                      {t("help_screen.link_open_related")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </Accordion>
            ))}
          </View>
        </Card>
      ))}

      <Text
        style={[
          styles.footerText,
          { color: C.muted, marginTop: 8, marginBottom: 24 },
        ]}
      >
        {Platform.OS === "ios"
          ? t("help_screen.footer_ios")
          : t("help_screen.footer_android")}
      </Text>
    </ScrollView>
  );
}


function ThemeToggle({
  mode,
  onChange,
  C,
}: {
  mode: ThemeMode;
  onChange: (m: ThemeMode) => void;
  C: typeof PALETTE_LIGHT;
}) {
  const { t } = useTranslation();
  const options: ThemeMode[] = ["auto", "light", "dark"];

  return (
    <View
      style={[
        styles.toggleWrap,
        { borderColor: C.border, backgroundColor: C.surface },
      ]}
    >
      {options.map((opt) => {
        const active = mode === opt;
        const labelKey =
          opt === "auto"
            ? "help_screen.theme_auto"
            : opt === "light"
            ? "help_screen.theme_light"
            : "help_screen.theme_dark";
        const label = t(labelKey);

        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.toggleBtn,
              active && { backgroundColor: C.chipBg, borderColor: C.border },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("help_screen.theme_toggle", {
              mode: label,
            })}
          >
            <Text
              style={[
                styles.toggleText,
                { color: active ? C.text : C.muted, fontWeight: active ? "700" : "500" },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Card({
  children,
  style,
  C,
}: {
  children: React.ReactNode;
  style?: any;
  C: typeof PALETTE_LIGHT;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderRadius: 14,
          padding: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: C.border,
          shadowColor: "#000",
          shadowOpacity: Platform.OS === "ios" ? 0.06 : 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  C,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  C: typeof PALETTE_LIGHT;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: C.primary,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignSelf: "flex-start",
        marginTop: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Text
        style={{
          color: C.primaryTextOn,
          fontWeight: "700",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Accordion({
  title,
  children,
  C,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  C: typeof PALETTE_LIGHT;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const a11yLabel = open
    ? t("help_screen.accessibility_toggleFaq_close", { title })
    : t("help_screen.accessibility_toggleFaq_open", { title });

  return (
    <View
      style={{
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: C.border,
        backgroundColor: C.surface,
        marginTop: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text
          style={{
            flex: 1,
            color: C.text,
            fontWeight: "700",
            fontSize: 15,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={{ color: C.muted, marginLeft: 8 }}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {open ? (
        <View
          style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

function StepRow({
  index,
  text,
  C,
}: {
  index: number;
  text: string;
  C: typeof PALETTE_LIGHT;
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 4 }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: C.border,
          backgroundColor: C.chipBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          marginTop: 1,
        }}
      >
        <Text
          style={{
            color: C.text,
            fontWeight: "800",
            fontSize: 12,
          }}
        >
          {index}
        </Text>
      </View>
      <Text style={[styles.body, { color: C.text, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  h1: { fontSize: 22, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  searchWrap: { marginTop: 12, marginBottom: 12 },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  body: { fontSize: 14, lineHeight: 20 },
  blockTitle: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bullet: { marginRight: 8, marginTop: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 6 },
  howToTitle: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: { fontWeight: "800", fontSize: 13 },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  linkText: { fontWeight: "800" },
  footerText: { textAlign: "center", fontSize: 12 },
  toggleWrap: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggleText: { fontSize: 12 },
});
