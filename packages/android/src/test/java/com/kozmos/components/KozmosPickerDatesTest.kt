package com.kozmos.components

import java.time.LocalDate
import java.util.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Material 3's pickers hold a day as the UTC midnight that starts it. The
 * pickers convert in UTC, so a date never moves a day, wherever the device
 * is: the 25th is the 25th at UTC-11 and at UTC+14.
 */
class KozmosPickerDatesTest {
    private val day = LocalDate.of(2026, 5, 25)

    private fun <T> inZone(id: String, block: () -> T): T {
        val before = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone(id))
        try {
            return block()
        } finally {
            TimeZone.setDefault(before)
        }
    }

    @Test fun aDayIsItsUtcMidnightInEveryZone() {
        val read = listOf("Pacific/Pago_Pago", "UTC", "Europe/Berlin", "Pacific/Kiritimati").associateWith { zone ->
            inZone(zone) { day.toPickerMillis() to 1779667200000L.toPickerDate() }
        }
        val expected = read.keys.associateWith { 1779667200000L to day }
        assertEquals(expected, read)
    }
}
