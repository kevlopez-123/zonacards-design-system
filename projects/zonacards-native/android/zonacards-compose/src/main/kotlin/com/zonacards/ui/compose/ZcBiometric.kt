package com.zonacards.ui.compose

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * Huella o reconocimiento facial con el diálogo del sistema (patrón móvil). Úsalo desde el botón de biometría de ZcPinPad.
 * La app nunca ve los datos biométricos: solo recibe éxito, cancelación o error.
 */
object ZcBiometric {
    /** true si el teléfono tiene biometría fuerte configurada. */
    fun available(activity: FragmentActivity): Boolean =
        BiometricManager.from(activity).canAuthenticate(BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS

    /**
     * Muestra el diálogo del sistema. `allowDeviceCredential` permite usar el PIN o patrón del teléfono como alternativa.
     * `onError` recibe el mensaje del sistema (ya traducido) salvo cuando la persona cancela.
     */
    fun authenticate(
        activity: FragmentActivity,
        title: String,
        subtitle: String? = null,
        cancelLabel: String,
        allowDeviceCredential: Boolean = false,
        onSuccess: () -> Unit,
        onCancel: () -> Unit = {},
        onError: (String) -> Unit = {},
    ) {
        val prompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) = onSuccess()
            override fun onAuthenticationError(code: Int, message: CharSequence) {
                if (code == BiometricPrompt.ERROR_USER_CANCELED || code == BiometricPrompt.ERROR_NEGATIVE_BUTTON || code == BiometricPrompt.ERROR_CANCELED) onCancel()
                else onError(message.toString())
            }
        })
        val info = BiometricPrompt.PromptInfo.Builder().setTitle(title).apply {
            if (subtitle != null) setSubtitle(subtitle)
            if (allowDeviceCredential) setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            else { setAllowedAuthenticators(BIOMETRIC_STRONG); setNegativeButtonText(cancelLabel) }
        }.build()
        prompt.authenticate(info)
    }
}
