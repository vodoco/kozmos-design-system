import {
  defineComponent,
  h,
  normalizeClass,
  ref,
  useId,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  cn,
  impliedLive,
  LIVE_ROLES,
  NOTICE_CLASS,
  NOTICE_DETAIL_TEXT_CLASS,
  NOTICE_MARK_CLASS,
  NOTICE_MARK_SIZE,
  NOTICE_MORE_CLASS,
  NOTICE_SUMMARY_CLASS,
  NOTICE_TONES,
  noticeActionClass,
  noticeChevronClass,
  noticeDetailClass,
  noticeDoneClass,
  noticeMarkClass,
  noticeRowClass,
  noticeTone,
  type NoticeTone,
} from "#kozmos-recipes";
import { drawn } from "../drawn";
import { glyph, type GlyphName } from "../glyphs";
import { spinnerArc } from "../Spinner/SpinnerArc";
import type {
  KozmosNoticeIconAlign,
  KozmosNoticeLiveness,
  KozmosNoticeStatus,
  KozmosNoticeTone,
} from "./types";

/** Each tone's own mark, the ones Toast draws for the same four tones. */
const TONE_MARKS: Record<NoticeTone, GlyphName> = {
  warning: "AlertTriangle",
  info: "InfoCircle",
  critical: "AlertCircle",
  success: "Check",
};

/**
 * Vue's counterpart of React's Notice: a short notice that opens for the
 * long version, drawn as the `<div>` React's draws from the same recipe
 * (`NOTICE_CLASS`, `NOTICE_TONES` and the rest). `#summary` is the one line
 * always shown; the default slot is the full wording, behind a "More"
 * disclosure (`expand-label`) unless `:collapsible="false"` shows it at
 * once, as an emergency notice must. The detail stays in the DOM, hidden by
 * the `hidden` attribute while closed, so it is read where it sits.
 *
 * Its state is `v-model:expanded`, as React's `expanded` and
 * `onExpandedChange`; left unbound it starts at `default-expanded` and
 * keeps its own. `#icon` replaces the tone's mark; an `#icon` that draws
 * nothing draws none and leaves no column, as React's `icon={null}`.
 * `status` `progress` turns the loading arc where the mark is; `done` ends
 * the summary in a check. `#action` is a control under the text. `live` is
 * `polite` (`role="status"`) by default, `assertive` (`role="alert"`) only
 * for an emergency; an app's own `role` or `aria-live` wins.
 */
export const KozmosNotice = defineComponent({
  name: "KozmosNotice",
  inheritAttrs: false,
  props: {
    tone: { type: String as PropType<KozmosNoticeTone>, default: "warning" },
    status: {
      type: String as PropType<KozmosNoticeStatus>,
      default: undefined,
    },
    iconAlign: {
      type: String as PropType<KozmosNoticeIconAlign>,
      default: "start",
    },
    defaultExpanded: { type: Boolean, default: false },
    expanded: { type: Boolean, default: undefined },
    expandLabel: { type: String, default: "More" },
    collapsible: { type: Boolean, default: undefined },
    live: {
      type: String as PropType<KozmosNoticeLiveness>,
      default: "polite",
    },
  },
  emits: {
    // React's onExpandedChange: (expanded: boolean) => void
    "update:expanded": (_expanded: boolean) => true,
  },
  slots: Object as SlotsType<{
    /** The one line that is always visible, as React's `summary`. */
    summary: () => VNode[];
    /** The full wording, revealed on tap, as React's `children`. */
    default?: () => VNode[];
    /** Replaces the tone's mark; one that draws nothing draws none. */
    icon?: () => VNode[];
    /** A control under the text, as React's `action`. */
    action?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const uncontrolled = ref(props.defaultExpanded);
    const detailId = useId();
    return () => {
      const { class: className, role, ...rest } = attrs;
      const isControlled = props.expanded !== undefined;
      const open = isControlled ? props.expanded! : uncontrolled.value;
      const children = drawn(slots.default?.());
      const hasDetail = !!children;
      const canCollapse = props.collapsible ?? true;
      // Not collapsible means always shown, whatever `expanded` says.
      const detailVisible = hasDetail && (!canCollapse || open);
      const toggle = () => {
        const next = !open;
        if (!isControlled) uncontrolled.value = next;
        emit("update:expanded", next);
      };

      const tone = noticeTone(props.tone);
      const working = props.status === "progress";
      const done = props.status === "done";
      // An #icon that draws nothing is React's icon={null}: no mark, no
      // column. No #icon is React's icon left out: the tone's mark, unless
      // done moved it to the inline end.
      const iconSlot = slots.icon;
      const icon = iconSlot ? drawn(iconSlot()) : undefined;
      const drawsIcon = working || (iconSlot ? !!icon : !done);
      const resolvedRole =
        (role as string | undefined) ?? LIVE_ROLES[props.live];
      const summary = slots.summary?.();
      const action = drawn(slots.action?.());

      return h(
        "div",
        {
          class: cn(
            NOTICE_CLASS,
            NOTICE_TONES[tone],
            normalizeClass(className),
          ),
          "data-tone": tone,
          "data-status": props.status,
          role: resolvedRole,
          "aria-live": impliedLive(resolvedRole),
          ...rest,
        },
        [
          h("div", { class: noticeRowClass(props.iconAlign) }, [
            drawsIcon
              ? h(
                  "span",
                  {
                    "aria-hidden": "true",
                    class: noticeMarkClass(props.iconAlign),
                  },
                  working
                    ? [
                        spinnerArc({
                          className: NOTICE_MARK_CLASS,
                          size: NOTICE_MARK_SIZE,
                        }),
                      ]
                    : (icon ?? [
                        glyph(TONE_MARKS[tone], { class: NOTICE_MARK_CLASS }),
                      ]),
                )
              : null,
            h("div", { class: NOTICE_SUMMARY_CLASS }, summary),
            done
              ? glyph("Check", {
                  "aria-hidden": "true",
                  focusable: "false",
                  "data-kozmos-notice-done": "",
                  class: noticeDoneClass(props.iconAlign),
                })
              : null,
            hasDetail && canCollapse
              ? h(
                  "button",
                  {
                    "aria-controls": detailId,
                    "aria-expanded": open ? "true" : "false",
                    class: NOTICE_MORE_CLASS,
                    onClick: toggle,
                    type: "button",
                  },
                  [
                    props.expandLabel,
                    glyph("ChevronDown", {
                      "aria-hidden": "true",
                      class: noticeChevronClass(open),
                    }),
                  ],
                )
              : null,
          ]),
          hasDetail
            ? h(
                "div",
                {
                  class: noticeDetailClass(drawsIcon, detailVisible),
                  hidden: !detailVisible,
                  id: detailId,
                },
                [h("div", { class: NOTICE_DETAIL_TEXT_CLASS }, children)],
              )
            : null,
          action
            ? h("div", { class: noticeActionClass(drawsIcon) }, action)
            : null,
        ],
      );
    };
  },
});
