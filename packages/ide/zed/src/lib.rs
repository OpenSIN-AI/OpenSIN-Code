use zed_extension_api as zed;

struct OpenSINExtension {
    server_url: String,
    ws_url: String,
}

impl zed::Extension for OpenSINExtension {
    fn new() -> Self {
        OpenSINExtension {
            server_url: "http://localhost:8080".to_string(),
            ws_url: "ws://localhost:8081".to_string(),
        }
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
        _worktree: &zed::Worktree,
    ) -> zed::Result<zed::Command> {
        Ok(zed::Command {
            command: "opensin".to_string(),
            args: vec!["acp".to_string()],
            env: vec![],
        })
    }

    fn language_server_workspace_configuration(
        &mut self,
        _language_server_id: &zed::LanguageServerId,
    ) -> zed::Result<Option<zed::serde_json::Value>> {
        Ok(Some(zed::serde_json::json!({
            "opensin": {
                "serverUrl": self.server_url,
                "wsUrl": self.ws_url,
            }
        })))
    }
}

zed::register_extension!(OpenSINExtension);
