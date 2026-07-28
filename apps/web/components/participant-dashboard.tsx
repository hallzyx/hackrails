"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  LockKeyhole,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

type ParticipantDashboardProps = { api: string; onBack?: () => void };

export function ParticipantDashboard({
  api,
  onBack,
}: ParticipantDashboardProps) {
  const accessStorageKey = "hackrails-team-access-token";
  const [accessKey, setAccessKey] = useState("");
  const [data, setData] = useState<any>(null);
  const [participantToken, setParticipantToken] = useState("");
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [activeMcpTab, setActiveMcpTab] = useState<
    "opencode" | "claude" | "cursor" | "codex"
  >("opencode");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (providedToken = accessKey, silent = false) => {
    const token = providedToken.trim().replace(/^Bearer\s+/i, "");
    if (!token) return setError("Enter your team access key.");
    setLoading(true);
    setError("");
    try {
      const response = await fetch(api + "/api/participant/dashboard", {
        headers: { authorization: "Bearer " + token },
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.sessionStorage.removeItem(accessStorageKey);
          setAccessKey("");
          setParticipantToken("");
          setData(null);
        }
        throw new Error(body.error ?? "Unable to load team dashboard.");
      }
      window.sessionStorage.setItem(accessStorageKey, token);
      setParticipantToken(token);
      setData(body);
    } catch (cause) {
      setError((cause as Error).message);
      if (!silent) setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = window.sessionStorage.getItem(accessStorageKey);
    if (savedToken) {
      setAccessKey(savedToken);
      void load(savedToken);
    }
  }, []);

  useEffect(() => {
    if (!participantToken) return;
    const interval = window.setInterval(
      () => void load(participantToken, true),
      7000,
    );
    return () => window.clearInterval(interval);
  }, [participantToken]);

  return (
    <main className="grid-noise min-h-screen pb-16 text-smoke">
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-line px-5 py-5">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-mint">
            Participant workspace
          </p>
          <h1 className="mt-1 font-display text-3xl uppercase text-white">
            Team Dashboard
          </h1>
        </div>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft size={13} className="mr-1 inline" />
            Organizer view
          </Button>
        )}
      </header>
      <div className="mx-auto max-w-7xl px-5 py-8">
        {!data && (
          <Panel className="mx-auto max-w-xl p-6">
            <div className="flex items-center gap-2 text-mint">
              <LockKeyhole size={16} />
              <h2 className="font-display text-xl uppercase">Team access</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-smoke">
              Use the token value only, without the <code>Bearer </code> prefix.
              It is used only for this authenticated request.
            </p>
            <input
              aria-label="Team access key"
              type="password"
              value={accessKey}
              onChange={(event) => setAccessKey(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void load()}
              placeholder="hxp_..."
              className="mt-5 w-full border border-line bg-panel px-3 py-3 text-sm text-mint outline-none focus:border-mint"
            />
            {error && (
              <p role="alert" className="mt-3 text-xs text-amber">
                {error}
              </p>
            )}
            <Button
              variant="mint"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Open team dashboard"}
            </Button>
          </Panel>
        )}
        {data && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[.18em] text-smoke">
                  {data.team.eventName}
                </p>
                <h2 className="font-display text-3xl uppercase text-white">
                  {data.team.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-mint">
                  {data.team.status}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => void load()}
                  disabled={loading}
                >
                  <RefreshCw size={13} className="mr-1 inline" />
                  Refresh
                </Button>
              </div>
            </div>
            <Panel className="p-5">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-[.16em] text-smoke">
                  Resources
                </p>
                <span
                  title="The Agent Skill teaches your coding agent how to use HackRails. Import MCP configures the HackRails tools in your coding agent. Use both together: the skill provides the workflow and MCP provides the live tools."
                  className="inline-grid h-4 w-4 cursor-help place-items-center rounded-full border border-line text-[10px] text-smoke"
                >
                  ?
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-smoke">
                Install the participant skill and connect the HackRails MCP
                tools to your coding agent.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span title="Open the MCP configuration for OpenCode, Claude Code, Cursor, and Codex.">
                  <Button variant="mint" onClick={() => setShowMcpModal(true)}>
                    <Copy size={13} className="mr-1 inline" />
                    Import MCP
                  </Button>
                </span>
                <a
                  href={api + data.skill.downloadPath}
                  download="hackrails-skill.zip"
                  title="Download the HackRails participant agent skill."
                  className="inline-flex items-center rounded-sm border border-line px-3 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-smoke hover:border-mint hover:text-mint"
                >
                  <Download size={13} className="mr-1" />
                  Download Skill
                </a>
              </div>
            </Panel>
            <Panel className="mt-5 overflow-hidden">
              <div className="border-b border-line p-5">
                <p className="text-[10px] uppercase tracking-[.18em] text-smoke">
                  MCP tools available to your team
                </p>
                <h3 className="mt-1 font-display text-2xl uppercase text-white">
                  Installed MCPs
                </h3>
              </div>
              <div className="divide-y divide-line">
                {data.tools.map((tool: any) => (
                  <div
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    key={tool.name}
                  >
                    <div>
                      <p className="font-bold text-mint">{tool.name}</p>
                      <p className="mt-1 text-xs text-smoke">
                        {tool.description}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p
                        className={
                          tool.type === "FREE" ? "text-mint" : "text-amber"
                        }
                      >
                        {tool.type}
                      </p>
                      <p className="mt-1 text-smoke">
                        {tool.callsUsed}/
                        {tool.maxCalls >= 999 ? "∞" : tool.maxCalls} calls used
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </>
        )}
      </div>
      {showMcpModal && (
        <McpConfigModal
          token={participantToken}
          activeTab={activeMcpTab}
          onTabChange={setActiveMcpTab}
          onClose={() => setShowMcpModal(false)}
        />
      )}
    </main>
  );
}

function McpConfigModal({
  token,
  activeTab,
  onTabChange,
  onClose,
}: {
  token: string;
  activeTab: "opencode" | "claude" | "cursor" | "codex";
  onTabChange: (tab: "opencode" | "claude" | "cursor" | "codex") => void;
  onClose: () => void;
}) {
  const configs = {
    opencode: JSON.stringify(
      {
        mcp: {
          hackrails: {
            type: "remote",
            url: "http://localhost:4001/mcp",
            enabled: true,
            oauth: false,
            headers: { Authorization: "Bearer " + token },
            timeout: 90000,
          },
        },
      },
      null,
      2,
    ),
    claude: JSON.stringify(
      {
        mcpServers: {
          hackrails: {
            type: "http",
            url: "http://localhost:4001/mcp",
            headers: { Authorization: "Bearer " + token },
          },
        },
      },
      null,
      2,
    ),
    cursor: JSON.stringify(
      {
        mcpServers: {
          hackrails: {
            url: "http://localhost:4001/mcp",
            headers: { Authorization: "Bearer " + token },
          },
        },
      },
      null,
      2,
    ),
    codex: `[mcp_servers.hackrails]\nurl = "http://localhost:4001/mcp"\nbearer_token_env_var = "HACKRAILS_TOKEN"\nenabled = true\nstartup_timeout_sec = 20\ntool_timeout_sec = 90`,
  };
  const labels = {
    opencode: "OpenCode",
    claude: "Claude Code",
    cursor: "Cursor",
    codex: "Codex CLI",
  } as const;
  const copy = () => void navigator.clipboard.writeText(configs[activeTab]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-xl uppercase text-white">
            MCP Server Configs
          </h3>
          <Button variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 border-b border-line px-5 py-3">
          {(Object.keys(labels) as Array<keyof typeof labels>).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "mint" : "ghost"}
              onClick={() => onTabChange(tab)}
            >
              {labels[tab]}
            </Button>
          ))}
        </div>
        <div className="p-5">
          <pre className="max-h-96 overflow-auto border border-line bg-black p-4 text-xs leading-5 text-mint">
            {configs[activeTab]}
          </pre>
          {activeTab === "codex" && (
            <div className="mb-4">
              <p className="mb-2 text-xs leading-5 text-smoke">
                Set this system environment variable before starting Codex.
                Keep the token out of <code>config.toml</code>.
              </p>
              <pre className="overflow-auto border border-line bg-black p-3 text-xs leading-5 text-amber">
                {"HACKRAILS_TOKEN=" + (token || "<participant-token>")}
              </pre>
            </div>
          )}
          <Button variant="mint" onClick={copy}>
            <Copy size={13} className="mr-1 inline" />
            Copy config
          </Button>
        </div>
      </div>
    </div>
  );
}
