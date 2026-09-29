package com.kozmos.components.icon

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.Info
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

/**
 * The names `KozmosIcon` draws, each as its Material counterpart. A name it
 * does not map falls back to Info, so a mapping that is missing shows as that
 * stand-in, not as an error.
 */
class IconNamesTest {
    /**
     * bluetooth-off, the map status pill's No Bluetooth (decision 39), is
     * Material's BluetoothDisabled: the B struck through, as Pointr's is.
     */
    @Test
    fun bluetoothOffIsMaterialsBluetoothDisabled() {
        assertNotEquals("bluetooth-off falls back to the stand-in", Icons.Filled.Info, resolveIconVector("bluetooth-off"))
        assertEquals(Icons.Filled.BluetoothDisabled, resolveIconVector("bluetooth-off"))
    }
}
