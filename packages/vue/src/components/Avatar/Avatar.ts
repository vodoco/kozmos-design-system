import {
  defineComponent,
  h,
  inject,
  normalizeClass,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  watch,
  type InjectionKey,
  type PropType,
  type Ref,
  type SlotsType,
  type VNode,
} from "vue";
import { Primitive } from "reka-ui";
import {
  AVATAR_FALLBACK_CLASS,
  AVATAR_IMAGE_CLASS,
  avatarBox,
  cn,
} from "#kozmos-recipes";
import type { KozmosAvatarImageLoadingStatus, KozmosAvatarSize } from "./types";

/**
 * Where the avatar's image is, shared by its image and its fallback, as
 * Radix's Avatar context shares it. Drawn here rather than on Reka's
 * Avatar: Reka's image is in the page, hidden, before it loads, and Radix's
 * is not there at all, so the server render and the accessibility tree
 * would differ from React's.
 */
const AvatarStatus: InjectionKey<Ref<KozmosAvatarImageLoadingStatus>> =
  Symbol("KozmosAvatar");

/**
 * Vue's counterpart of React's Avatar: a round box at 40, or 24 with
 * `size="sm"` (decision 221), drawn as the `<span>` React's Radix Avatar
 * draws, from the same recipe (`avatarBox`). Put a `KozmosAvatarImage`
 * and a `KozmosAvatarFallback` in it: the fallback shows until the image
 * has loaded, and again if it fails. `as-child` draws the box on its one
 * child, as Radix's Slot does.
 */
export const KozmosAvatar = defineComponent({
  name: "KozmosAvatar",
  inheritAttrs: false,
  props: {
    size: {
      type: String as PropType<KozmosAvatarSize>,
      default: "default",
    },
    asChild: { type: Boolean, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The image and the fallback, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    provide(AvatarStatus, ref<KozmosAvatarImageLoadingStatus>("idle"));
    return () => {
      const { class: className, ...rest } = attrs;
      const [boxClass, dataSize] = avatarBox(props.size);
      return h(
        Primitive,
        {
          as: "span",
          asChild: props.asChild,
          "data-size": dataSize,
          class: cn(boxClass, normalizeClass(className)),
          ...rest,
        },
        slots.default,
      );
    };
  },
});

/**
 * The avatar's image, drawn as React's: nothing until it has loaded, then
 * the `<img>` (`src`, `alt` and the rest are its attributes), filling the
 * box. It loads in the browser only, as Radix's does after hydration, so a
 * server render draws the fallback. `loadingStatusChange` reports each
 * status after `idle`: `loading`, then `loaded` or `error`.
 */
export const KozmosAvatarImage = defineComponent({
  name: "KozmosAvatarImage",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
  },
  emits: {
    /** React's `onLoadingStatusChange`, with the image's new status. */
    loadingStatusChange: (status: KozmosAvatarImageLoadingStatus) =>
      typeof status === "string",
  },
  slots: Object as SlotsType<{
    /** What React's `children` draws inside the image, which is nothing. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, emit, slots }) {
    const shared = inject(AvatarStatus, undefined);
    const status = ref<KozmosAvatarImageLoadingStatus>("idle");
    let image: HTMLImageElement | undefined;
    const source = () =>
      typeof attrs.src === "string" ? attrs.src : undefined;
    const read = (img: HTMLImageElement, src: string | undefined) => {
      if (!src) return "error";
      if (img.src !== src) img.src = src;
      return img.complete && img.naturalWidth > 0 ? "loaded" : "loading";
    };
    const loaded = () => (status.value = "loaded");
    const failed = () => (status.value = "error");
    onMounted(() => {
      image = new window.Image();
      image.addEventListener("load", loaded);
      image.addEventListener("error", failed);
      const policy = attrs.referrerpolicy ?? attrs.referrerPolicy;
      if (typeof policy === "string")
        image.referrerPolicy = policy as ReferrerPolicy;
      const cors = attrs.crossorigin ?? attrs.crossOrigin;
      if (typeof cors === "string") image.crossOrigin = cors;
      status.value = read(image, source());
    });
    watch(source, (src) => {
      if (image) status.value = read(image, src);
    });
    onBeforeUnmount(() => {
      image?.removeEventListener("load", loaded);
      image?.removeEventListener("error", failed);
    });
    watch(status, (value) => {
      if (value === "idle") return;
      emit("loadingStatusChange", value);
      if (shared) shared.value = value;
    });
    return () => {
      if (status.value !== "loaded") return null;
      const { class: className, ...rest } = attrs;
      return h(
        Primitive,
        {
          as: "img",
          asChild: props.asChild,
          ...rest,
          class: cn(AVATAR_IMAGE_CLASS, normalizeClass(className)),
        },
        slots.default,
      );
    };
  },
});

/**
 * What the avatar shows while it has no image: its default slot, the
 * initials, centred on the muted fill. `delay-ms` holds it back that long,
 * so a quick image does not flash it.
 */
export const KozmosAvatarFallback = defineComponent({
  name: "KozmosAvatarFallback",
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: undefined },
    delayMs: { type: Number, default: undefined },
  },
  slots: Object as SlotsType<{
    /** The initials, as React's `children`. */
    default?: () => VNode[];
  }>,
  setup(props, { attrs, slots }) {
    const shared = inject(AvatarStatus, undefined);
    const canRender = ref(props.delayMs === undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    onMounted(() => {
      if (props.delayMs !== undefined)
        timer = setTimeout(() => (canRender.value = true), props.delayMs);
    });
    onBeforeUnmount(() => clearTimeout(timer));
    return () => {
      if (!canRender.value || shared?.value === "loaded") return null;
      const { class: className, ...rest } = attrs;
      return h(
        Primitive,
        {
          as: "span",
          asChild: props.asChild,
          class: cn(AVATAR_FALLBACK_CLASS, normalizeClass(className)),
          ...rest,
        },
        slots.default,
      );
    };
  },
});
