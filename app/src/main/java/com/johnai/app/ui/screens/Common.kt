package com.johnai.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.johnai.app.data.JohnApiException
import com.johnai.app.data.JohnRepository
import com.johnai.app.navigation.LocalNavigator
import com.johnai.app.navigation.LocalRepository
import com.johnai.app.ui.components.ErrorState
import com.johnai.app.ui.components.SkeletonList
import com.johnai.app.ui.glass.LocalReflection
import com.johnai.app.ui.glass.ProvideReflection
import com.johnai.app.ui.theme.JohnTheme
import com.johnai.app.ui.theme.Space
import com.johnai.app.ui.theme.Touch

/* ------------------------------------------------------------------ */
/* Async loading primitive                                             */
/* ------------------------------------------------------------------ */

sealed interface Async<out T> {
    data object Loading : Async<Nothing>
    data class Error(val message: String) : Async<Nothing>
    data class Data<T>(val value: T) : Async<T>
}

class Loader<T>(private val state: MutableState<Async<T>>, private val reload: suspend () -> Unit) {
    val value: Async<T> get() = state.value
    suspend fun refresh() = reload()
}

/**
 * Loads data for a screen, mapping transport failures onto plain-language
 * messages. Never surfaces exception types to the pastor.
 */
@Composable
fun <T> rememberLoader(vararg keys: Any?, block: suspend (JohnRepository) -> T): Pair<Async<T>, () -> Unit> {
    val repo = LocalRepository.current
    val state = remember(*keys) { mutableStateOf<Async<T>>(Async.Loading) }
    var attempt by remember(*keys) { mutableStateOf(0) }
    LaunchedEffect(attempt, *keys) {
        state.value = Async.Loading
        state.value = try {
            Async.Data(block(repo))
        } catch (e: JohnApiException) {
            Async.Error(e.message)
        } catch (e: Exception) {
            Async.Error("John could not load this right now.")
        }
    }
    return state.value to { attempt += 1 }
}

@Composable
fun <T> AsyncContent(
    state: Async<T>,
    onRetry: () -> Unit,
    skeletonCount: Int = 3,
    content: @Composable (T) -> Unit,
) {
    when (state) {
        is Async.Loading -> SkeletonList(skeletonCount)
        is Async.Error -> ErrorState(state.message, onRetry = onRetry)
        is Async.Data -> content(state.value)
    }
}

/* ------------------------------------------------------------------ */
/* Screen scaffold                                                     */
/* ------------------------------------------------------------------ */

/**
 * Standard screen frame.
 *
 * Handles safe areas (status bar, gesture nav, IME) once, so no screen has to
 * reinvent them, and installs the scroll-reflection environment for glass.
 */
@Composable
fun JohnScreen(
    title: String? = null,
    subtitle: String? = null,
    showBack: Boolean = false,
    reserveNavBar: Boolean = true,
    actions: @Composable () -> Unit = {},
    content: LazyListScope.() -> Unit,
) {
    val nav = LocalNavigator.current
    val colors = JohnTheme.colors
    ProvideReflection(enabled = !JohnTheme.reducedMotion) { reflection ->
        Box(Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .imePadding()
                    .nestedScroll(remember(reflection) { reflection.nestedScrollConnection() }),
                contentPadding = PaddingValues(
                    start = Space.m,
                    end = Space.m,
                    top = Space.s,
                    // Keep the floating navigation from ever covering the last row.
                    bottom = if (reserveNavBar) 112.dp else Space.l,
                ),
                verticalArrangement = Arrangement.spacedBy(Space.s),
            ) {
                if (title != null) {
                    item(key = "__header") {
                        Row(
                            Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (showBack) {
                                IconButton(
                                    onClick = { nav.popBackStack() },
                                    modifier = Modifier.height(Touch.preferred),
                                ) {
                                    Icon(
                                        Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Go back",
                                        tint = colors.secondary,
                                    )
                                }
                                Spacer(Modifier.padding(end = Space.xs))
                            }
                            Column(Modifier.weight(1f)) {
                                Text(
                                    text = title,
                                    style = MaterialTheme.typography.displayLarge,
                                    color = colors.foreground,
                                    modifier = Modifier.semantics { heading() },
                                )
                                if (subtitle != null) {
                                    Text(subtitle, style = MaterialTheme.typography.bodyLarge, color = colors.secondary)
                                }
                            }
                            actions()
                        }
                    }
                }
                content()
            }
        }
    }
}

@Composable
fun SectionHeader(text: String) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = JohnTheme.colors.tertiary,
        modifier = Modifier.padding(top = Space.s),
    )
}
