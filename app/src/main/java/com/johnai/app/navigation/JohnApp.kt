package com.johnai.app.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Insights
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.johnai.app.data.JohnRepository
import com.johnai.app.ui.glass.AmbientBackground
import com.johnai.app.ui.glass.GlassBottomNavigation
import com.johnai.app.ui.screens.AiScreen
import com.johnai.app.ui.screens.AuthScreen
import com.johnai.app.ui.screens.CalendarScreen
import com.johnai.app.ui.screens.CommandPalette
import com.johnai.app.ui.screens.EventScreen
import com.johnai.app.ui.screens.EventsScreen
import com.johnai.app.ui.screens.FocusModeScreen
import com.johnai.app.ui.screens.HomeScreen
import com.johnai.app.ui.screens.InboxScreen
import com.johnai.app.ui.screens.MeetingScreen
import com.johnai.app.ui.screens.MemoryScreen
import com.johnai.app.ui.screens.NotesScreen
import com.johnai.app.ui.screens.OnboardingScreen
import com.johnai.app.ui.screens.PrayerScreen
import com.johnai.app.ui.screens.PreachModeScreen
import com.johnai.app.ui.screens.ProfileScreen
import com.johnai.app.ui.screens.ProgressScreen
import com.johnai.app.ui.screens.SermonEditorScreen
import com.johnai.app.ui.screens.SermonScreen
import com.johnai.app.ui.screens.SermonsScreen
import com.johnai.app.ui.screens.SplashScreen
import com.johnai.app.ui.screens.TasksScreen
import com.johnai.app.ui.screens.TrustCenterScreen
import com.johnai.app.ui.screens.WorkScreen
import com.johnai.app.ui.theme.Motion

val LocalRepository: ProvidableCompositionLocal<JohnRepository> =
    staticCompositionLocalOf { error("JohnRepository was not provided") }

val LocalNavigator: ProvidableCompositionLocal<NavHostController> =
    staticCompositionLocalOf { error("Navigator was not provided") }

/** Screens that show the primary navigation. Detail and immersive modes do not. */
private val TOP_LEVEL = setOf(Routes.HOME, Routes.WORK, Routes.AI, Routes.PROGRESS, Routes.PROFILE)

@Composable
fun JohnApp() {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route?.substringBefore('/') ?: Routes.SPLASH
    var paletteOpen by remember { mutableStateOf(false) }

    CompositionLocalProvider(LocalNavigator provides nav) {
        AmbientBackground(Modifier.fillMaxSize()) {
            NavHost(
                navController = nav,
                startDestination = Routes.SPLASH,
                modifier = Modifier.fillMaxSize(),
                // Spatial continuity: fade + a slight scale, never a hard cut.
                enterTransition = { fadeIn(tween(Motion.NORMAL_MS)) + scaleIn(tween(Motion.NORMAL_MS), initialScale = 0.98f) },
                exitTransition = { fadeOut(tween(Motion.FAST_MS)) },
                popEnterTransition = { fadeIn(tween(Motion.NORMAL_MS)) },
                popExitTransition = { fadeOut(tween(Motion.FAST_MS)) + scaleOut(tween(Motion.FAST_MS), targetScale = 0.98f) },
            ) {
                composable(Routes.SPLASH) { SplashScreen() }
                composable(Routes.AUTH) { AuthScreen() }
                composable(Routes.ONBOARDING) { OnboardingScreen() }

                composable(Routes.HOME) { HomeScreen(onOpenPalette = { paletteOpen = true }) }
                composable(Routes.WORK) { WorkScreen() }
                composable(Routes.AI) { AiScreen() }
                composable(Routes.PROGRESS) { ProgressScreen() }
                composable(Routes.PROFILE) { ProfileScreen() }

                composable(Routes.SERMONS) { SermonsScreen() }
                composable(
                    "${Routes.SERMON}/{id}",
                    arguments = listOf(navArgument("id") { type = NavType.StringType }),
                ) { SermonScreen(it.arguments?.getString("id").orEmpty()) }
                composable("${Routes.SERMON_EDITOR}/{id}") { SermonEditorScreen(it.arguments?.getString("id").orEmpty()) }
                composable("${Routes.PREACH}/{id}") { PreachModeScreen(it.arguments?.getString("id").orEmpty()) }
                composable("${Routes.FOCUS}/{id}") { FocusModeScreen(it.arguments?.getString("id").orEmpty()) }

                composable(Routes.TASKS) { TasksScreen() }
                composable(Routes.PRAYER) { PrayerScreen() }
                composable(Routes.NOTES) { NotesScreen() }
                composable(Routes.CALENDAR) { CalendarScreen() }
                composable(Routes.EVENTS) { EventsScreen() }
                composable("${Routes.EVENT}/{id}") { EventScreen(it.arguments?.getString("id").orEmpty()) }
                composable("${Routes.MEETING}/{id}") { MeetingScreen(it.arguments?.getString("id").orEmpty()) }
                composable(Routes.INBOX) { InboxScreen() }
                composable(Routes.MEMORY) { MemoryScreen() }
                composable(Routes.TRUST) { TrustCenterScreen() }
            }

            if (current in TOP_LEVEL) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
                    GlassBottomNavigation(
                        items = listOf(
                            Triple(Routes.HOME, Icons.Filled.Home, "Home"),
                            Triple(Routes.WORK, Icons.Filled.WorkspacePremium, "Work"),
                            Triple(Routes.AI, Icons.Filled.AutoAwesome, "John"),
                            Triple(Routes.PROGRESS, Icons.Filled.Insights, "Progress"),
                            Triple(Routes.PROFILE, Icons.Filled.Person, "Profile"),
                        ),
                        selectedRoute = current,
                        onSelect = { route ->
                            if (route != current) {
                                nav.navigate(route) {
                                    popUpTo(Routes.HOME) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        },
                    )
                }
            }

            if (paletteOpen) {
                CommandPalette(onDismiss = { paletteOpen = false })
            }
        }
    }
}
