/**
 * Compile-time only: each of Notice's public types equals the shared
 * recipe's (`#kozmos-recipes`). vue-tsc fails here when they differ; nothing
 * here is exported or bundled.
 */
import type {
  NoticeIconAlign,
  NoticeLiveness,
  NoticeStatus,
  NoticeTone,
} from "#kozmos-recipes";
import type {
  KozmosNoticeIconAlign,
  KozmosNoticeLiveness,
  KozmosNoticeStatus,
  KozmosNoticeTone,
} from "./types";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type NoticeTypesMatchTheRecipe = [
  Expect<Equal<KozmosNoticeTone, NoticeTone>>,
  Expect<Equal<KozmosNoticeStatus, NoticeStatus>>,
  Expect<Equal<KozmosNoticeLiveness, NoticeLiveness>>,
  Expect<Equal<KozmosNoticeIconAlign, NoticeIconAlign>>,
];
