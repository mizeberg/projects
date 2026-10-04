package com.johnai.app.data

import com.johnai.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/** A failure we can explain to a pastor in plain language — never a stack trace. */
class JohnApiException(
    val code: String,
    override val message: String,
    val status: Int = 0,
) : Exception(message)

/**
 * Thin HTTP client for the John AI server.
 *
 * All model calls happen server-side: no AI provider key ever ships in the APK.
 */
class JohnApi(
    private val baseUrl: String = BuildConfig.JOHN_API_BASE_URL,
    private val tokenProvider: suspend () -> String?,
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .build()

    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }

    private val mediaType = "application/json; charset=utf-8".toMediaType()

    suspend fun request(method: String, path: String, body: JsonObject? = null): String =
        withContext(Dispatchers.IO) {
            val builder = Request.Builder().url(baseUrl + path)
            tokenProvider()?.let { builder.header("Authorization", "Bearer $it") }
            val payload = body?.let { json.encodeToString(JsonObject.serializer(), it).toRequestBody(mediaType) }
            when (method) {
                "GET" -> builder.get()
                "POST" -> builder.post(payload ?: "{}".toRequestBody(mediaType))
                "PATCH" -> builder.patch(payload ?: "{}".toRequestBody(mediaType))
                "DELETE" -> if (payload != null) builder.delete(payload) else builder.delete()
                else -> throw IllegalArgumentException("Unsupported method $method")
            }
            val response = try {
                client.newCall(builder.build()).execute()
            } catch (io: IOException) {
                throw JohnApiException("offline", "You appear to be offline. John will retry when you reconnect.")
            }
            response.use {
                val text = it.body?.string().orEmpty()
                if (!it.isSuccessful) {
                    val parsed = runCatching { json.decodeFromString(ApiError.serializer(), text) }.getOrNull()
                    throw JohnApiException(
                        code = parsed?.error ?: "server_error",
                        message = parsed?.message ?: "Something went wrong. Please try again.",
                        status = it.code,
                    )
                }
                text
            }
        }

    suspend inline fun <reified T> get(path: String): T =
        json.decodeFromString(request("GET", path))

    suspend inline fun <reified T> post(path: String, body: JsonObject? = null): T =
        json.decodeFromString(request("POST", path, body))

    suspend inline fun <reified T> patch(path: String, body: JsonObject? = null): T =
        json.decodeFromString(request("PATCH", path, body))

    suspend inline fun <reified T> delete(path: String, body: JsonObject? = null): T =
        json.decodeFromString(request("DELETE", path, body))

    companion object {
        fun credentials(email: String, password: String, displayName: String? = null) = buildJsonObject {
            put("email", email)
            put("password", password)
            if (displayName != null) put("displayName", displayName)
        }
    }
}
