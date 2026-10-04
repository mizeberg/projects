package com.johnai.app.data

import com.johnai.app.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

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
 *
 * This deliberately uses the platform's HttpURLConnection rather than a third-party
 * HTTP library. John AI needs four JSON verbs and a bearer header; the platform stack
 * covers that, is guaranteed present on every Android device, and removes a dependency
 * (and its transitive Okio dependency) that has to be correctly packaged for the app to
 * start at all. On Android HttpURLConnection is itself backed by OkHttp, so connection
 * pooling, gzip and HTTP/2 still apply.
 */
class JohnApi(
    private val baseUrl: String = BuildConfig.JOHN_API_BASE_URL,
    private val tokenProvider: suspend () -> String?,
) {
    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
    }

    suspend fun request(method: String, path: String, body: JsonObject? = null): String =
        withContext(Dispatchers.IO) {
            require(method in SUPPORTED_METHODS) { "Unsupported method $method" }
            val payload = body?.let { json.encodeToString(JsonObject.serializer(), it) }
                ?: if (method == "POST" || method == "PATCH") "{}" else null

            var connection: HttpURLConnection? = null
            try {
                connection = (URL(baseUrl + path).openConnection() as HttpURLConnection).apply {
                    requestMethod = method
                    connectTimeout = CONNECT_TIMEOUT_MS
                    readTimeout = READ_TIMEOUT_MS
                    useCaches = false
                    setRequestProperty("Accept", "application/json")
                    tokenProvider()?.let { setRequestProperty("Authorization", "Bearer $it") }
                    if (payload != null) {
                        doOutput = true
                        setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    }
                }

                payload?.let { connection.outputStream.use { out -> out.write(it.toByteArray()) } }

                val status = connection.responseCode
                val stream = if (status in 200..299) connection.inputStream else connection.errorStream
                val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()

                if (status !in 200..299) {
                    val parsed = runCatching { json.decodeFromString(ApiError.serializer(), text) }.getOrNull()
                    throw JohnApiException(
                        code = parsed?.error ?: "server_error",
                        message = parsed?.message ?: "Something went wrong. Please try again.",
                        status = status,
                    )
                }
                text
            } catch (io: IOException) {
                // No route to the server: unreachable, refused, timed out or DNS failure.
                throw JohnApiException("offline", "You appear to be offline. John will retry when you reconnect.")
            } finally {
                connection?.disconnect()
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
        const val CONNECT_TIMEOUT_MS = 15_000
        const val READ_TIMEOUT_MS = 45_000
        val SUPPORTED_METHODS = setOf("GET", "POST", "PATCH", "DELETE")

        fun credentials(email: String, password: String, displayName: String? = null) = buildJsonObject {
            put("email", email)
            put("password", password)
            if (displayName != null) put("displayName", displayName)
        }
    }
}
