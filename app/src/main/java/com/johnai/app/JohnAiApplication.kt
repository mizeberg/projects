package com.johnai.app

import android.app.Application
import com.johnai.app.data.JohnRepository
import com.johnai.app.data.SessionStore

/**
 * Manual dependency container. John AI has one repository and one session store;
 * a DI framework would add indirection without adding safety here.
 */
class JohnAiApplication : Application() {
    lateinit var sessionStore: SessionStore
        private set
    lateinit var repository: JohnRepository
        private set

    override fun onCreate() {
        super.onCreate()
        sessionStore = SessionStore(this)
        repository = JohnRepository(sessionStore)
    }
}
