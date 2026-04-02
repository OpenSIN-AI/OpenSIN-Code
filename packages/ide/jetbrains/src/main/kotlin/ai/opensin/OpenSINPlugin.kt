package ai.opensin

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.openapi.ui.Messages
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.SimplePersistentStateComponent
import com.intellij.openapi.components.State
import com.intellij.openapi.components.Storage
import com.intellij.openapi.options.Configurable
import com.intellij.ui.content.ContentFactory
import javax.swing.JPanel
import javax.swing.JTextField
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JButton
import javax.swing.BoxLayout
import javax.swing.Box
import java.awt.BorderLayout

@Service
@State(name = "OpenSINSettings", storages = [Storage("opensin-settings.xml")])
class OpenSINSettings : SimplePersistentStateComponent<OpenSINSettings.State>(State()) {
    class State : com.intellij.openapi.components.BaseState() {
        var serverUrl by string("http://localhost:8080")
        var wsUrl by string("ws://localhost:8081")
        var defaultModel by string("openrouter/qwen/qwen3.6-plus:free")
    }
}

class OpenSINToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = JPanel(BorderLayout())
        val label = JLabel("OpenSIN Chat")
        panel.add(label, BorderLayout.NORTH)

        val content = ContentFactory.getInstance().createContent(panel, "", false)
        toolWindow.contentManager.addContent(content)
    }
}

class OpenSINSettingsConfigurable : Configurable {
    private var panel: JPanel? = null
    private var serverField = JTextField()
    private var wsField = JTextField()
    private var modelField = JTextField()

    override fun getDisplayName(): String = "OpenSIN"

    override fun createComponent(): JComponent {
        panel = JPanel().apply {
            layout = BoxLayout(this, BoxLayout.Y_AXIS)
            add(JLabel("Server URL:"))
            add(serverField)
            add(Box.createVerticalStrut(8))
            add(JLabel("WebSocket URL:"))
            add(wsField)
            add(Box.createVerticalStrut(8))
            add(JLabel("Default Model:"))
            add(modelField)
        }
        return panel!!
    }

    override fun isModified(): Boolean {
        val settings = OpenSINSettings::class.java
        return serverField.text != settings.serverUrl ||
               wsField.text != settings.wsUrl ||
               modelField.text != settings.defaultModel
    }

    override fun apply() {
        // Settings would be persisted here
    }

    override fun reset() {
        val settings = OpenSINSettings::class.java
        serverField.text = settings.serverUrl
        wsField.text = settings.wsUrl
        modelField.text = settings.defaultModel
    }

    override fun disposeUIResources() {
        panel = null
    }
}

class ConnectAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        Messages.showInfoMessage(e.project, "Connecting to OpenSIN server...", "OpenSIN")
    }
}

class NewChatAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        Messages.showInfoMessage(e.project, "Starting new OpenSIN chat session", "OpenSIN")
    }
}

class ShowDiffAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        Messages.showInfoMessage(e.project, "No diffs available", "OpenSIN")
    }
}
