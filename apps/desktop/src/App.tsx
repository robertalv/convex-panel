import { useState } from "react";
import ConvexPanel from "@convex-panel/panel";
import { useTauriAuth } from "./hooks/useTauriAuth";

function App() {
    const [oauthConfig] = useState({
        clientId: "<CLIENT_ID_HERE>",
        redirectUri: "http://localhost:14200",
        scope: "project" as const,
    });

    const auth = useTauriAuth(oauthConfig);

    return (
        <div className="container" style={{ height: "100vh", width: "100vw", padding: 0 }}>
            <ConvexPanel
                oauthConfig={oauthConfig}
                auth={auth}
                defaultTheme="dark"
            />
        </div>
    );
}

export default App;
