package com.zonacards.ui.compose

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.selection.selectable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.zonacards.ui.tokens.R
import com.zonacards.ui.tokens.ZcIcons
import com.zonacards.ui.tokens.ZcType
import kotlinx.coroutines.delay

/** Espera, en milisegundos, entre que el usuario deja de escribir y se pide la búsqueda (como los 250 ms de la web). */
private const val SEARCH_DEBOUNCE_MS = 250L

/** La lista de una búsqueda hecha por quien llama: las opciones ya vienen filtradas (por ejemplo, desde el servidor). */
@Composable
private fun <T> RemoteList(
    options: List<ZcSelectOption<T>>,
    selected: T?,
    loading: Boolean,
    minChars: Int,
    onQueryChange: (String) -> Unit,
    onSelect: (ZcSelectOption<T>) -> Unit,
    onCreate: ((String) -> Unit)?,
    close: () -> Unit,
) {
    val ctx = LocalContext.current
    val c = ZonacardsTheme.colors
    val haptic = rememberZcHaptics()
    var q by remember { mutableStateOf("") }
    val text = q.trim()
    // Espera a que termine de escribir; pedir una búsqueda por tecla satura al servidor.
    LaunchedEffect(q) { delay(SEARCH_DEBOUNCE_MS); onQueryChange(text) }
    val short = text.length < minChars
    val canCreate = onCreate != null && !short && !loading && options.none { it.label.equals(text, ignoreCase = true) }
    Column {
        SearchBox(q) { q = it }
        when {
            loading -> Row(Modifier.fillMaxWidth().padding(20.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                ZcSpinner(size = 16.dp, decorative = true)
                ZcText(ctx.getString(R.string.zc_ui_buscando), color = c.textMuted)
            }
            options.isEmpty() && short -> ZcText(ctx.getString(R.string.zc_ui_escribe_minimo, minChars.toString()), color = c.textMuted, modifier = Modifier.padding(20.dp))
            options.isEmpty() -> ZcText(ctx.getString(R.string.zc_ui_sin_resultados_ayuda, text), color = c.textMuted, modifier = Modifier.padding(20.dp))
        }
        LazyColumn(Modifier.padding(bottom = 8.dp)) {
            if (!loading) items(options, key = { it.value.hashCode() }) { o ->
                OptionRow(o, o.value == selected, false, q,
                    Modifier.selectable(o.value == selected, enabled = !o.disabled, role = Role.RadioButton) { haptic(ZcHaptic.SELECTION); onSelect(o); close() })
            }
            if (canCreate) item {
                Row(
                    Modifier.fillMaxWidth().padding(horizontal = 8.dp).heightIn(min = 48.dp)
                        .clickable(role = Role.Button) { haptic(ZcHaptic.SELECTION); onCreate?.invoke(text); close() }.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ZcIcon(ZcIcons.sAddCircle, contentDescription = null, size = 16.dp)
                    ZcText(ctx.getString(R.string.zc_ui_crear_texto, text), style = ZcType.body)
                }
            }
        }
    }
}

/**
 * Select con búsqueda hecha por quien llama (equivale a `zc-autocomplete` y al ComboBox con datos remotos): al escribir, espera 250 ms y llama
 * a `onQueryChange(texto)`; la app responde con `options` ya filtradas (del servidor) y `loading` mientras tarda. Con menos de `minChars` letras
 * no se pide nada y se explica ("Escribe al menos 2 letras"); sin resultados, se dice con ayuda; con `onCreate` se ofrece "Crear “texto”".
 * `selected` es la opción elegida: el campo muestra su etiqueta aunque ya no esté en `options` (otra búsqueda la sacó de la lista).
 * Como `ZcSelect`, la lista va en un bottom sheet y, dentro de otro sheet o modal, como subpantalla con Volver.
 */
@Composable
fun <T> ZcAutocomplete(
    options: List<ZcSelectOption<T>>,
    selected: ZcSelectOption<T>?,
    onSelect: (ZcSelectOption<T>) -> Unit,
    onQueryChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    hint: String? = null,
    error: String? = null,
    required: Boolean = false,
    enabled: Boolean = true,
    loading: Boolean = false,
    minChars: Int = 2,
    onCreate: ((String) -> Unit)? = null,
) {
    val host = LocalZcSubscreenHost.current
    val ctx = LocalContext.current
    var open by remember { mutableStateOf(false) }
    ZcField(label, modifier, required, false, hint, error, null, enabled) {
        SelectTrigger(selected?.label, placeholder ?: ctx.getString(R.string.zc_ui_selecciona), fieldName(label, required), error, enabled, ZcIcons.sMagnifier, open) {
            if (host != null) host.push(label) { RemoteList(options, selected?.value, loading, minChars, onQueryChange, onSelect, onCreate) { host.pop() } } else open = true
        }
    }
    if (open) ZcBottomSheet(onDismiss = { open = false }, title = label) {
        RemoteList(options, selected?.value, loading, minChars, onQueryChange, onSelect, onCreate) { open = false }
    }
}
