package com.zonacards.ui.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.runtime.withFrameNanos

/**
 * Errores de validación que devuelve el servidor, por campo (equivale a `applyServerErrors` y `focusFirstInvalid` de la web, y a `validationErrors`
 * del formulario de HeroUI). Declara los campos en el orden de la pantalla; cada uno lee su mensaje con `error(campo)`, recibe su `requester(campo)`
 * y se limpia con `clear(campo)` cuando la persona lo edita:
 *
 * ```
 * val server = rememberZcServerErrors("email", "nombre")
 * ZcTextField(email, { email = it; server.clear("email") }, "Correo", error = server.error("email") ?: localError, focusRequester = server.requester("email"))
 * // al responder el servidor con 422:
 * val general = server.apply(mapOf("email" to "Ya existe una cuenta con este correo.", "cuenta" to "Cuenta suspendida"))
 * server.focusFirst()
 * ```
 * `apply` devuelve las claves que no son de ningún campo (un error general): muéstralas en un `ZcAlert`.
 */
class ZcServerErrors(private val fields: List<String>) {
    private val messages = mutableStateMapOf<String, String>()
    private val requesters = fields.associateWith { FocusRequester() }

    /** El mensaje del servidor para el campo, o `null`. */
    fun error(field: String): String? = messages[field]

    /** Hay algún error del servidor sin resolver. */
    val hasErrors: Boolean get() = messages.isNotEmpty()

    /** El primer campo con error, en el orden declarado. */
    val firstInvalid: String? get() = fields.firstOrNull { it in messages }

    /** Para `ZcTextField(focusRequester = …)`: así se le puede llevar el foco. */
    fun requester(field: String): FocusRequester = requesters.getValue(field)

    /** Borra el error de un campo (la persona lo editó). */
    fun clear(field: String) { messages.remove(field) }

    /** Borra todos (antes de volver a enviar). */
    fun clearAll() = messages.clear()

    /**
     * Pone los mensajes en sus campos. Los vacíos se ignoran. Devuelve las claves que no corresponden a ningún campo declarado.
     */
    fun apply(errors: Map<String, String?>): List<String> {
        val unmatched = ArrayList<String>()
        for ((field, message) in errors) {
            if (message.isNullOrBlank()) continue
            if (field in requesters) messages[field] = message else unmatched.add(field)
        }
        return unmatched
    }

    /** Lleva el foco al primer campo con error. Espera un cuadro de dibujo para que el error ya esté en pantalla. */
    suspend fun focusFirst() {
        val field = firstInvalid ?: return
        withFrameNanos { }
        try { requesters.getValue(field).requestFocus() } catch (_: IllegalStateException) { /* el campo ya no está en pantalla */ }
    }
}

/** Recuerda un [ZcServerErrors] con los campos del formulario, en el orden de la pantalla. */
@Composable
fun rememberZcServerErrors(vararg fields: String): ZcServerErrors = remember { ZcServerErrors(fields.toList()) }
