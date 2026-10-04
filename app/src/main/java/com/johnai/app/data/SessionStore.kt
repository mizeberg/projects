package com.johnai.app.data

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Session token storage, encrypted with a hardware-backed Android Keystore key
 * where the device supports it. The token never lands in plaintext preferences.
 */
class SessionStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("john_session", Context.MODE_PRIVATE)

    private val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }

    private fun secretKey(): SecretKey {
        (keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
        val spec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .apply {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) setIsStrongBoxBacked(false)
            }
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    fun saveToken(token: String) {
        val cipher = Cipher.getInstance(TRANSFORMATION).apply { init(Cipher.ENCRYPT_MODE, secretKey()) }
        val encrypted = cipher.doFinal(token.toByteArray())
        prefs.edit()
            .putString(KEY_IV, Base64.encodeToString(cipher.iv, Base64.NO_WRAP))
            .putString(KEY_TOKEN, Base64.encodeToString(encrypted, Base64.NO_WRAP))
            .apply()
    }

    fun token(): String? {
        val iv = prefs.getString(KEY_IV, null) ?: return null
        val payload = prefs.getString(KEY_TOKEN, null) ?: return null
        return runCatching {
            val cipher = Cipher.getInstance(TRANSFORMATION).apply {
                init(
                    Cipher.DECRYPT_MODE,
                    secretKey(),
                    GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)),
                )
            }
            String(cipher.doFinal(Base64.decode(payload, Base64.NO_WRAP)))
        }.getOrNull()
    }

    fun clear() = prefs.edit().clear().apply()

    private companion object {
        const val KEYSTORE = "AndroidKeyStore"
        const val KEY_ALIAS = "john_ai_session_key"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val KEY_TOKEN = "token"
        const val KEY_IV = "iv"
    }
}
