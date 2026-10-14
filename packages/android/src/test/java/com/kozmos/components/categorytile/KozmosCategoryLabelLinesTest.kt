package com.kozmos.components.categorytile

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Decision 78 (GAP-010): a category name in Han, kana or Hangul gets a third
 * line, so a long word shows whole; other scripts keep two.
 */
class KozmosCategoryLabelLinesTest {
    @Test
    fun aCjkNameGetsThreeLines() {
        for (label in listOf("カスタマーサービス", "ヴィーガン・ベジタリアン", "고객 서비스", "客户服务")) {
            assertEquals(label, 3, categoryLabelMaxLines(label))
        }
    }

    @Test
    fun otherScriptsKeepTwo() {
        for (label in listOf("Customer service", "خدمة العملاء", "Сервис")) {
            assertEquals(label, 2, categoryLabelMaxLines(label))
        }
    }
}
